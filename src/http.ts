import { CliError, EXIT, type ExitCode } from "./exit-codes.js";
import { resolvePassword, type ApiVersion, type TenantProfile } from "./config.js";
import { redactCreds } from "./normalize.js";

const VERSION = "0.1.0";
const DEFAULT_TIMEOUT_MS = 30_000;

export type Query = Record<string, string | number | boolean | string[] | undefined>;

export interface RequestSpec {
  method: string;
  path: string;
  query?: Query;
  body?: unknown;
  /** Whether to retry once on 429/5xx. Defaults to true only for GET (reads). Never retry writes. */
  retry?: boolean;
  /** Per-request timeout override (ms). Defaults to 30s. */
  timeoutMs?: number;
}

export interface RequestResult<T = unknown> {
  data: T;
  status: number;
}

// ---------------------------------------------------------------------------
// URL / query building
// ---------------------------------------------------------------------------

/**
 * Join a resource path onto the tenant baseUrl. `baseUrl` is the FULL API base
 * (e.g. https://host/api) — no "/api" is appended here.
 */
export function buildUrl(baseUrl: string, resourcePath: string, query?: Query): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL(resourcePath.replace(/^\//, ""), base);
  applyQuery(url, query);
  return url.toString();
}

function applyQuery(url: URL, query?: Query): void {
  if (!query) return;
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      url.searchParams.set(k, v.join(","));
    } else {
      url.searchParams.set(k, String(v));
    }
  }
}

// ---------------------------------------------------------------------------
// Core request()
// ---------------------------------------------------------------------------

/**
 * Issue a request against a tenant, dispatching to the v2 or v3 transport.
 * The resolved password (flag/env/profile) must be present on the profile or
 * reachable via `resolvePassword`; a missing password is EXIT.AUTH.
 */
export async function request<T = unknown>(
  profile: TenantProfile,
  spec: RequestSpec,
): Promise<RequestResult<T>> {
  const password = resolvePassword(profile);
  if (!password) {
    throw new CliError(
      EXIT.AUTH,
      `No password for tenant customer "${profile.customerName}". Set HS_PASSWORD or store it with \`hs tenant add\`.`,
    );
  }

  const method = spec.method.toUpperCase();
  const isRead = method === "GET";
  const shouldRetry = spec.retry ?? isRead;
  const timeoutMs = spec.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const wire = profile.apiVersion === "v3"
    ? buildV3(profile, password, method, spec)
    : buildV2(profile, password, method, spec);

  const res = await doFetch(wire.url, wire.init, shouldRetry, timeoutMs);

  if (res.status === 204) {
    return { data: undefined as T, status: 204 };
  }

  const text = await res.text();
  const parsed = text.length > 0 ? safeJson(text) : undefined;

  if (!res.ok) {
    throw new CliError(
      mapError(res.status, parsed),
      formatHttpError(method, wire.url, res.status, parsed, text),
    );
  }
  return { data: parsed as T, status: res.status };
}

interface Wire {
  url: string;
  init: RequestInit;
}

function baseHeaders(): Record<string, string> {
  return {
    "User-Agent": `hostedsuite-cli/${VERSION}`,
    Accept: "application/json",
  };
}

/**
 * v3 transport: real REST verb, custom Authorization header
 * `<customerName> <base64(userName:password)>` (NOT "Basic"), JSON body for writes.
 */
function buildV3(profile: TenantProfile, password: string, method: string, spec: RequestSpec): Wire {
  const url = buildUrl(profile.baseUrl, spec.path, spec.query);
  const headers = baseHeaders();
  const token = Buffer.from(`${profile.userName}:${password}`).toString("base64");
  headers["Authorization"] = `${profile.customerName} ${token}`;

  const init: RequestInit = { method, headers, redirect: "manual" };
  if (hasBody(method) && spec.body !== undefined && spec.body !== null) {
    headers["Content-Type"] = "application/json";
    init.body = typeof spec.body === "string" ? spec.body : JSON.stringify(spec.body);
  }
  return { url, init };
}

/**
 * v2 transport: POST for everything except the handful of GET routes. Credentials
 * ride in the request body (PascalCase CustomerName/UserName/Password) for writes,
 * or in the query string for GET routes.
 */
function buildV2(profile: TenantProfile, password: string, method: string, spec: RequestSpec): Wire {
  const creds = {
    CustomerName: profile.customerName,
    UserName: profile.userName,
    Password: password,
  };
  const headers = baseHeaders();
  const init: RequestInit = { method, headers, redirect: "manual" };

  if (method === "GET") {
    // The 2 v2 GET routes: creds + fields travel in the query string.
    const query: Query = { ...spec.query, ...creds };
    const url = buildUrl(profile.baseUrl, spec.path, query);
    return { url, init };
  }

  const url = buildUrl(profile.baseUrl, spec.path, spec.query);
  const fields = (spec.body && typeof spec.body === "object" && !Array.isArray(spec.body))
    ? (spec.body as Record<string, unknown>)
    : {};
  headers["Content-Type"] = "application/json";
  init.body = JSON.stringify({ ...creds, ...fields });
  return { url, init };
}

function hasBody(method: string): boolean {
  return method === "POST" || method === "PATCH" || method === "PUT";
}

// ---------------------------------------------------------------------------
// Fetch with timeout + single retry
// ---------------------------------------------------------------------------

async function doFetch(url: string, init: RequestInit, shouldRetry: boolean, timeoutMs: number): Promise<Response> {
  const res = await fetchWithTimeout(url, init, timeoutMs);
  if (shouldRetry && (res.status === 429 || res.status >= 500)) {
    await sleep(retryDelayMs(res));
    return fetchWithTimeout(url, init, timeoutMs);
  }
  return res;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new CliError(EXIT.RETRYABLE, `Request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw new CliError(EXIT.RETRYABLE, `Network error: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}

function retryDelayMs(res: Response): number {
  const header = res.headers.get("retry-after");
  if (header) {
    const secs = Number(header);
    if (Number.isFinite(secs) && secs >= 0) return Math.min(secs * 1000, 10_000);
  }
  return 1000;
}

// ---------------------------------------------------------------------------
// Error mapping (keyed on responseStatus.errorCode primarily, then status)
// ---------------------------------------------------------------------------

function mapError(status: number, data: unknown): ExitCode {
  const errorCode = extractErrorCode(data);
  const message = extractMessage(data);

  if (errorCode) {
    const ec = errorCode.toLowerCase();
    if (ec === "unauthorized") return EXIT.AUTH;
    if (ec.includes("forbidden")) return EXIT.FORBIDDEN;
  }
  if (message && /not found/i.test(message)) return EXIT.NOT_FOUND;
  if (status === 429) return EXIT.RATE_LIMIT;
  if (status === 401) return EXIT.AUTH;
  if (status === 403) return EXIT.FORBIDDEN;
  if (status === 404) return EXIT.NOT_FOUND;
  if (status >= 500) return EXIT.RETRYABLE;
  return EXIT.ERR;
}

function extractErrorCode(data: unknown): string | undefined {
  const rs = getResponseStatus(data);
  const ec = rs?.errorCode;
  return typeof ec === "string" ? ec : undefined;
}

function extractMessage(data: unknown): string | undefined {
  const rs = getResponseStatus(data);
  const msg = rs?.message ?? (data as { message?: unknown } | undefined)?.message;
  return typeof msg === "string" ? msg : undefined;
}

function getResponseStatus(data: unknown): { errorCode?: unknown; message?: unknown } | undefined {
  if (data && typeof data === "object" && "responseStatus" in data) {
    const rs = (data as { responseStatus?: unknown }).responseStatus;
    if (rs && typeof rs === "object") return rs as { errorCode?: unknown; message?: unknown };
  }
  return undefined;
}

function formatHttpError(method: string, url: string, status: number, data: unknown, rawText: string): string {
  // Redact any echoed credentials (v2 error bodies may reflect the request).
  const safe = data && typeof data === "object" ? redactCreds(data) : undefined;
  const detail = safe ? JSON.stringify(safe) : redactRawText(rawText).slice(0, 500);
  return `${method} ${url} → ${status}\n${detail}`;
}

function redactRawText(text: string): string {
  // Best-effort redaction for non-JSON echoes that include a credential field.
  return text.replace(/("?(?:password|userName|authToken)"?\s*[:=]\s*)("?)[^",}&\s]+\2/gi, '$1"***"');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Raw binary transport (report exports + file downloads) — no JSON parsing
// ---------------------------------------------------------------------------

export interface RawSpec {
  method: string;
  path: string;
  query?: Query;
  timeoutMs?: number;
}

/**
 * Issue an authenticated request and return the raw {@link Response} without
 * JSON parsing — for streaming binary payloads (report xlsx/pdf, file blobs)
 * to disk. On a non-2xx the (text) body is parsed only to map the error code.
 */
export async function requestRaw(profile: TenantProfile, spec: RawSpec): Promise<Response> {
  const password = resolvePassword(profile);
  if (!password) {
    throw new CliError(
      EXIT.AUTH,
      `No password for tenant customer "${profile.customerName}". Set HS_PASSWORD or store it with \`hs tenant add\`.`,
    );
  }
  const method = spec.method.toUpperCase();
  const timeoutMs = spec.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const wire = profile.apiVersion === "v3"
    ? buildV3(profile, password, method, spec)
    : buildV2(profile, password, method, spec);

  const res = await fetchWithTimeout(wire.url, wire.init, timeoutMs);
  if (!res.ok) {
    const text = await res.text();
    const parsed = text.length > 0 ? safeJson(text) : undefined;
    throw new CliError(mapError(res.status, parsed), formatHttpError(method, wire.url, res.status, parsed, text));
  }
  return res;
}

// ---------------------------------------------------------------------------
// Multipart upload transport (image/* file fields) — v3 only
// ---------------------------------------------------------------------------

export interface MultipartSpec {
  method: string;
  path: string;
  form: FormData;
  timeoutMs?: number;
}

/**
 * POST a multipart/form-data body (a single file) to a v3 file-field route.
 * `fetch` sets the multipart boundary from the {@link FormData}, so no explicit
 * Content-Type is added. Uploads exist only on the v3 API.
 */
export async function requestMultipart<T = unknown>(
  profile: TenantProfile,
  spec: MultipartSpec,
): Promise<RequestResult<T>> {
  if (profile.apiVersion !== "v3") {
    throw new CliError(EXIT.NOT_IMPLEMENTED, "File uploads require a v3 tenant.");
  }
  const password = resolvePassword(profile);
  if (!password) {
    throw new CliError(
      EXIT.AUTH,
      `No password for tenant customer "${profile.customerName}". Set HS_PASSWORD or store it with \`hs tenant add\`.`,
    );
  }
  const method = spec.method.toUpperCase();
  const timeoutMs = spec.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const url = buildUrl(profile.baseUrl, spec.path);
  const headers = baseHeaders();
  const token = Buffer.from(`${profile.userName}:${password}`).toString("base64");
  headers["Authorization"] = `${profile.customerName} ${token}`;

  const res = await fetchWithTimeout(
    url,
    { method, headers, body: spec.form, redirect: "manual" },
    timeoutMs,
  );
  const text = await res.text();
  const parsed = text.length > 0 ? safeJson(text) : undefined;
  if (!res.ok) {
    throw new CliError(mapError(res.status, parsed), formatHttpError(method, url, res.status, parsed, text));
  }
  return { data: parsed as T, status: res.status };
}

// ---------------------------------------------------------------------------
// Auth check + version probe
// ---------------------------------------------------------------------------

export interface AuthInfo {
  isAuthenticated?: boolean;
  [key: string]: unknown;
}

/**
 * Verify credentials / fetch the caller identity.
 * v3: GET /auth/info (always HTTP 200 with { isAuthenticated, ... }).
 * v2: POST /authenticate (UserInfo, credentials in body).
 */
export async function authCheck(profile: TenantProfile): Promise<RequestResult<AuthInfo>> {
  if (profile.apiVersion === "v3") {
    return request<AuthInfo>(profile, { method: "GET", path: "/auth/info", retry: true });
  }
  return request<AuthInfo>(profile, { method: "POST", path: "/authenticate", body: {}, retry: true });
}

/**
 * Detect a tenant's API generation (PLAN §4 probe). Order matters:
 *  1. GET /auth/info — a well-formed 200 JSON with `isAuthenticated` ⇒ v3
 *     (regardless of the value; a false value means bad creds, not "not v3").
 *  2. POST /authenticate — a well-formed / SecurityException-shaped JSON ⇒ v2.
 *  3. Network/TLS/DNS failure ⇒ throw EXIT.RETRYABLE (never misclassify).
 *  4. Neither route present ⇒ EXIT.CONFIG "not a HostedSuite API".
 */
export async function probeVersion(
  baseUrl: string,
  customerName: string,
  userName: string,
  password: string,
): Promise<ApiVersion> {
  // Step 1 — v3 /auth/info
  const infoUrl = buildUrl(baseUrl, "/auth/info");
  const token = Buffer.from(`${userName}:${password}`).toString("base64");
  let infoStatus = -1;
  try {
    const res = await fetch(infoUrl, {
      method: "GET",
      headers: { ...baseHeaders(), Authorization: `${customerName} ${token}` },
      redirect: "manual",
    });
    infoStatus = res.status;
    if (res.status === 200) {
      const body = safeJson(await res.text());
      if (isWellFormedAuthInfo(body)) return "v3";
    }
  } catch (err) {
    throw new CliError(EXIT.RETRYABLE, `Probe failed reaching ${infoUrl}: ${(err as Error).message}`);
  }

  // Step 2 — v2 /authenticate
  const authUrl = buildUrl(baseUrl, "/authenticate");
  let authStatus = -1;
  try {
    const res = await fetch(authUrl, {
      method: "POST",
      headers: { ...baseHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ CustomerName: customerName, UserName: userName, Password: password }),
      redirect: "manual",
    });
    authStatus = res.status;
    const body = safeJson(await res.text());
    // Any well-formed JSON object (UserInfo or a SecurityException-shaped error) proves the route exists ⇒ v2.
    if (body && typeof body === "object") return "v2";
  } catch (err) {
    throw new CliError(EXIT.RETRYABLE, `Probe failed reaching ${authUrl}: ${(err as Error).message}`);
  }

  throw new CliError(
    EXIT.CONFIG,
    `Not a HostedSuite API at ${baseUrl} (checked /auth/info → ${infoStatus}, /authenticate → ${authStatus}).`,
  );
}

function isWellFormedAuthInfo(body: unknown): body is AuthInfo {
  return !!body && typeof body === "object" && "isAuthenticated" in body;
}

import type { ApiVersion } from "./config.js";

/**
 * Field names that carry secrets and must never reach output. Matched
 * case-insensitively so both v3 camelCase (`password`) and v2 PascalCase
 * (`Password`) are caught. Values are replaced with "***" rather than deleted,
 * so the shape of the response is preserved.
 *
 * NOTE: `userName` is deliberately NOT redacted — it is a login identifier
 * (email), not a secret, and `hs whoami` must show it so the JSON is a usable
 * source of truth for "who am I authenticated as". Only true secrets are masked.
 */
export const CRED_KEYS = new Set(["password", "authtoken", "apikey", "secret"]);

const REDACTED = "***";

/**
 * Recursively replace the values of credential-named keys with "***".
 * Applied to every response and error body before any output, including
 * under `--raw` (v2 error bodies may echo the submitted request — API-NOTES §10).
 */
export function redactCreds<T>(value: T): T {
  return redactInner(value) as T;
}

function redactInner(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactInner);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = CRED_KEYS.has(k.toLowerCase()) ? REDACTED : redactInner(v);
    }
    return out;
  }
  return value;
}

/**
 * Present one read contract regardless of API version:
 *  - bare arrays are wrapped into `{ items: [...] }`
 *  - v2 PascalCase object keys are recursively lower-camelized (first-char only)
 *  - credential fields are redacted (always, even under `raw`)
 *
 * `raw` disables the casing/envelope transforms but never the redaction.
 */
export function normalizeResponse(data: unknown, apiVersion: ApiVersion, raw = false): unknown {
  if (raw) return redactCreds(data);
  let out = data;
  if (apiVersion === "v2") out = camelizeDeep(out);
  out = wrapEnvelope(out);
  return redactCreds(out);
}

function wrapEnvelope(value: unknown): unknown {
  if (Array.isArray(value)) return { items: value };
  return value;
}

function lowerFirst(key: string): string {
  if (key.length === 0) return key;
  return key.charAt(0).toLowerCase() + key.slice(1);
}

function camelizeDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelizeDeep);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[lowerFirst(k)] = camelizeDeep(v);
    }
    return out;
  }
  return value;
}

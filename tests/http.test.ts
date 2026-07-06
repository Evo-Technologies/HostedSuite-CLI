import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildUrl, request } from "../src/http.js";
import { CliError, EXIT } from "../src/exit-codes.js";
import type { TenantProfile } from "../src/config.js";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  delete process.env.HS_PASSWORD;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function v3Profile(overrides: Partial<TenantProfile> = {}): TenantProfile {
  return {
    baseUrl: "https://acme.example.com/api",
    customerName: "acme",
    apiVersion: "v3",
    userName: "user@example.com",
    password: "s3cret",
    ...overrides,
  };
}

function v2Profile(overrides: Partial<TenantProfile> = {}): TenantProfile {
  return { ...v3Profile(), apiVersion: "v2", ...overrides };
}

function lastInit(): RequestInit {
  return fetchMock.mock.calls[fetchMock.mock.calls.length - 1][1] as RequestInit;
}

function lastUrl(): string {
  return String(fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0]);
}

describe("buildUrl", () => {
  it("joins base + path, tolerating slashes", () => {
    expect(buildUrl("https://acme.example.com/api", "/clients")).toBe("https://acme.example.com/api/clients");
    expect(buildUrl("https://acme.example.com/api/", "clients")).toBe("https://acme.example.com/api/clients");
  });

  it("encodes scalar query params and joins arrays comma-separated", () => {
    const url = buildUrl("https://acme.example.com/api", "/clients", { page: 0, ids: ["a", "b"] });
    expect(url).toMatch(/page=0/);
    expect(url).toMatch(/ids=a%2Cb/);
  });

  it("omits undefined/null/empty values", () => {
    const url = buildUrl("https://acme.example.com/api", "/clients", { page: undefined, q: "", ids: [] });
    expect(url).not.toMatch(/page=/);
    expect(url).not.toMatch(/[?&]q=/);
    expect(url).not.toMatch(/ids=/);
  });
});

describe("v3 transport — Authorization header", () => {
  it("sends `<customerName> <base64(userName:password)>` (NOT Basic)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [] }));
    await request(v3Profile(), { method: "GET", path: "/clients" });

    const auth = (lastInit().headers as Record<string, string>).Authorization;
    const expectedToken = Buffer.from("user@example.com:s3cret").toString("base64");
    expect(auth).toBe(`acme ${expectedToken}`);
    expect(auth).not.toMatch(/^Basic /);
  });

  it("serializes a JSON body and sets Content-Type on writes", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "c1" }));
    await request(v3Profile(), { method: "POST", path: "/clients", body: { name: "Acme" } });

    const init = lastInit();
    expect(init.body).toBe('{"name":"Acme"}');
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("reads the password from HS_PASSWORD when the profile has none", async () => {
    process.env.HS_PASSWORD = "envpass";
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [] }));
    await request(v3Profile({ password: undefined }), { method: "GET", path: "/clients" });

    const auth = (lastInit().headers as Record<string, string>).Authorization;
    expect(auth).toBe(`acme ${Buffer.from("user@example.com:envpass").toString("base64")}`);
  });

  it("fails EXIT.AUTH when no password can be resolved", async () => {
    await expect(request(v3Profile({ password: undefined }), { method: "GET", path: "/clients" }))
      .rejects.toMatchObject({ code: EXIT.AUTH });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("v2 transport — credential injection", () => {
  it("injects PascalCase creds into the POST body alongside the fields", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await request(v2Profile(), { method: "POST", path: "/clients/save", body: { Name: "Acme" } });

    const body = JSON.parse(lastInit().body as string);
    expect(body.CustomerName).toBe("acme");
    expect(body.UserName).toBe("user@example.com");
    expect(body.Password).toBe("s3cret");
    expect(body.Name).toBe("Acme");
  });

  it("puts creds in the query string for the v2 GET routes", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await request(v2Profile(), { method: "GET", path: "/status" });

    const url = lastUrl();
    expect(url).toMatch(/CustomerName=acme/);
    expect(url).toMatch(/Password=s3cret/);
  });
});

describe("error → exit-code mapping", () => {
  it("maps 401 to EXIT.AUTH", async () => {
    fetchMock.mockResolvedValueOnce(new Response("no", { status: 401 }));
    await expect(request(v3Profile(), { method: "POST", path: "/clients", body: {} }))
      .rejects.toMatchObject({ code: EXIT.AUTH });
  });

  it("maps 403 to EXIT.FORBIDDEN", async () => {
    fetchMock.mockResolvedValueOnce(new Response("denied", { status: 403 }));
    await expect(request(v3Profile(), { method: "POST", path: "/clients", body: {} }))
      .rejects.toBeInstanceOf(CliError);
    fetchMock.mockResolvedValueOnce(new Response("denied", { status: 403 }));
    await expect(request(v3Profile(), { method: "POST", path: "/clients", body: {} }))
      .rejects.toMatchObject({ code: EXIT.FORBIDDEN });
  });

  it("maps 404 to EXIT.NOT_FOUND", async () => {
    fetchMock.mockResolvedValueOnce(new Response("gone", { status: 404 }));
    await expect(request(v3Profile(), { method: "GET", path: "/clients/x", retry: false }))
      .rejects.toMatchObject({ code: EXIT.NOT_FOUND });
  });

  it("maps 429 to EXIT.RATE_LIMIT", async () => {
    fetchMock.mockResolvedValueOnce(new Response("slow", { status: 429 }));
    await expect(request(v3Profile(), { method: "POST", path: "/clients", body: {} }))
      .rejects.toMatchObject({ code: EXIT.RATE_LIMIT });
  });

  it("maps 5xx to EXIT.RETRYABLE (write, no retry)", async () => {
    fetchMock.mockResolvedValueOnce(new Response("boom", { status: 500 }));
    await expect(request(v3Profile(), { method: "POST", path: "/clients", body: {} }))
      .rejects.toMatchObject({ code: EXIT.RETRYABLE });
  });

  it("maps a responseStatus.errorCode of Unauthorized to EXIT.AUTH regardless of HTTP status", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ responseStatus: { errorCode: "Unauthorized", message: "bad creds" } }, 400),
    );
    await expect(request(v3Profile(), { method: "POST", path: "/clients", body: {} }))
      .rejects.toMatchObject({ code: EXIT.AUTH });
  });
});

describe("error-body redaction", () => {
  it("redacts credentials echoed back in a v2 error body", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ UserName: "user@example.com", Password: "s3cret", message: "invalid" }, 400),
    );
    let caught: CliError | undefined;
    try {
      await request(v2Profile(), { method: "POST", path: "/clients/save", body: { Name: "Acme" } });
    } catch (err) {
      caught = err as CliError;
    }
    expect(caught).toBeInstanceOf(CliError);
    expect(caught!.message).toContain("***");
    expect(caught!.message).not.toContain("s3cret");
  });
});

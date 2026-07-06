import { describe, expect, it } from "vitest";

import { normalizeResponse, redactCreds } from "../src/normalize.js";

describe("normalizeResponse — v2 PascalCase → camelCase", () => {
  it("lower-cases the first character of every key, recursively", () => {
    const out = normalizeResponse(
      { FirstName: "Ada", Nested: { ClientId: "c1", CenterId: "x2" } },
      "v2",
    );
    expect(out).toEqual({
      firstName: "Ada",
      nested: { clientId: "c1", centerId: "x2" },
    });
  });

  it("only lowers the first character (interior casing is preserved)", () => {
    const out = normalizeResponse({ InformationCSV: "a,b" }, "v2");
    expect(out).toEqual({ informationCSV: "a,b" });
  });

  it("camelizes keys inside arrays of objects", () => {
    const out = normalizeResponse([{ ClientId: "c1" }, { ClientId: "c2" }], "v2");
    expect(out).toEqual({ items: [{ clientId: "c1" }, { clientId: "c2" }] });
  });

  it("leaves v3 keys untouched (already camelCase)", () => {
    const out = normalizeResponse({ clientId: "c1", centerId: "x2" }, "v3");
    expect(out).toEqual({ clientId: "c1", centerId: "x2" });
  });
});

describe("normalizeResponse — bare array → { items }", () => {
  it("wraps a top-level array under items (v3)", () => {
    const out = normalizeResponse([{ id: "1" }, { id: "2" }], "v3");
    expect(out).toEqual({ items: [{ id: "1" }, { id: "2" }] });
  });

  it("wraps an empty array as { items: [] }", () => {
    expect(normalizeResponse([], "v3")).toEqual({ items: [] });
  });

  it("does not wrap an object that already carries its own envelope", () => {
    const out = normalizeResponse({ items: [{ id: "1" }], totalCount: 1 }, "v3");
    expect(out).toEqual({ items: [{ id: "1" }], totalCount: 1 });
  });
});

describe("credential redaction", () => {
  it("redacts password/userName/authToken values case-insensitively", () => {
    const out = redactCreds({
      userName: "mike",
      Password: "supersecret",
      AuthToken: "tok",
      keep: "visible",
    }) as Record<string, unknown>;
    expect(out.userName).toBe("***");
    expect(out.Password).toBe("***");
    expect(out.AuthToken).toBe("***");
    expect(out.keep).toBe("visible");
  });

  it("redacts deeply, including inside arrays", () => {
    const out = redactCreds({
      list: [{ password: "p1" }, { password: "p2" }],
      nested: { creds: { userName: "u", password: "p" } },
    }) as { list: Array<{ password: string }>; nested: { creds: Record<string, string> } };
    expect(out.list[0].password).toBe("***");
    expect(out.list[1].password).toBe("***");
    expect(out.nested.creds.userName).toBe("***");
    expect(out.nested.creds.password).toBe("***");
  });

  it("applies during v2 normalization after camelization (PascalCase creds are caught)", () => {
    const out = normalizeResponse({ UserName: "u", Password: "p", Name: "Acme" }, "v2") as Record<string, unknown>;
    expect(out.userName).toBe("***");
    expect(out.password).toBe("***");
    expect(out.name).toBe("Acme");
  });

  it("redacts even under raw (no casing/envelope transform, keys keep original case)", () => {
    const out = normalizeResponse({ Password: "p", Name: "Acme" }, "v2", true) as Record<string, unknown>;
    expect(out.Password).toBe("***");
    // raw disables camelization, so the un-credential key keeps its PascalCase.
    expect(out.Name).toBe("Acme");
    expect(JSON.stringify(out)).not.toContain('"p"');
  });
});

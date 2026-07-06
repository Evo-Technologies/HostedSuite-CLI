import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildHistoryCommand, buildUndoCommand } from "../src/commands/undo.js";
import { appendEntry, readEntries, type JournalEntry } from "../src/journal.js";
import { saveConfig, type ConfigFile, type TenantProfile } from "../src/config.js";

interface Restorable {
  mockRestore(): void;
}

let tmpRoot: string;
let stdout: string;
let stdoutSpy: Restorable;
let stderrSpy: Restorable;

function profile(): TenantProfile {
  return {
    baseUrl: "https://acme.example.com/api",
    customerName: "acme",
    apiVersion: "v3",
    userName: "user@example.com",
    password: "s3cret",
  };
}

function entry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    opId: "op-1",
    ts: "2026-07-01T00:00:00.000Z",
    tenant: { alias: "acme", customerName: "acme", baseUrl: "https://acme.example.com/api", apiVersion: "v3" },
    action: "patch client",
    records: [{ entityNoun: "client", id: "c1", operation: "update", before: { name: "Old" }, after: { name: "New" } }],
    ...overrides,
  };
}

/** A fetch double dispatching on (method, url) to a JSON body via `handler`. */
function stubFetch(handler: (url: string, method: string, init: RequestInit) => unknown): ReturnType<typeof vi.fn> {
  const fn = vi.fn(async (url: unknown, init: RequestInit = {}) => {
    const method = (init.method ?? "GET").toUpperCase();
    const body = handler(String(url), method, init);
    const text = body === undefined ? "" : JSON.stringify(body);
    return {
      ok: true,
      status: 200,
      text: async () => text,
      headers: { get: () => null },
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hs-test-"));
  process.env.HOSTEDSUITE_CONFIG_DIR = path.join(tmpRoot, "config");
  process.env.HOSTEDSUITE_CACHE_DIR = path.join(tmpRoot, "cache");
  process.env.HOSTEDSUITE_NO_BANNER = "1";

  const cfg: ConfigFile = { activeTenant: "acme", tenants: { acme: profile() } };
  saveConfig(cfg);

  stdout = "";
  stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(((chunk: unknown) => {
    stdout += String(chunk);
    return true;
  }) as never);
  stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation((() => true) as never);
});

afterEach(() => {
  stdoutSpy.mockRestore();
  stderrSpy.mockRestore();
  vi.unstubAllGlobals();
  delete process.env.HOSTEDSUITE_CONFIG_DIR;
  delete process.env.HOSTEDSUITE_CACHE_DIR;
  delete process.env.HOSTEDSUITE_NO_BANNER;
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe("hs history", () => {
  it("lists journaled entries newest-first with record counts and undone state", async () => {
    appendEntry(entry({ opId: "op-1", ts: "2026-07-01T00:00:00.000Z" }));
    appendEntry(entry({ opId: "op-2", ts: "2026-07-02T00:00:00.000Z", undoneBy: "op-x" }));

    const cmd = buildHistoryCommand();
    await cmd.parseAsync(["--json"], { from: "user" });

    const out = JSON.parse(stdout.trim());
    expect(out.tenant).toBe("acme");
    expect(out.items.map((i: { opId: string }) => i.opId)).toEqual(["op-2", "op-1"]);
    expect(out.items[0].undone).toBe(true);
    expect(out.items[0].records).toBe(1);
  });
});

describe("hs undo", () => {
  it("reverses an update, PATCHing the reverse body, and marks the entry undone", async () => {
    appendEntry(entry());
    const fetchMock = stubFetch((_url, method, init) => {
      if (method === "GET") return { name: "New" }; // current matches stored `after`
      if (method === "PATCH") return { name: "Old" }; // reverse applied
      return {};
    });

    const cmd = buildUndoCommand();
    await cmd.parseAsync(["--json"], { from: "user" });

    const out = JSON.parse(stdout.trim());
    expect(out.undone).toBe("op-1");
    expect(out.reverted).toBe(1);
    expect(out.skipped).toEqual([]);
    expect(out.newOpId).toBeTruthy();

    // The PATCH carried the reverse body { name: "Old" }.
    const patchCall = fetchMock.mock.calls.find((c) => (c[1] as RequestInit).method === "PATCH");
    expect(patchCall).toBeTruthy();
    expect(JSON.parse((patchCall![1] as RequestInit).body as string)).toEqual({ name: "Old" });

    // The original entry is now marked undone by the new undo entry, which is itself journaled.
    const entries = readEntries("acme");
    expect(entries.find((e) => e.opId === "op-1")?.undoneBy).toBe(out.newOpId);
    expect(entries.find((e) => e.opId === out.newOpId)?.action).toBe("undo op-1");
  });

  it("skips a record whose current state changed since our write (concurrency), issuing no write", async () => {
    appendEntry(entry());
    const fetchMock = stubFetch((_url, method) => {
      if (method === "GET") return { name: "SOMEONE-ELSE-EDITED" }; // != stored `after` { name: "New" }
      return {};
    });

    const cmd = buildUndoCommand();
    await cmd.parseAsync(["--json"], { from: "user" });

    const out = JSON.parse(stdout.trim());
    expect(out.reverted).toBe(0);
    expect(out.skipped).toEqual([{ id: "c1", reason: "changed since (skipped)" }]);
    expect(out.newOpId).toBeUndefined();

    // No PATCH was issued (only the GET probe).
    expect(fetchMock.mock.calls.some((c) => (c[1] as RequestInit).method === "PATCH")).toBe(false);

    // The entry remains NOT undone.
    expect(readEntries("acme").find((e) => e.opId === "op-1")?.undoneBy).toBeUndefined();
  });

  it("aborts EXIT.EMPTY when there is nothing to undo", async () => {
    const cmd = buildUndoCommand();
    await expect(cmd.parseAsync(["--json"], { from: "user" })).rejects.toMatchObject({ code: 3 });
  });

  it("aborts EXIT.CONFIG when the journaled tenant identity has drifted", async () => {
    appendEntry(entry({ tenant: { alias: "acme", customerName: "acme", baseUrl: "https://OLD.example.com/api", apiVersion: "v3" } }));
    const cmd = buildUndoCommand();
    await expect(cmd.parseAsync(["--json"], { from: "user" })).rejects.toMatchObject({ code: 10 });
  });
});

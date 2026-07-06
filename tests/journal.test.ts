import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  appendEntry,
  findEntry,
  journalFile,
  markUndone,
  readEntries,
  recordWrite,
  type JournalEntry,
} from "../src/journal.js";
import {
  computeReversePatch,
  isSystemField,
  isVolatileField,
  recordsMatch,
} from "../src/commands/undo.js";
import type { ResolvedTenant, TenantProfile } from "../src/config.js";

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hs-test-"));
  process.env.HOSTEDSUITE_CACHE_DIR = path.join(tmpRoot, "cache");
});

afterEach(() => {
  delete process.env.HOSTEDSUITE_CACHE_DIR;
  delete process.env.HS_NO_JOURNAL;
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

function profile(overrides: Partial<TenantProfile> = {}): TenantProfile {
  return {
    baseUrl: "https://acme.example.com/api",
    customerName: "acme",
    apiVersion: "v3",
    userName: "user@example.com",
    password: "s3cret",
    ...overrides,
  };
}

function resolved(): ResolvedTenant {
  return { alias: "acme", profile: profile() };
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

describe("journal storage — append / read / markUndone roundtrip", () => {
  it("appends entries and reads them back newest-first", () => {
    appendEntry(entry({ opId: "op-1", ts: "2026-07-01T00:00:00.000Z" }));
    appendEntry(entry({ opId: "op-2", ts: "2026-07-02T00:00:00.000Z" }));
    const entries = readEntries("acme");
    expect(entries.map((e) => e.opId)).toEqual(["op-2", "op-1"]);
  });

  it("honours the limit and sinceTs read options", () => {
    appendEntry(entry({ opId: "op-1", ts: "2026-07-01T00:00:00.000Z" }));
    appendEntry(entry({ opId: "op-2", ts: "2026-07-02T00:00:00.000Z" }));
    appendEntry(entry({ opId: "op-3", ts: "2026-07-03T00:00:00.000Z" }));
    expect(readEntries("acme", { limit: 1 }).map((e) => e.opId)).toEqual(["op-3"]);
    expect(readEntries("acme", { sinceTs: "2026-07-01T00:00:00.000Z" }).map((e) => e.opId)).toEqual(["op-3", "op-2"]);
  });

  it("markUndone stamps undoneBy and findEntry(latest) skips undone entries", () => {
    appendEntry(entry({ opId: "op-1", ts: "2026-07-01T00:00:00.000Z" }));
    appendEntry(entry({ opId: "op-2", ts: "2026-07-02T00:00:00.000Z" }));
    markUndone("acme", "op-2", "op-undo");

    const reread = readEntries("acme");
    expect(reread.find((e) => e.opId === "op-2")?.undoneBy).toBe("op-undo");

    // Latest not-yet-undone is op-1 (op-2 is now undone).
    expect(findEntry("acme")?.opId).toBe("op-1");
    // Explicit opId resolves regardless of undone state.
    expect(findEntry("acme", "op-2")?.opId).toBe("op-2");
  });

  it("recordWrite builds an entry, redacts credentials in before/after, and returns the opId", () => {
    const built = recordWrite(resolved(), "patch client", [
      { entityNoun: "client", id: "c1", operation: "update", before: { name: "Old", password: "s3cret" }, after: { name: "New" } },
    ]);
    expect(built?.opId).toBeTruthy();

    const onDisk = fs.readFileSync(journalFile("acme"), "utf8");
    expect(onDisk).not.toMatch(/s3cret/);
    const reread = readEntries("acme")[0];
    expect((reread.records[0].before as Record<string, unknown>).password).toBe("***");
    expect((reread.records[0].before as Record<string, unknown>).name).toBe("Old");
  });

  it("HS_NO_JOURNAL=1 disables append and read entirely", () => {
    process.env.HS_NO_JOURNAL = "1";
    appendEntry(entry());
    expect(recordWrite(resolved(), "patch client", entry().records)).toBeUndefined();
    expect(readEntries("acme")).toEqual([]);
    expect(fs.existsSync(journalFile("acme"))).toBe(false);
  });
});

describe("computeReversePatch — reverse-body computation", () => {
  it("reverts a changed field to its prior value (X→Y reverts to X)", () => {
    expect(computeReversePatch({ name: "X" }, { name: "Y" })).toEqual({ name: "X" });
  });

  it("reverts a cleared reference by sending the old id back", () => {
    // Our write cleared clientId ("c1" → ""). Undo re-sets the old id.
    expect(computeReversePatch({ clientId: "c1" }, { clientId: "" })).toEqual({ clientId: "c1" });
  });

  it("reverts a newly-set reference by sending '' (the ref-clearing convention)", () => {
    // Our write set clientId (absent → "c1"). Undo clears it with "".
    expect(computeReversePatch({}, { clientId: "c1" })).toEqual({ clientId: "" });
  });

  it("ignores system/read-only fields and unchanged keys", () => {
    const reverse = computeReversePatch(
      { id: "1", name: "X", dateCreated: "d0", lastModifiedById: "u1", unchanged: "same" },
      { id: "1", name: "Y", dateCreated: "d0", lastModifiedById: "u2", unchanged: "same" },
    );
    expect(reverse).toEqual({ name: "X" });
  });
});

describe("field classifiers", () => {
  it("isSystemField flags id, date*, *ById/*ByName, and underscore-meta", () => {
    for (const k of ["id", "dateCreated", "dateArchived", "createdById", "lastModifiedByName", "_DisplayName"]) {
      expect(isSystemField(k)).toBe(true);
    }
    for (const k of ["name", "centerId", "clientId", "notes"]) expect(isSystemField(k)).toBe(false);
  });

  it("isVolatileField flags dateLastModified, lastModifiedBy*, and displayName", () => {
    for (const k of ["dateLastModified", "lastModifiedById", "lastModifiedByName", "_DisplayName"]) {
      expect(isVolatileField(k)).toBe(true);
    }
    expect(isVolatileField("name")).toBe(false);
  });
});

describe("recordsMatch — concurrency guard", () => {
  it("is true when only volatile fields differ", () => {
    expect(
      recordsMatch(
        { name: "New", dateLastModified: "t2", lastModifiedByName: "Bob" },
        { name: "New", dateLastModified: "t1", lastModifiedByName: "Alice" },
      ),
    ).toBe(true);
  });

  it("is false when a real field changed since our write", () => {
    expect(recordsMatch({ name: "CHANGED" }, { name: "New" })).toBe(false);
  });
});

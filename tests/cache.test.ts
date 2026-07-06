import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanPlans, dirSizeBytes, formatBytes, maybeWarnCacheSize, trimJournals } from "../src/cache.js";
import { buildConfigCommand } from "../src/commands/config.js";
import { loadConfig, plansDir, saveConfig } from "../src/config.js";
import { EXIT } from "../src/exit-codes.js";
import { journalDir } from "../src/journal.js";

let tmp: string;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hs-cache-test-"));
  process.env.HOSTEDSUITE_CACHE_DIR = tmp;
  process.env.HOSTEDSUITE_CONFIG_DIR = path.join(tmp, "config");
});

afterEach(() => {
  delete process.env.HOSTEDSUITE_CACHE_DIR;
  delete process.env.HOSTEDSUITE_CONFIG_DIR;
  fs.rmSync(tmp, { recursive: true, force: true });
});

function writePlanDir(name: string, expiresAt?: string): string {
  const dir = path.join(plansDir(), name);
  fs.mkdirSync(dir, { recursive: true });
  if (expiresAt !== undefined) {
    fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify({ token: name, expiresAt }));
  }
  return dir;
}

function writeJournal(alias: string, entries: Array<Record<string, unknown> | string>): string {
  fs.mkdirSync(journalDir(), { recursive: true });
  const file = path.join(journalDir(), `${alias}.jsonl`);
  const lines = entries.map((e) => (typeof e === "string" ? e : JSON.stringify(e)));
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
  return file;
}

const daysAgo = (n: number): string => new Date(Date.now() - n * 24 * 60 * 60_000).toISOString();

describe("dirSizeBytes / formatBytes", () => {
  it("sums nested files and returns 0 for a missing dir", () => {
    fs.mkdirSync(path.join(tmp, "a", "b"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "a", "x.txt"), "12345");
    fs.writeFileSync(path.join(tmp, "a", "b", "y.txt"), "1234567890");
    expect(dirSizeBytes(path.join(tmp, "a"))).toBe(15);
    expect(dirSizeBytes(path.join(tmp, "missing"))).toBe(0);
  });

  it("formats bytes at sensible units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});

describe("cleanPlans", () => {
  it("removes consumed and expired plan dirs, keeps live ones", () => {
    const consumed = writePlanDir("aaa.consumed");
    fs.writeFileSync(path.join(consumed, "progress.json"), "{}");
    const expired = writePlanDir("bbb", daysAgo(1));
    const corrupt = writePlanDir("ccc"); // no plan.json → unconfirmable → removable
    const live = writePlanDir("ddd", new Date(Date.now() + 60_000).toISOString());

    const result = cleanPlans();
    expect(result.removedDirs).toBe(3);
    expect(result.keptDirs).toBe(1);
    expect(fs.existsSync(consumed)).toBe(false);
    expect(fs.existsSync(expired)).toBe(false);
    expect(fs.existsSync(corrupt)).toBe(false);
    expect(fs.existsSync(live)).toBe(true);
  });

  it("dry-run reports without deleting", () => {
    const consumed = writePlanDir("aaa.consumed");
    const result = cleanPlans(true);
    expect(result.removedDirs).toBe(1);
    expect(fs.existsSync(consumed)).toBe(true);
  });
});

describe("trimJournals", () => {
  it("drops entries older than the cutoff, keeps newer + unparseable lines", () => {
    const file = writeJournal("acme", [
      { opId: "old1", ts: daysAgo(100), action: "patch client", records: [] },
      "{{not-json",
      { opId: "new1", ts: daysAgo(1), action: "patch client", records: [] },
    ]);

    const result = trimJournals(90);
    expect(result).toMatchObject({ files: 1, removedEntries: 1, keptEntries: 2 });
    const kept = fs.readFileSync(file, "utf8");
    expect(kept).toContain("new1");
    expect(kept).toContain("{{not-json");
    expect(kept).not.toContain("old1");
  });

  it("removes a journal file that becomes empty", () => {
    const file = writeJournal("acme", [{ opId: "old1", ts: daysAgo(100), action: "x", records: [] }]);
    trimJournals(90);
    expect(fs.existsSync(file)).toBe(false);
  });

  it("dry-run leaves files untouched", () => {
    const file = writeJournal("acme", [{ opId: "old1", ts: daysAgo(100), action: "x", records: [] }]);
    const result = trimJournals(90, true);
    expect(result.removedEntries).toBe(1);
    expect(fs.readFileSync(file, "utf8")).toContain("old1");
  });
});

// ---------------------------------------------------------------------------
// The preAction size warning
// ---------------------------------------------------------------------------

/** A minimal `hs <name>` action command with a parent, as the hook receives it. */
function fakeActionCmd(name: string, opts: Record<string, unknown> = {}): Command {
  const root = new Command("hs");
  const leaf = root.command(name);
  for (const [k, v] of Object.entries(opts)) leaf.setOptionValue(k, v);
  return leaf;
}

function captureStderr(): { chunks: string[]; restore: () => void } {
  const chunks: string[] = [];
  const spy = vi.spyOn(process.stderr, "write").mockImplementation(((chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  }) as never);
  return { chunks, restore: () => spy.mockRestore() };
}

describe("maybeWarnCacheSize", () => {
  it("warns once when over the threshold, then throttles via the stamp file", () => {
    saveConfig({ tenants: {}, settings: { cacheWarnMb: 0.0001 } }); // ~105 bytes
    fs.mkdirSync(plansDir(), { recursive: true });
    fs.writeFileSync(path.join(plansDir(), "big.json"), "x".repeat(4096));

    const err = captureStderr();
    try {
      maybeWarnCacheSize(new Command(), fakeActionCmd("whoami"));
      expect(err.chunks.join("")).toContain("hs cache clean");
      err.chunks.length = 0;
      maybeWarnCacheSize(new Command(), fakeActionCmd("whoami")); // within the 6h window
      expect(err.chunks.join("")).toBe("");
    } finally {
      err.restore();
    }
  });

  it("stays silent under the threshold, with --quiet, when disabled, and for `hs cache`", () => {
    fs.mkdirSync(plansDir(), { recursive: true });
    fs.writeFileSync(path.join(plansDir(), "big.json"), "x".repeat(4096));

    const err = captureStderr();
    try {
      saveConfig({ tenants: {}, settings: { cacheWarnMb: 50 } }); // way under 50 MB
      maybeWarnCacheSize(new Command(), fakeActionCmd("whoami"));

      saveConfig({ tenants: {}, settings: { cacheWarnMb: 0.0001 } });
      fs.rmSync(path.join(tmp, ".size-checked"), { force: true });
      maybeWarnCacheSize(new Command(), fakeActionCmd("whoami", { quiet: true }));

      saveConfig({ tenants: {}, settings: { cacheWarnMb: 0 } }); // disabled
      fs.rmSync(path.join(tmp, ".size-checked"), { force: true });
      maybeWarnCacheSize(new Command(), fakeActionCmd("whoami"));

      // `hs cache clean` itself never nags.
      saveConfig({ tenants: {}, settings: { cacheWarnMb: 0.0001 } });
      fs.rmSync(path.join(tmp, ".size-checked"), { force: true });
      const root = new Command("hs");
      const clean = root.command("cache").command("clean");
      maybeWarnCacheSize(new Command(), clean);

      expect(err.chunks.join("")).toBe("");
    } finally {
      err.restore();
    }
  });
});

describe("config key cache-warn-mb", () => {
  it("round-trips a numeric value and rejects garbage", async () => {
    const out = captureStdout();
    try {
      await buildConfigCommand().parseAsync(["set", "cache-warn-mb", "100"], { from: "user" });
      expect(loadConfig().settings?.cacheWarnMb).toBe(100);

      out.chunks.length = 0;
      await buildConfigCommand().parseAsync(["get", "cache-warn-mb"], { from: "user" });
      expect(JSON.parse(out.chunks.join("").trim())).toEqual({ "cache-warn-mb": 100 });
    } finally {
      out.restore();
    }
    await expect(
      buildConfigCommand().parseAsync(["set", "cache-warn-mb", "lots"], { from: "user" }),
    ).rejects.toMatchObject({ code: EXIT.USAGE });
  });
});

function captureStdout(): { chunks: string[]; restore: () => void } {
  const chunks: string[] = [];
  const spy = vi.spyOn(process.stdout, "write").mockImplementation(((chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  }) as never);
  return { chunks, restore: () => spy.mockRestore() };
}

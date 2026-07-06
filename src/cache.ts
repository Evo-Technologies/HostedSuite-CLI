import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";

import { cacheDir, loadConfig, plansDir, type ConfigFile } from "./config.js";
import { journalDir } from "./journal.js";
import type { GlobalFlags } from "./output.js";

// ===========================================================================
// Cache housekeeping. The plan store (plans/<token>[.consumed]/) and the change
// journal (journal/<alias>.jsonl) grow without bound, so every command checks
// the cache size (throttled) and warns when it crosses a threshold; `hs cache
// info|clean` inspect and prune it.
// ===========================================================================

/** Default warn threshold. Override with `hs config set cache-warn-mb <n>`; 0 disables. */
export const DEFAULT_CACHE_WARN_MB = 50;

/** Re-check the size at most this often (a stamp file throttles the walk). */
const CHECK_INTERVAL_MS = 6 * 60 * 60_000;

/** Effective warn threshold in MB (0 = disabled). */
export function cacheWarnMb(cfg: ConfigFile): number {
  const v = cfg.settings?.cacheWarnMb;
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : DEFAULT_CACHE_WARN_MB;
}

/** Recursive size of a directory in bytes (0 when missing/unreadable). */
export function dirSizeBytes(dir: string): number {
  let total = 0;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      total += dirSizeBytes(full);
    } else if (e.isFile()) {
      try {
        total += fs.statSync(full).size;
      } catch {
        /* raced away — skip */
      }
    }
  }
  return total;
}

export function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

function stampFile(): string {
  return path.join(cacheDir(), ".size-checked");
}

/**
 * preAction hook: warn (stderr, suppressible with `--quiet`) when the cache
 * grows past the threshold. Throttled to one size walk per 6h via a stamp file,
 * and skipped for `hs cache …` itself (you're already dealing with it).
 * Best-effort: never fails the command.
 */
export function maybeWarnCacheSize(_thisCmd: Command, actionCmd: Command): void {
  try {
    let top: Command = actionCmd;
    while (top.parent && top.parent.parent) top = top.parent;
    if (top.name() === "cache") return;

    const globals = actionCmd.optsWithGlobals<GlobalFlags>();
    if (globals.quiet) return;

    const warnMb = cacheWarnMb(loadConfig());
    if (warnMb === 0) return;

    const stamp = stampFile();
    try {
      if (Date.now() - fs.statSync(stamp).mtimeMs < CHECK_INTERVAL_MS) return;
    } catch {
      /* no stamp yet → check now */
    }

    const total = dirSizeBytes(cacheDir());
    try {
      fs.mkdirSync(cacheDir(), { recursive: true, mode: 0o700 });
      fs.writeFileSync(stamp, "");
    } catch {
      /* stamp is best-effort */
    }
    if (total > warnMb * 1024 * 1024) {
      process.stderr.write(
        `NOTE: the hostedsuite cache is ${formatBytes(total)} (plans + change journal) — ` +
          `run \`hs cache clean\` to prune it (threshold: ${warnMb} MB, \`hs config set cache-warn-mb <n>\`).\n`,
      );
    }
  } catch {
    /* housekeeping must never break a command */
  }
}

// ---------------------------------------------------------------------------
// Pruning
// ---------------------------------------------------------------------------

export interface PlanCleanResult {
  removedDirs: number;
  keptDirs: number;
  freedBytes: number;
}

/**
 * Remove plan directories that can no longer be executed: every `<token>.consumed/`
 * (already applied) and any pending `<token>/` whose plan.json is expired or
 * unreadable. Live (unexpired, unconsumed) plans are kept.
 */
export function cleanPlans(dryRun = false): PlanCleanResult {
  const dir = plansDir();
  const result: PlanCleanResult = { removedDirs: 0, keptDirs: 0, freedBytes: 0 };
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return result;
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const full = path.join(dir, e.name);
    if (e.name.endsWith(".consumed") || planExpired(full)) {
      result.freedBytes += dirSizeBytes(full);
      result.removedDirs += 1;
      if (!dryRun) {
        try {
          fs.rmSync(full, { recursive: true, force: true });
        } catch {
          /* best-effort */
        }
      }
    } else {
      result.keptDirs += 1;
    }
  }
  return result;
}

/** True when a pending plan dir's plan.json is expired or unreadable. */
function planExpired(dir: string): boolean {
  try {
    const plan = JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8")) as { expiresAt?: string };
    const t = plan.expiresAt ? new Date(plan.expiresAt).getTime() : NaN;
    return !Number.isFinite(t) || t < Date.now();
  } catch {
    return true; // no/corrupt plan.json → cannot be confirmed → safe to remove
  }
}

export interface JournalTrimResult {
  files: number;
  removedEntries: number;
  keptEntries: number;
  freedBytes: number;
}

/**
 * Trim journal entries older than `days` from every tenant's journal file.
 * Removing an entry forfeits `hs undo` for that operation, so this only runs
 * on an explicit `hs cache clean --journal-days <n>`. Unparseable lines are
 * kept verbatim (same policy as markUndone).
 */
export function trimJournals(days: number, dryRun = false): JournalTrimResult {
  const result: JournalTrimResult = { files: 0, removedEntries: 0, keptEntries: 0, freedBytes: 0 };
  const dir = journalDir();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60_000).toISOString();
  let names: string[];
  try {
    names = fs.readdirSync(dir).filter((n) => n.endsWith(".jsonl"));
  } catch {
    return result;
  }
  for (const name of names) {
    const file = path.join(dir, name);
    let raw: string;
    try {
      raw = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const kept: string[] = [];
    let removed = 0;
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;
      let old = false;
      try {
        const parsed = JSON.parse(trimmed) as { ts?: string };
        old = typeof parsed.ts === "string" && parsed.ts < cutoff;
      } catch {
        /* unparseable → keep verbatim */
      }
      if (old) removed += 1;
      else kept.push(trimmed);
    }
    result.files += 1;
    result.removedEntries += removed;
    result.keptEntries += kept.length;
    if (removed > 0) {
      const next = kept.length > 0 ? `${kept.join("\n")}\n` : "";
      result.freedBytes += Buffer.byteLength(raw) - Buffer.byteLength(next);
      if (!dryRun) {
        try {
          if (next.length === 0) {
            fs.rmSync(file, { force: true });
          } else {
            fs.writeFileSync(file, next, { mode: 0o600 });
            try { fs.chmodSync(file, 0o600); } catch { /* Windows */ }
          }
        } catch {
          /* best-effort */
        }
      }
    }
  }
  return result;
}

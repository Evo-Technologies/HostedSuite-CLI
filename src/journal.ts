import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

import { cacheDir, type ResolvedTenant } from "./config.js";
import { redactCreds } from "./normalize.js";

/**
 * The change journal (PLAN — undo/history). Every successful write records a
 * JournalEntry (one line of JSONL under cacheDir()/journal/<alias>.jsonl) so that
 * `hs history` can list recent changes and `hs undo` can reverse them. Journaling
 * is best-effort: a failure to write the journal must never abort a real write.
 *
 * Set HS_NO_JOURNAL=1 to disable journaling entirely (no reads, no writes).
 */

export type JournalOperation = "create" | "update" | "delete" | "restore";

export interface JournalRecord {
  /** The CLI noun (registry key) so undo can map back to v3 uriBase / v2 routes. */
  entityNoun: string;
  /** The record id (empty string if it could not be determined). */
  id: string;
  /** The API entity type if known (best-effort, from the response payload). */
  type?: string;
  operation: JournalOperation;
  /** State before the write (null for a create). Credentials are redacted. */
  before: unknown | null;
  /** State after the write (null for a delete). Credentials are redacted. */
  after: unknown | null;
}

export interface JournalTenant {
  alias: string;
  customerName: string;
  baseUrl: string;
  apiVersion: string;
}

export interface JournalEntry {
  opId: string;
  /** ISO timestamp. */
  ts: string;
  tenant: JournalTenant;
  /** Human action label, e.g. "patch client", "bulk-archive contacts", "undo <opId>". */
  action: string;
  records: JournalRecord[];
  /** opId of the entry that undid this one (set by `hs undo`). */
  undoneBy?: string;
}

export interface ReadOptions {
  limit?: number;
  sinceTs?: string;
}

// ---------------------------------------------------------------------------
// Paths + enable flag
// ---------------------------------------------------------------------------

export function journalDir(): string {
  return path.join(cacheDir(), "journal");
}

export function journalFile(alias: string): string {
  return path.join(journalDir(), `${alias}.jsonl`);
}

/** Journaling (and history/undo reads) are disabled when HS_NO_JOURNAL === "1". */
export function journalingDisabled(): boolean {
  return process.env.HS_NO_JOURNAL === "1";
}

/** opId = base36(now) + "-" + 3 random bytes hex (short, sortable-ish, unique). */
export function newOpId(): string {
  return `${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
}

// ---------------------------------------------------------------------------
// Append / read / mutate
// ---------------------------------------------------------------------------

/** Append one JournalEntry as a JSON line (mode 600 dir/file). Best-effort no-op when disabled. */
export function appendEntry(entry: JournalEntry): void {
  if (journalingDisabled()) return;
  try {
    const dir = journalDir();
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const file = journalFile(entry.tenant.alias);
    fs.appendFileSync(file, `${JSON.stringify(entry)}\n`, { mode: 0o600 });
    try { fs.chmodSync(file, 0o600); } catch { /* Windows: falls back to profile ACL */ }
  } catch {
    /* journaling is best-effort; never abort a write over it */
  }
}

/** Parse a tenant's journal, newest-first. Honours {limit, sinceTs}. Empty when disabled/missing. */
export function readEntries(alias: string, opts: ReadOptions = {}): JournalEntry[] {
  if (journalingDisabled()) return [];
  const file = journalFile(alias);
  if (!fs.existsSync(file)) return [];
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    return [];
  }
  const entries: JournalEntry[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    try {
      const parsed = JSON.parse(trimmed) as JournalEntry;
      if (parsed && typeof parsed === "object" && typeof parsed.opId === "string") entries.push(parsed);
    } catch {
      /* skip a corrupt line rather than fail the whole read */
    }
  }
  let out = entries;
  if (opts.sinceTs) out = out.filter((e) => e.ts > opts.sinceTs!);
  out = out.reverse(); // file is oldest→newest; callers want newest-first
  if (opts.limit !== undefined && opts.limit >= 0) out = out.slice(0, opts.limit);
  return out;
}

/**
 * Mark an entry as undone by rewriting the whole file with `undoneBy = byOpId`
 * set on the matching entry. No-op when disabled or the opId is not present.
 */
export function markUndone(alias: string, opId: string, byOpId: string): void {
  if (journalingDisabled()) return;
  const file = journalFile(alias);
  if (!fs.existsSync(file)) return;
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    return;
  }
  const lines: string[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    try {
      const parsed = JSON.parse(trimmed) as JournalEntry;
      if (parsed.opId === opId) parsed.undoneBy = byOpId;
      lines.push(JSON.stringify(parsed));
    } catch {
      lines.push(trimmed); // preserve an unparseable line verbatim
    }
  }
  try {
    fs.writeFileSync(file, `${lines.join("\n")}\n`, { mode: 0o600 });
    try { fs.chmodSync(file, 0o600); } catch { /* Windows */ }
  } catch {
    /* best-effort */
  }
}

/**
 * Resolve a journal entry to act on: an explicit opId (any state), else the
 * latest entry that has not yet been undone. Returns undefined when none match.
 */
export function findEntry(alias: string, opId?: string): JournalEntry | undefined {
  const entries = readEntries(alias); // newest-first
  if (opId) return entries.find((e) => e.opId === opId);
  return entries.find((e) => !e.undoneBy);
}

// ---------------------------------------------------------------------------
// Convenience: build + append an entry for a successful write
// ---------------------------------------------------------------------------

/** Best-effort deep-extract of the API entity type from a payload (`_type`/`type`/`$type`). */
export function extractType(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const rec = value as Record<string, unknown>;
  for (const k of ["_type", "type", "$type"]) {
    const v = rec[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

/**
 * Build a JournalEntry for a successful write and append it. Credentials in
 * `before`/`after` are redacted before storage (never persist a password even if
 * a response echoed one). No-op (returns undefined) when journaling is disabled.
 */
export function recordWrite(
  resolved: ResolvedTenant,
  action: string,
  records: JournalRecord[],
): JournalEntry | undefined {
  if (journalingDisabled()) return undefined;
  const entry: JournalEntry = {
    opId: newOpId(),
    ts: new Date().toISOString(),
    tenant: {
      alias: resolved.alias,
      customerName: resolved.profile.customerName,
      baseUrl: resolved.profile.baseUrl,
      apiVersion: resolved.profile.apiVersion,
    },
    action,
    records: records.map((r) => ({
      ...r,
      before: r.before === null || r.before === undefined ? null : redactCreds(r.before),
      after: r.after === null || r.after === undefined ? null : redactCreds(r.after),
    })),
  };
  appendEntry(entry);
  return entry;
}

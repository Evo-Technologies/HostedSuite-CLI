import { Command } from "commander";

import {
  loadConfig,
  setLastWriteTenant,
  strictModeOn,
  type ResolvedTenant,
  type TenantProfile,
} from "../config.js";
import { findEntity, type EntityDef, type EntityV2, type EntityV3 } from "../entities.js";
import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { request } from "../http.js";
import {
  findEntry,
  markUndone,
  readEntries,
  recordWrite,
  type JournalEntry,
  type JournalRecord,
} from "../journal.js";
import { emit, note, printBanner, type GlobalFlags } from "../output.js";
import { fetchCurrentRecord, parseTimeout } from "./entity.js";

// ===========================================================================
// `hs history` and `hs undo` — the change journal's read + reverse surfaces.
// Undo is an explicit recovery action the user already asked for, so it does
// NOT route through the bulk two-phase gate; it still pins to the journaled
// tenant and prints the banner.
// ===========================================================================

interface HistoryOpts {
  tenant?: string;
  limit?: string;
  all?: boolean;
  json?: boolean;
  plain?: boolean;
  select?: string;
  out?: string;
  quiet?: boolean;
}

// ---------------------------------------------------------------------------
// hs history
// ---------------------------------------------------------------------------

export function buildHistoryCommand(): Command {
  const cmd = new Command("history")
    .description("List recent journaled changes for a tenant (newest first).")
    // NOTE: not addGlobalFlags — the global `-n` is --dry-run; here -n is the entry count.
    .option("--tenant <alias>", "Tenant whose history to show (default: active tenant)")
    .option("-n, --limit <n>", "Max entries to show (default 20)")
    .option("--all", "Show every entry (ignore the -n limit)")
    .option("-j, --json", "Force JSON output")
    .option("-p, --plain", "Tab-separated output")
    .option("--select <fields>", "Comma-separated list of top-level fields to keep")
    .option("--out <path>", "Write JSON to <path>")
    .option("--quiet", "Suppress the tenant banner")
    .addHelpText(
      "after",
      "\nExamples:\n  hs history\n  hs history -n 50\n  hs history --tenant acme --all --json\n",
    )
    .action((opts: HistoryOpts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags & HistoryOpts>();
      const alias = resolveJournalAlias(globals.tenant);
      const limit = opts.all ? undefined : parseLimit(opts.limit);
      const entries = readEntries(alias, { limit });
      const items = entries.map((e) => ({
        opId: e.opId,
        ts: e.ts,
        action: e.action,
        records: e.records.length,
        undone: e.undoneBy ? true : undefined,
        undoneBy: e.undoneBy,
      }));
      emit({ tenant: alias, items }, { ...globals, emptyExit: false });
    });

  return cmd;
}

function resolveJournalAlias(override?: string): string {
  const cfg = loadConfig();
  const env = process.env.HS_TENANT;
  const hasEnv = typeof env === "string" && env.length > 0;
  // Same precedence as resolveActiveTenant: --tenant → HS_TENANT → active tenant.
  const alias = override ?? (hasEnv ? env : cfg.activeTenant);
  if (strictModeOn(cfg) && !override && !hasEnv) {
    throw new CliError(
      EXIT.USAGE,
      "Strict mode is on: no tenant specified. Pass --tenant <alias> or set HS_TENANT=<alias>.",
    );
  }
  if (!alias) {
    throw new CliError(EXIT.CONFIG, "No active tenant. Pass --tenant <alias> or run `hs tenant use <alias>`.");
  }
  return alias;
}

function parseLimit(raw?: string): number {
  if (raw === undefined) return 20;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new CliError(EXIT.USAGE, `-n/--limit must be a non-negative number (got "${raw}").`);
  return Math.floor(n);
}

// ---------------------------------------------------------------------------
// hs undo
// ---------------------------------------------------------------------------

interface SkipItem {
  id: string;
  reason: string;
}

export function buildUndoCommand(): Command {
  return addGlobalFlags(new Command("undo"))
    .argument("[opId]", "The op id to undo (default: the latest not-yet-undone change)")
    .description("Reverse a journaled change. Pins to the change's tenant; not routed through the bulk gate.")
    .addHelpText(
      "after",
      "\nExamples:\n  hs undo                 # undo the most recent change on the active tenant\n" +
        "  hs undo l2k3j-a1b2c3     # undo a specific op id (from `hs history`)\n\n" +
        "Safety:\n  Reversal writes are real writes to the change's ORIGINAL tenant. An update whose record " +
        "changed since our write is skipped (not clobbered). The undo is itself journaled, so it can be undone (redo).\n",
    )
    .action(async (opId: string | undefined, _opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const alias = resolveJournalAlias(globals.tenant);

      const entry = findEntry(alias, opId);
      if (!entry) {
        const which = opId ? `No journal entry "${opId}" for tenant ${alias}.` : `Nothing to undo on tenant ${alias}.`;
        throw new CliError(EXIT.EMPTY, which);
      }
      if (entry.undoneBy) {
        throw new CliError(EXIT.USAGE, `Op ${entry.opId} was already undone by ${entry.undoneBy}.`);
      }

      // Pin to the journaled tenant identity — abort if the alias has drifted (like confirm).
      const resolved = pinnedTenant(alias, entry);
      const { profile } = resolved;
      printBanner(resolved, globals);
      note(`Undoing ${entry.opId} (${entry.action}) — ${entry.records.length} record(s).`);

      const reverted: JournalRecord[] = [];
      const skipped: SkipItem[] = [];

      for (const rec of entry.records) {
        const def = findEntity(rec.entityNoun);
        if (!def) {
          skipped.push({ id: rec.id, reason: "unknown entity (skipped)" });
          continue;
        }
        try {
          const redo = await reverseRecord(def, rec, profile, globals);
          if (redo.skipped) skipped.push({ id: rec.id, reason: redo.skipped });
          else if (redo.record) reverted.push(redo.record);
        } catch (err) {
          skipped.push({ id: rec.id, reason: err instanceof Error ? err.message : String(err) });
        }
      }

      // Journal the undo as a NEW entry so it is itself undoable (redo), then link the original.
      let newOpId: string | undefined;
      if (reverted.length > 0) {
        const undoEntry = recordWrite(resolved, `undo ${entry.opId}`, reverted);
        newOpId = undoEntry?.opId;
        if (newOpId) markUndone(alias, entry.opId, newOpId);
        setLastWriteTenant(alias);
      }

      emit(
        { undone: entry.opId, reverted: reverted.length, skipped, newOpId },
        globals,
      );
    });
}

function pinnedTenant(alias: string, entry: JournalEntry): ResolvedTenant {
  const cfg = loadConfig();
  const profile: TenantProfile | undefined = cfg.tenants[entry.tenant.alias];
  if (!profile) {
    throw new CliError(EXIT.CONFIG, `Journaled tenant "${entry.tenant.alias}" no longer exists in config.`);
  }
  if (profile.baseUrl !== entry.tenant.baseUrl || profile.customerName !== entry.tenant.customerName) {
    throw new CliError(
      EXIT.CONFIG,
      `Tenant "${entry.tenant.alias}" changed since op ${entry.opId} ` +
        `(journaled ${entry.tenant.customerName}@${entry.tenant.baseUrl}). Refusing to undo against a different tenant.`,
    );
  }
  return { alias: entry.tenant.alias, profile };
}

// ---------------------------------------------------------------------------
// Per-record reversal
// ---------------------------------------------------------------------------

interface Reversal {
  /** A redo record when the reversal issued a write; undefined when skipped. */
  record?: JournalRecord;
  /** Present when the record was NOT reversed, with a human reason. */
  skipped?: string;
}

async function reverseRecord(
  def: EntityDef,
  rec: JournalRecord,
  profile: TenantProfile,
  globals: GlobalFlags,
): Promise<Reversal> {
  switch (rec.operation) {
    case "update":
      return reverseUpdate(def, rec, profile, globals);
    case "create":
      // We created it → undo = archive it.
      return reverseByArchive(def, rec, profile, globals, rec.after);
    case "restore":
      // We restored it → undo = archive it again.
      return reverseByArchive(def, rec, profile, globals, rec.after);
    case "delete":
      // We archived/deleted it → undo = restore it.
      return reverseByRestore(def, rec, profile, globals);
    default:
      return { skipped: `unknown operation "${String(rec.operation)}" (skipped)` };
  }
}

async function reverseUpdate(
  def: EntityDef,
  rec: JournalRecord,
  profile: TenantProfile,
  globals: GlobalFlags,
): Promise<Reversal> {
  const current = await fetchCurrentRecord(def, rec.id, profile, globals);
  if (!current) return { skipped: "not found (skipped)" };
  if (!recordsMatch(current, rec.after)) return { skipped: "changed since (skipped)" };

  const reverse = computeReversePatch(rec.before, rec.after);
  if (Object.keys(reverse).length === 0) return { skipped: "no reversible fields (skipped)" };

  if (profile.apiVersion === "v3") {
    const v3 = def.v3 as EntityV3 | undefined;
    if (!v3) return { skipped: "no v3 surface (skipped)" };
    const bodyId = v3.patchStyle === "body-id";
    const path = v3.singleton || bodyId ? v3.uriBase : `${v3.uriBase}/${encodeURIComponent(rec.id)}`;
    const body: Record<string, unknown> = { ...reverse };
    if (bodyId && !v3.singleton) body.id = rec.id;
    await writeRequest(profile, { method: "PATCH", path, body }, globals);
  } else {
    const v2 = def.v2 as EntityV2 | undefined;
    if (!v2?.update) return { skipped: "no v2 update route (skipped)" };
    const translated: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(reverse)) {
      const mapped = v2.update.fieldMap[k];
      if (mapped !== undefined) translated[mapped] = val;
    }
    if (Object.keys(translated).length === 0) return { skipped: "no reversible v2 fields (skipped)" };
    translated[v2.update.idField] = rec.id;
    await writeRequest(profile, { method: "POST", path: v2.update.route, body: translated }, globals);
  }

  // Redo record: undoing this undo re-applies our original write's after-state.
  return {
    record: {
      entityNoun: def.noun,
      id: rec.id,
      type: rec.type,
      operation: "update",
      before: rec.after,
      after: rec.before,
    },
  };
}

async function reverseByArchive(
  def: EntityDef,
  rec: JournalRecord,
  profile: TenantProfile,
  globals: GlobalFlags,
  priorState: unknown | null,
): Promise<Reversal> {
  if (profile.apiVersion === "v3") {
    const v3 = def.v3 as EntityV3 | undefined;
    if (!v3) return { skipped: "no v3 surface (skipped)" };
    const gone = await writeRequestAllowNotFound(
      profile,
      { method: "DELETE", path: `${v3.uriBase}/${encodeURIComponent(rec.id)}` },
      globals,
    );
    if (gone) return { skipped: "already gone (skipped)" };
  } else {
    const v2 = def.v2 as EntityV2 | undefined;
    if (!v2?.archive) return { skipped: "no archive route (skipped)" };
    const gone = await writeRequestAllowNotFound(
      profile,
      { method: "POST", path: v2.archive.route, body: { [v2.archive.idField]: rec.id } },
      globals,
    );
    if (gone) return { skipped: "already gone (skipped)" };
  }
  // Redo record: a deletion — undoing this undo restores the record.
  return {
    record: { entityNoun: def.noun, id: rec.id, type: rec.type, operation: "delete", before: priorState ?? null, after: null },
  };
}

async function reverseByRestore(
  def: EntityDef,
  rec: JournalRecord,
  profile: TenantProfile,
  globals: GlobalFlags,
): Promise<Reversal> {
  if (profile.apiVersion === "v3") {
    const v3 = def.v3 as EntityV3 | undefined;
    if (!v3) return { skipped: "no v3 surface (skipped)" };
    const bodyId = v3.patchStyle === "body-id";
    const path = bodyId ? v3.uriBase : `${v3.uriBase}/${encodeURIComponent(rec.id)}`;
    const body: Record<string, unknown> = { __Restore: true };
    if (bodyId) body.id = rec.id;
    await writeRequest(profile, { method: "PATCH", path, body }, globals);
  } else {
    const v2 = def.v2 as EntityV2 | undefined;
    if (!v2?.restore) return { skipped: "no restore route (skipped)" };
    await writeRequest(profile, { method: "POST", path: v2.restore.route, body: { [v2.restore.idField]: rec.id } }, globals);
  }
  // Redo record: a restore — undoing this undo archives the record again.
  return {
    record: { entityNoun: def.noun, id: rec.id, type: rec.type, operation: "restore", before: null, after: rec.before ?? null },
  };
}

interface WriteSpec {
  method: string;
  path: string;
  body?: unknown;
}

async function writeRequest(profile: TenantProfile, spec: WriteSpec, globals: GlobalFlags): Promise<void> {
  await request(profile, { ...spec, retry: false, timeoutMs: parseTimeout(globals) });
}

/** Like writeRequest but returns true when the record is already gone (404/NOT_FOUND). */
async function writeRequestAllowNotFound(profile: TenantProfile, spec: WriteSpec, globals: GlobalFlags): Promise<boolean> {
  try {
    await request(profile, { ...spec, retry: false, timeoutMs: parseTimeout(globals) });
    return false;
  } catch (err) {
    if (err instanceof CliError && err.code === EXIT.NOT_FOUND) return true;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Pure reversal logic (exported for tests)
// ---------------------------------------------------------------------------

const SYSTEM_EXACT = new Set(["id", "dateCreated", "dateLastModified", "dateArchived", "dateDeleted"]);

/** System / read-only fields that a reverse-patch must never write. */
export function isSystemField(key: string): boolean {
  if (SYSTEM_EXACT.has(key)) return true;
  if (key.startsWith("_")) return true; // _DisplayName and other meta
  if (/ById$/.test(key) || /ByName$/.test(key)) return true;
  if (/^(createdBy|lastModifiedBy|archivedBy|deletedBy)/.test(key)) return true;
  return false;
}

/** Volatile fields ignored when checking whether a record changed since our write. */
export function isVolatileField(key: string): boolean {
  const lower = key.toLowerCase();
  if (lower === "datelastmodified") return true;
  if (lower.startsWith("lastmodifiedby")) return true;
  if (/^_?displayname$/i.test(key)) return true;
  return false;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  const aArr = Array.isArray(a);
  const bArr = Array.isArray(b);
  if (aArr !== bArr) return false;
  if (aArr && bArr) {
    if (a.length !== b.length) return false;
    return a.every((x, i) => deepEqual(x, b[i]));
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const ak = Object.keys(ao);
  const bk = Object.keys(bo);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => Object.prototype.hasOwnProperty.call(bo, k) && deepEqual(ao[k], bo[k]));
}

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/**
 * Compute the PATCH body that reverses a write, given the record's `before` and
 * `after` snapshots. For each non-system top-level key our write changed
 * (before[k] !== after[k]), set `before[k]` back — except when `before[k]` is
 * absent/null and the key is a reference (`*Id`), where we send "" to clear it
 * (the CLI's ref-clearing convention). Keys our write did not change are left
 * untouched.
 */
export function computeReversePatch(before: unknown, after: unknown): Record<string, unknown> {
  const b = asObject(before);
  const a = asObject(after);
  const out: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  for (const k of keys) {
    if (isSystemField(k)) continue;
    if (deepEqual(b[k], a[k])) continue; // our write did not touch this key
    const bv = b[k];
    if ((bv === null || bv === undefined) && k.endsWith("Id")) {
      out[k] = ""; // reference was set by our write → clear it to reverse
    } else if (bv !== undefined) {
      out[k] = bv;
    }
    // (a non-Id field that was absent before our write cannot be cleared via PATCH — skip it)
  }
  return out;
}

/**
 * True when `current` still matches the `after` we recorded, ignoring volatile
 * fields — i.e. nothing changed the record since our write. A mismatch means a
 * concurrent edit, so undo must NOT clobber it.
 */
export function recordsMatch(current: unknown, after: unknown): boolean {
  const c = asObject(current);
  const a = asObject(after);
  const keys = new Set([...Object.keys(c), ...Object.keys(a)]);
  for (const k of keys) {
    if (isVolatileField(k)) continue;
    if (!deepEqual(c[k], a[k])) return false;
  }
  return true;
}

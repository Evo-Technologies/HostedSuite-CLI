import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";

import {
  consumePlanAtomically,
  loadConfig,
  plansDir,
  setLastWriteTenant,
  type BulkPlan,
  type PlanRequest,
  type ResolvedTenant,
} from "../config.js";
import { findEntityByPlural, type EntityDef } from "../entities.js";
import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { request } from "../http.js";
import {
  extractType,
  recordWrite,
  type JournalOperation,
  type JournalRecord,
} from "../journal.js";
import { normalizeResponse } from "../normalize.js";
import { emit, note, printBanner, type GlobalFlags } from "../output.js";
import { fetchCurrentRecord, parseTimeout } from "./entity.js";

interface RecordOutcome {
  index: number;
  method: string;
  path: string;
  status: "applied" | "failed";
  error?: string;
}

export function buildConfirmCommand(): Command {
  return addGlobalFlags(new Command("confirm"))
    .argument("<token>", "Token from a prior phase-1 bulk response (exit 11)")
    .description("Phase 2 of a gated bulk plan. Always executes against the plan's PINNED tenant.")
    .addHelpText(
      "after",
      "\nSafety:\n  Ignores --tenant and the active tenant — writes go to the tenant pinned at phase 1. " +
        "Token consumption is atomic and single-use.\n",
    )
    .action(async (token: string, _opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();

      if (globals.tenant) {
        throw new CliError(EXIT.USAGE, "confirm always runs against the plan's tenant; remove --tenant.");
      }

      // Atomically claim the token BEFORE any write (a second confirm loses the race → exit 4).
      const plan = consumePlanAtomically(token);

      // Resolve the PINNED tenant and verify its identity has not drifted.
      const cfg = loadConfig();
      const profile = cfg.tenants[plan.tenant.alias];
      if (!profile) {
        throw new CliError(
          EXIT.CONFIG,
          `Plan tenant "${plan.tenant.alias}" no longer exists in config. Re-run phase 1.`,
        );
      }
      if (profile.baseUrl !== plan.tenant.baseUrl || profile.customerName !== plan.tenant.customerName) {
        throw new CliError(
          EXIT.CONFIG,
          `Plan tenant "${plan.tenant.alias}" changed since phase 1 ` +
            `(pinned ${plan.tenant.customerName}@${plan.tenant.baseUrl}). Re-run phase 1.`,
        );
      }

      const resolved: ResolvedTenant = { alias: plan.tenant.alias, profile };
      printBanner(resolved, globals);
      note(`Executing ${plan.action}: ${plan.summary}`);
      if (plan.recentTenantSwitch) {
        note("NOTE: this plan was created right after a tenant switch — re-verify the tenant before proceeding.");
      }

      const progressPath = path.join(plansDir(), `${token}.consumed`, "progress.json");
      const failuresPath = path.join(plansDir(), `${token}.consumed`, "failures.json");
      const outcomes: RecordOutcome[] = [];
      const failed: RecordOutcome[] = [];

      // Journaling context derived from the plan's action ("bulk-<verb> <plural>").
      const journal = bulkJournalContext(plan.action);
      const journalRecords: JournalRecord[] = [];

      for (let i = 0; i < plan.requests.length; i += 1) {
        const req = plan.requests[i];
        const id = journal ? requestId(journal.def, profile.apiVersion, journal.operation, req) : "";
        // Snapshot `before` prior to the write (skip for a create, which has none).
        let before: unknown | null = null;
        if (journal && id && journal.operation !== "create") {
          before = await fetchCurrentRecord(journal.def, id, profile, globals);
        }
        try {
          const after = await executeRequest(profile.apiVersion, profile, req, globals);
          outcomes.push({ index: i, method: req.method, path: req.path, status: "applied" });
          if (journal) {
            journalRecords.push({
              entityNoun: journal.def.noun,
              id,
              type: extractType(after) ?? extractType(before),
              operation: journal.operation,
              before: before ?? null,
              after: journal.operation === "delete" ? null : (after ?? null),
            });
          }
        } catch (err) {
          const outcome: RecordOutcome = {
            index: i,
            method: req.method,
            path: req.path,
            status: "failed",
            error: err instanceof Error ? err.message : String(err),
          };
          outcomes.push(outcome);
          failed.push(outcome);
        }
        // Persist progress after every record so a mid-run kill leaves an accurate applied set.
        writeJsonQuiet(progressPath, { token, plan: plan.action, outcomes });
      }

      setLastWriteTenant(plan.tenant.alias);
      // Journal one entry for all successfully-applied records (best-effort).
      if (journalRecords.length > 0) recordWrite(resolved, plan.action, journalRecords);

      const appliedCount = outcomes.filter((o) => o.status === "applied").length;
      const result: Record<string, unknown> = {
        token,
        action: plan.action,
        applied: appliedCount,
        failed: failed.map((f) => ({ index: f.index, path: f.path, error: f.error })),
      };
      if (failed.length > 0) {
        writeJsonQuiet(failuresPath, { token, failed });
        result.failuresPath = path.resolve(failuresPath);
      }

      emit(result, globals);
      if (failed.length > 0) process.exit(EXIT.ERR);
    });
}

async function executeRequest(
  apiVersion: string,
  profile: Parameters<typeof request>[0],
  req: PlanRequest,
  globals: GlobalFlags,
): Promise<unknown> {
  const res = await request(profile, {
    method: req.method,
    path: req.path,
    query: req.query as Record<string, string | number | string[] | undefined> | undefined,
    body: req.body,
    retry: false, // never auto-retry a write — it may have applied
    timeoutMs: parseTimeout(globals),
  });
  // Canonical normalize/redact (non-raw) — used as the journal `after` snapshot; keeps creds out of any log.
  return normalizeResponse(res.data, apiVersion as "v2" | "v3", false);
}

// ---------------------------------------------------------------------------
// Bulk journaling helpers
// ---------------------------------------------------------------------------

interface BulkJournalContext {
  def: EntityDef;
  operation: JournalOperation;
}

/**
 * Derive the journaling entity + operation from a bulk plan's action string,
 * which the bulk engine builds as `bulk-<verb> <plural>` (e.g. "bulk-archive
 * contacts"). Returns undefined when the noun cannot be resolved (journaling is
 * then skipped — best-effort).
 */
function bulkJournalContext(action: string): BulkJournalContext | undefined {
  const space = action.indexOf(" ");
  if (space === -1) return undefined;
  const verb = action.slice(0, space);
  const plural = action.slice(space + 1).trim();
  const def = findEntityByPlural(plural);
  if (!def) return undefined;
  let operation: JournalOperation;
  if (verb === "bulk-patch") operation = "update";
  else if (verb === "bulk-archive") operation = "delete";
  else if (verb === "bulk-restore") operation = "restore";
  else return undefined;
  return { def, operation };
}

/** Recover a record id from a stored plan request (path segment / body id / v2 idField). */
function requestId(def: EntityDef, apiVersion: string, operation: JournalOperation, req: PlanRequest): string {
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? (req.body as Record<string, unknown>)
    : {};
  if (apiVersion === "v3") {
    if (typeof body.id === "string" && body.id.length > 0) return body.id;
    const seg = req.path.split("/").filter(Boolean).pop();
    return seg ? decodeURIComponent(seg) : "";
  }
  const v2 = def.v2;
  let idField: string | undefined;
  if (operation === "update") idField = v2?.update?.idField;
  else if (operation === "delete") idField = v2?.archive?.idField ?? v2?.hardDelete?.idField;
  else if (operation === "restore") idField = v2?.restore?.idField;
  const v = idField ? body[idField] : undefined;
  return v === undefined || v === null ? "" : String(v);
}

function writeJsonQuiet(target: string, data: unknown): void {
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    fs.writeFileSync(target, JSON.stringify(data, null, 2), { mode: 0o600 });
    try { fs.chmodSync(target, 0o600); } catch { /* Windows */ }
  } catch {
    /* progress/failure logging is best-effort; never abort the run over it */
  }
}

// Keep BulkPlan referenced for type-check clarity of the plan shape.
export type { BulkPlan };

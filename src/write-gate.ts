import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

import {
  planArtifactPath,
  PLAN_TTL_MS,
  recentTenantSwitch,
  writePlan,
  type BulkPlan,
  type ConfigFile,
  type PlanRequest,
  type ResolvedTenant,
} from "./config.js";
import { EXIT } from "./exit-codes.js";
import { banner, note, printBanner, type GlobalFlags } from "./output.js";
import type { DiffEntry } from "./commands/entity.js";

// ===========================================================================
// The two-phase write gate (PLAN §6). Shared by the bulk engine (bulk.ts) and
// by the single genuinely-irreversible writes that reuse the same mechanism
// (v2 hard delete, dialing-rule create/update). A gated op NEVER executes on
// first invocation: it builds a fully-resolved (credential-free) plan under a
// fresh token, prints the phase-1 contract to stdout, and exits 11
// (CONFIRMATION_REQUIRED). Execution happens only via `hs confirm <token>`,
// which injects credentials at execute time from the pinned profile.
// ===========================================================================

export interface PreviewRecord {
  id: string;
  method: string;
  path: string;
  diff?: DiffEntry[];
}

export interface GateParams {
  /** Action label, e.g. "bulk-patch contacts" or "hard-delete client". */
  action: string;
  /** Human summary naming the tenant + target(s). Quoted verbatim by the agent. */
  summary: string;
  resolved: ResolvedTenant;
  cfg: ConfigFile;
  globals: GlobalFlags;
  /** The credential-free requests to persist in the plan. */
  requests: PlanRequest[];
  /** Per-record preview rows (written to preview.json). */
  records: PreviewRecord[];
  /** First-10 human preview lines for stderr. */
  sampleLines: string[];
  affectedCount: number;
}

/**
 * Persist the plan + preview, print the phase-1 JSON contract to stdout and the
 * human summary to stderr, then exit 11. Never returns.
 */
export function gateAndExit(p: GateParams): never {
  const token = newToken();
  const now = Date.now();
  const createdAt = new Date(now).toISOString();
  const expiresAt = new Date(now + PLAN_TTL_MS).toISOString();
  const recentSwitch = recentTenantSwitch(p.cfg, p.resolved.alias);
  const { profile, alias } = p.resolved;

  const planTenant = {
    alias,
    baseUrl: profile.baseUrl,
    customerName: profile.customerName,
    apiVersion: profile.apiVersion,
  };

  const plan: BulkPlan = {
    token,
    createdAt,
    expiresAt,
    tenant: planTenant,
    action: p.action,
    summary: p.summary,
    recentTenantSwitch: recentSwitch,
    requests: p.requests, // NO credentials — injected at execute time from the pinned profile
  };
  writePlan(token, plan);

  const previewPath = planArtifactPath(token, "preview.json");
  writeJson600(previewPath, {
    token,
    action: p.action,
    tenant: planTenant,
    affectedCount: p.affectedCount,
    records: p.records,
  });

  const phase1 = {
    requiresConfirmation: true,
    token,
    expiresAt,
    action: p.action,
    tenant: planTenant,
    summary: p.summary,
    affectedCount: p.affectedCount,
    previewPath,
    recentTenantSwitch: recentSwitch,
  };

  // stdout — the agent-parseable phase-1 contract. Written directly (not via
  // emit) so --select/--out cannot reshape or redirect it.
  const isTty = !!process.stdout.isTTY;
  process.stdout.write(`${isTty ? JSON.stringify(phase1, null, 2) : JSON.stringify(phase1)}\n`);

  // stderr — human summary + instructions (safety notes; not suppressed by --quiet).
  printBanner(p.resolved, p.globals);
  note(`Phase 1 of 2 — ${p.action}. Review before confirming:`);
  note(`  ${p.summary}`);
  if (p.sampleLines.length > 0) {
    banner("Preview (first 10):", p.globals);
    for (const l of p.sampleLines) banner(l, p.globals);
    if (p.affectedCount > 10) {
      banner(`  … and ${p.affectedCount - 10} more (full preview: ${previewPath})`, p.globals);
    }
  }
  if (recentSwitch) {
    note(
      "NOTE: this plan targets a tenant you recently switched to or have not written to — re-verify with the user.",
    );
  }
  note(`Show this summary to the user, get an explicit yes, then run:  hs confirm ${token}`);

  process.exit(EXIT.CONFIRMATION_REQUIRED);
}

// ---------------------------------------------------------------------------
// Plan-artifact helpers
// ---------------------------------------------------------------------------

export function writeJson600(target: string, data: unknown): void {
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  fs.writeFileSync(target, JSON.stringify(data, null, 2), { mode: 0o600 });
  try {
    fs.chmodSync(target, 0o600);
  } catch {
    /* Windows: falls back to profile ACL */
  }
}

const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function newToken(): string {
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) out += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  return out;
}

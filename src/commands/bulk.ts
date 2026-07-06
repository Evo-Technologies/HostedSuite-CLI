import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { Command } from "commander";

import {
  planArtifactPath,
  PLAN_TTL_MS,
  recentTenantSwitch,
  writePlan,
  type BulkPlan,
  type ConfigFile,
  type PlanRequest,
  type ResolvedTenant,
  type TenantProfile,
} from "../config.js";
import type { EntityDef, EntityV2, EntityV3 } from "../entities.js";
import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { request } from "../http.js";
import { normalizeResponse } from "../normalize.js";
import { banner, note, printBanner, readBodyFromFlag, type GlobalFlags } from "../output.js";
import {
  addFilterOptions,
  computeDiff,
  diffLine,
  filterBody,
  filterQuery,
  notImplemented,
  parseTimeout,
  resolveActive,
  translateBody,
  type DiffEntry,
} from "./entity.js";

// ===========================================================================
// The bulk engine (PLAN §6). `bulk-patch | bulk-archive | bulk-restore` never
// execute on first invocation: they resolve targets, build a fully-resolved
// (credential-free) plan under a fresh token, and exit 11 (CONFIRMATION_REQUIRED).
// Execution happens only via `hs confirm <token>`.
// ===========================================================================

type Bulk = "patch" | "archive" | "restore";

interface BulkOpts {
  ids?: string;
  idsFile?: string;
  query?: string;
  archived?: boolean;
  max?: string;
  file?: string;
  [key: string]: unknown;
}

interface PreviewRecord {
  id: string;
  method: string;
  path: string;
  diff?: DiffEntry[];
}

/**
 * Attach `bulk-patch | bulk-archive | bulk-restore` to a writable entity command.
 * No-op for read-only resources and singletons (they have no bulk surface).
 */
export function addBulkCommands(root: Command, def: EntityDef): void {
  if (def.v3?.singleton || def.v3?.readOnly) return;
  addBulkPatch(root, def);
  addFixedBulk(root, def, "archive");
  addFixedBulk(root, def, "restore");
}

// ---------------------------------------------------------------------------
// bulk-patch
// ---------------------------------------------------------------------------

function addBulkPatch(root: Command, def: EntityDef): void {
  const cmd = addGlobalFlags(root.command("bulk-patch"))
    .description(
      `Preview a PATCH applied to many ${def.plural} (v3 camelCase body). Two-phase: exits 11 with a token — run \`hs confirm <token>\`.`,
    )
    .requiredOption("-f, --file <path>", "JSON patch body (v3 camelCase) applied to every target");
  addSelectorFlags(cmd, def);
  cmd.addHelpText("after", bulkHelp("bulk-patch", def));

  cmd.action(async (opts: BulkOpts, command: Command) => {
    const globals = command.optsWithGlobals<GlobalFlags & BulkOpts>();
    const { cfg, resolved } = resolveActive(globals);
    const { profile } = resolved;
    ensureBulkSupported(def, "patch", resolved);

    const fileBody = asRecord(readBodyFromFlag(opts.file as string));
    const ids = await resolveTargets(def, opts, globals, profile, resolved);
    requireNonEmpty(ids, def, resolved);

    const requests: PlanRequest[] = [];
    const records: PreviewRecord[] = [];

    if (profile.apiVersion === "v3") {
      const v3 = def.v3 as EntityV3;
      const currentMap = await fetchCurrentV3(profile, v3.uriBase, ids, globals);
      const bodyId = v3.patchStyle === "body-id";
      for (const id of ids) {
        const targetPath = bodyId ? v3.uriBase : `${v3.uriBase}/${encodeURIComponent(id)}`;
        const body: Record<string, unknown> = { ...fileBody };
        if (bodyId) body.id = id;
        requests.push({ method: "PATCH", path: targetPath, body });
        records.push({ id, method: "PATCH", path: targetPath, diff: computeDiff(fileBody, currentMap.get(id) ?? {}) });
      }
    } else {
      const v2 = def.v2 as EntityV2;
      const update = v2.update!;
      // Validate the field vocabulary once (throws EXIT.USAGE naming any unmapped field).
      const translated = translateBody(fileBody, update.fieldMap, resolved);
      const currentMap = await fetchCurrentV2(v2, profile, ids, globals);
      for (const id of ids) {
        const body: Record<string, unknown> = { ...translated, [update.idField]: id };
        requests.push({ method: "POST", path: update.route, body });
        records.push({ id, method: "POST", path: update.route, diff: computeDiff(fileBody, currentMap.get(id) ?? {}) });
      }
    }

    gateAndExit({
      action: `bulk-patch ${def.plural}`,
      summary: summarize("PATCH", ids.length, def, resolved, fileBody),
      def,
      resolved,
      cfg,
      globals,
      requests,
      records,
      sampleLines: patchSampleLines(records),
      affectedCount: ids.length,
    });
  });
}

function patchSampleLines(records: PreviewRecord[]): string[] {
  const lines: string[] = [];
  for (const rec of records.slice(0, 10)) {
    const dl = (rec.diff ?? []).map(diffLine);
    if (dl.length === 0) {
      lines.push(`  [${rec.id}] (no field changes)`);
    } else {
      lines.push(`  [${rec.id}]`);
      for (const l of dl) lines.push(`  ${l}`);
    }
  }
  return lines;
}

// ---------------------------------------------------------------------------
// bulk-archive / bulk-restore (fixed bodies — no field diff, both versions)
// ---------------------------------------------------------------------------

function addFixedBulk(root: Command, def: EntityDef, op: "archive" | "restore"): void {
  const name = `bulk-${op}`;
  const verb = op === "archive" ? "ARCHIVE" : "RESTORE";
  const cmd = addGlobalFlags(root.command(name)).description(
    op === "archive"
      ? `Preview archiving many ${def.plural} (recoverable). Two-phase: exits 11 with a token — run \`hs confirm <token>\`.`
      : `Preview restoring (un-archiving) many ${def.plural}. Two-phase: exits 11 with a token — run \`hs confirm <token>\`.`,
  );
  addSelectorFlags(cmd, def);
  cmd.addHelpText("after", bulkHelp(name, def));

  cmd.action(async (opts: BulkOpts, command: Command) => {
    const globals = command.optsWithGlobals<GlobalFlags & BulkOpts>();
    const { cfg, resolved } = resolveActive(globals);
    const { profile } = resolved;
    ensureBulkSupported(def, op, resolved);

    const ids = await resolveTargets(def, opts, globals, profile, resolved);
    requireNonEmpty(ids, def, resolved);

    const requests: PlanRequest[] = [];
    const records: PreviewRecord[] = [];
    for (const id of ids) {
      const req = fixedRequest(def, op, id, resolved);
      requests.push(req);
      records.push({ id, method: req.method, path: req.path });
    }

    gateAndExit({
      action: `${name} ${def.plural}`,
      summary: summarize(verb, ids.length, def, resolved),
      def,
      resolved,
      cfg,
      globals,
      requests,
      records,
      sampleLines: records.slice(0, 10).map((r) => `  [${r.id}] → ${r.method} ${r.path}`),
      affectedCount: ids.length,
    });
  });
}

function fixedRequest(def: EntityDef, op: "archive" | "restore", id: string, resolved: ResolvedTenant): PlanRequest {
  if (resolved.profile.apiVersion === "v3") {
    const v3 = def.v3 as EntityV3;
    if (op === "archive") return { method: "DELETE", path: `${v3.uriBase}/${encodeURIComponent(id)}` };
    if (v3.patchStyle === "body-id") return { method: "PATCH", path: v3.uriBase, body: { id, __Restore: true } };
    return { method: "PATCH", path: `${v3.uriBase}/${encodeURIComponent(id)}`, body: { __Restore: true } };
  }
  const v2 = def.v2 as EntityV2;
  const target = op === "archive" ? v2.archive! : v2.restore!;
  return { method: "POST", path: target.route, body: { [target.idField]: id } };
}

// ---------------------------------------------------------------------------
// Capability + selector plumbing
// ---------------------------------------------------------------------------

function ensureBulkSupported(def: EntityDef, op: Bulk, resolved: ResolvedTenant): void {
  const action = `${def.noun} bulk-${op}`;
  if (resolved.profile.apiVersion === "v3") {
    if (!def.v3) notImplemented(action, resolved);
    return;
  }
  const v2 = def.v2;
  if (!v2) notImplemented(action, resolved);
  if (op === "patch" && !v2.update) notImplemented(action, resolved);
  if (op === "archive" && !v2.archive) notImplemented(action, resolved);
  if (op === "restore" && !v2.restore) notImplemented(action, resolved);
}

function addSelectorFlags(cmd: Command, def: EntityDef): void {
  cmd
    .option("--ids <id,id,...>", "Target these ids explicitly")
    .option("--ids-file <path>", "Target ids from a file (JSON array, or newline/comma-delimited; - for stdin)")
    .option("--query <text>", "Select targets by name-ish contains match")
    .option("--archived", "Resolve targets from archived/deleted rows (e.g. for bulk-restore)")
    .option("--max <n>", "Safety cap on filter-resolved targets (default 10000)");
  addFilterOptions(cmd, [...(def.v3?.listFilters ?? []), ...(def.v2?.list.filters ?? [])]);
}

async function resolveTargets(
  def: EntityDef,
  opts: BulkOpts,
  globals: GlobalFlags,
  profile: TenantProfile,
  resolved: ResolvedTenant,
): Promise<string[]> {
  if (opts.ids !== undefined) return splitIds(opts.ids);
  if (opts.idsFile !== undefined) return readIdsFile(opts.idsFile);

  if (profile.apiVersion === "v3") {
    if (!def.v3) notImplemented(`${def.noun} bulk selector`, resolved);
    return resolveTargetsV3(def.v3, opts, globals, profile);
  }
  if (!def.v2) notImplemented(`${def.noun} bulk selector`, resolved);
  return resolveTargetsV2(def.v2, opts, globals, profile, resolved);
}

async function resolveTargetsV3(
  v3: EntityV3,
  opts: BulkOpts,
  globals: GlobalFlags,
  profile: TenantProfile,
): Promise<string[]> {
  const filters = filterQuery(v3.listFilters, opts);
  const hasSelector = (opts.query !== undefined && opts.query.length > 0) || Object.keys(filters).length > 0;
  if (!hasSelector) throw noSelectorError();

  const cap = opts.max ? Number(opts.max) : 10_000;
  const perPage = 200;
  const ids: string[] = [];
  let page = 0;
  for (;;) {
    const res = await request<{ items?: unknown[]; totalPages?: number }>(profile, {
      method: "GET",
      path: v3.uriBase,
      query: {
        ...filters,
        query: opts.query,
        archived: opts.archived ? true : undefined,
        detailed: false,
        countPerPage: perPage,
        page,
      },
      timeoutMs: parseTimeout(globals),
    });
    const items = Array.isArray(res.data?.items) ? res.data.items : [];
    for (const item of items) {
      const id = extractId(item, ["id", "_id"]);
      if (id) ids.push(id);
    }
    if (ids.length > cap) {
      throw new CliError(
        EXIT.USAGE,
        `Selector matched more than the ${cap}-target cap. Narrow the selector or raise --max.`,
      );
    }
    const totalPages = typeof res.data?.totalPages === "number" ? res.data.totalPages : page + 1;
    page += 1;
    if (items.length === 0 || page >= totalPages) break;
  }
  return ids;
}

async function resolveTargetsV2(
  v2: EntityV2,
  opts: BulkOpts,
  globals: GlobalFlags,
  profile: TenantProfile,
  resolved: ResolvedTenant,
): Promise<string[]> {
  const body: Record<string, unknown> = { ...filterBody(v2.list.filters, opts) };
  if (opts.query !== undefined && opts.query.length > 0) {
    if (!v2.list.queryField) {
      throw new CliError(EXIT.USAGE, `--query is not supported for ${resolved.alias}'s v2 ${v2.list.route} route.`);
    }
    body[v2.list.queryField] = opts.query;
  }
  if (Object.keys(body).length === 0) throw noSelectorError();

  const res = await request(profile, {
    method: "POST",
    path: v2.list.route,
    body,
    timeoutMs: parseTimeout(globals),
  });
  const items = itemsOf(normalizeResponse(res.data, "v2", false));
  const idKeys = ["id", "_id"];
  if (v2.list.idFilterField) idKeys.push(lowerFirst(v2.list.idFilterField));
  const ids: string[] = [];
  for (const item of items) {
    const id = extractId(item, idKeys);
    if (id) ids.push(id);
  }
  return ids;
}

async function fetchCurrentV3(
  profile: TenantProfile,
  uriBase: string,
  ids: string[],
  globals: GlobalFlags,
): Promise<Map<string, Record<string, unknown>>> {
  const map = new Map<string, Record<string, unknown>>();
  const chunkSize = 100;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const res = await request<{ items?: unknown[] }>(profile, {
      method: "GET",
      path: uriBase,
      query: { ids: chunk, detailed: true, countPerPage: chunk.length },
      timeoutMs: parseTimeout(globals),
    });
    const items = Array.isArray(res.data?.items) ? res.data.items : [];
    for (const item of items) {
      const id = extractId(item, ["id", "_id"]);
      if (id && item && typeof item === "object") map.set(id, item as Record<string, unknown>);
    }
  }
  return map;
}

async function fetchCurrentV2(
  v2: EntityV2,
  profile: TenantProfile,
  ids: string[],
  globals: GlobalFlags,
): Promise<Map<string, Record<string, unknown>>> {
  const map = new Map<string, Record<string, unknown>>();
  if (v2.get !== "via-list" || !v2.list.idFilterField) return map;
  for (const id of ids) {
    try {
      const res = await request(profile, {
        method: "POST",
        path: v2.list.route,
        body: { [v2.list.idFilterField]: id },
        timeoutMs: parseTimeout(globals),
      });
      const first = itemsOf(normalizeResponse(res.data, "v2", false))[0];
      if (first && typeof first === "object") map.set(id, first as Record<string, unknown>);
    } catch {
      /* leave current unset — the diff falls back to (unset) for this record */
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Gate: persist the plan + preview, print phase-1 JSON, exit 11
// ---------------------------------------------------------------------------

interface GateParams {
  action: string;
  summary: string;
  def: EntityDef;
  resolved: ResolvedTenant;
  cfg: ConfigFile;
  globals: GlobalFlags;
  requests: PlanRequest[];
  records: PreviewRecord[];
  sampleLines: string[];
  affectedCount: number;
}

function gateAndExit(p: GateParams): never {
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
// Small local helpers
// ---------------------------------------------------------------------------

function requireNonEmpty(ids: string[], def: EntityDef, resolved: ResolvedTenant): void {
  if (ids.length === 0) {
    throw new CliError(EXIT.EMPTY, `Selector matched no ${def.plural} on ${resolved.alias}; no plan created.`);
  }
}

function noSelectorError(): CliError {
  return new CliError(
    EXIT.USAGE,
    "A bulk operation needs a selector: --ids, --ids-file, --query, or a filter flag.",
  );
}

function summarize(
  verb: string,
  count: number,
  def: EntityDef,
  resolved: ResolvedTenant,
  fileBody?: Record<string, unknown>,
): string {
  const host = hostOf(resolved.profile.baseUrl);
  const base = `${verb} ${count} ${def.plural} on tenant ${resolved.profile.customerName} (${host})`;
  if (verb === "PATCH" && fileBody) return `${base} setting ${JSON.stringify(fileBody)}`;
  return base;
}

function bulkHelp(name: string, def: EntityDef): string {
  return (
    `\nExample:\n  hs ${def.noun} ${name} --ids id1,id2` +
    (name === "bulk-patch" ? " -f patch.json" : "") +
    "\n\nSafety:\n  Two-phase, ALWAYS — never executes on first run. Resolves targets, writes a credential-free " +
    "plan under a fresh token, and exits 11. 0 matches exits 3 (no token). Show the summary to the user, get an " +
    "explicit yes, then run `hs confirm <token>`. --force does NOT bypass this gate.\n"
  );
}

function asRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new CliError(EXIT.USAGE, "Patch body must be a JSON object.");
  }
  return body as Record<string, unknown>;
}

function extractId(item: unknown, keys: string[]): string | undefined {
  if (!item || typeof item !== "object") return undefined;
  const rec = item as Record<string, unknown>;
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.length > 0) return v;
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

function itemsOf(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && "items" in value) {
    const items = (value as { items?: unknown }).items;
    if (Array.isArray(items)) return items;
  }
  return [];
}

function splitIds(csv: string): string[] {
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}

function readIdsFile(file: string): string[] {
  let raw: string;
  try {
    raw = fs.readFileSync(file === "-" ? 0 : file, "utf8").trim();
  } catch (err) {
    throw new CliError(EXIT.USAGE, `Cannot read --ids-file "${file}": ${(err as Error).message}`);
  }
  if (raw.length === 0) throw new CliError(EXIT.USAGE, `--ids-file "${file}" is empty.`);
  if (raw.startsWith("[")) {
    let arr: unknown;
    try {
      arr = JSON.parse(raw);
    } catch (err) {
      throw new CliError(EXIT.USAGE, `--ids-file "${file}" is not valid JSON: ${(err as Error).message}`);
    }
    if (!Array.isArray(arr)) throw new CliError(EXIT.USAGE, `--ids-file "${file}" JSON must be an array of ids.`);
    return arr.map((x) => String(x).trim()).filter(Boolean);
  }
  return raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
}

function writeJson600(target: string, data: unknown): void {
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  fs.writeFileSync(target, JSON.stringify(data, null, 2), { mode: 0o600 });
  try {
    fs.chmodSync(target, 0o600);
  } catch {
    /* Windows: falls back to profile ACL */
  }
}

const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function newToken(): string {
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) out += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  return out;
}

function lowerFirst(key: string): string {
  return key.length === 0 ? key : key.charAt(0).toLowerCase() + key.slice(1);
}

function hostOf(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl;
  }
}

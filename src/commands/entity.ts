import { Command } from "commander";

import {
  loadConfig,
  recentTenantSwitch,
  resolveActiveTenant,
  setLastWriteTenant,
  type ConfigFile,
  type ResolvedTenant,
  type TenantProfile,
} from "../config.js";
import type { EntityDef, EntityV2, EntityV3, FlagDef } from "../entities.js";
import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { request, type RequestSpec } from "../http.js";
import { normalizeResponse, redactCreds } from "../normalize.js";
import {
  banner,
  emit,
  note,
  printBanner,
  readBodyFromFlag,
  recentSwitchNote,
  type GlobalFlags,
} from "../output.js";

// ===========================================================================
// Shared helpers (exported for reuse by api/auth/confirm/tenant commands)
// ===========================================================================

/** Resolve the tenant a command targets (honouring `--tenant`) plus the config. */
export function resolveActive(globals: GlobalFlags): { cfg: ConfigFile; resolved: ResolvedTenant } {
  const cfg = loadConfig();
  const resolved = resolveActiveTenant(cfg, globals.tenant);
  return { cfg, resolved };
}

/** Parse `--timeout <ms>` into a positive number, or undefined for the default. */
export function parseTimeout(globals: GlobalFlags): number | undefined {
  if (!globals.timeout) return undefined;
  const n = Number(globals.timeout);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Issue a request and return the normalized (or raw-redacted) response body. */
export async function sendNormalized(
  profile: TenantProfile,
  spec: RequestSpec,
  globals: GlobalFlags,
): Promise<unknown> {
  const res = await request(profile, { ...spec, timeoutMs: parseTimeout(globals) });
  return normalizeResponse(res.data, profile.apiVersion, !!globals.raw);
}

/**
 * Banner + recent-switch safety note, printed before any single write. The
 * recent-switch note is never suppressed by `--quiet`.
 */
export function writePreamble(cfg: ConfigFile, resolved: ResolvedTenant, globals: GlobalFlags): void {
  printBanner(resolved, globals);
  if (recentTenantSwitch(cfg, resolved.alias)) {
    recentSwitchNote(cfg.lastWriteTenant, resolved.alias);
  }
}

export function notImplemented(action: string, resolved: ResolvedTenant): never {
  const need = resolved.profile.apiVersion === "v3" ? "v2" : "v3";
  throw new CliError(
    EXIT.NOT_IMPLEMENTED,
    `'${action}' is not available on this tenant; ${resolved.alias} runs the ${resolved.profile.apiVersion} API` +
      ` (this operation is only implemented for ${need}).`,
  );
}

/** Derive the commander opts key from an option string, e.g. `--center-id <id>` → `centerId`. */
function optKey(option: string): string {
  const m = option.match(/--([a-z0-9-]+)/i);
  const name = m ? m[1] : option;
  return name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function collect(value: string, prev: string[] = []): string[] {
  return [...prev, value];
}

function asRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new CliError(EXIT.USAGE, "Request body must be a JSON object.");
  }
  return body as Record<string, unknown>;
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "(unset)";
  if (typeof v === "string") return v.length > 60 ? `${v.slice(0, 57)}…` : v;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

// ===========================================================================
// Command factory
// ===========================================================================

export function buildEntityCommand(def: EntityDef): Command {
  const root = new Command(def.noun).description(entityDescription(def));

  const v3 = def.v3;
  const singleton = v3?.singleton === true;
  const readOnly = v3?.readOnly === true;

  if (singleton) {
    addSingletonGet(root, def);
    addSingletonPatch(root, def);
    return root;
  }

  addList(root, def);
  addGet(root, def);
  if (!readOnly) {
    addCreate(root, def);
    addPatch(root, def);
    addDelete(root, def);
  }
  return root;
}

function entityDescription(def: EntityDef): string {
  const versions = [def.v3 ? "v3" : null, def.v2 ? "v2" : null].filter(Boolean).join("/");
  return `Manage ${def.plural} (${versions || "no API"} tenants).`;
}

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

interface ListOpts {
  page?: string;
  count?: string;
  all?: boolean;
  max?: string;
  query?: string;
  ids?: string;
  archived?: boolean;
  brief?: boolean;
  sort?: string;
  desc?: boolean;
  [key: string]: unknown;
}

const V2_UNSUPPORTED_LIST_FLAGS: { key: string; flag: string }[] = [
  { key: "page", flag: "--page" },
  { key: "count", flag: "--count" },
  { key: "all", flag: "--all" },
  { key: "max", flag: "--max" },
  { key: "ids", flag: "--ids" },
  { key: "archived", flag: "--archived" },
  { key: "brief", flag: "--brief" },
  { key: "sort", flag: "--sort" },
  { key: "desc", flag: "--desc" },
];

function addList(root: Command, def: EntityDef): void {
  const cmd = addGlobalFlags(root.command("list"))
    .description(`List ${def.plural}. Returns { items, totalCount?, totalPages? } — pipe to \`jq '.items[]'\`.`)
    .option("--page <n>", "Page index (0-based; v3 only)")
    .option("--count <n>", "Items per page (CountPerPage; v3 only)")
    .option("--all", "Fetch every page (v3 only; hard-stops at 50k unless --max)")
    .option("--max <n>", "Raise the --all safety cap (default 50000)")
    .option("--query <text>", "Case-insensitive contains match on name-ish fields")
    .option("--ids <id,id,...>", "Restrict to these ids (v3 only)")
    .option("--archived", "Include archived/deleted rows (v3 only)")
    .option("--brief", "Only id + display name (v3 Detailed=false)")
    .option("--sort <field>", "Sort field")
    .option("--desc", "Sort descending (with --sort)");

  // Register the UNION of v3 + v2 filter flags, deduped by flag name (an entity
  // may expose the same flag on both versions mapping to different fields).
  addFilterOptions(cmd, [...(def.v3?.listFilters ?? []), ...(def.v2?.list.filters ?? [])]);

  cmd.addHelpText("after", listExample(def));

  cmd.action(async (opts: ListOpts, command: Command) => {
    const globals = command.optsWithGlobals<GlobalFlags & ListOpts>();
    const { resolved } = resolveActive(globals);
    const { profile, alias } = resolved;

    if (profile.apiVersion === "v3") {
      if (!def.v3) notImplemented(`${def.noun} list`, resolved);
      await listV3(def.v3, opts, globals, profile, resolved);
      return;
    }
    if (!def.v2) notImplemented(`${def.noun} list`, resolved);
    await listV2(def.v2, opts, globals, profile, resolved, alias);
  });
}

async function listV3(
  v3: EntityV3,
  opts: ListOpts,
  globals: GlobalFlags & ListOpts,
  profile: TenantProfile,
  resolved: ResolvedTenant,
): Promise<void> {
  const query: Record<string, string | number | boolean | string[] | undefined> = {
    page: opts.page,
    countPerPage: opts.count,
    query: opts.query,
    ids: opts.ids ? opts.ids.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    archived: opts.archived ? true : undefined,
    detailed: opts.brief ? false : undefined,
    // Server-side sparse projection reuses the --fields/--select value (see global-flags).
    fields: globals.select,
    sortField: opts.sort,
    sortOrder: opts.sort ? (opts.desc ? "Descend" : "Ascend") : undefined,
    ...filterQuery(v3.listFilters, opts),
  };

  if (globals.dryRun) {
    emit(planned("GET", v3.uriBase, query, undefined, resolved), globals);
    return;
  }
  printBanner(resolved, globals);

  if (opts.all) {
    const data = await listAllV3(profile, v3.uriBase, query, opts, globals);
    emit(normalizeResponse(data, "v3", !!globals.raw), { ...globals, emptyExit: true });
    return;
  }

  const out = await sendNormalized(profile, { method: "GET", path: v3.uriBase, query }, globals);
  emit(out, { ...globals, emptyExit: true });
}

async function listAllV3(
  profile: TenantProfile,
  uriBase: string,
  baseQuery: Record<string, string | number | boolean | string[] | undefined>,
  opts: ListOpts,
  globals: GlobalFlags,
): Promise<{ items: unknown[]; totalCount: number }> {
  const cap = opts.max ? Number(opts.max) : 50_000;
  const perPage = opts.count ? Number(opts.count) : 200;
  const items: unknown[] = [];
  let page = 0;
  for (;;) {
    const res = await request<{ items?: unknown[]; totalPages?: number }>(profile, {
      method: "GET",
      path: uriBase,
      query: { ...baseQuery, page, countPerPage: perPage },
      timeoutMs: parseTimeout(globals),
    });
    const pageItems = Array.isArray(res.data?.items) ? res.data.items : [];
    items.push(...pageItems);
    if (items.length > cap) {
      throw new CliError(
        EXIT.ERR,
        `--all exceeded the ${cap}-item safety cap. Narrow the query or raise --max.`,
      );
    }
    const totalPages = typeof res.data?.totalPages === "number" ? res.data.totalPages : page + 1;
    page += 1;
    if (pageItems.length === 0 || page >= totalPages) break;
  }
  return { items, totalCount: items.length };
}

async function listV2(
  v2: EntityV2,
  opts: ListOpts,
  globals: GlobalFlags & ListOpts,
  profile: TenantProfile,
  resolved: ResolvedTenant,
  alias: string,
): Promise<void> {
  for (const { key, flag } of V2_UNSUPPORTED_LIST_FLAGS) {
    if (opts[key] !== undefined && opts[key] !== false) {
      throw new CliError(EXIT.USAGE, `${flag} is not supported on the v2 API (tenant ${alias}).`);
    }
  }

  const body: Record<string, unknown> = { ...filterBody(v2.list.filters, opts) };
  if (opts.query !== undefined) {
    if (!v2.list.queryField) {
      throw new CliError(EXIT.USAGE, `--query is not supported for ${resolved.alias}'s v2 ${v2.list.route} route.`);
    }
    body[v2.list.queryField] = opts.query;
  }

  if (globals.dryRun) {
    emit(planned("POST", v2.list.route, undefined, body, resolved), globals);
    return;
  }
  printBanner(resolved, globals);
  const out = await sendNormalized(profile, { method: "POST", path: v2.list.route, body }, globals);
  emit(out, { ...globals, emptyExit: true });
}

// ---------------------------------------------------------------------------
// get
// ---------------------------------------------------------------------------

function addGet(root: Command, def: EntityDef): void {
  addGlobalFlags(root.command("get"))
    .argument("<id>", `The ${def.noun} id`)
    .description(`Fetch one ${def.noun} by id.`)
    .addHelpText("after", `\nExample:\n  hs ${def.noun} get <id> --json\n`)
    .action(async (id: string, _opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { resolved } = resolveActive(globals);
      const { profile } = resolved;

      if (profile.apiVersion === "v3") {
        if (!def.v3) notImplemented(`${def.noun} get`, resolved);
        const path = `${def.v3.uriBase}/${encodeURIComponent(id)}`;
        if (globals.dryRun) {
          emit(planned("GET", path, undefined, undefined, resolved), globals);
          return;
        }
        printBanner(resolved, globals);
        emit(await sendNormalized(profile, { method: "GET", path }, globals), globals);
        return;
      }

      // v2: emulate get via the list route filtered by idFilterField.
      const v2 = def.v2;
      if (!v2 || v2.get !== "via-list" || !v2.list.idFilterField) notImplemented(`${def.noun} get`, resolved);
      const body = { [v2.list.idFilterField]: id };
      if (globals.dryRun) {
        emit(planned("POST", v2.list.route, undefined, body, resolved), globals);
        return;
      }
      printBanner(resolved, globals);
      const listed = await sendNormalized(profile, { method: "POST", path: v2.list.route, body }, globals);
      const first = firstItem(listed);
      if (first === undefined) {
        throw new CliError(EXIT.NOT_FOUND, `No ${def.noun} found with id "${id}" on ${resolved.alias}.`);
      }
      emit(first, globals);
    });
}

function firstItem(listed: unknown): unknown {
  if (listed && typeof listed === "object" && "items" in listed) {
    const items = (listed as { items?: unknown[] }).items;
    if (Array.isArray(items)) return items.length > 0 ? items[0] : undefined;
  }
  if (Array.isArray(listed)) return listed.length > 0 ? listed[0] : undefined;
  return undefined;
}

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

function addCreate(root: Command, def: EntityDef): void {
  addGlobalFlags(root.command("create"))
    .description(`Create a ${def.noun}. Body via -f <file|-> in v3 camelCase field names.`)
    .requiredOption("-f, --file <path>", "JSON body file (use - for stdin)")
    .addHelpText("after", createSafetyHelp(def))
    .action(async (opts: { file: string }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { cfg, resolved } = resolveActive(globals);
      const { profile } = resolved;
      const body = asRecord(readBodyFromFlag(opts.file));

      if (profile.apiVersion === "v3") {
        if (!def.v3) notImplemented(`${def.noun} create`, resolved);
        if (globals.dryRun) {
          emit(planned("POST", def.v3.uriBase, undefined, body, resolved), globals);
          return;
        }
        writePreamble(cfg, resolved, globals);
        const out = await sendNormalized(profile, { method: "POST", path: def.v3.uriBase, body }, globals);
        setLastWriteTenant(resolved.alias);
        emit(out, globals);
        return;
      }

      const v2 = def.v2;
      if (!v2 || !v2.create) notImplemented(`${def.noun} create`, resolved);
      const translated = translateBody(body, v2.create.fieldMap, resolved);
      if (globals.dryRun) {
        emit(planned("POST", v2.create.route, undefined, translated, resolved), globals);
        return;
      }
      writePreamble(cfg, resolved, globals);
      const out = await sendNormalized(profile, { method: "POST", path: v2.create.route, body: translated }, globals);
      setLastWriteTenant(resolved.alias);
      emit(out, globals);
    });
}

// ---------------------------------------------------------------------------
// patch (+ --restore)
// ---------------------------------------------------------------------------

function addPatch(root: Command, def: EntityDef): void {
  addGlobalFlags(root.command("patch"))
    .argument("<id>", `The ${def.noun} id`)
    .description(`Update a ${def.noun}. Body via -f in v3 camelCase. --restore un-archives.`)
    .option("-f, --file <path>", "JSON body file (use - for stdin)")
    .option("--restore", "Un-archive (v3: {__Restore:true}; v2: restore route)")
    .addHelpText("after", patchSafetyHelp(def))
    .action(async (id: string, opts: { file?: string; restore?: boolean }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { cfg, resolved } = resolveActive(globals);
      const { profile } = resolved;

      const fileBody = opts.file ? asRecord(readBodyFromFlag(opts.file)) : {};
      if (!opts.file && !opts.restore) {
        throw new CliError(EXIT.USAGE, "patch needs -f <body> and/or --restore.");
      }

      if (profile.apiVersion === "v3") {
        if (!def.v3) notImplemented(`${def.noun} patch`, resolved);
        await patchV3(def.v3, id, fileBody, !!opts.restore, globals, profile, resolved);
        return;
      }
      await patchV2(def, id, fileBody, !!opts.restore, globals, profile, cfg, resolved);
    });
}

async function patchV3(
  v3: EntityV3,
  id: string,
  fileBody: Record<string, unknown>,
  restore: boolean,
  globals: GlobalFlags,
  profile: TenantProfile,
  resolved: ResolvedTenant,
): Promise<void> {
  const bodyId = v3.patchStyle === "body-id";
  const path = bodyId ? v3.uriBase : `${v3.uriBase}/${encodeURIComponent(id)}`;
  const body: Record<string, unknown> = { ...fileBody };
  if (restore) body.__Restore = true;
  if (bodyId) body.id = id;

  if (globals.dryRun) {
    let current: Record<string, unknown> = {};
    try {
      const cur = await sendNormalized(profile, { method: "GET", path: `${v3.uriBase}/${encodeURIComponent(id)}` }, globals);
      if (cur && typeof cur === "object") current = cur as Record<string, unknown>;
    } catch {
      /* diff falls back to (unset) when the current fetch fails */
    }
    emit(diffPlan("PATCH", path, body, current, resolved, fileBody, globals), globals);
    return;
  }

  const { cfg } = resolveActive(globals);
  writePreamble(cfg, resolved, globals);
  const out = await sendNormalized(profile, { method: "PATCH", path, body }, globals);
  setLastWriteTenant(resolved.alias);
  emit(out, globals);
}

async function patchV2(
  def: EntityDef,
  id: string,
  fileBody: Record<string, unknown>,
  restore: boolean,
  globals: GlobalFlags,
  profile: TenantProfile,
  cfg: ConfigFile,
  resolved: ResolvedTenant,
): Promise<void> {
  const v2 = def.v2;
  if (!v2) notImplemented(`${def.noun} patch`, resolved);
  const hasFields = Object.keys(fileBody).length > 0;

  if (globals.dryRun) {
    const current = await fetchV2Current(v2, id, profile, globals).catch(() => ({} as Record<string, unknown>));
    emit(diffPlan("POST", v2.update?.route ?? "(no v2 update route)", fileBody, current, resolved, fileBody, globals), globals);
    return;
  }

  writePreamble(cfg, resolved, globals);
  const results: unknown[] = [];

  if (restore) {
    if (!v2.restore) notImplemented(`${def.noun} patch --restore`, resolved);
    const body = { [v2.restore.idField]: id };
    results.push(await sendNormalized(profile, { method: "POST", path: v2.restore.route, body }, globals));
  }
  if (hasFields || !restore) {
    if (!v2.update) notImplemented(`${def.noun} patch`, resolved);
    const translated = translateBody(fileBody, v2.update.fieldMap, resolved);
    translated[v2.update.idField] = id;
    results.push(await sendNormalized(profile, { method: "POST", path: v2.update.route, body: translated }, globals));
  }

  setLastWriteTenant(resolved.alias);
  emit(results.length === 1 ? results[0] : { results }, globals);
}

async function fetchV2Current(
  v2: EntityV2,
  id: string,
  profile: TenantProfile,
  globals: GlobalFlags,
): Promise<Record<string, unknown>> {
  if (v2.get !== "via-list" || !v2.list.idFilterField) return {};
  const listed = await sendNormalized(profile, {
    method: "POST",
    path: v2.list.route,
    body: { [v2.list.idFilterField]: id },
  }, globals);
  const first = firstItem(listed);
  return first && typeof first === "object" ? (first as Record<string, unknown>) : {};
}

// ---------------------------------------------------------------------------
// delete (--force, --hard)
// ---------------------------------------------------------------------------

function addDelete(root: Command, def: EntityDef): void {
  addGlobalFlags(root.command("delete"))
    .argument("<id>", `The ${def.noun} id`)
    .description(`Archive a ${def.noun} (recoverable). Requires --force.`)
    .option("--hard", "v2 only: use the true delete route instead of archive")
    .addHelpText("after", deleteSafetyHelp(def))
    .action(async (id: string, opts: { hard?: boolean }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { cfg, resolved } = resolveActive(globals);
      const { profile } = resolved;

      if (!globals.force) {
        throw new CliError(EXIT.USAGE, `delete requires --force (archives ${def.noun} ${id} on ${resolved.alias}).`);
      }

      if (profile.apiVersion === "v3") {
        if (!def.v3) notImplemented(`${def.noun} delete`, resolved);
        if (opts.hard) {
          throw new CliError(EXIT.USAGE, "--hard applies only to v2 tenants; v3 delete already archives (recoverable via patch --restore).");
        }
        const path = `${def.v3.uriBase}/${encodeURIComponent(id)}`;
        if (globals.dryRun) {
          emit(planned("DELETE", path, undefined, undefined, resolved), globals);
          return;
        }
        writePreamble(cfg, resolved, globals);
        const out = await sendNormalized(profile, { method: "DELETE", path }, globals);
        setLastWriteTenant(resolved.alias);
        emit(out ?? { ok: true }, globals);
        return;
      }

      const v2 = def.v2;
      if (!v2) notImplemented(`${def.noun} delete`, resolved);
      const target = opts.hard ? v2.hardDelete : v2.archive;
      if (!target) {
        const which = opts.hard ? "hard delete" : "archive";
        throw new CliError(EXIT.NOT_IMPLEMENTED, `${def.noun} ${which} is not mapped for the v2 API (tenant ${resolved.alias}).`);
      }
      const body = { [target.idField]: id };
      if (globals.dryRun) {
        emit(planned("POST", target.route, undefined, body, resolved), globals);
        return;
      }
      writePreamble(cfg, resolved, globals);
      const out = await sendNormalized(profile, { method: "POST", path: target.route, body }, globals);
      setLastWriteTenant(resolved.alias);
      emit(out ?? { ok: true }, globals);
    });
}

// ---------------------------------------------------------------------------
// singleton (system-settings): get / patch, no id
// ---------------------------------------------------------------------------

function addSingletonGet(root: Command, def: EntityDef): void {
  addGlobalFlags(root.command("get"))
    .description(`Fetch the ${def.noun} singleton.`)
    .action(async (_opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { resolved } = resolveActive(globals);
      if (!def.v3) notImplemented(`${def.noun} get`, resolved);
      if (globals.dryRun) {
        emit(planned("GET", def.v3.uriBase, undefined, undefined, resolved), globals);
        return;
      }
      printBanner(resolved, globals);
      emit(await sendNormalized(resolved.profile, { method: "GET", path: def.v3.uriBase }, globals), globals);
    });
}

function addSingletonPatch(root: Command, def: EntityDef): void {
  addGlobalFlags(root.command("patch"))
    .description(`Update the ${def.noun} singleton. Body via -f.`)
    .requiredOption("-f, --file <path>", "JSON body file (use - for stdin)")
    .action(async (opts: { file: string }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { cfg, resolved } = resolveActive(globals);
      if (!def.v3) notImplemented(`${def.noun} patch`, resolved);
      const body = asRecord(readBodyFromFlag(opts.file));
      if (globals.dryRun) {
        emit(planned("PATCH", def.v3.uriBase, undefined, body, resolved), globals);
        return;
      }
      writePreamble(cfg, resolved, globals);
      const out = await sendNormalized(resolved.profile, { method: "PATCH", path: def.v3.uriBase, body }, globals);
      setLastWriteTenant(resolved.alias);
      emit(out, globals);
    });
}

// ---------------------------------------------------------------------------
// filter option wiring
// ---------------------------------------------------------------------------

export function addFilterOptions(cmd: Command, filters?: FlagDef[]): void {
  if (!filters) return;
  const seen = new Set<string>();
  for (const f of filters) {
    const key = optKey(f.option);
    if (seen.has(key)) continue; // first definition wins across the v3/v2 union
    seen.add(key);
    if (f.repeatable) cmd.option(f.option, f.description, collect, [] as string[]);
    else cmd.option(f.option, f.description);
  }
}

export function filterQuery(
  filters: FlagDef[] | undefined,
  opts: Record<string, unknown>,
): Record<string, string | number | boolean | string[] | undefined> {
  const out: Record<string, string | number | boolean | string[] | undefined> = {};
  if (!filters) return out;
  for (const f of filters) {
    const val = opts[optKey(f.option)];
    if (val === undefined || (Array.isArray(val) && val.length === 0)) continue;
    out[f.field] = val as string | string[];
  }
  return out;
}

export function filterBody(filters: FlagDef[] | undefined, opts: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!filters) return out;
  for (const f of filters) {
    const val = opts[optKey(f.option)];
    if (val === undefined || (Array.isArray(val) && val.length === 0)) continue;
    out[f.field] = val;
  }
  return out;
}

// ---------------------------------------------------------------------------
// body translation (v3 camelCase → v2 field names)
// ---------------------------------------------------------------------------

export function translateBody(
  body: Record<string, unknown>,
  fieldMap: Record<string, string>,
  resolved: ResolvedTenant,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    const mapped = fieldMap[key];
    if (!mapped) {
      throw new CliError(
        EXIT.USAGE,
        `Field "${key}" has no v2 mapping for ${resolved.alias} (${resolved.profile.apiVersion}). ` +
          `Mappable fields: ${Object.keys(fieldMap).join(", ") || "(none)"}.`,
      );
    }
    out[mapped] = value;
  }
  return out;
}

// ---------------------------------------------------------------------------
// dry-run payloads
// ---------------------------------------------------------------------------

function planned(
  method: string,
  path: string,
  query: Record<string, string | number | boolean | string[] | undefined> | undefined,
  body: unknown,
  resolved: ResolvedTenant,
): unknown {
  return redactCreds({
    dryRun: true,
    method,
    path,
    query: query ? stripUndef(query) : undefined,
    body: body === undefined ? undefined : body,
    tenant: { alias: resolved.alias, apiVersion: resolved.profile.apiVersion },
  });
}

function stripUndef<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

export interface DiffEntry {
  field: string;
  from?: unknown;
  to?: unknown;
  clearsReference?: boolean;
  was?: unknown;
  wasName?: unknown;
  ignored?: string;
}

/**
 * Pure field-level diff of the patch `intentBody` would cause against `current`,
 * honouring v3 PATCH semantics (null is ignored — cannot clear; empty string
 * clears an EntityReference `{name}Id` and surfaces the detached name). Shared by
 * single-patch `--dry-run` (entity.ts) and the bulk-engine preview (bulk.ts).
 */
export function computeDiff(
  intentBody: Record<string, unknown>,
  current: Record<string, unknown>,
): DiffEntry[] {
  const diff: DiffEntry[] = [];
  for (const [field, newVal] of Object.entries(intentBody)) {
    if (field === "__Restore") continue;
    const oldVal = current[field];
    if (newVal === null) {
      diff.push({ field, ignored: "null" });
      continue;
    }
    if (newVal === "") {
      const nameField = field.endsWith("Id") ? `${field.slice(0, -2)}Name` : undefined;
      const wasName = nameField ? current[nameField] : undefined;
      diff.push({ field, clearsReference: true, was: oldVal, wasName });
      continue;
    }
    diff.push({ field, from: oldVal, to: newVal });
  }
  return diff;
}

/** Render a single diff entry as a human line for stderr. */
export function diffLine(d: DiffEntry): string {
  if (d.ignored === "null") return `  ${d.field}: (null ignored — PATCH cannot clear via null)`;
  if (d.clearsReference) {
    return `  CLEARS REFERENCE ${d.field} (was ${fmt(d.was)}${d.wasName ? ` "${String(d.wasName)}"` : ""})`;
  }
  return `  ${d.field}: ${fmt(d.from)} → ${fmt(d.to)}`;
}

/** Build a fetch-and-diff dry-run payload for patch, and print a human summary to stderr. */
function diffPlan(
  method: string,
  path: string,
  wireBody: Record<string, unknown>,
  current: Record<string, unknown>,
  resolved: ResolvedTenant,
  intentBody: Record<string, unknown>,
  globals: GlobalFlags,
): unknown {
  const diff = computeDiff(intentBody, current);

  banner(`DRY RUN — ${method} ${path} on ${resolved.alias} (${resolved.profile.apiVersion}):`, globals);
  for (const d of diff) banner(diffLine(d), globals);
  if (diff.some((d) => d.clearsReference)) {
    note("This patch CLEARS one or more references (empty string detaches). Review before applying.");
  }

  return redactCreds({
    dryRun: true,
    method,
    path,
    tenant: { alias: resolved.alias, apiVersion: resolved.profile.apiVersion },
    diff,
    body: wireBody,
  });
}

// ---------------------------------------------------------------------------
// help text
// ---------------------------------------------------------------------------

function listExample(def: EntityDef): string {
  return `\nExample:\n  hs ${def.noun} list --query acme --out ${def.plural}.json\n`;
}

function createSafetyHelp(def: EntityDef): string {
  return (
    `\nExample:\n  echo '{"name":"Acme"}' | hs ${def.noun} create -f -\n\n` +
    "Safety:\n  Single write — prints the tenant banner and a recent-switch note. " +
    "Use --dry-run to preview the request. Not two-phase gated.\n"
  );
}

function patchSafetyHelp(def: EntityDef): string {
  return (
    `\nExample:\n  hs ${def.noun} patch <id> -f patch.json --dry-run   # preview the field diff first\n\n` +
    "Safety:\n  --dry-run fetches the current record and prints a field diff, including a " +
    'CLEARS REFERENCE line when a body value is "" (empty string detaches a reference on v3). ' +
    "PATCH ignores null. Single write — banner + recent-switch note apply.\n"
  );
}

function deleteSafetyHelp(def: EntityDef): string {
  return (
    `\nExample:\n  hs ${def.noun} delete <id> --force\n\n` +
    "Safety:\n  Requires --force. v3: archives (recoverable via `patch --restore`). " +
    "v2: archives by default; --hard uses the true delete route where defined.\n"
  );
}

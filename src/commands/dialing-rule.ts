import { Command } from "commander";

import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { request } from "../http.js";
import { normalizeResponse } from "../normalize.js";
import { emit, printBanner, readBodyFromFlag, type GlobalFlags } from "../output.js";
import { gateAndExit } from "../write-gate.js";
import { notImplemented, parseTimeout, resolveActive, translateBody } from "./entity.js";

function hostOf(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl;
  }
}

const DIALING_RULE_FIELD_MAP: Record<string, string> = {
  name: "Name",
  template: "Template",
  centerId: "CenterId",
};

/**
 * Unwrap the v3 GET /dialing-rules envelope ({ dialingRules: [...],
 * dedicatedSmsPhoneNumber }) to the unified { items } read contract, mirroring the
 * ListEvents envelope handling in entity.ts. Tolerates PascalCase and a bare array.
 * Pure + exported for tests.
 */
export function unwrapDialingRules(data: unknown): { items: unknown[] } {
  if (Array.isArray(data)) return { items: data };
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const rules = d.dialingRules ?? d.DialingRules;
    if (Array.isArray(rules)) return { items: rules };
  }
  return { items: [] };
}

function asRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new CliError(EXIT.USAGE, "Request body must be a JSON object.");
  }
  return body as Record<string, unknown>;
}

export function buildDialingRuleCommand(): Command {
  const root = new Command("dialing-rule").description(
    "Manage dialing rules (v2: full read/write; v3: read-only list).",
  );

  // ---- dialing-rule list --------------------------------------------------
  addGlobalFlags(root.command("list"))
    .description("List dialing rules. Returns { items } — pipe to `jq '.items[]'`.")
    .addHelpText("after", "\nExample:\n  hs dialing-rule list --plain\n")
    .action(async (_opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { resolved } = resolveActive(globals);
      const { profile } = resolved;

      if (profile.apiVersion === "v3") {
        if (globals.dryRun) {
          emit({ dryRun: true, method: "GET", path: "/dialing-rules", tenant: { alias: resolved.alias, apiVersion: "v3" } }, globals);
          return;
        }
        printBanner(resolved, globals);
        const res = await request<Record<string, unknown>>(profile, {
          method: "GET",
          path: "/dialing-rules",
          retry: true,
          timeoutMs: parseTimeout(globals),
        });
        emit(normalizeResponse(unwrapDialingRules(res.data), "v3", !!globals.raw), { ...globals, emptyExit: true });
        return;
      }

      if (globals.dryRun) {
        emit({ dryRun: true, method: "POST", path: "/settings/dialing-rules", body: {}, tenant: { alias: resolved.alias, apiVersion: "v2" } }, globals);
        return;
      }
      printBanner(resolved, globals);
      const res = await request(profile, {
        method: "POST",
        path: "/settings/dialing-rules",
        body: {},
        retry: true,
        timeoutMs: parseTimeout(globals),
      });
      emit(normalizeResponse(res.data, "v2", !!globals.raw), { ...globals, emptyExit: true });
    });

  // ---- dialing-rule create -f <body> --------------------------------------
  addGlobalFlags(root.command("create"))
    .description("Create a dialing rule (v2 only). Body via -f in v3 camelCase (name, template, centerId).")
    .requiredOption("-f, --file <path>", "JSON body file (use - for stdin)")
    .addHelpText(
      "after",
      "\nExample:\n  echo '{\"name\":\"UK\",\"template\":\"0{number}\",\"centerId\":\"<id>\"}' | hs dialing-rule create -f -\n\n" +
        "Safety:\n  Two-phase gated — a dialing rule create has NO delete route (not undoable), so it exits 11 " +
        "with a token; run `hs confirm <token>`. v3 tenants are read-only for dialing rules (exits 9).\n",
    )
    .action(async (opts: { file: string }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { cfg, resolved } = resolveActive(globals);
      const { profile } = resolved;
      if (profile.apiVersion === "v3") notImplemented("dialing-rule create", resolved);

      const body = asRecord(readBodyFromFlag(opts.file));
      const translated = translateBody(body, DIALING_RULE_FIELD_MAP, resolved);
      const route = "/settings/dialing-rules/new";
      if (globals.dryRun) {
        emit({ dryRun: true, method: "POST", path: route, body: translated, tenant: { alias: resolved.alias, apiVersion: "v2" } }, globals);
        return;
      }
      // A dialing-rule create is a rare config write with NO delete route (not
      // undoable) — gate it via the two-phase write mechanism instead of executing.
      const host = hostOf(resolved.profile.baseUrl);
      const nameLabel = typeof body.name === "string" ? ` "${body.name}"` : "";
      gateAndExit({
        action: "create dialing-rule",
        summary: `CREATE dialing-rule${nameLabel} on tenant ${resolved.profile.customerName} (${host}) — not undoable (no delete route).`,
        resolved,
        cfg,
        globals,
        requests: [{ method: "POST", path: route, body: translated }],
        records: [{ id: "(new)", method: "POST", path: route }],
        sampleLines: [`  [new] → POST ${route} ${JSON.stringify(translated)}`],
        affectedCount: 1,
      });
    });

  // ---- dialing-rule update <id> -f <body> ---------------------------------
  addGlobalFlags(root.command("update"))
    .argument("<id>", "The dialing rule id")
    .description("Update a dialing rule (v2 only). Body via -f in v3 camelCase (name, template, centerId).")
    .requiredOption("-f, --file <path>", "JSON body file (use - for stdin)")
    .addHelpText(
      "after",
      "\nExample:\n  echo '{\"name\":\"UK\"}' | hs dialing-rule update <id> -f -\n\n" +
        "Safety:\n  Two-phase gated — a dialing rule write is a rare config change with no undo path, so it exits 11 " +
        "with a token; run `hs confirm <token>`. v3 tenants are read-only for dialing rules (exits 9).\n",
    )
    .action(async (id: string, opts: { file: string }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { cfg, resolved } = resolveActive(globals);
      const { profile } = resolved;
      if (profile.apiVersion === "v3") notImplemented("dialing-rule update", resolved);

      const body = asRecord(readBodyFromFlag(opts.file));
      const translated = translateBody(body, DIALING_RULE_FIELD_MAP, resolved);
      translated.Id = id;
      const route = "/settings/dialing-rule/update";
      if (globals.dryRun) {
        emit({ dryRun: true, method: "POST", path: route, body: translated, tenant: { alias: resolved.alias, apiVersion: "v2" } }, globals);
        return;
      }
      // A dialing-rule update is a rare config write — gate it via the two-phase
      // write mechanism instead of executing directly.
      const host = hostOf(resolved.profile.baseUrl);
      gateAndExit({
        action: "update dialing-rule",
        summary: `UPDATE dialing-rule ${id} on tenant ${resolved.profile.customerName} (${host}).`,
        resolved,
        cfg,
        globals,
        requests: [{ method: "POST", path: route, body: translated }],
        records: [{ id, method: "POST", path: route }],
        sampleLines: [`  [${id}] → POST ${route} ${JSON.stringify(translated)}`],
        affectedCount: 1,
      });
    });

  return root;
}

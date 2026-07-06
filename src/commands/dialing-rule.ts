import { Command } from "commander";

import { setLastWriteTenant } from "../config.js";
import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { request } from "../http.js";
import { normalizeResponse } from "../normalize.js";
import { emit, printBanner, readBodyFromFlag, type GlobalFlags } from "../output.js";
import { notImplemented, parseTimeout, resolveActive, translateBody, writePreamble } from "./entity.js";

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
        "Safety:\n  Single write — banner + recent-switch note. v3 tenants are read-only for dialing rules (exits 9).\n",
    )
    .action(async (opts: { file: string }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { cfg, resolved } = resolveActive(globals);
      const { profile } = resolved;
      if (profile.apiVersion === "v3") notImplemented("dialing-rule create", resolved);

      const body = asRecord(readBodyFromFlag(opts.file));
      const translated = translateBody(body, DIALING_RULE_FIELD_MAP, resolved);
      if (globals.dryRun) {
        emit({ dryRun: true, method: "POST", path: "/settings/dialing-rules/new", body: translated, tenant: { alias: resolved.alias, apiVersion: "v2" } }, globals);
        return;
      }
      writePreamble(cfg, resolved, globals);
      const res = await request(profile, {
        method: "POST",
        path: "/settings/dialing-rules/new",
        body: translated,
        timeoutMs: parseTimeout(globals),
      });
      setLastWriteTenant(resolved.alias);
      emit(normalizeResponse(res.data, "v2", !!globals.raw), globals);
    });

  // ---- dialing-rule update <id> -f <body> ---------------------------------
  addGlobalFlags(root.command("update"))
    .argument("<id>", "The dialing rule id")
    .description("Update a dialing rule (v2 only). Body via -f in v3 camelCase (name, template, centerId).")
    .requiredOption("-f, --file <path>", "JSON body file (use - for stdin)")
    .addHelpText(
      "after",
      "\nExample:\n  echo '{\"name\":\"UK\"}' | hs dialing-rule update <id> -f -\n\n" +
        "Safety:\n  Single write — banner + recent-switch note. v3 tenants are read-only for dialing rules (exits 9).\n",
    )
    .action(async (id: string, opts: { file: string }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { cfg, resolved } = resolveActive(globals);
      const { profile } = resolved;
      if (profile.apiVersion === "v3") notImplemented("dialing-rule update", resolved);

      const body = asRecord(readBodyFromFlag(opts.file));
      const translated = translateBody(body, DIALING_RULE_FIELD_MAP, resolved);
      translated.Id = id;
      if (globals.dryRun) {
        emit({ dryRun: true, method: "POST", path: "/settings/dialing-rule/update", body: translated, tenant: { alias: resolved.alias, apiVersion: "v2" } }, globals);
        return;
      }
      writePreamble(cfg, resolved, globals);
      const res = await request(profile, {
        method: "POST",
        path: "/settings/dialing-rule/update",
        body: translated,
        timeoutMs: parseTimeout(globals),
      });
      setLastWriteTenant(resolved.alias);
      emit(normalizeResponse(res.data, "v2", !!globals.raw), globals);
    });

  return root;
}

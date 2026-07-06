import { Command } from "commander";

import { addGlobalFlags } from "../global-flags.js";
import { request } from "../http.js";
import { normalizeResponse } from "../normalize.js";
import { emit, printBanner, type GlobalFlags } from "../output.js";
import { parseTimeout, resolveActive } from "./entity.js";

/**
 * Unwrap the v3 GET /time-zones envelope ({ timeZones: [{ id, displayName }] }) to
 * the unified { items } read contract. Tolerates PascalCase and a bare array.
 * Pure + exported for tests.
 */
export function unwrapTimeZones(data: unknown): { items: unknown[] } {
  if (Array.isArray(data)) return { items: data };
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const zones = d.timeZones ?? d.TimeZones;
    if (Array.isArray(zones)) return { items: zones };
  }
  return { items: [] };
}

export function buildTimeZonesCommand(): Command {
  const cmd = new Command("time-zones").description("List the system time zones (v2 + v3; read-only).");

  addGlobalFlags(cmd)
    .addHelpText("after", "\nExample:\n  hs time-zones --plain\n")
    .action(async (_opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { resolved } = resolveActive(globals);
      const { profile } = resolved;

      if (profile.apiVersion === "v3") {
        if (globals.dryRun) {
          emit({ dryRun: true, method: "GET", path: "/time-zones", tenant: { alias: resolved.alias, apiVersion: "v3" } }, globals);
          return;
        }
        printBanner(resolved, globals);
        const res = await request<Record<string, unknown>>(profile, {
          method: "GET",
          path: "/time-zones",
          retry: true,
          timeoutMs: parseTimeout(globals),
        });
        emit(normalizeResponse(unwrapTimeZones(res.data), "v3", !!globals.raw), { ...globals, emptyExit: true });
        return;
      }

      if (globals.dryRun) {
        emit({ dryRun: true, method: "GET", path: "/settings/time-zones", tenant: { alias: resolved.alias, apiVersion: "v2" } }, globals);
        return;
      }
      printBanner(resolved, globals);
      const res = await request(profile, {
        method: "GET",
        path: "/settings/time-zones",
        retry: true,
        timeoutMs: parseTimeout(globals),
      });
      emit(normalizeResponse(res.data, "v2", !!globals.raw), { ...globals, emptyExit: true });
    });

  return cmd;
}

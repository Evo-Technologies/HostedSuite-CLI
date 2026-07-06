import { Command } from "commander";

import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { request } from "../http.js";
import { normalizeResponse } from "../normalize.js";
import { emit, printBanner, type GlobalFlags } from "../output.js";
import { parseTimeout, resolveActive } from "./entity.js";

/**
 * `hs remote-phones` — list the devices/extensions used for soft-phone
 * connections (v2 POST /remote-phones; bare list → { items }). Read-only. No v3
 * equivalent exists, so v3 tenants exit 9.
 */
export function buildRemotePhonesCommand(): Command {
  const cmd = new Command("remote-phones").description(
    "List soft-phone devices/extensions (v2 only; read-only).",
  );

  addGlobalFlags(cmd)
    .addHelpText(
      "after",
      "\nExample:\n  hs remote-phones --plain\n\n" +
        "Note:\n  Read-only. Bare list response is wrapped to { items }. No v3 equivalent (v3 tenants exit 9).\n",
    )
    .action(async (_opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { resolved } = resolveActive(globals);
      const { profile } = resolved;

      if (profile.apiVersion !== "v2") {
        throw new CliError(
          EXIT.NOT_IMPLEMENTED,
          `remote-phones is a v2-only endpoint; ${resolved.alias} runs the v3 API (no v3 equivalent).`,
        );
      }

      if (globals.dryRun) {
        emit({ dryRun: true, method: "POST", path: "/remote-phones", body: {}, tenant: { alias: resolved.alias, apiVersion: "v2" } }, globals);
        return;
      }
      printBanner(resolved, globals);
      const res = await request(profile, {
        method: "POST",
        path: "/remote-phones",
        body: {},
        retry: true,
        timeoutMs: parseTimeout(globals),
      });
      emit(normalizeResponse(res.data, "v2", !!globals.raw), { ...globals, emptyExit: true });
    });

  return cmd;
}

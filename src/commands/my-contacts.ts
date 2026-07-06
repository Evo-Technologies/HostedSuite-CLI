import { Command } from "commander";

import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { request } from "../http.js";
import { normalizeResponse } from "../normalize.js";
import { emit, printBanner, type GlobalFlags } from "../output.js";
import { parseTimeout, resolveActive } from "./entity.js";

/**
 * `hs my-contacts <contactId>` — list the contacts associated with a given contact
 * (v2 POST /contacts/my-contacts; bare list → { items }). Read-only. No v3
 * equivalent, so v3 tenants exit 9.
 */
export function buildMyContactsCommand(): Command {
  const cmd = new Command("my-contacts").description(
    "List contacts associated with a contact (v2 only; read-only).",
  );

  addGlobalFlags(cmd)
    .argument("<contactId>", "The contact id whose associates you want")
    .addHelpText(
      "after",
      "\nExample:\n  hs my-contacts <contactId>\n\n" +
        "Note:\n  Read-only. Bare list response is wrapped to { items }. No v3 equivalent (v3 tenants exit 9).\n",
    )
    .action(async (contactId: string, _opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { resolved } = resolveActive(globals);
      const { profile } = resolved;

      if (profile.apiVersion !== "v2") {
        throw new CliError(
          EXIT.NOT_IMPLEMENTED,
          `my-contacts is a v2-only endpoint; ${resolved.alias} runs the v3 API (no v3 equivalent).`,
        );
      }

      const body = { ContactId: contactId };
      if (globals.dryRun) {
        emit({ dryRun: true, method: "POST", path: "/contacts/my-contacts", body, tenant: { alias: resolved.alias, apiVersion: "v2" } }, globals);
        return;
      }
      printBanner(resolved, globals);
      const res = await request(profile, {
        method: "POST",
        path: "/contacts/my-contacts",
        body,
        retry: true,
        timeoutMs: parseTimeout(globals),
      });
      emit(normalizeResponse(res.data, "v2", !!globals.raw), { ...globals, emptyExit: true });
    });

  return cmd;
}

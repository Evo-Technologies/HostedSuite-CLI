import { Command } from "commander";

import { setLastWriteTenant } from "../config.js";
import { addGlobalFlags } from "../global-flags.js";
import { emit, printBanner, type GlobalFlags } from "../output.js";
import { notImplemented, resolveActive, sendNormalized, writePreamble } from "./entity.js";

/**
 * Attach the v2-only `mark-read <formId>` action under the completed-form entity
 * command. It rides POST /forms/mark-read { FormId }. There is no v3 equivalent,
 * so on a v3 tenant it exits 9 (notImplemented). completed-form itself stays
 * read-only (list/get); this is the one mutating verb it exposes on v2.
 */
export function addCompletedFormExtras(completedFormRoot: Command): void {
  addGlobalFlags(completedFormRoot.command("mark-read"))
    .argument("<formId>", "The completed-form id to mark as read")
    .description("Mark a completed form as read (v2 only; POST /forms/mark-read).")
    .addHelpText(
      "after",
      "\nExample:\n  hs completed-form mark-read <formId>\n\n" +
        "Safety:\n  v2-only action — single write, prints the tenant banner and a recent-switch note. " +
        "Not available on v3 tenants (exits 9).\n",
    )
    .action(async (formId: string, _opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { cfg, resolved } = resolveActive(globals);
      const { profile } = resolved;

      if (profile.apiVersion === "v3") {
        notImplemented("completed-form mark-read is a v2-only action", resolved);
      }

      const body = { FormId: formId };
      if (globals.dryRun) {
        emit(
          { dryRun: true, method: "POST", path: "/forms/mark-read", body, tenant: { alias: resolved.alias, apiVersion: "v2" } },
          globals,
        );
        return;
      }
      writePreamble(cfg, resolved, globals);
      const out = await sendNormalized(profile, { method: "POST", path: "/forms/mark-read", body }, globals);
      setLastWriteTenant(resolved.alias);
      emit(out ?? { ok: true }, globals);
    });
}

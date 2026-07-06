import { Command } from "commander";

import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { request } from "../http.js";
import { normalizeResponse } from "../normalize.js";
import { emit, printBanner, type GlobalFlags } from "../output.js";
import { parseTimeout, resolveActive } from "./entity.js";

/**
 * `hs meeting-room-resources --meeting-room-id <id>` — list the resources available
 * for a meeting room (v2 POST /scheduling/available-resources; bare list → { items }).
 * Read-only. No v3 equivalent, so v3 tenants exit 9.
 */
export function buildMeetingRoomResourcesCommand(): Command {
  const cmd = new Command("meeting-room-resources").description(
    "List the resources available for a meeting room (v2 only; read-only).",
  );

  addGlobalFlags(cmd)
    .requiredOption("--meeting-room-id <id>", "The meeting room id whose resources you want")
    .addHelpText(
      "after",
      "\nExample:\n  hs meeting-room-resources --meeting-room-id <id>\n\n" +
        "Note:\n  Read-only. Bare list response is wrapped to { items }. No v3 equivalent (v3 tenants exit 9).\n",
    )
    .action(async (opts: { meetingRoomId: string }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags & { meetingRoomId: string }>();
      const { resolved } = resolveActive(globals);
      const { profile } = resolved;

      if (profile.apiVersion !== "v2") {
        throw new CliError(
          EXIT.NOT_IMPLEMENTED,
          `meeting-room-resources is a v2-only endpoint; ${resolved.alias} runs the v3 API (no v3 equivalent).`,
        );
      }

      const body = { MeetingRoomId: opts.meetingRoomId };
      if (globals.dryRun) {
        emit({ dryRun: true, method: "POST", path: "/scheduling/available-resources", body, tenant: { alias: resolved.alias, apiVersion: "v2" } }, globals);
        return;
      }
      printBanner(resolved, globals);
      const res = await request(profile, {
        method: "POST",
        path: "/scheduling/available-resources",
        body,
        retry: true,
        timeoutMs: parseTimeout(globals),
      });
      emit(normalizeResponse(res.data, "v2", !!globals.raw), { ...globals, emptyExit: true });
    });

  return cmd;
}

import { Command } from "commander";

import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { request } from "../http.js";
import { normalizeResponse } from "../normalize.js";
import { emit, printBanner, type GlobalFlags } from "../output.js";
import { parseTimeout, resolveActive } from "./entity.js";

function collect(value: string, prev: string[] = []): string[] {
  return [...prev, value];
}

function requireV2(globals: GlobalFlags, action: string): ReturnType<typeof resolveActive> {
  const ctx = resolveActive(globals);
  if (ctx.resolved.profile.apiVersion !== "v2") {
    throw new CliError(
      EXIT.NOT_IMPLEMENTED,
      `'availability ${action}' is a v2-only scheduling endpoint; ${ctx.resolved.alias} runs the v3 API.`,
    );
  }
  return ctx;
}

export function buildAvailabilityCommand(): Command {
  const root = new Command("availability").description(
    "Check meeting-room / resource availability for a time window (v2 only; read-only).",
  );

  // ---- availability room --------------------------------------------------
  addGlobalFlags(root.command("room"))
    .description("Check whether a meeting room is available (POST /scheduling/check-availability).")
    .requiredOption("--room-id <id>", "The meeting room id to check")
    .requiredOption("--start <ts>", "Start of the window")
    .requiredOption("--end <ts>", "End of the window")
    .addHelpText("after", "\nExample:\n  hs availability room --room-id <id> --start 2026-07-06T09:00 --end 2026-07-06T10:00\n")
    .action(async (opts: { roomId: string; start: string; end: string }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { resolved } = requireV2(globals, "room");
      const body = { RoomId: opts.roomId, StartTime: opts.start, EndTime: opts.end };
      if (globals.dryRun) {
        emit({ dryRun: true, method: "POST", path: "/scheduling/check-availability", body, tenant: { alias: resolved.alias, apiVersion: "v2" } }, globals);
        return;
      }
      printBanner(resolved, globals);
      const res = await request(resolved.profile, {
        method: "POST",
        path: "/scheduling/check-availability",
        body,
        retry: true,
        timeoutMs: parseTimeout(globals),
      });
      emit(normalizeResponse(res.data, "v2", !!globals.raw), globals);
    });

  // ---- availability resource ----------------------------------------------
  addGlobalFlags(root.command("resource"))
    .description("Check whether resources are available (POST /scheduling/check-resource/availability).")
    .requiredOption("--resource-id <id>", "A resource id to check (repeatable)", collect, [] as string[])
    .requiredOption("--start <ts>", "Start of the window")
    .requiredOption("--end <ts>", "End of the window")
    .addHelpText(
      "after",
      "\nExample:\n  hs availability resource --resource-id <id> --resource-id <id2> --start 2026-07-06T09:00 --end 2026-07-06T10:00\n",
    )
    .action(async (opts: { resourceId: string[]; start: string; end: string }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { resolved } = requireV2(globals, "resource");
      if (opts.resourceId.length === 0) {
        throw new CliError(EXIT.USAGE, "availability resource needs at least one --resource-id.");
      }
      const body = { ResourceIds: opts.resourceId, StartTime: opts.start, EndTime: opts.end };
      if (globals.dryRun) {
        emit({ dryRun: true, method: "POST", path: "/scheduling/check-resource/availability", body, tenant: { alias: resolved.alias, apiVersion: "v2" } }, globals);
        return;
      }
      printBanner(resolved, globals);
      const res = await request(resolved.profile, {
        method: "POST",
        path: "/scheduling/check-resource/availability",
        body,
        retry: true,
        timeoutMs: parseTimeout(globals),
      });
      emit(normalizeResponse(res.data, "v2", !!globals.raw), globals);
    });

  return root;
}

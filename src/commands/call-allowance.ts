import { Command } from "commander";

import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { emit, printBanner, type GlobalFlags } from "../output.js";
import { parseTimeout, resolveActive } from "./entity.js";
import { request } from "../http.js";
import { normalizeResponse } from "../normalize.js";

export interface CallAllowanceOpts {
  startDate?: string;
  endDate?: string;
  clientId?: string;
  billHold?: boolean;
  billTalk?: boolean;
  billTransfer?: boolean;
  billRing?: boolean;
  callRounding?: string;
  minDuration?: string;
  maxDuration?: string;
}

const CALL_ROUNDING = new Set(["None", "NextMinute", "Next30Seconds"]);

/**
 * Assemble the v2 POST /call-allowance/balance body (PascalCase). Boolean bill-*
 * flags are only emitted when set (server defaults them false); numbers are parsed
 * and only emitted when a finite value is supplied. Pure + exported for tests.
 */
export function buildCallAllowanceBody(opts: CallAllowanceOpts): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (opts.startDate !== undefined) body.StartDate = opts.startDate;
  if (opts.endDate !== undefined) body.EndDate = opts.endDate;
  if (opts.clientId !== undefined) body.ClientId = opts.clientId;
  if (opts.billHold) body.BillHold = true;
  if (opts.billTalk) body.BillTalk = true;
  if (opts.billTransfer) body.BillTransfer = true;
  if (opts.billRing) body.BillRing = true;
  if (opts.callRounding !== undefined) body.CallRounding = opts.callRounding;
  const min = numberOrUndefined(opts.minDuration);
  const max = numberOrUndefined(opts.maxDuration);
  if (min !== undefined) body.MinCallDuration = min;
  if (max !== undefined) body.MaxCallDuration = max;
  return body;
}

function numberOrUndefined(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new CliError(EXIT.USAGE, `Expected a number, got "${v}".`);
  return n;
}

export function buildCallAllowanceCommand(): Command {
  const cmd = new Command("call-allowance").description(
    "Retrieve call allowance balances for client(s) over a date range (v2 only; read-only).",
  );

  addGlobalFlags(cmd)
    .option("--start-date <date>", "Window start date")
    .option("--end-date <date>", "Window end date")
    .option("--client-id <id>", "Filter by client id")
    .option("--bill-hold", "Bill for hold time")
    .option("--bill-talk", "Bill for talk time")
    .option("--bill-transfer", "Bill for transfer time")
    .option("--bill-ring", "Bill for ring time")
    .option("--call-rounding <v>", "Round call durations (None | NextMinute | Next30Seconds)")
    .option("--min-duration <n>", "Minimum call duration in seconds (talk time)")
    .option("--max-duration <n>", "Maximum call duration in seconds (talk time)")
    .addHelpText(
      "after",
      "\nExample:\n" +
        "  hs call-allowance --start-date 2026-01-01 --end-date 2026-01-31 --client-id <id> --bill-talk\n\n" +
        "Note:\n  Read-only. Bare list response is wrapped to { items }. On v3 tenants this endpoint does not " +
        "exist — use `hs report run call-allowance-report` instead.\n",
    )
    .action(async (opts: CallAllowanceOpts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags & CallAllowanceOpts>();
      const { resolved } = resolveActive(globals);
      const { profile } = resolved;

      if (profile.apiVersion !== "v2") {
        throw new CliError(
          EXIT.NOT_IMPLEMENTED,
          `call-allowance balances are a v2-only endpoint; ${resolved.alias} runs the v3 API. ` +
            "Use `hs report run call-allowance-report` instead.",
        );
      }

      if (opts.callRounding !== undefined && !CALL_ROUNDING.has(opts.callRounding)) {
        throw new CliError(
          EXIT.USAGE,
          `--call-rounding must be one of None | NextMinute | Next30Seconds (got "${opts.callRounding}").`,
        );
      }

      const body = buildCallAllowanceBody(opts);
      if (globals.dryRun) {
        emit(
          { dryRun: true, method: "POST", path: "/call-allowance/balance", body, tenant: { alias: resolved.alias, apiVersion: "v2" } },
          globals,
        );
        return;
      }
      printBanner(resolved, globals);
      const res = await request(profile, {
        method: "POST",
        path: "/call-allowance/balance",
        body,
        retry: true,
        timeoutMs: parseTimeout(globals),
      });
      emit(normalizeResponse(res.data, "v2", !!globals.raw), { ...globals, emptyExit: true });
    });

  return cmd;
}

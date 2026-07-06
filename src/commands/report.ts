import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";

import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { request, requestRaw } from "../http.js";
import { normalizeResponse } from "../normalize.js";
import { emit, printBanner, type GlobalFlags } from "../output.js";
import { parseTimeout, resolveActive } from "./entity.js";

/**
 * The full set of `/reports/*` routes (all GET, v3-only), enumerated from the
 * server's codegen (`[Route("/reports/`). Every `Run*Report`/`Run*Export` DTO also
 * inherits a `Format` field (mapped by the CLI's `--format` flag), so it is not
 * repeated in `params`. `hs report run <name>` accepts ANY route name, so even a
 * route not listed here still works; this table is discovery help.
 *
 * `params` are the report-specific property names (case-insensitive on the wire);
 * pass each with `--param Name=value`. Date windows are `DateRange`/`TimeRange`
 * complex objects on most reports — consult the server DTO for their sub-fields.
 */
interface ReportDef {
  name: string;
  description: string;
  /** Report-specific parameter names (case-insensitive on the wire); pass with --param. */
  params?: string[];
}

// Shared parameter cores, to keep the table readable.
const CALL_CORE = [
  "TimeRange",
  "OnlyIncludeSpecifiedTimeOfDay",
  "Type",
  "Centers",
  "Clients",
  "RoundCalls",
  "MinCallDurationInSeconds",
  "MaxCallDurationInSeconds",
  "Categories",
  "CallDispositions",
  "BillableTime",
];
const SCHEDULING_CORE = [
  "DateRange",
  "ClientsAtCenter",
  "RoomsAtCenter",
  "Client",
  "ShowOnlyBillableReservations",
  "ShowOnlyReservationsWithNotes",
  "ShowOnlyReservationsWithAdminNotes",
  "Status",
];
const CHARGE_CORE = [
  "DateRange",
  "Center",
  "ChargeSources",
  "Client",
  "SpecificServices",
  "RoundCalls",
  "BillableTime",
  "MinCallDurationInSeconds",
  "ShowEmptyCharges",
];

const REPORTS: ReportDef[] = [
  { name: "booking-dates-report", description: "Booking dates report", params: SCHEDULING_CORE },
  {
    name: "meeting-room-day-sheet-report",
    description: "Meeting room day sheet report",
    params: ["Date", "Center", "ShowCompanyNamesOnReservations", "Interval", "StartTime", "EndTime"],
  },
  {
    name: "utilization-report",
    description: "Utilization report",
    params: ["DateRange", "StartTime", "EndTime", "Centers", "ExcludeClients", "IncludeRoomOccupancy", "IncludeWeekends"],
  },
  { name: "sign-in-sheet-report", description: "Sign-in sheet report", params: SCHEDULING_CORE },
  { name: "day-sheet-report", description: "Day sheet report", params: SCHEDULING_CORE },
  { name: "scheduling-history-report", description: "Scheduling history report", params: SCHEDULING_CORE },
  { name: "scheduling-billing-report", description: "Scheduling billing report", params: SCHEDULING_CORE },
  {
    name: "call-allowance-report-by-day",
    description: "Call allowance report by day",
    params: [...CALL_CORE, "IncludeArchivedClients", "RemoveBalanceColumns", "AllowanceType"],
  },
  {
    name: "call-allowance-report-v-1",
    description: "Call allowance report v1",
    params: [
      "TimeRange",
      "OnlyIncludeSpecifiedTimeOfDay",
      "Type",
      "Centers",
      "Client",
      "RoundCalls",
      "MinCallDurationInSeconds",
      "MaxCallDurationInSeconds",
      "Categories",
      "BillableTime",
      "IncludeArchivedClients",
    ],
  },
  { name: "call-insights-report", description: "Call insights report", params: [...CALL_CORE, "Insight", "Grouping"] },
  { name: "weekly-call-breakdown-report", description: "Weekly call breakdown report", params: CALL_CORE },
  { name: "call-transfer-report", description: "Call transfer report", params: CALL_CORE },
  { name: "call-count-by-screen-pop-report", description: "Call count by screen pop report", params: CALL_CORE },
  { name: "monthly-call-breakdown-report", description: "Monthly call breakdown report", params: CALL_CORE },
  { name: "hourly-call-volume-report", description: "Hourly call volume report", params: CALL_CORE },
  {
    name: "outbound-cdr-report",
    description: "Outbound CDR report",
    params: ["TimeRange", "Center", "Client", "SortBy", "IncludeRawCdrs", "ShowEachCall", "OnlyIncludeBillableCalls"],
  },
  {
    name: "hourly-call-breakdown-report",
    description: "Hourly call breakdown report",
    params: [...CALL_CORE, "HideClientInformation"],
  },
  {
    name: "missed-call-report",
    description: "Missed call report",
    params: ["TimeRange", "OnlyIncludeSpecifiedTimeOfDay", "Center", "Categories", "Client", "MinRingTimeInSeconds"],
  },
  {
    name: "operator-transfer-cdr-report",
    description: "Operator transfer CDR report",
    params: ["TimeRange", "Center", "Client", "SortBy", "IncludeRawCdrs", "ShowEachCall", "OnlyIncludeBillableCalls"],
  },
  {
    name: "center-call-breakdown-report",
    description: "Center call breakdown report",
    params: [...CALL_CORE, "DoNotIncludeClientBreakdowns"],
  },
  { name: "call-notes-report", description: "Call notes report", params: CALL_CORE },
  {
    name: "call-allowance-report",
    description: "Call allowance report",
    params: [...CALL_CORE, "IncludeArchivedClients", "RemoveBalanceColumns", "AllowanceType"],
  },
  {
    name: "client-call-breakdown-report",
    description: "Client call breakdown report",
    params: [...CALL_CORE, "IncludeCallDetail", "IncludeCallNotes", "IncludeCallDisposition", "TimeSpanFormat"],
  },
  {
    name: "operator-statistics-report",
    description: "Operator statistics report",
    params: [...CALL_CORE, "GroupBy", "CountBy", "IncludeMissedCallInformation", "MinRingTimeInSecondsForMissedCalls"],
  },
  { name: "lead-excel-report", description: "Lead excel report", params: ["Center"] },
  { name: "completed-forms-excel-report", description: "Completed forms excel report", params: ["TimeRange", "Client", "Center"] },
  { name: "completed-forms-report", description: "Completed forms report", params: ["TimeRange", "Client", "Center"] },
  { name: "client-excel-report", description: "Client excel report", params: ["Center"] },
  { name: "client-gain-loss-report", description: "Client gain/loss report", params: ["TimeRange", "Center"] },
  { name: "screen-pops-report", description: "Screen pops report", params: ["Center", "ShowIdsInsteadOfNames"] },
  { name: "custom-fields-report", description: "Custom fields report", params: ["Center"] },
  { name: "client-report", description: "Client report", params: ["Center"] },
  {
    name: "client-spreadsheet-report",
    description: "Client spreadsheet report",
    params: ["Center", "DisplayMode", "OnlyShowContactsWithLogins", "ShowLoginPassword"],
  },
  { name: "charge-details-export", description: "Charge details export", params: CHARGE_CORE },
  {
    name: "manual-charges-report",
    description: "Manual charges report",
    params: ["DateRange", "Center", "Client", "SpecificServices", "GroupChargeTotals"],
  },
  {
    name: "quick-books-excel-export",
    description: "QuickBooks excel export",
    params: ["DateRange", "InvoiceDate", "ChargeSources", "BillableCallTime", "IncludeZeroChargeLineItems", "LineItemMode"],
  },
  { name: "contracts-excel-export", description: "Contracts excel export (no parameters beyond --format)", params: [] },
  { name: "charge-summary-report", description: "Charge summary report", params: CHARGE_CORE },
  { name: "appointment-counts-by-user-report", description: "Appointment counts by user report", params: ["DateRange"] },
];

const FORMATS = new Set(["xlsx", "pdf", "json"]);

function collect(value: string, prev: string[] = []): string[] {
  return [...prev, value];
}

function parseParams(pairs: string[]): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq === -1) throw new CliError(EXIT.USAGE, `--param expects k=v, got "${pair}".`);
    const key = pair.slice(0, eq);
    const val = pair.slice(eq + 1);
    const existing = out[key];
    if (existing === undefined) out[key] = val;
    else if (Array.isArray(existing)) existing.push(val);
    else out[key] = [existing, val];
  }
  return out;
}

export function buildReportCommand(): Command {
  const root = new Command("report").description("List and run HostedSuite reports (v3 /reports/* — GET-only exports).");

  addGlobalFlags(root.command("list"))
    .description("List all known /reports/* routes (GET-only, v3 tenants).")
    .addHelpText("after", "\nExample:\n  hs report list --plain\n")
    .action((_opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      emit(
        { items: REPORTS, note: "`hs report run <name>` accepts any /reports/* route; --format sets the DTO Format field." },
        globals,
      );
    });

  addGlobalFlags(root.command("run"))
    .argument("<name>", "Report route name, e.g. client-excel-report (with or without leading /reports/)")
    .description("Run a report. Binary formats (xlsx/pdf) stream to --out; json prints (or --out).")
    .option("--param <k=v>", "Report parameter (repeatable)", collect, [] as string[])
    .option("--format <fmt>", "xlsx | pdf | json (default json)")
    .addHelpText(
      "after",
      "\nExample:\n  hs report run client-excel-report --param from=2026-01-01 --param to=2026-06-30 --format xlsx --out report.xlsx\n\n" +
        "Safety:\n  Read-only. Report endpoints are concurrency-capped (429 → retried after Retry-After); run them serially.\n",
    )
    .action(async (name: string, opts: { param: string[]; format?: string }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags & { param: string[]; format?: string }>();
      const format = (opts.format ?? "json").toLowerCase();
      if (!FORMATS.has(format)) {
        throw new CliError(EXIT.USAGE, `--format must be one of xlsx | pdf | json (got "${opts.format}").`);
      }

      const { resolved } = resolveActive(globals);
      if (resolved.profile.apiVersion !== "v3") {
        throw new CliError(EXIT.NOT_IMPLEMENTED, `Reports require a v3 tenant; ${resolved.alias} runs the v2 API.`);
      }

      const reportPath = normalizeReportPath(name);
      const query: Record<string, string | string[]> = parseParams(opts.param);
      if (format !== "json") query.format = format;

      if (globals.dryRun) {
        emit({ dryRun: true, method: "GET", path: reportPath, query, format, tenant: { alias: resolved.alias, apiVersion: "v3" } }, globals);
        return;
      }

      printBanner(resolved, globals);

      // JSON reports parse and emit through the normal contract.
      if (format === "json") {
        const res = await request(resolved.profile, {
          method: "GET",
          path: reportPath,
          query,
          retry: true,
          timeoutMs: parseTimeout(globals),
        });
        emit(normalizeResponse(res.data, "v3", !!globals.raw), globals);
        return;
      }

      // Binary formats must stream to a file.
      if (!globals.out) {
        throw new CliError(EXIT.USAGE, `--out <path> is required for --format ${format} (binary output).`);
      }
      const res = await requestRaw(resolved.profile, {
        method: "GET",
        path: reportPath,
        query,
        timeoutMs: parseTimeout(globals),
      });
      const bytes = await streamToFile(res, globals.out);
      process.stdout.write(`${JSON.stringify({ path: path.resolve(globals.out), bytes, format })}\n`);
    });

  return root;
}

function normalizeReportPath(name: string): string {
  const trimmed = name.replace(/^\/+/, "").replace(/^reports\//, "");
  return `/reports/${trimmed}`;
}

async function streamToFile(res: Response, out: string): Promise<number> {
  const resolved = path.resolve(out);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(resolved, buf);
  return buf.byteLength;
}

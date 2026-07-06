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
 * A small, HONEST subset of the ~39 `/reports/*` routes (all GET, v3-only). The
 * full list is enumerated server-side (grep `[Route("/reports/` in the server's
 * codegen) — do not treat this as exhaustive. `hs report run <name>` accepts ANY
 * route name, so unlisted reports still work; this table is just discovery help.
 */
interface ReportDef {
  name: string;
  description: string;
  /** Illustrative params (case-insensitive on the wire); reports vary — pass with --param. */
  params?: string[];
}

const REPORTS: ReportDef[] = [
  {
    name: "client-excel-report",
    description: "Per-client export (xlsx).",
    params: ["from", "to", "centerId"],
  },
  {
    name: "quick-books-excel-export",
    description: "QuickBooks billing export (xlsx).",
    params: ["from", "to"],
  },
  {
    name: "utilization-report",
    description: "Resource/room utilization over a window.",
    params: ["from", "to", "centerId"],
  },
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
    .description("List known report routes (a representative subset — not exhaustive).")
    .addHelpText("after", "\nExample:\n  hs report list --plain\n")
    .action((_opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      emit({ items: REPORTS, note: "Representative subset; `hs report run <name>` accepts any /reports/* route." }, globals);
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

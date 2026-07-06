import { Command } from "commander";

import { addGlobalFlags } from "../global-flags.js";
import { CliError, EXIT } from "../exit-codes.js";
import { request } from "../http.js";
import { normalizeResponse, redactCreds } from "../normalize.js";
import { emit, printBanner, readBodyFromFlag, type GlobalFlags } from "../output.js";
import { parseTimeout, resolveActive, writePreamble } from "./entity.js";

const WRITE_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

function collect(value: string, prev: string[] = []): string[] {
  return [...prev, value];
}

function parseQueryPairs(pairs: string[]): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq === -1) throw new CliError(EXIT.USAGE, `--query expects k=v, got "${pair}".`);
    const key = pair.slice(0, eq);
    const val = pair.slice(eq + 1);
    const existing = out[key];
    if (existing === undefined) out[key] = val;
    else if (Array.isArray(existing)) existing.push(val);
    else out[key] = [existing, val];
  }
  return out;
}

export function buildApiCommand(): Command {
  return addGlobalFlags(new Command("api"))
    .argument("<method>", "HTTP method: GET | POST | PATCH | PUT | DELETE")
    .argument("<path>", "Resource path, e.g. /clients or /clients/{id}")
    .description("Raw passthrough on the active tenant (v2 injects body credentials). Write methods require --force.")
    .option("--query <k=v>", "Query parameter (repeatable)", collect, [] as string[])
    .option("-f, --file <path>", "JSON body file (use - for stdin)")
    .addHelpText(
      "after",
      "\nExample:\n  hs api GET /clients --query query=acme\n  hs api PATCH /clients/<id> -f body.json --force\n\n" +
        "Safety:\n  POST/PATCH/PUT/DELETE require --force. Do NOT loop this for bulk work — use `bulk-*` so the gate applies.\n",
    )
    .action(async (method: string, resourcePath: string, opts: { query: string[]; file?: string }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags & { query: string[]; file?: string }>();
      const upper = method.toUpperCase();
      const isWrite = WRITE_METHODS.has(upper);

      if (isWrite && !globals.force) {
        throw new CliError(EXIT.USAGE, `hs api ${upper} requires --force (raw write on the active tenant).`);
      }

      const { cfg, resolved } = resolveActive(globals);
      const query = parseQueryPairs(opts.query);
      const body = opts.file ? readBodyFromFlag(opts.file) : undefined;

      if (globals.dryRun) {
        emit(
          redactCreds({
            dryRun: true,
            method: upper,
            path: resourcePath,
            query,
            body,
            tenant: { alias: resolved.alias, apiVersion: resolved.profile.apiVersion },
          }),
          globals,
        );
        return;
      }

      if (isWrite) writePreamble(cfg, resolved, globals);
      else printBanner(resolved, globals);

      const res = await request(resolved.profile, {
        method: upper,
        path: resourcePath,
        query,
        body,
        retry: !isWrite,
        timeoutMs: parseTimeout(globals),
      });

      if (isWrite) {
        const { setLastWriteTenant } = await import("../config.js");
        setLastWriteTenant(resolved.alias);
      }

      emit(normalizeResponse(res.data, resolved.profile.apiVersion, !!globals.raw), globals);
    });
}

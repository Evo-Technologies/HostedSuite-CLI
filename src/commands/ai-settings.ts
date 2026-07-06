import { Command } from "commander";

import { setLastWriteTenant } from "../config.js";
import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { request } from "../http.js";
import { normalizeResponse } from "../normalize.js";
import { emit, note, printBanner, readBodyFromFlag, type GlobalFlags } from "../output.js";
import { parseTimeout, resolveActive, writePreamble } from "./entity.js";

// aiSettings ride the normal client entity: GET/PATCH /clients/{id} carry the
// `aiSettings` object (API-NOTES §9). These commands attach under `hs client`.
const CLIENTS_BASE = "/clients";
const RESELLER_PORTAL = "ResellerPortal";

/** Attach `ai-settings get|set` and `prompt-lint` under the client entity command. */
export function addAiSettingsCommands(clientRoot: Command): void {
  const group = new Command("ai-settings").description("Read and write a client's AI settings (v3 only; ride /clients/{id}).");

  // ---- ai-settings get <id> -----------------------------------------------
  addGlobalFlags(group.command("get"))
    .argument("<id>", "Client id")
    .description("Fetch a client's aiSettings (GET /clients/{id} → .aiSettings).")
    .addHelpText("after", "\nExample:\n  hs client ai-settings get <id> --out ai.json\n")
    .action(async (id: string, _opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { resolved } = requireV3(globals, `${id} ai-settings get`);
      const clientPath = `${CLIENTS_BASE}/${encodeURIComponent(id)}`;
      if (globals.dryRun) {
        emit({ dryRun: true, method: "GET", path: clientPath, tenant: { alias: resolved.alias, apiVersion: "v3" } }, globals);
        return;
      }
      printBanner(resolved, globals);
      const client = await fetchClient(id, globals);
      const aiSettings = extractAiSettings(client);
      if (aiSettings === undefined) {
        throw new CliError(EXIT.NOT_FOUND, `Client "${id}" has no aiSettings on ${resolved.alias}.`);
      }
      warnIfResellerPortal(aiSettings);
      emit(aiSettings, globals);
    });

  // ---- ai-settings set <id> -f settings.json ------------------------------
  addGlobalFlags(group.command("set"))
    .argument("<id>", "Client id")
    .description("Patch a client's aiSettings (PATCH /clients/{id} { aiSettings }). Body is the aiSettings object.")
    .requiredOption("-f, --file <path>", "aiSettings JSON object (use - for stdin)")
    .addHelpText(
      "after",
      "\nExample:\n  hs client ai-settings set <id> -f ai.json --dry-run   # preview first\n\n" +
        "Safety:\n  Single write — banner + recent-switch note. If the client's configSource is ResellerPortal, local " +
        "edits are IGNORED server-side (config is redirected to the reseller portal); the command warns loudly.\n",
    )
    .action(async (id: string, opts: { file: string }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { cfg, resolved } = requireV3(globals, `${id} ai-settings set`);
      const aiSettings = asObject(readBodyFromFlag(opts.file));
      const clientPath = `${CLIENTS_BASE}/${encodeURIComponent(id)}`;
      const body = { aiSettings };

      if (globals.dryRun) {
        emit({ dryRun: true, method: "PATCH", path: clientPath, body, tenant: { alias: resolved.alias, apiVersion: "v3" } }, globals);
        return;
      }

      // Check the CURRENT configSource so we can warn before writing pointlessly.
      const current = extractAiSettings(await fetchClient(id, globals).catch(() => undefined));
      const currentSource = current ? (current as Record<string, unknown>).configSource : undefined;
      if (currentSource === RESELLER_PORTAL || aiSettings.configSource === RESELLER_PORTAL) {
        note(
          "WARNING: this client's AI config is ResellerPortal-managed — HostedSuite ignores local aiSettings edits " +
            "(they are redirected to the reseller portal). This write will have NO effect on live AI behavior.",
        );
      }

      writePreamble(cfg, resolved, globals);
      const res = await request(resolved.profile, {
        method: "PATCH",
        path: clientPath,
        body,
        retry: false,
        timeoutMs: parseTimeout(globals),
      });
      setLastWriteTenant(resolved.alias);
      emit(normalizeResponse(res.data, "v3", !!globals.raw), globals);
    });

  clientRoot.addCommand(group);

  // ---- prompt-lint <id> ---------------------------------------------------
  addGlobalFlags(clientRoot.command("prompt-lint"))
    .argument("<id>", "Client id")
    .description("Flag unresolved {{SNIPPET ...}} markers in a client's AI prompt fields (v3 only).")
    .addHelpText(
      "after",
      "\nExample:\n  hs client prompt-lint <id>\n\n" +
        "Note:\n  {{SNIPPET ...}} markers fail silently server-side when unresolved. This lists every marker found " +
        "in the client's aiSettings for review; it cannot itself resolve them.\n",
    )
    .action(async (id: string, _opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const { resolved } = requireV3(globals, `${id} prompt-lint`);
      if (globals.dryRun) {
        emit({ dryRun: true, method: "GET", path: `${CLIENTS_BASE}/${encodeURIComponent(id)}`, tenant: { alias: resolved.alias, apiVersion: "v3" } }, globals);
        return;
      }
      printBanner(resolved, globals);
      const aiSettings = extractAiSettings(await fetchClient(id, globals));
      if (aiSettings === undefined) {
        throw new CliError(EXIT.NOT_FOUND, `Client "${id}" has no aiSettings on ${resolved.alias}.`);
      }
      const findings = lintSnippets(aiSettings);
      const configSource = (aiSettings as Record<string, unknown>).configSource;
      warnIfResellerPortal(aiSettings);
      emit({ clientId: id, configSource, snippetMarkers: findings, count: findings.length }, globals);
    });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireV3(globals: GlobalFlags, action: string): ReturnType<typeof resolveActive> {
  const ctx = resolveActive(globals);
  if (ctx.resolved.profile.apiVersion !== "v3") {
    throw new CliError(
      EXIT.NOT_IMPLEMENTED,
      `'client ${action}' requires a v3 tenant; ${ctx.resolved.alias} runs the v2 API (AI settings are a v3 feature).`,
    );
  }
  return ctx;
}

async function fetchClient(id: string, globals: GlobalFlags): Promise<unknown> {
  const { resolved } = resolveActive(globals);
  const res = await request(resolved.profile, {
    method: "GET",
    path: `${CLIENTS_BASE}/${encodeURIComponent(id)}`,
    retry: true,
    timeoutMs: parseTimeout(globals),
  });
  return normalizeResponse(res.data, "v3", false);
}

function extractAiSettings(client: unknown): unknown {
  if (client && typeof client === "object" && "aiSettings" in client) {
    return (client as { aiSettings?: unknown }).aiSettings;
  }
  return undefined;
}

function warnIfResellerPortal(aiSettings: unknown): void {
  if (aiSettings && typeof aiSettings === "object" && (aiSettings as Record<string, unknown>).configSource === RESELLER_PORTAL) {
    note(
      "NOTE: configSource is ResellerPortal — HostedSuite ignores local aiSettings edits for this client " +
        "(AI config is managed in the reseller portal).",
    );
  }
}

function asObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new CliError(EXIT.USAGE, "aiSettings body must be a JSON object.");
  }
  return body as Record<string, unknown>;
}

interface SnippetFinding {
  path: string;
  marker: string;
}

const SNIPPET_RE = /\{\{\s*SNIPPET[\s\S]*?\}\}\}?/gi;

/** Walk every string in aiSettings and collect {{SNIPPET ...}} markers with their field path. */
function lintSnippets(value: unknown, at = "", out: SnippetFinding[] = []): SnippetFinding[] {
  if (typeof value === "string") {
    const matches = value.match(SNIPPET_RE);
    if (matches) for (const m of matches) out.push({ path: at || "(root)", marker: m.trim() });
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => lintSnippets(v, `${at}[${i}]`, out));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      lintSnippets(v, at ? `${at}.${k}` : k, out);
    }
  }
  return out;
}

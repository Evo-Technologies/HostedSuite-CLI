import { Command } from "commander";

import { DEFAULT_CACHE_WARN_MB } from "../cache.js";
import { loadConfig, saveConfig, type Settings } from "../config.js";
import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { emit, type GlobalFlags } from "../output.js";

// ===========================================================================
// `hs config` — read/write persisted CLI settings (cfg.settings). Does NOT call
// resolveActiveTenant, so it is naturally exempt from strict "require-tenant"
// mode (you must be able to turn strict mode off without a tenant selected).
// ===========================================================================

/** CLI setting keys (kebab-case) mapped to their camelCase field + type on cfg.settings. */
const SETTING_KEYS: Record<string, { field: keyof Settings; kind: "bool" | "number" }> = {
  "require-tenant": { field: "requireTenant", kind: "bool" },
  "cache-warn-mb": { field: "cacheWarnMb", kind: "number" },
};

function knownKeys(): string {
  return Object.keys(SETTING_KEYS).join(", ");
}

function resolveKey(key: string): { field: keyof Settings; kind: "bool" | "number" } {
  const def = SETTING_KEYS[key];
  if (!def) {
    throw new CliError(EXIT.USAGE, `Unknown config key "${key}". Known keys: ${knownKeys()}.`);
  }
  return def;
}

/** Parse a setting value by its declared kind. */
function parseValue(kind: "bool" | "number", raw: string): boolean | number {
  if (kind === "bool") {
    const v = raw.trim().toLowerCase();
    if (v === "true" || v === "1") return true;
    if (v === "false" || v === "0") return false;
    throw new CliError(EXIT.USAGE, `Expected a boolean (true/false/1/0) for this setting; got "${raw}".`);
  }
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < 0) {
    throw new CliError(EXIT.USAGE, `Expected a non-negative number for this setting; got "${raw}".`);
  }
  return n;
}

/** Present the current settings as a kebab-case JSON object with defaults filled in. */
function settingsView(settings: Settings | undefined): Record<string, unknown> {
  const s = settings ?? {};
  return {
    "require-tenant": s.requireTenant === true,
    "cache-warn-mb": s.cacheWarnMb ?? DEFAULT_CACHE_WARN_MB,
  };
}

export function buildConfigCommand(): Command {
  const root = new Command("config").description(
    "Read/write persisted CLI settings (e.g. strict require-tenant mode). Does not target a tenant.",
  );

  // --- list ----------------------------------------------------------------
  addGlobalFlags(root.command("list"))
    .description("Print all settings as JSON.")
    .action((_opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const cfg = loadConfig();
      emit(settingsView(cfg.settings), globals);
    });

  // --- get <key> -----------------------------------------------------------
  addGlobalFlags(root.command("get"))
    .argument("<key>", `Setting key (${knownKeys()})`)
    .description("Print one setting's value as JSON.")
    .action((key: string, _opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      resolveKey(key); // validate the key
      const cfg = loadConfig();
      emit({ [key]: settingsView(cfg.settings)[key] }, globals);
    });

  // --- set <key> <value> ---------------------------------------------------
  addGlobalFlags(root.command("set"))
    .argument("<key>", `Setting key (${knownKeys()})`)
    .argument("<value>", "New value (bool keys: true/false/1/0; number keys: a non-negative number)")
    .description("Set one setting and persist it.")
    .addHelpText(
      "after",
      "\nExamples:\n  hs config set require-tenant true    # refuse the ambient active tenant; force --tenant/HS_TENANT\n" +
        "  hs config set cache-warn-mb 100      # warn when ~/.cache/hostedsuite exceeds 100 MB (0 disables)\n",
    )
    .action((key: string, value: string, _opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const def = resolveKey(key);
      const parsed = parseValue(def.kind, value);
      const cfg = loadConfig();
      cfg.settings = { ...cfg.settings, [def.field]: parsed };
      saveConfig(cfg);
      emit({ [key]: parsed }, globals);
    });

  return root;
}

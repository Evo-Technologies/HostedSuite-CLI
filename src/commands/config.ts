import { Command } from "commander";

import { loadConfig, saveConfig, type Settings } from "../config.js";
import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { emit, type GlobalFlags } from "../output.js";

// ===========================================================================
// `hs config` — read/write persisted CLI settings (cfg.settings). Does NOT call
// resolveActiveTenant, so it is naturally exempt from strict "require-tenant"
// mode (you must be able to turn strict mode off without a tenant selected).
// ===========================================================================

/** CLI setting keys (kebab-case) mapped to their camelCase field on cfg.settings. */
const SETTING_KEYS: Record<string, keyof Settings> = {
  "require-tenant": "requireTenant",
};

function knownKeys(): string {
  return Object.keys(SETTING_KEYS).join(", ");
}

function resolveKey(key: string): keyof Settings {
  const field = SETTING_KEYS[key];
  if (!field) {
    throw new CliError(EXIT.USAGE, `Unknown config key "${key}". Known keys: ${knownKeys()}.`);
  }
  return field;
}

/** Parse a boolean setting value: true/false/1/0 (case-insensitive). */
function parseBool(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  throw new CliError(EXIT.USAGE, `Expected a boolean (true/false/1/0) for this setting; got "${raw}".`);
}

/** Present the current settings as a kebab-case JSON object with defaults filled in. */
function settingsView(settings: Settings | undefined): Record<string, unknown> {
  const s = settings ?? {};
  return { "require-tenant": s.requireTenant === true };
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
      const field = resolveKey(key);
      const cfg = loadConfig();
      const value = cfg.settings?.[field] === true;
      emit({ [key]: value }, globals);
    });

  // --- set <key> <value> ---------------------------------------------------
  addGlobalFlags(root.command("set"))
    .argument("<key>", `Setting key (${knownKeys()})`)
    .argument("<value>", "New value (bool keys: true/false/1/0)")
    .description("Set one setting and persist it.")
    .addHelpText(
      "after",
      "\nExample:\n  hs config set require-tenant true    # refuse the ambient active tenant; force --tenant/HS_TENANT\n",
    )
    .action((key: string, value: string, _opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const field = resolveKey(key);
      const parsed = parseBool(value);
      const cfg = loadConfig();
      cfg.settings = { ...cfg.settings, [field]: parsed };
      saveConfig(cfg);
      emit({ [key]: parsed }, globals);
    });

  return root;
}

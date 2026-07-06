import { Command, Option } from "commander";

/**
 * Commander only matches options at the level they are declared. To let users
 * type `hs <cmd> --json --out path`, every leaf command has to repeat the
 * global flag set. Calling this on a subcommand keeps that ergonomic without
 * forcing parent-first ordering.
 */
export function addGlobalFlags(cmd: Command): Command {
  for (const opt of GLOBAL_OPTIONS) cmd.addOption(opt());
  return cmd;
}

const GLOBAL_OPTIONS: (() => Option)[] = [
  () => new Option("-j, --json", "Force JSON output (default when stdout is piped)"),
  () => new Option("-p, --plain", "Tab-separated output (top-level scalars only)"),
  () => new Option("--select <fields>", "Comma-separated list of top-level fields to keep"),
  () => new Option("--fields <fields>", "Alias for --select").hideHelp(),
  () => new Option("--out <path>", 'Write JSON to <path>; print {"path":...} to stdout'),
  () => new Option("-n, --dry-run", "Print the planned request and exit without calling the API"),
  () => new Option("--no-input", "Never prompt; fail if input is required"),
  () => new Option("--force", "Skip single-write confirmation (does NOT bypass the bulk gate)"),
  () => new Option("--yes", "Alias for --force").hideHelp(),
  () => new Option("-v, --verbose", "Verbose progress to stderr"),
  () => new Option("--quiet", "Suppress the tenant banner on stderr (safety notes still print)"),
  () => new Option("--raw", "Disable casing/envelope normalization (credential redaction still applies)"),
  () => new Option("--tenant <alias>", "Override the active tenant for this single call"),
  () => new Option("--timeout <ms>", "Request timeout in milliseconds (default 30000)"),
];

/** Normalize alias flags in a preAction hook on the root command. */
export function normalizeAliases(_thisCmd: Command, actionCmd: Command): void {
  const o = actionCmd.opts() as Record<string, unknown>;
  if (o.fields && !o.select) actionCmd.setOptionValueWithSource("select", o.fields, "cli");
  if (o.yes && !o.force) actionCmd.setOptionValueWithSource("force", true, "cli");
}

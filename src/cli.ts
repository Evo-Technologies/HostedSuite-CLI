import { Command } from "commander";

import { addAiSettingsCommands } from "./commands/ai-settings.js";
import { buildApiCommand } from "./commands/api.js";
import { buildAuthCommand, buildWhoamiCommand } from "./commands/auth.js";
import { addBulkCommands } from "./commands/bulk.js";
import { buildConfirmCommand } from "./commands/confirm.js";
import { buildEntityCommand } from "./commands/entity.js";
import { buildFileCommand } from "./commands/file.js";
import { buildReportCommand } from "./commands/report.js";
import { buildTenantCommand } from "./commands/tenant.js";
import { ENTITIES } from "./entities.js";
import { CliError, EXIT, EXIT_DESCRIPTIONS } from "./exit-codes.js";
import { addGlobalFlags, normalizeAliases } from "./global-flags.js";
import { emit, type GlobalFlags } from "./output.js";
import { findSubcommand, serializeCommand } from "./schema.js";

const VERSION = "0.1.0";

function buildProgram(): Command {
  const program = new Command();

  program
    .name("hs")
    .description(
      "CLI for HostedSuite tenants (host-agnostic — add tenants with `hs tenant add`). " +
        "Reads run freely; bulk writes are two-phase (exit 11 → `hs confirm <token>`). Every tenant is production.",
    )
    .version(VERSION)
    .showHelpAfterError();

  program.hook("preAction", normalizeAliases);

  // ---- command groups -----------------------------------------------------
  program.addCommand(buildTenantCommand());  // tenant list|add|use|current|show|remove|probe
  program.addCommand(buildWhoamiCommand());  // top-level `hs whoami` shortcut
  program.addCommand(buildAuthCommand());    // auth whoami | check
  program.addCommand(buildConfirmCommand()); // confirm <token>
  program.addCommand(buildApiCommand());     // raw escape hatch: hs api <method> <path>
  program.addCommand(buildReportCommand());  // report list | run <name>
  program.addCommand(buildFileCommand());    // file get | upload
  for (const def of ENTITIES) {
    const cmd = buildEntityCommand(def);       // <entity> list|get|create|patch|delete
    addBulkCommands(cmd, def);                 // + bulk-patch|bulk-archive|bulk-restore (writable only)
    if (def.noun === "client") addAiSettingsCommands(cmd); // + ai-settings get|set, prompt-lint
    program.addCommand(cmd);
  }
  // ------------------------------------------------------------------------

  addGlobalFlags(program.command("schema [path...]"))
    .description("Print the CLI command tree as JSON. Optional path narrows to a subcommand.")
    .action((parts: string[], _opts, command: Command) => {
      const globals = command.opts<GlobalFlags>();
      const target = parts.length === 0 ? program : findSubcommand(program, parts);
      if (!target) throw new CliError(EXIT.NOT_FOUND, `No such command: ${parts.join(" ")}`);
      emit(serializeCommand(target), globals);
    });

  addGlobalFlags(program.command("exit-codes"))
    .description("Print the CLI exit-code map as JSON.")
    .action((_opts, command: Command) => {
      const globals = command.opts<GlobalFlags>();
      const map: Record<string, { code: number; description: string }> = {};
      for (const [k, v] of Object.entries(EXIT)) {
        map[k] = { code: v, description: EXIT_DESCRIPTIONS[v] };
      }
      emit(map, globals);
    });

  return program;
}

export async function main(argv: string[]): Promise<void> {
  const program = buildProgram();
  await program.parseAsync(argv);
}

export function handleError(err: unknown): never {
  if (err instanceof CliError) {
    if (err.message && err.message.length > 0) process.stderr.write(`${err.message}\n`);
    process.exit(err.code);
  }
  if (err && typeof err === "object" && "code" in err && (err as { code?: unknown }).code === "commander.help") {
    process.exit(EXIT.OK);
  }
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code?: unknown }).code;
    if (typeof code === "string" && code.startsWith("commander.")) {
      const msg = (err as { message?: unknown }).message;
      process.stderr.write(`${typeof msg === "string" ? msg : String(err)}\n`);
      process.exit(EXIT.USAGE);
    }
  }
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(EXIT.ERR);
}

main(process.argv).catch(handleError);

export { buildProgram };

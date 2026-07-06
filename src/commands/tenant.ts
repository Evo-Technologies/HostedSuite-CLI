import fs from "node:fs";
import { Command, Option } from "commander";

import {
  loadConfig,
  redactProfile,
  resolveActiveTenant,
  saveConfig,
  setTenant,
  stampTenantChanged,
  type ApiVersion,
  type TenantProfile,
} from "../config.js";
import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { probeVersion } from "../http.js";
import { emit, note, type GlobalFlags } from "../output.js";

interface AddOpts {
  baseUrl?: string;
  customer?: string;
  user?: string;
  password?: string;
  apiVersion?: string;
}

export function buildTenantCommand(): Command {
  const root = new Command("tenant").description("Manage tenant profiles (baseUrl + customer + credentials + API version).");

  // --- list ----------------------------------------------------------------
  addGlobalFlags(root.command("list"))
    .description("List configured tenants (passwords redacted).")
    .action((_opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const cfg = loadConfig();
      const tenants = Object.entries(cfg.tenants).map(([alias, p]) => ({
        alias,
        active: alias === cfg.activeTenant,
        customerName: p.customerName,
        baseUrl: p.baseUrl,
        apiVersion: p.apiVersion,
        userName: p.userName,
      }));
      emit({ activeTenant: cfg.activeTenant ?? null, lastWriteTenant: cfg.lastWriteTenant ?? null, tenants }, globals);
    });

  // --- add -----------------------------------------------------------------
  addGlobalFlags(root.command("add"))
    .argument("<alias>", "Short local name for this tenant, e.g. acme")
    .description("Add a tenant, then probe its API version (unless --api-version is given).")
    .requiredOption("--base-url <url>", "API base URL, e.g. https://acme.example.com/api")
    .requiredOption("--customer <name>", "HostedSuite customer (tenant) name")
    .requiredOption("--user <email>", "User name / email, e.g. user@example.com")
    .option("--password <pw>", "Password (discouraged; use - for stdin or omit to be prompted)")
    .addOption(new Option("--api-version <v>", "Skip the probe and set the version").choices(["v2", "v3"]))
    .addHelpText(
      "after",
      "\nExample:\n  hs tenant add acme --base-url https://acme.example.com/api --customer Acme --user user@example.com\n",
    )
    .action(async (alias: string, opts: AddOpts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags & AddOpts>();
      if (!opts.baseUrl || !opts.customer || !opts.user) {
        throw new CliError(EXIT.USAGE, "add requires --base-url, --customer, and --user.");
      }
      const password = await resolvePasswordInput(opts.password, !!globals.noInput);

      let apiVersion = opts.apiVersion as ApiVersion | undefined;
      if (!apiVersion) {
        note(`Probing ${opts.baseUrl} to detect the API version…`);
        apiVersion = await probeVersion(opts.baseUrl, opts.customer, opts.user, password);
      }

      const profile: TenantProfile = {
        baseUrl: opts.baseUrl,
        customerName: opts.customer,
        apiVersion,
        userName: opts.user,
        password,
        tenantChangedAt: new Date().toISOString(),
      };
      const cfg = loadConfig();
      const next = setTenant(cfg, alias, profile);
      if (!next.activeTenant) next.activeTenant = alias;
      saveConfig(next);

      emit({ added: alias, active: next.activeTenant === alias, ...redactProfile(profile) }, globals);
    });

  // --- use -----------------------------------------------------------------
  addGlobalFlags(root.command("use"))
    .argument("<alias>", "Tenant to make active")
    .description("Switch the active tenant (stamps tenantChangedAt for the recent-switch guard).")
    .action((alias: string, _opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const cfg = loadConfig();
      if (!cfg.tenants[alias]) throw new CliError(EXIT.CONFIG, `Unknown tenant "${alias}". Run \`hs tenant list\`.`);
      cfg.activeTenant = alias;
      saveConfig(cfg);
      stampTenantChanged(alias);
      emit({ activeTenant: alias }, globals);
    });

  // --- current -------------------------------------------------------------
  addGlobalFlags(root.command("current"))
    .description("Print the active tenant alias.")
    .action((_opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const cfg = loadConfig();
      emit({ activeTenant: cfg.activeTenant ?? null }, globals);
    });

  // --- show ----------------------------------------------------------------
  addGlobalFlags(root.command("show"))
    .argument("[alias]", "Tenant to show (default: active)")
    .description("Show a tenant profile (password redacted).")
    .action((alias: string | undefined, _opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const cfg = loadConfig();
      // Management subcommand: exempt from strict require-tenant mode.
      const { alias: resolvedAlias, profile } = resolveActiveTenant(cfg, alias, { allowAmbient: true });
      emit({ alias: resolvedAlias, active: resolvedAlias === cfg.activeTenant, ...redactProfile(profile) }, globals);
    });

  // --- remove --------------------------------------------------------------
  addGlobalFlags(root.command("remove"))
    .argument("<alias>", "Tenant to remove")
    .description("Delete a tenant profile from the config.")
    .action((alias: string, _opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const cfg = loadConfig();
      if (!cfg.tenants[alias]) throw new CliError(EXIT.CONFIG, `Unknown tenant "${alias}".`);
      delete cfg.tenants[alias];
      if (cfg.activeTenant === alias) cfg.activeTenant = undefined;
      if (cfg.lastWriteTenant === alias) cfg.lastWriteTenant = undefined;
      saveConfig(cfg);
      emit({ removed: alias, activeTenant: cfg.activeTenant ?? null }, globals);
    });

  // --- probe ---------------------------------------------------------------
  addGlobalFlags(root.command("probe"))
    .argument("[alias]", "Tenant to probe (default: active)")
    .description("Re-detect a tenant's API version and persist it.")
    .action(async (alias: string | undefined, _opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const cfg = loadConfig();
      // Management subcommand: exempt from strict require-tenant mode.
      const { alias: resolvedAlias, profile } = resolveActiveTenant(cfg, alias, { allowAmbient: true });
      const { resolvePassword } = await import("../config.js");
      const password = resolvePassword(profile);
      if (!password) {
        throw new CliError(EXIT.AUTH, `No password for "${resolvedAlias}". Set HS_PASSWORD or re-run \`hs tenant add\`.`);
      }
      const apiVersion = await probeVersion(profile.baseUrl, profile.customerName, profile.userName, password);
      profile.apiVersion = apiVersion;
      saveConfig(cfg);
      emit({ alias: resolvedAlias, apiVersion }, globals);
    });

  return root;
}

// ---------------------------------------------------------------------------
// Password input (flag → HS_PASSWORD → prompt; --no-input errors)
// ---------------------------------------------------------------------------

async function resolvePasswordInput(flag: string | undefined, noInput: boolean): Promise<string> {
  if (flag === "-") {
    const buf = fs.readFileSync(0, "utf8").trim();
    if (buf.length === 0) throw new CliError(EXIT.USAGE, "Empty password on stdin.");
    return buf;
  }
  if (flag && flag.length > 0) return flag;
  const env = process.env.HS_PASSWORD;
  if (env && env.length > 0) return env;
  if (noInput) throw new CliError(EXIT.USAGE, "No --password provided and --no-input set.");
  if (!process.stdin.isTTY) {
    throw new CliError(EXIT.USAGE, "No --password provided; stdin is not a TTY for prompting.");
  }
  return promptHidden("Password: ");
}

function promptHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stderr.write(prompt);
    const stdin = process.stdin;
    const origRaw = stdin.isRaw ?? false;
    if (typeof stdin.setRawMode === "function") stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let buf = "";
    const onData = (ch: string): void => {
      for (const c of ch) {
        if (c === "\r" || c === "\n") {
          stdin.removeListener("data", onData);
          if (typeof stdin.setRawMode === "function") stdin.setRawMode(origRaw);
          stdin.pause();
          process.stderr.write("\n");
          resolve(buf);
          return;
        } else if (c === "") {
          process.exit(EXIT.USAGE);
        } else if (c === "" || c === "\b") {
          buf = buf.slice(0, -1);
        } else {
          buf += c;
        }
      }
    };
    stdin.on("data", onData);
  });
}

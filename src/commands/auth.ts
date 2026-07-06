import { Command } from "commander";

import { redactProfile } from "../config.js";
import { addGlobalFlags } from "../global-flags.js";
import { authCheck } from "../http.js";
import { normalizeResponse } from "../normalize.js";
import { emit, printBanner, type GlobalFlags } from "../output.js";
import { resolveActive } from "./entity.js";

/**
 * Fetch the authenticated identity for the active tenant.
 * v3: GET /auth/info. v2: POST /authenticate. Both normalized + redacted.
 */
async function whoamiPayload(globals: GlobalFlags): Promise<{ tenant: unknown; auth: unknown }> {
  const { resolved } = resolveActive(globals);
  printBanner(resolved, globals);
  const res = await authCheck(resolved.profile);
  const auth = normalizeResponse(res.data, resolved.profile.apiVersion, !!globals.raw);
  return {
    tenant: { alias: resolved.alias, ...redactProfile(resolved.profile) },
    auth,
  };
}

function isAuthenticated(auth: unknown): boolean {
  if (!auth || typeof auth !== "object") return false;
  const a = auth as Record<string, unknown>;
  // v3: { isAuthenticated }; v2 UserInfo: { authenticated }.
  if (typeof a.isAuthenticated === "boolean") return a.isAuthenticated;
  if (typeof a.authenticated === "boolean") return a.authenticated;
  // v2 returning any well-formed UserInfo object counts as authenticated.
  return Object.keys(a).length > 0;
}

/** The `hs whoami` leaf action, reused as a top-level shortcut and under `hs auth`. */
export function buildWhoamiCommand(name = "whoami"): Command {
  return addGlobalFlags(new Command(name))
    .description("Show the active tenant + authenticated user (v3 /auth/info, v2 /authenticate). Run before writes.")
    .action(async (_opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const payload = await whoamiPayload(globals);
      emit(payload, globals);
    });
}

export function buildAuthCommand(): Command {
  const root = new Command("auth").description("Verify credentials against the active tenant.");

  root.addCommand(buildWhoamiCommand("whoami"));

  addGlobalFlags(root.command("check"))
    .description("Boolean-ish credential check; exits 4 (AUTH) when not authenticated.")
    .action(async (_opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const payload = await whoamiPayload(globals);
      const ok = isAuthenticated(payload.auth);
      emit({ tenant: payload.tenant, authenticated: ok }, globals);
      if (!ok) {
        const { EXIT } = await import("../exit-codes.js");
        process.exit(EXIT.AUTH);
      }
    });

  return root;
}

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { CliError, EXIT } from "./exit-codes.js";

export type ApiVersion = "v2" | "v3";

export interface TenantProfile {
  baseUrl: string;
  customerName: string;
  apiVersion: ApiVersion;
  userName: string;
  /** Stored per-tenant because v2 requires the password on every call. Redacted from all output. */
  password?: string;
  tenantChangedAt?: string;
}

export interface ConfigFile {
  activeTenant?: string;
  lastWriteTenant?: string;
  tenants: Record<string, TenantProfile>;
}

export interface ResolvedTenant {
  alias: string;
  profile: TenantProfile;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

export function configDir(): string {
  if (process.env.HOSTEDSUITE_CONFIG_DIR) return process.env.HOSTEDSUITE_CONFIG_DIR;
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg && xdg.length > 0 ? xdg : path.join(os.homedir(), ".config");
  return path.join(base, "hostedsuite");
}

export function cacheDir(): string {
  if (process.env.HOSTEDSUITE_CACHE_DIR) return process.env.HOSTEDSUITE_CACHE_DIR;
  const xdg = process.env.XDG_CACHE_HOME;
  const base = xdg && xdg.length > 0 ? xdg : path.join(os.homedir(), ".cache");
  return path.join(base, "hostedsuite");
}

export function configPath(): string {
  return path.join(configDir(), "config.json");
}

export function plansDir(): string {
  return path.join(cacheDir(), "plans");
}

// ---------------------------------------------------------------------------
// Load / save
// ---------------------------------------------------------------------------

function blankConfig(): ConfigFile {
  return { tenants: {} };
}

export function loadConfig(): ConfigFile {
  const file = configPath();
  if (!fs.existsSync(file)) return blankConfig();
  try {
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as Partial<ConfigFile>;
    if (!parsed.tenants || typeof parsed.tenants !== "object") return blankConfig();
    return { ...blankConfig(), ...parsed } as ConfigFile;
  } catch (err) {
    throw new CliError(EXIT.CONFIG, `Failed to read ${file}: ${(err as Error).message}`);
  }
}

export function saveConfig(cfg: ConfigFile): string {
  const dir = configDir();
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = configPath();
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  try { fs.chmodSync(file, 0o600); } catch { /* Windows: falls back to profile ACL */ }
  return file;
}

// ---------------------------------------------------------------------------
// Tenant resolution
// ---------------------------------------------------------------------------

export function getTenant(cfg: ConfigFile, alias: string): TenantProfile | undefined {
  return cfg.tenants[alias];
}

/**
 * Resolve the tenant a command should target: an explicit `--tenant` override
 * wins, else the config's activeTenant. Throws EXIT.CONFIG when nothing resolves.
 */
export function resolveActiveTenant(cfg: ConfigFile, override?: string): ResolvedTenant {
  const alias = override ?? cfg.activeTenant;
  if (!alias) {
    throw new CliError(
      EXIT.CONFIG,
      "No active tenant. Add one with `hs tenant add <alias> --base-url <url> --customer <name> --user <email>` then `hs tenant use <alias>`.",
    );
  }
  const profile = cfg.tenants[alias];
  if (!profile) {
    throw new CliError(EXIT.CONFIG, `Unknown tenant "${alias}". Run \`hs tenant list\` to see configured tenants.`);
  }
  return { alias, profile };
}

/** Upsert a tenant profile. Pure: returns a new ConfigFile; caller saves. */
export function setTenant(cfg: ConfigFile, alias: string, profile: TenantProfile): ConfigFile {
  return { ...cfg, tenants: { ...cfg.tenants, [alias]: profile } };
}

/** Stamp a tenant's `tenantChangedAt` to now (called by `tenant use` and `tenant add`). Loads+saves. */
export function stampTenantChanged(alias: string): void {
  const cfg = loadConfig();
  const profile = cfg.tenants[alias];
  if (!profile) throw new CliError(EXIT.CONFIG, `Unknown tenant "${alias}".`);
  profile.tenantChangedAt = new Date().toISOString();
  saveConfig(cfg);
}

/** Record the alias of the tenant that received the most recent write. Loads+saves. */
export function setLastWriteTenant(alias: string): void {
  const cfg = loadConfig();
  cfg.lastWriteTenant = alias;
  saveConfig(cfg);
}

// ---------------------------------------------------------------------------
// Recent-switch detection (PLAN §3.3)
// ---------------------------------------------------------------------------

/**
 * True when a write targeting `targetAlias` should raise the recent-switch
 * warning: the target differs from the tenant of the most recent write (which
 * is undefined on the first write of a session). This single condition already
 * covers every pivot path — `tenant use`, `tenant add`, and a per-call
 * `--tenant` override all make target !== lastWriteTenant on the next write.
 * We intentionally do NOT also fire on "added within N minutes": that produced
 * false positives (a self-contradictory "v3 → v3" note) on every write during
 * continuous work on one tenant, which trains users to ignore the warning.
 */
export function recentTenantSwitch(cfg: ConfigFile, targetAlias: string): boolean {
  return cfg.lastWriteTenant !== targetAlias;
}

// ---------------------------------------------------------------------------
// Password resolution + redaction
// ---------------------------------------------------------------------------

/**
 * Password precedence: `--password` flag → `HS_PASSWORD` env → stored profile
 * value → undefined (caller must prompt, or fail under `--no-input`).
 */
export function resolvePassword(profile: TenantProfile, flagPassword?: string): string | undefined {
  if (flagPassword && flagPassword.length > 0) return flagPassword;
  const env = process.env.HS_PASSWORD;
  if (env && env.length > 0) return env;
  if (profile.password && profile.password.length > 0) return profile.password;
  return undefined;
}

/** Return a copy of a profile with the password redacted, safe for output/logging. */
export function redactProfile(profile: TenantProfile): TenantProfile {
  return { ...profile, password: profile.password ? "***" : undefined };
}

// ---------------------------------------------------------------------------
// Bulk plan store (PLAN §6). Plans live under cacheDir()/plans/<token>/.
// ---------------------------------------------------------------------------

export const PLAN_TTL_MS = 5 * 60_000;

export interface PlanTenant {
  alias: string;
  baseUrl: string;
  customerName: string;
  apiVersion: ApiVersion;
}

export interface PlanRequest {
  method: string;
  path: string;
  query?: Record<string, string | number | string[]>;
  body?: unknown;
}

/** A fully-resolved bulk plan. Contains NO credentials — they are injected at execute time. */
export interface BulkPlan {
  token: string;
  createdAt: string;
  expiresAt: string;
  tenant: PlanTenant;
  action: string;
  summary: string;
  recentTenantSwitch: boolean;
  requests: PlanRequest[];
}

function planDir(token: string): string {
  return path.join(plansDir(), token);
}

function planFilePath(token: string): string {
  return path.join(planDir(token), "plan.json");
}

/** Absolute path to a per-plan artifact (preview.json, progress.json, failures.json). */
export function planArtifactPath(token: string, name: string): string {
  return path.resolve(path.join(planDir(token), name));
}

/** Persist a plan under a fresh token directory (mode 600). Returns the absolute plan.json path. */
export function writePlan(token: string, plan: BulkPlan): string {
  const dir = planDir(token);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = planFilePath(token);
  fs.writeFileSync(file, JSON.stringify(plan, null, 2), { mode: 0o600 });
  try { fs.chmodSync(file, 0o600); } catch { /* Windows */ }
  return path.resolve(file);
}

/** Read a plan, validating existence, consumption, and TTL. Throws EXIT.AUTH otherwise. */
export function readPlan(token: string): BulkPlan {
  const file = planFilePath(token);
  if (!fs.existsSync(file)) {
    if (fs.existsSync(`${planDir(token)}.consumed`)) {
      throw new CliError(EXIT.AUTH, `Plan token "${token}" already consumed. Re-run phase 1 for a fresh token.`);
    }
    throw new CliError(EXIT.AUTH, `Unknown plan token "${token}". Re-run phase 1 for a fresh token.`);
  }
  let plan: BulkPlan;
  try {
    plan = JSON.parse(fs.readFileSync(file, "utf8")) as BulkPlan;
  } catch (err) {
    throw new CliError(EXIT.AUTH, `Corrupt plan "${token}": ${(err as Error).message}. Re-run phase 1.`);
  }
  if (new Date(plan.expiresAt).getTime() < Date.now()) {
    throw new CliError(EXIT.AUTH, `Plan token "${token}" expired. Re-run phase 1 for a fresh token.`);
  }
  return plan;
}

/**
 * Atomically claim a plan for execution: rename plans/<token>/ →
 * plans/<token>.consumed/ BEFORE returning it. A second concurrent caller
 * loses the rename race and gets EXIT.AUTH "already consumed".
 */
export function consumePlanAtomically(token: string): BulkPlan {
  const plan = readPlan(token); // validates existence + TTL + not-yet-consumed
  const src = planDir(token);
  const dst = `${src}.consumed`;
  try {
    fs.renameSync(src, dst);
  } catch {
    throw new CliError(EXIT.AUTH, `Plan token "${token}" already consumed. Re-run phase 1 for a fresh token.`);
  }
  return plan;
}

import fs from "node:fs";
import path from "node:path";

import { CliError, EXIT } from "./exit-codes.js";
import type { ResolvedTenant } from "./config.js";

export interface GlobalFlags {
  json?: boolean;
  plain?: boolean;
  select?: string;
  out?: string;
  dryRun?: boolean;
  noInput?: boolean;
  force?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  raw?: boolean;
  tenant?: string;
  timeout?: string;
}

export interface EmitContext extends GlobalFlags {
  emptyExit?: boolean;
}

export function emit(data: unknown, ctx: EmitContext = {}): void {
  if (ctx.emptyExit && isEmptyResult(data)) {
    if (ctx.out) writeOut(ctx.out, data);
    process.exit(EXIT.EMPTY);
  }

  const projected = ctx.select ? project(data, ctx.select) : data;

  if (ctx.out) {
    const resolved = writeOut(ctx.out, projected);
    process.stdout.write(`${JSON.stringify({ path: resolved })}\n`);
    if (ctx.verbose) process.stderr.write(`wrote ${resolved}\n`);
    return;
  }

  if (ctx.plain) {
    process.stdout.write(toTsv(projected));
    return;
  }

  const isTty = process.stdout.isTTY;
  const json = isTty && !ctx.json ? JSON.stringify(projected, null, 2) : JSON.stringify(projected);
  process.stdout.write(`${json}\n`);
}

function isEmptyResult(data: unknown): boolean {
  if (Array.isArray(data) && data.length === 0) return true;
  if (data && typeof data === "object" && "items" in data && Array.isArray((data as { items: unknown[] }).items)) {
    return (data as { items: unknown[] }).items.length === 0;
  }
  return false;
}

function writeOut(target: string, data: unknown): string {
  const resolved = path.resolve(target);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, JSON.stringify(data, null, 2));
  return resolved;
}

function project(data: unknown, fields: string): unknown {
  const keys = fields.split(",").map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) return data;
  if (Array.isArray(data)) return data.map((item) => pick(item, keys));
  // For list-envelope data, project across .items[] but preserve the wrapper.
  if (data && typeof data === "object" && "items" in data && Array.isArray((data as { items: unknown[] }).items)) {
    const d = data as { items: unknown[] } & Record<string, unknown>;
    return { ...d, items: d.items.map((item) => pick(item, keys)) };
  }
  return pick(data, keys);
}

function pick(item: unknown, keys: string[]): Record<string, unknown> {
  if (item === null || typeof item !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = (item as Record<string, unknown>)[k];
  return out;
}

function toTsv(data: unknown): string {
  let rows: unknown = data;
  if (data && typeof data === "object" && "items" in data && Array.isArray((data as { items: unknown[] }).items)) {
    rows = (data as { items: unknown[] }).items;
  }
  if (Array.isArray(rows)) {
    if (rows.length === 0) return "";
    const headers = collectHeaders(rows);
    const out = rows.map((row) => headers.map((h) => tsvCell(row, h)).join("\t"));
    return `${headers.join("\t")}\n${out.join("\n")}\n`;
  }
  if (rows && typeof rows === "object") {
    const obj = rows as Record<string, unknown>;
    return `${Object.entries(obj)
      .filter(([, v]) => v === null || typeof v !== "object")
      .map(([k, v]) => `${k}\t${formatScalar(v)}`)
      .join("\n")}\n`;
  }
  return `${String(rows)}\n`;
}

function collectHeaders(rows: unknown[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    if (row && typeof row === "object") {
      for (const k of Object.keys(row)) {
        const v = (row as Record<string, unknown>)[k];
        if (v === null || typeof v !== "object") seen.add(k);
      }
    }
  }
  return [...seen];
}

function tsvCell(row: unknown, key: string): string {
  if (!row || typeof row !== "object") return "";
  return formatScalar((row as Record<string, unknown>)[key]);
}

function formatScalar(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.replace(/\t/g, " ").replace(/\n/g, " ");
  return String(v);
}

export function readBodyFromFlag(flag: string): unknown {
  const raw = readRaw(flag);
  if (raw.trim().length === 0) {
    throw new CliError(EXIT.USAGE, "Empty input body");
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new CliError(EXIT.USAGE, `Body is not valid JSON: ${(err as Error).message}`);
  }
}

function readRaw(flag: string): string {
  if (flag === "-") return fs.readFileSync(0, "utf8");
  return fs.readFileSync(flag, "utf8");
}

// ---------------------------------------------------------------------------
// Banner + safety notes (stderr). Every HostedSuite tenant is production, so
// the banner is red-tinted on a TTY. Stdout stays clean for piping.
// ---------------------------------------------------------------------------

const ANSI = {
  red: "[31m",
  yellow: "[33m",
  reset: "[0m",
};

function hostOf(baseUrl: string): string {
  try { return new URL(baseUrl).host; } catch { return baseUrl; }
}

/**
 * Routine tenant banner. Suppressible with `--quiet` (and HOSTEDSUITE_NO_BANNER=1).
 * Format: `[<alias>] customer=<name> · <host> · <v2|v3> · user=<user>`.
 */
export function printBanner(tenant: ResolvedTenant, ctx: GlobalFlags): void {
  if (ctx.quiet) return;
  if (process.env.HOSTEDSUITE_NO_BANNER === "1") return;

  const { alias, profile } = tenant;
  const line =
    `[${alias}] customer=${profile.customerName} · ${hostOf(profile.baseUrl)} · ` +
    `${profile.apiVersion} · user=${profile.userName}`;

  const isTty = !!process.stderr.isTTY;
  process.stderr.write(isTty ? `${ANSI.red}${line}${ANSI.reset}\n` : `${line}\n`);
}

/**
 * Safety note — printed to stderr and NEVER suppressed by `--quiet` (recent-switch
 * warnings, phase-1 instructions). Yellow-tinted on a TTY.
 */
export function note(msg: string): void {
  const isTty = !!process.stderr.isTTY;
  process.stderr.write(isTty ? `${ANSI.yellow}${msg}${ANSI.reset}\n` : `${msg}\n`);
}

/**
 * Suppressible informational banner/line (respects `--quiet`), for non-safety
 * progress the user may want to silence.
 */
export function banner(msg: string, ctx: GlobalFlags): void {
  if (ctx.quiet) return;
  process.stderr.write(`${msg}\n`);
}

/**
 * The recent-switch warning (PLAN §3.3). Always emitted regardless of `--quiet`
 * because it routes the human through a re-verification.
 */
export function recentSwitchNote(from: string | undefined, to: string): void {
  const arrow = from ? `${from} → ${to}` : `→ ${to}`;
  note(`NOTE: this write targets a different tenant than your last write (${arrow}) — re-verify with the user.`);
}

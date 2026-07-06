import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildEntityCommand } from "../src/commands/entity.js";
import { addBulkCommands } from "../src/commands/bulk.js";
import { buildConfirmCommand } from "../src/commands/confirm.js";
import { findEntity } from "../src/entities.js";
import {
  consumePlanAtomically,
  plansDir,
  PLAN_TTL_MS,
  saveConfig,
  writePlan,
  type BulkPlan,
  type ConfigFile,
  type TenantProfile,
} from "../src/config.js";
import { EXIT } from "../src/exit-codes.js";

class ProcessExit extends Error {
  constructor(public readonly code: number) {
    super(`process.exit(${code})`);
  }
}

interface Restorable {
  mockRestore(): void;
}

let tmpRoot: string;
let stdout: string;
let exitSpy: Restorable;
let stdoutSpy: Restorable;
let stderrSpy: Restorable;

function profile(apiVersion: "v2" | "v3" = "v3"): TenantProfile {
  return {
    baseUrl: "https://acme.example.com/api",
    customerName: "acme",
    apiVersion,
    userName: "user@example.com",
    password: "s3cret",
  };
}

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hs-test-"));
  process.env.HOSTEDSUITE_CONFIG_DIR = path.join(tmpRoot, "config");
  process.env.HOSTEDSUITE_CACHE_DIR = path.join(tmpRoot, "cache");
  process.env.HOSTEDSUITE_NO_BANNER = "1";

  const cfg: ConfigFile = { activeTenant: "acme", tenants: { acme: profile("v3") } };
  saveConfig(cfg);

  stdout = "";
  stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(((chunk: unknown) => {
    stdout += String(chunk);
    return true;
  }) as never);
  stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation((() => true) as never);
  exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new ProcessExit(code ?? 0);
  }) as never);
});

afterEach(() => {
  stdoutSpy.mockRestore();
  stderrSpy.mockRestore();
  exitSpy.mockRestore();
  delete process.env.HOSTEDSUITE_CONFIG_DIR;
  delete process.env.HOSTEDSUITE_CACHE_DIR;
  delete process.env.HOSTEDSUITE_NO_BANNER;
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

function bulkCommand() {
  const def = findEntity("client")!;
  const cmd = buildEntityCommand(def);
  addBulkCommands(cmd, def);
  return cmd;
}

describe("bulk gate — ALWAYS two-phase, never executes on first run", () => {
  it("even a single target (count 1) gates: exits 11, writes a plan, prints the phase-1 contract", async () => {
    const cmd = bulkCommand();
    let exitCode: number | undefined;
    try {
      await cmd.parseAsync(["bulk-archive", "--ids", "onlyone"], { from: "user" });
    } catch (err) {
      if (err instanceof ProcessExit) exitCode = err.code;
      else throw err;
    }

    expect(exitCode).toBe(EXIT.CONFIRMATION_REQUIRED);

    const phase1 = JSON.parse(stdout.trim());
    expect(phase1.requiresConfirmation).toBe(true);
    expect(typeof phase1.token).toBe("string");
    expect(phase1.affectedCount).toBe(1);

    // A credential-free plan was persisted under the token.
    const planFile = path.join(plansDir(), phase1.token, "plan.json");
    expect(fs.existsSync(planFile)).toBe(true);
    const onDisk = fs.readFileSync(planFile, "utf8");
    expect(onDisk).not.toMatch(/s3cret/);
    expect(onDisk).not.toMatch(/password/i);
  });

  it("0 matches exits EMPTY (exit 3), creating no token", async () => {
    const cmd = bulkCommand();
    // `--ids ,` resolves to an empty target set after trimming/filtering.
    await expect(cmd.parseAsync(["bulk-archive", "--ids", ","], { from: "user" })).rejects.toMatchObject({
      code: EXIT.EMPTY,
    });
    // No plan directory was created.
    const dir = plansDir();
    const entries = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    expect(entries).toHaveLength(0);
  });
});

describe("confirm — phase 2 guardrails", () => {
  it("rejects --tenant (writes go to the plan's PINNED tenant only)", async () => {
    const cmd = buildConfirmCommand();
    await expect(cmd.parseAsync(["SOMETOKEN", "--tenant", "acme"], { from: "user" })).rejects.toMatchObject({
      code: EXIT.USAGE,
      message: expect.stringContaining("remove --tenant"),
    });
  });

  it("rejects an already-consumed token with EXIT.AUTH before any write", async () => {
    const now = Date.now();
    const plan: BulkPlan = {
      token: "CONSUMEDTOK",
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + PLAN_TTL_MS).toISOString(),
      tenant: { alias: "acme", baseUrl: "https://acme.example.com/api", customerName: "acme", apiVersion: "v3" },
      action: "bulk-archive clients",
      summary: "ARCHIVE 1 clients",
      recentTenantSwitch: false,
      requests: [{ method: "DELETE", path: "/clients/onlyone" }],
    };
    writePlan(plan.token, plan);
    consumePlanAtomically(plan.token); // simulate phase 2 already run

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    try {
      const cmd = buildConfirmCommand();
      await expect(cmd.parseAsync([plan.token], { from: "user" })).rejects.toMatchObject({
        code: EXIT.AUTH,
        message: expect.stringContaining("already consumed"),
      });
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

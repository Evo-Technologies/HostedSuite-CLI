import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  consumePlanAtomically,
  loadConfig,
  PLAN_TTL_MS,
  recentTenantSwitch,
  resolveActiveTenant,
  saveConfig,
  setTenant,
  strictModeOn,
  writePlan,
  type BulkPlan,
  type ConfigFile,
  type TenantProfile,
} from "../src/config.js";
import { buildConfigCommand } from "../src/commands/config.js";
import { EXIT } from "../src/exit-codes.js";

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hs-test-"));
  process.env.HOSTEDSUITE_CONFIG_DIR = path.join(tmpRoot, "config");
  process.env.HOSTEDSUITE_CACHE_DIR = path.join(tmpRoot, "cache");
  // Ensure a clean env for every test (these leak across cases otherwise).
  delete process.env.HS_TENANT;
  delete process.env.HS_REQUIRE_TENANT;
});

afterEach(() => {
  delete process.env.HOSTEDSUITE_CONFIG_DIR;
  delete process.env.HOSTEDSUITE_CACHE_DIR;
  delete process.env.HS_TENANT;
  delete process.env.HS_REQUIRE_TENANT;
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

function profile(overrides: Partial<TenantProfile> = {}): TenantProfile {
  return {
    baseUrl: "https://acme.example.com/api",
    customerName: "acme",
    apiVersion: "v3",
    userName: "user@example.com",
    ...overrides,
  };
}

function seed(...aliases: string[]): ConfigFile {
  let cfg: ConfigFile = { tenants: {} };
  for (const a of aliases) cfg = setTenant(cfg, a, profile());
  return cfg;
}

describe("resolveActiveTenant", () => {
  it("returns the active tenant when no override is given", () => {
    const cfg: ConfigFile = { ...seed("acme"), activeTenant: "acme" };
    const resolved = resolveActiveTenant(cfg);
    expect(resolved.alias).toBe("acme");
    expect(resolved.profile.customerName).toBe("acme");
  });

  it("honours an explicit --tenant override over the active tenant", () => {
    const cfg: ConfigFile = { ...seed("acme", "beta"), activeTenant: "acme" };
    const resolved = resolveActiveTenant(cfg, "beta");
    expect(resolved.alias).toBe("beta");
  });

  it("throws EXIT.CONFIG when nothing resolves (no active, no override)", () => {
    const cfg = seed("acme");
    expect(() => resolveActiveTenant(cfg)).toThrowError(
      expect.objectContaining({ code: EXIT.CONFIG, message: expect.stringContaining("No active tenant") }),
    );
  });

  it("throws EXIT.CONFIG when the alias is unknown", () => {
    const cfg: ConfigFile = { ...seed("acme"), activeTenant: "acme" };
    expect(() => resolveActiveTenant(cfg, "ghost")).toThrowError(
      expect.objectContaining({ code: EXIT.CONFIG, message: expect.stringContaining('Unknown tenant "ghost"') }),
    );
  });
});

describe("resolveActiveTenant — precedence: --tenant > HS_TENANT > active", () => {
  it("a --tenant flag wins over HS_TENANT and the active tenant (not pinned)", () => {
    process.env.HS_TENANT = "beta";
    const cfg: ConfigFile = { ...seed("acme", "beta", "gamma"), activeTenant: "gamma" };
    const resolved = resolveActiveTenant(cfg, "acme");
    expect(resolved.alias).toBe("acme");
    expect(resolved.source).toBe("flag");
    expect(resolved.pinned).toBe(false);
  });

  it("HS_TENANT wins over the active tenant and marks the resolution pinned", () => {
    process.env.HS_TENANT = "beta";
    const cfg: ConfigFile = { ...seed("acme", "beta"), activeTenant: "acme" };
    const resolved = resolveActiveTenant(cfg);
    expect(resolved.alias).toBe("beta");
    expect(resolved.source).toBe("env");
    expect(resolved.pinned).toBe(true);
  });

  it("falls back to the active tenant when no flag and no HS_TENANT (source active, not pinned)", () => {
    const cfg: ConfigFile = { ...seed("acme"), activeTenant: "acme" };
    const resolved = resolveActiveTenant(cfg);
    expect(resolved.alias).toBe("acme");
    expect(resolved.source).toBe("active");
    expect(resolved.pinned).toBe(false);
  });

  it("throws EXIT.CONFIG when HS_TENANT names an alias absent from the config", () => {
    process.env.HS_TENANT = "ghost";
    const cfg: ConfigFile = { ...seed("acme"), activeTenant: "acme" };
    expect(() => resolveActiveTenant(cfg)).toThrowError(
      expect.objectContaining({ code: EXIT.CONFIG, message: expect.stringContaining('HS_TENANT="ghost"') }),
    );
  });
});

describe("resolveActiveTenant — strict require-tenant mode", () => {
  it("strictModeOn reflects config settings and HS_REQUIRE_TENANT", () => {
    expect(strictModeOn({ ...seed("acme") })).toBe(false);
    expect(strictModeOn({ ...seed("acme"), settings: { requireTenant: true } })).toBe(true);
    process.env.HS_REQUIRE_TENANT = "1";
    expect(strictModeOn({ ...seed("acme") })).toBe(true);
  });

  it("defaults to strict once 2+ tenants are configured; single-tenant stays lax", () => {
    delete process.env.HS_REQUIRE_TENANT;
    expect(strictModeOn(seed("acme"))).toBe(false);                 // 1 tenant → unambiguous, not strict
    expect(strictModeOn(seed("acme", "beta"))).toBe(true);          // 2+ tenants → strict by default
    expect(strictModeOn({ ...seed("acme", "beta"), settings: { requireTenant: false } })).toBe(false); // explicit off wins
  });

  it("throws EXIT.USAGE when strict + no --tenant + no HS_TENANT (would fall back to active)", () => {
    const cfg: ConfigFile = { ...seed("acme"), activeTenant: "acme", settings: { requireTenant: true } };
    expect(() => resolveActiveTenant(cfg)).toThrowError(
      expect.objectContaining({ code: EXIT.USAGE, message: expect.stringContaining("Strict mode is on") }),
    );
  });

  it("passes in strict mode when a --tenant flag is given", () => {
    const cfg: ConfigFile = { ...seed("acme"), activeTenant: "acme", settings: { requireTenant: true } };
    expect(resolveActiveTenant(cfg, "acme").alias).toBe("acme");
  });

  it("passes in strict mode when HS_TENANT is set", () => {
    process.env.HS_TENANT = "acme";
    const cfg: ConfigFile = { ...seed("acme"), activeTenant: "acme", settings: { requireTenant: true } };
    const resolved = resolveActiveTenant(cfg);
    expect(resolved.alias).toBe("acme");
    expect(resolved.pinned).toBe(true);
  });

  it("HS_REQUIRE_TENANT=1 also triggers strict mode", () => {
    process.env.HS_REQUIRE_TENANT = "1";
    const cfg: ConfigFile = { ...seed("acme"), activeTenant: "acme" };
    expect(() => resolveActiveTenant(cfg)).toThrowError(
      expect.objectContaining({ code: EXIT.USAGE }),
    );
  });

  it("allowAmbient exempts management subcommands from strict mode", () => {
    const cfg: ConfigFile = { ...seed("acme"), activeTenant: "acme", settings: { requireTenant: true } };
    expect(resolveActiveTenant(cfg, undefined, { allowAmbient: true }).alias).toBe("acme");
  });
});

describe("hs config set/get roundtrip", () => {
  it("persists require-tenant via `config set` and reads it back via `config get`", async () => {
    saveConfig({ ...seed("acme"), activeTenant: "acme" });

    const stdoutChunks: string[] = [];
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(((chunk: unknown) => {
      stdoutChunks.push(String(chunk));
      return true;
    }) as never);
    try {
      await buildConfigCommand().parseAsync(["set", "require-tenant", "true"], { from: "user" });
      // Persisted under cfg.settings (camelCase).
      expect(loadConfig().settings?.requireTenant).toBe(true);

      stdoutChunks.length = 0;
      await buildConfigCommand().parseAsync(["get", "require-tenant"], { from: "user" });
      expect(JSON.parse(stdoutChunks.join("").trim())).toEqual({ "require-tenant": true });

      // Round-trip back to false.
      await buildConfigCommand().parseAsync(["set", "require-tenant", "0"], { from: "user" });
      expect(loadConfig().settings?.requireTenant).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });

  it("rejects an unknown key with EXIT.USAGE", async () => {
    saveConfig({ ...seed("acme"), activeTenant: "acme" });
    await expect(buildConfigCommand().parseAsync(["set", "bogus", "true"], { from: "user" })).rejects.toMatchObject({
      code: EXIT.USAGE,
    });
  });
});

describe("recentTenantSwitch", () => {
  it("is true when the target differs from the last-written tenant", () => {
    const cfg: ConfigFile = { ...seed("acme"), lastWriteTenant: "beta" };
    expect(recentTenantSwitch(cfg, "acme")).toBe(true);
  });

  it("is true on the first write of a session (no last-written tenant yet)", () => {
    const cfg: ConfigFile = { ...seed("acme"), lastWriteTenant: undefined };
    expect(recentTenantSwitch(cfg, "acme")).toBe(true);
  });

  it("is false when the target is the last-written tenant, even if it was just added/switched", () => {
    const cfg: ConfigFile = { ...seed("acme"), lastWriteTenant: "acme" };
    cfg.tenants.acme.tenantChangedAt = new Date().toISOString(); // recent add must NOT re-fire during continuous work
    expect(recentTenantSwitch(cfg, "acme")).toBe(false);
  });
});

describe("config load/save round-trip", () => {
  it("persists and reloads tenants", () => {
    const cfg: ConfigFile = { ...seed("acme"), activeTenant: "acme" };
    saveConfig(cfg);
    const reloaded = loadConfig();
    expect(reloaded.activeTenant).toBe("acme");
    expect(reloaded.tenants.acme.baseUrl).toBe("https://acme.example.com/api");
  });
});

describe("bulk plan store — atomic single-use consume", () => {
  function newPlan(overrides: Partial<BulkPlan> = {}): BulkPlan {
    const now = Date.now();
    return {
      token: "TOKEN12345",
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + PLAN_TTL_MS).toISOString(),
      tenant: { alias: "acme", baseUrl: "https://acme.example.com/api", customerName: "acme", apiVersion: "v3" },
      action: "bulk-archive clients",
      summary: "ARCHIVE 2 clients",
      recentTenantSwitch: false,
      requests: [
        { method: "DELETE", path: "/clients/a" },
        { method: "DELETE", path: "/clients/b" },
      ],
      ...overrides,
    };
  }

  it("the first consume succeeds and returns the plan", () => {
    const plan = newPlan();
    writePlan(plan.token, plan);
    const claimed = consumePlanAtomically(plan.token);
    expect(claimed.token).toBe(plan.token);
    expect(claimed.requests).toHaveLength(2);
  });

  it("a second consume of the same token fails with EXIT.AUTH (already consumed)", () => {
    const plan = newPlan();
    writePlan(plan.token, plan);
    consumePlanAtomically(plan.token);
    expect(() => consumePlanAtomically(plan.token)).toThrowError(
      expect.objectContaining({ code: EXIT.AUTH, message: expect.stringContaining("already consumed") }),
    );
  });

  it("an unknown token fails with EXIT.AUTH", () => {
    expect(() => consumePlanAtomically("nope")).toThrowError(
      expect.objectContaining({ code: EXIT.AUTH }),
    );
  });

  it("an expired token fails with EXIT.AUTH", () => {
    const plan = newPlan({ expiresAt: new Date(Date.now() - 1000).toISOString() });
    writePlan(plan.token, plan);
    expect(() => consumePlanAtomically(plan.token)).toThrowError(
      expect.objectContaining({ code: EXIT.AUTH, message: expect.stringContaining("expired") }),
    );
  });

  it("the plan on disk carries NO credentials (creds are injected only at execute time)", () => {
    const plan = newPlan();
    const file = writePlan(plan.token, plan);
    const onDisk = fs.readFileSync(file, "utf8");
    expect(onDisk).not.toMatch(/password/i);
    expect(onDisk).not.toMatch(/"userName"/);
  });
});

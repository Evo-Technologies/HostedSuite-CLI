import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  consumePlanAtomically,
  loadConfig,
  PLAN_TTL_MS,
  recentTenantSwitch,
  resolveActiveTenant,
  saveConfig,
  setTenant,
  writePlan,
  type BulkPlan,
  type ConfigFile,
  type TenantProfile,
} from "../src/config.js";
import { EXIT } from "../src/exit-codes.js";

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hs-test-"));
  process.env.HOSTEDSUITE_CONFIG_DIR = path.join(tmpRoot, "config");
  process.env.HOSTEDSUITE_CACHE_DIR = path.join(tmpRoot, "cache");
});

afterEach(() => {
  delete process.env.HOSTEDSUITE_CONFIG_DIR;
  delete process.env.HOSTEDSUITE_CACHE_DIR;
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

describe("recentTenantSwitch", () => {
  it("is true when the target differs from the last-written tenant", () => {
    const cfg: ConfigFile = { ...seed("acme"), lastWriteTenant: "beta" };
    expect(recentTenantSwitch(cfg, "acme")).toBe(true);
  });

  it("is true when the target was switched-to within the last 10 minutes", () => {
    const cfg: ConfigFile = { ...seed("acme"), lastWriteTenant: "acme" };
    cfg.tenants.acme.tenantChangedAt = new Date().toISOString();
    expect(recentTenantSwitch(cfg, "acme")).toBe(true);
  });

  it("is false when the target is the last-written tenant and the switch is stale", () => {
    const cfg: ConfigFile = { ...seed("acme"), lastWriteTenant: "acme" };
    cfg.tenants.acme.tenantChangedAt = new Date(Date.now() - 30 * 60_000).toISOString();
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

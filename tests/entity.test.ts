import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildEntityCommand,
  computeDiff,
  filterBody,
  filterQuery,
  notImplemented,
  translateBody,
} from "../src/commands/entity.js";
import { findEntity } from "../src/entities.js";
import { saveConfig, type ConfigFile, type ResolvedTenant, type TenantProfile } from "../src/config.js";
import { EXIT } from "../src/exit-codes.js";

function profile(overrides: Partial<TenantProfile> = {}): TenantProfile {
  return {
    baseUrl: "https://acme.example.com/api",
    customerName: "acme",
    apiVersion: "v3",
    userName: "user@example.com",
    password: "s3cret",
    ...overrides,
  };
}

function resolved(apiVersion: "v2" | "v3" = "v2"): ResolvedTenant {
  return { alias: "acme", profile: profile({ apiVersion }) };
}

const client = findEntity("client")!;

describe("list filter flag → query mapping (filterQuery, v3)", () => {
  it("maps each declared filter's opt key onto its v3 query field", () => {
    // Commander derives the opt key `categoryId` from `--category-id`, which the
    // filter def maps onto the (pluralised) v3 query field `categoryIds`.
    const out = filterQuery(client.v3!.listFilters, { centerId: "5", categoryId: ["1", "2"] });
    expect(out).toEqual({ centerId: "5", categoryIds: ["1", "2"] });
  });

  it("skips filters that were not supplied (undefined / empty array)", () => {
    const out = filterQuery(client.v3!.listFilters, { centerId: undefined, categoryId: [] });
    expect(out).toEqual({});
  });
});

describe("list filter flag → body mapping (filterBody, v2 PascalCase)", () => {
  it("maps opt keys onto the v2 PascalCase filter fields", () => {
    const out = filterBody(client.v2!.list.filters, { name: "Acme", centerId: "5" });
    expect(out).toEqual({ Name: "Acme", CenterId: "5" });
  });
});

describe("translateBody (v3 camelCase → v2 field names)", () => {
  it("translates every mapped field using the entity's create fieldMap", () => {
    const out = translateBody({ name: "Acme", centerId: "3" }, client.v2!.create!.fieldMap, resolved());
    expect(out).toEqual({ Name: "Acme", CenterId: "3" });
  });

  it("uses the bespoke New* names from the update fieldMap", () => {
    const out = translateBody({ name: "Renamed", centerId: "9" }, client.v2!.update!.fieldMap, resolved());
    expect(out).toEqual({ NewName: "Renamed", NewCenterId: "9" });
  });

  it("throws EXIT.USAGE naming an unmapped field", () => {
    expect(() => translateBody({ bogus: "x" }, client.v2!.create!.fieldMap, resolved())).toThrowError(
      expect.objectContaining({ code: EXIT.USAGE, message: expect.stringContaining('Field "bogus" has no v2 mapping') }),
    );
  });
});

describe("computeDiff — v3 PATCH semantics", () => {
  it("reports a from → to change", () => {
    expect(computeDiff({ name: "New" }, { name: "Old" })).toEqual([{ field: "name", from: "Old", to: "New" }]);
  });

  it("marks null as ignored (PATCH cannot clear via null)", () => {
    expect(computeDiff({ centerId: null }, { centerId: "c1" })).toEqual([{ field: "centerId", ignored: "null" }]);
  });

  it("flags an empty string as clearing a reference and surfaces the detached name", () => {
    const diff = computeDiff({ centerId: "" }, { centerId: "c1", centerName: "Old Center" });
    expect(diff).toEqual([{ field: "centerId", clearsReference: true, was: "c1", wasName: "Old Center" }]);
  });

  it("skips the __Restore control field", () => {
    expect(computeDiff({ __Restore: true, name: "New" }, { name: "Old" })).toEqual([
      { field: "name", from: "Old", to: "New" },
    ]);
  });
});

describe("notImplemented — unsupported on this API version", () => {
  it("throws EXIT.NOT_IMPLEMENTED (exit 9)", () => {
    expect(() => notImplemented("center list", resolved("v3"))).toThrowError(
      expect.objectContaining({ code: EXIT.NOT_IMPLEMENTED }),
    );
  });
});

describe("end-to-end: a v3-only entity on a v2 tenant exits 9", () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hs-test-"));
    process.env.HOSTEDSUITE_CONFIG_DIR = path.join(tmpRoot, "config");
    process.env.HOSTEDSUITE_CACHE_DIR = path.join(tmpRoot, "cache");
    process.env.HOSTEDSUITE_NO_BANNER = "1";
    const cfg: ConfigFile = {
      activeTenant: "acme",
      tenants: { acme: profile({ apiVersion: "v2" }) },
    };
    saveConfig(cfg);
  });

  afterEach(() => {
    delete process.env.HOSTEDSUITE_CONFIG_DIR;
    delete process.env.HOSTEDSUITE_CACHE_DIR;
    delete process.env.HOSTEDSUITE_NO_BANNER;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it("`center list` on a v2 tenant rejects with EXIT.NOT_IMPLEMENTED", async () => {
    // `center` is registered v3-only (no v2 surface).
    const center = buildEntityCommand(findEntity("center")!);
    await expect(center.parseAsync(["list"], { from: "user" })).rejects.toMatchObject({
      code: EXIT.NOT_IMPLEMENTED,
    });
  });
});

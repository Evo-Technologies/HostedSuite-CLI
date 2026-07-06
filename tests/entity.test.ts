import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildEntityCommand,
  checkListWindow,
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
const center = findEntity("center")!;
const reservation = findEntity("reservation")!;

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

  it("merges a date-range pair into one nested object for a non-client entity (department)", () => {
    // `department` was wired with name + a dateCreated range (--created-after/--created-before).
    // The two nest{parent:"dateCreated"} flags must collapse into one { start, end } object.
    const department = findEntity("department")!;
    const out = filterQuery(department.v3!.listFilters, {
      createdAfter: "2026-01-01",
      createdBefore: "2026-06-30",
    });
    expect(out).toEqual({ dateCreated: { start: "2026-01-01", end: "2026-06-30" } });
  });

  it("maps a repeatable array filter onto its (pluralised) camel query field (reservation)", () => {
    // `--meeting-room-id` (opt key meetingRoomId) maps onto the v3 field meetingRoomIds.
    const out = filterQuery(reservation.v3!.listFilters, { meetingRoomId: ["r1", "r2"] });
    expect(out).toEqual({ meetingRoomIds: ["r1", "r2"] });
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

describe("new v2 entity field-maps (center)", () => {
  it("translates the center create fieldMap (name → Name)", () => {
    const out = translateBody(
      { name: "Downtown", thirdPartyAccountId: "tp-1", address: "1 Main St" },
      center.v2!.create!.fieldMap,
      resolved(),
    );
    expect(out).toEqual({ Name: "Downtown", ThirdPartyAccountId: "tp-1", Address: "1 Main St" });
  });

  it("uses the bespoke New* name on center update (name → NewName)", () => {
    const out = translateBody({ name: "Renamed", address: "2 Elm St" }, center.v2!.update!.fieldMap, resolved());
    expect(out).toEqual({ NewName: "Renamed", Address: "2 Elm St" });
  });

  it("throws EXIT.USAGE for an unmapped field on a new v2 entity", () => {
    expect(() => translateBody({ bogus: "x" }, center.v2!.create!.fieldMap, resolved())).toThrowError(
      expect.objectContaining({ code: EXIT.USAGE, message: expect.stringContaining('Field "bogus" has no v2 mapping') }),
    );
  });
});

describe("checkListWindow — client-side ≤7-day guard", () => {
  it("throws EXIT.USAGE for an 8-day reservation span", () => {
    expect(() => checkListWindow(reservation, { from: "2026-01-01", to: "2026-01-09" })).toThrowError(
      expect.objectContaining({
        code: EXIT.USAGE,
        message: expect.stringContaining("reservation list is limited to a 7-day window; got 8 days"),
      }),
    );
  });

  it("allows a 7-day span", () => {
    expect(() => checkListWindow(reservation, { from: "2026-01-01", to: "2026-01-08" })).not.toThrow();
  });

  it("is a no-op when only one bound is supplied", () => {
    expect(() => checkListWindow(reservation, { from: "2026-01-01" })).not.toThrow();
  });

  it("is a no-op for an entity without a window cap", () => {
    expect(() => checkListWindow(client, { from: "2026-01-01", to: "2026-12-31" })).not.toThrow();
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

  it("`category list` on a v2 tenant rejects with EXIT.NOT_IMPLEMENTED", async () => {
    // `category` is registered v3-only (no v2 surface).
    const category = buildEntityCommand(findEntity("category")!);
    await expect(category.parseAsync(["list"], { from: "user" })).rejects.toMatchObject({
      code: EXIT.NOT_IMPLEMENTED,
    });
  });
});

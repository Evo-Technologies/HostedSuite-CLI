import { describe, expect, it } from "vitest";

import { translateBody } from "../src/commands/entity.js";
import { buildCallAllowanceBody } from "../src/commands/call-allowance.js";
import { unwrapDialingRules } from "../src/commands/dialing-rule.js";
import { unwrapTimeZones } from "../src/commands/time-zones.js";
import { findEntity } from "../src/entities.js";
import { normalizeResponse } from "../src/normalize.js";
import { type ResolvedTenant, type TenantProfile } from "../src/config.js";

function resolved(apiVersion: "v2" | "v3" = "v2"): ResolvedTenant {
  const profile: TenantProfile = {
    baseUrl: "https://acme.example.com/api",
    customerName: "acme",
    apiVersion,
    userName: "user@example.com",
    password: "s3cret",
  };
  return { alias: "acme", profile };
}

describe("reception-call v2 update fieldMap ({ notes } → { Notes })", () => {
  const receptionCall = findEntity("reception-call")!;

  it("carries a v2 block whose update targets /calls/update with idField Id", () => {
    expect(receptionCall.v2?.update?.route).toBe("/calls/update");
    expect(receptionCall.v2?.update?.idField).toBe("Id");
    expect(receptionCall.v2?.list.route).toBe("/calls");
    expect(receptionCall.v2?.list.idFilterField).toBe("CallRecordId");
  });

  it("translates notes → Notes", () => {
    const out = translateBody({ notes: "Called back at 3pm" }, receptionCall.v2!.update!.fieldMap, resolved());
    expect(out).toEqual({ Notes: "Called back at 3pm" });
  });

  it("preserves an empty string (clears Notes, like v3)", () => {
    const out = translateBody({ notes: "" }, receptionCall.v2!.update!.fieldMap, resolved());
    expect(out).toEqual({ Notes: "" });
  });
});

describe("completed-form v2 list block", () => {
  const completedForm = findEntity("completed-form")!;

  it("lists via POST /forms/completed and maps --form-id → SpecificFormId with no v2 get", () => {
    expect(completedForm.v2?.list.route).toBe("/forms/completed");
    expect(completedForm.v2?.list.idFilterField).toBeUndefined();
    expect(completedForm.v2?.get).toBeUndefined();
    const formIdFilter = completedForm.v2?.list.filters?.find((f) => f.option.includes("--form-id"));
    expect(formIdFilter?.field).toBe("SpecificFormId");
  });
});

describe("dialing-rule v3 envelope unwrap ({ dialingRules } → { items })", () => {
  it("unwraps the camelCase envelope, dropping dedicatedSmsPhoneNumber", () => {
    const out = unwrapDialingRules({ dialingRules: [{ id: "1" }, { id: "2" }], dedicatedSmsPhoneNumber: "+15550000" });
    expect(out).toEqual({ items: [{ id: "1" }, { id: "2" }] });
  });

  it("tolerates a PascalCase envelope", () => {
    expect(unwrapDialingRules({ DialingRules: [{ Id: "1" }] })).toEqual({ items: [{ Id: "1" }] });
  });

  it("tolerates a bare array and normalizes to the read contract", () => {
    const out = normalizeResponse(unwrapDialingRules([{ Id: "1" }]), "v3");
    expect(out).toEqual({ items: [{ Id: "1" }] });
  });

  it("yields { items: [] } for an unexpected shape", () => {
    expect(unwrapDialingRules({ nope: true })).toEqual({ items: [] });
  });
});

describe("time-zones v3 envelope unwrap ({ timeZones } → { items })", () => {
  it("unwraps { timeZones: [{ id, displayName }] }", () => {
    const out = unwrapTimeZones({ timeZones: [{ id: "utc", displayName: "UTC" }] });
    expect(out).toEqual({ items: [{ id: "utc", displayName: "UTC" }] });
  });
});

describe("call-allowance v2 body assembly", () => {
  it("assembles PascalCase fields, emitting bill-* booleans only when set and coercing numbers", () => {
    const body = buildCallAllowanceBody({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      clientId: "c1",
      billTalk: true,
      billHold: false,
      callRounding: "NextMinute",
      minDuration: "30",
      maxDuration: "600",
    });
    expect(body).toEqual({
      StartDate: "2026-01-01",
      EndDate: "2026-01-31",
      ClientId: "c1",
      BillTalk: true,
      CallRounding: "NextMinute",
      MinCallDuration: 30,
      MaxCallDuration: 600,
    });
    expect(body).not.toHaveProperty("BillHold");
    expect(body).not.toHaveProperty("BillRing");
  });

  it("omits every optional field when nothing is supplied", () => {
    expect(buildCallAllowanceBody({})).toEqual({});
  });

  it("throws EXIT.USAGE on a non-numeric duration", () => {
    expect(() => buildCallAllowanceBody({ minDuration: "abc" })).toThrowError(
      expect.objectContaining({ message: expect.stringContaining("Expected a number") }),
    );
  });
});

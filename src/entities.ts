/**
 * The entity registry — one declarative table that drives command generation
 * (`src/commands/entity.ts`). It is the heart of the v2/v3 duality: the read
 * contract is unified (camelCase + `{items}` envelope), but write bodies use
 * the v3 camelCase vocabulary everywhere and each v2 entity carries a bespoke
 * `fieldMap` (v3 key → v2 field) transcribed from the server's `Shared.cs`.
 *
 * See PLAN §4 (the EntityDef contract) and API-NOTES §4/§5 (the surfaces).
 */

/** A single entity-specific list/filter flag. */
export interface FlagDef {
  /** Commander option string, e.g. `"--center-id <id>"`. */
  option: string;
  /** Help text. */
  description: string;
  /**
   * The request field this flag maps to. In a v3 `listFilters` entry this is the
   * v3 camelCase query field (`centerId`); in a v2 `filters` entry it is the v2
   * PascalCase field (`CenterId`). Ignored when `nest` is set.
   */
  field: string;
  /**
   * Nested-object target: this flag's value becomes `query[parent][key]` — the
   * two flags of a date window (`--created-after`/`--created-before`) merge into
   * one `DateRangeFilter` object (`dateCreated: { start, end }`) which the HTTP
   * layer JSV-encodes. Server field names are case-insensitive, so lowercase
   * `dateCreated`/`start`/`end` bind to C# `DateCreated`/`Start`/`End`.
   */
  nest?: { parent: string; key: string };
  /** Repeatable flag → collected into an array. */
  repeatable?: boolean;
}

/** A reusable date-range filter pair for a v3 `DateRangeFilter` property. */
export function dateRangeFilter(parent: string, label: string): FlagDef[] {
  return [
    { option: `--${label}-after <date>`, description: `${parent} on/after this date (ISO)`, field: "", nest: { parent, key: "start" } },
    { option: `--${label}-before <date>`, description: `${parent} on/before this date (ISO)`, field: "", nest: { parent, key: "end" } },
  ];
}

export type PatchStyle = "path-id" | "body-id";

export interface EntityV3 {
  /** URI base, e.g. `"/clients"`. */
  uriBase: string;
  /** `"path-id"` (default, `PATCH /x/{id}`) or `"body-id"` (reservations/appointments). */
  patchStyle?: PatchStyle;
  /** Entity-specific list filters, unioned with the standard list flag set. */
  listFilters?: FlagDef[];
  /** Read-only resource: only `list` + `get` are generated. */
  readOnly?: boolean;
  /** Singleton (system-settings): only `get` (no id) + `patch` (no id). */
  singleton?: boolean;
  /**
   * Cap on the `--from`/`--to` list window (in days), enforced CLIENT-SIDE before
   * the request. Scheduling entities (reservation/appointment) cap at 7 days.
   */
  maxListWindowDays?: number;
  /**
   * `"events"` for scheduling lists (reservation/appointment): the DTO base is
   * `ListEvents<T>` — scalar `Start`/`End` params, a `{ events: [...] }` response
   * envelope (no pagination), which the list handler unwraps to `{ items }`.
   */
  listStyle?: "events";
  /** Per-FileReference upload routes (image/* only) — wired in a later phase. */
  files?: { field: string; route: string }[];
}

export interface EntityV2 {
  list: {
    route: string;
    /** Field `--query` maps to (e.g. `"Name"`); absent → `--query` on v2 exits USAGE. */
    queryField?: string;
    /** Single-id filter field (e.g. `"ClientId"`) — used by `get` + bulk preview. */
    idFilterField?: string;
    /** v2-specific filter flags. */
    filters?: FlagDef[];
  };
  /** Most v2 nouns have no single-get route; emulate via list + idFilterField. */
  get?: "via-list";
  /**
   * A dedicated v2 single-get route (POST `{ [idField]: id }`), used when a noun
   * exposes a real get endpoint distinct from its list route (e.g. reservations,
   * meeting-rooms). Takes precedence over `get: "via-list"`.
   */
  getOne?: { route: string; idField: string };
  create?: { route: string; fieldMap: Record<string, string> };
  update?: { route: string; idField: string; fieldMap: Record<string, string> };
  archive?: { route: string; idField: string };
  restore?: { route: string; idField: string };
  hardDelete?: { route: string; idField: string };
}

export interface EntityDef {
  /** CLI noun, e.g. `"client"`. */
  noun: string;
  plural: string;
  /** Present when the noun exists on v3; omit → exit 9 on v3 tenants. */
  v3?: EntityV3;
  /** Present when the noun exists on v2; omit → exit 9 on v2 tenants. */
  v2?: EntityV2;
}

// ---------------------------------------------------------------------------
// v2 fieldMaps (v3 camelCase key → v2 field name), from Shared.cs
// ---------------------------------------------------------------------------

const CLIENT_V2_CREATE: Record<string, string> = {
  name: "Name",
  centerId: "CenterId",
  greeting: "Greeting",
  callInstructions: "CallInstructions",
  popupInformation: "PopupInformation",
  information: "Information",
  contractId: "ContractId",
  location: "Location",
  thirdPartyAccountId: "ThirdPartyAccountId",
  faxNumber: "FaxNumber",
  webSiteUrl: "WebSiteUrl",
  informationCsv: "InformationCSV",
  industryId: "IndustryId",
  categoryId: "CategoryId",
  categoryIds: "CategoryIds",
};

const CLIENT_V2_UPDATE: Record<string, string> = {
  // NB: v2 update uses bespoke `New*` names for the renamed/moved refs.
  name: "NewName",
  centerId: "NewCenterId",
  callInstructions: "CallInstructions",
  greeting: "Greeting",
  popupInformation: "PopupInformation",
  information: "Information",
  thirdPartyAccountId: "ThirdPartyAccountId",
  contractId: "ContractId",
  location: "Location",
  faxNumber: "FaxNumber",
  webSiteUrl: "WebSiteUrl",
  informationCsv: "InformationCSV",
  industryId: "IndustryId",
};

const CONTACT_V2_CREATE: Record<string, string> = {
  clientId: "ClientId",
  firstName: "FirstName",
  lastName: "LastName",
  information: "Information",
  greetingOverride: "GreetingOverride",
  moreInformation: "MoreInformation",
  alert: "Alert",
  status: "Status",
  longDistanceCode: "LongDistanceCode",
  callInstructions: "CallInstructions",
  title: "Title",
  thirdPartyAccountId: "ThirdPartyAccountId",
  emergencyInstructions: "EmergencyInstructions",
  timeZoneId: "TimeZoneId",
};

const CONTACT_V2_UPDATE: Record<string, string> = {
  firstName: "FirstName",
  lastName: "LastName",
  information: "Information",
  greetingOverride: "GreetingOverride",
  moreInformation: "MoreInformation",
  alert: "Alert",
  alertExpirationDate: "AlertExpirationDate",
  status: "Status",
  statusExpirationDate: "StatusExpirationDate",
  location: "Location",
  longDistanceCode: "LongDistanceCode",
  callInstructions: "CallInstructions",
  title: "Title",
  thirdPartyAccountId: "ThirdPartyAccountId",
  emergencyInstructions: "EmergencyInstructions",
  timeZoneId: "TimeZoneId",
};

const CENTER_V2_CREATE: Record<string, string> = {
  name: "Name",
  thirdPartyAccountId: "ThirdPartyAccountId",
  address: "Address",
};

const CENTER_V2_UPDATE: Record<string, string> = {
  // v2 update selects the center by Id and renames via `NewName`.
  name: "NewName",
  address: "Address",
};

const CHARGE_V2_CREATE: Record<string, string> = {
  clientId: "ClientId",
  serviceId: "ServiceId",
  dateOfCharge: "DateOfCharge",
  notes: "Notes",
  quantity: "Quantity",
  cost: "Cost",
  memorized: "Memorized",
};

const INDUSTRY_V2_CREATE: Record<string, string> = {
  name: "Name",
  centerId: "CenterId",
};

const INDUSTRY_V2_UPDATE: Record<string, string> = {
  name: "Name",
};

const RESERVATION_V2_CREATE: Record<string, string> = {
  meetingRoomId: "MeetingRoomId",
  startTime: "StartTime",
  endTime: "EndTime",
  subject: "Subject",
  notes: "Notes",
  attendees: "Attendees",
  organizerName: "OrganizerName",
  resourceIds: "ResourceIds",
  numAttendees: "NumAttendees",
  clientId: "ClientId",
  clientEmailAddress: "ClientEmailAddress",
  paymentStatus: "PaymentStatus",
};

const RESERVATION_V2_UPDATE: Record<string, string> = {
  // Full reschedule via /scheduling/reschedule (RescheduleReservationRequest).
  meetingRoomId: "MeetingRoomId",
  startTime: "StartTime",
  endTime: "EndTime",
  subject: "Subject",
  notes: "Notes",
  attendees: "Attendees",
  organizerName: "OrganizerName",
  numAttendees: "NumAttendees",
};

// ---------------------------------------------------------------------------
// v3-only entity helpers
// ---------------------------------------------------------------------------

/** A full-CRUD v3-only entity with no v2 mapping (exits 9 on v2 tenants). */
function v3Entity(
  noun: string,
  plural: string,
  uriBase: string,
  extra: Partial<EntityV3> = {},
): EntityDef {
  return { noun, plural, v3: { uriBase, ...extra } };
}

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

export const ENTITIES: EntityDef[] = [
  // --- client (v3 + v2) ----------------------------------------------------
  {
    noun: "client",
    plural: "clients",
    v3: {
      uriBase: "/clients",
      listFilters: [
        { option: "--name <text>", description: "Filter by client name", field: "name" },
        { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
        { option: "--category-id <id>", description: "Filter by category id (repeatable)", field: "categoryIds", repeatable: true },
        { option: "--contract-id <id>", description: "Filter by contract id", field: "contractId" },
        { option: "--reference-id <id>", description: "Filter by external reference id", field: "referenceId" },
        { option: "--billing-email-address <email>", description: "Filter by billing email address", field: "billingEmailAddress" },
        { option: "--ai-config-source <src>", description: "Filter by AI config source (ClientAIConfigSources: Local, ResellerPortal)", field: "aiConfigSource" },
        ...dateRangeFilter("dateCreated", "created"),
      ],
    },
    v2: {
      list: {
        route: "/clients",
        queryField: "Name",
        idFilterField: "ClientId",
        filters: [
          { option: "--name <text>", description: "Filter by client name", field: "Name" },
          { option: "--center-id <id>", description: "Filter by center id", field: "CenterId" },
          { option: "--third-party-id <id>", description: "Filter by third-party account id", field: "ThirdPartyAccountId" },
        ],
      },
      get: "via-list",
      create: { route: "/clients/save", fieldMap: CLIENT_V2_CREATE },
      update: { route: "/clients/update", idField: "ClientId", fieldMap: CLIENT_V2_UPDATE },
      archive: { route: "/clients/archive", idField: "ClientId" },
      restore: { route: "/clients/restore", idField: "ClientId" },
      hardDelete: { route: "/clients/delete", idField: "ClientId" },
    },
  },

  // --- contact (v3 + v2) ---------------------------------------------------
  {
    noun: "contact",
    plural: "contacts",
    v3: {
      uriBase: "/contacts",
      listFilters: [
        { option: "--client-id <id>", description: "Filter by client id", field: "clientId" },
        { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
        { option: "--first-name <text>", description: "Filter by first name", field: "firstName" },
        { option: "--last-name <text>", description: "Filter by last name", field: "lastName" },
        { option: "--email <text>", description: "Filter by email address", field: "emailAddress" },
        { option: "--reference-id <id>", description: "Filter by external reference id", field: "referenceId" },
        { option: "--include-information <bool>", description: "Include extended information (true/false)", field: "includeInformation" },
        ...dateRangeFilter("dateCreated", "created"),
      ],
    },
    v2: {
      list: {
        route: "/contacts",
        // v2 contacts expose per-name/email/phone filters; --query maps to LastName.
        queryField: "LastName",
        idFilterField: "ContactId",
        filters: [
          { option: "--client-id <id>", description: "Filter by client id", field: "ClientId" },
          { option: "--center-id <id>", description: "Filter by center id", field: "CenterId" },
          { option: "--first-name <text>", description: "Filter by first name", field: "FirstName" },
          { option: "--last-name <text>", description: "Filter by last name", field: "LastName" },
          { option: "--email <text>", description: "Filter by email address", field: "EmailAddress" },
          { option: "--phone <text>", description: "Filter by partial phone number", field: "PhoneNumber" },
        ],
      },
      get: "via-list",
      create: { route: "/contacts/new", fieldMap: CONTACT_V2_CREATE },
      update: { route: "/contacts/update", idField: "ContactId", fieldMap: CONTACT_V2_UPDATE },
      archive: { route: "/contacts/archive", idField: "ContactId" },
      restore: { route: "/contacts/restore", idField: "ContactId" },
      hardDelete: { route: "/contacts/delete", idField: "ContactId" },
    },
  },

  // --- operational entities (v3 + v2 where mapped) -------------------------
  {
    ...v3Entity("center", "centers", "/centers", {
      listFilters: [
        { option: "--name <text>", description: "Filter by center name", field: "name" },
        { option: "--latitude <deg>", description: "Filter by latitude (decimal degrees)", field: "latitude" },
        { option: "--longitude <deg>", description: "Filter by longitude (decimal degrees)", field: "longitude" },
        { option: "--distance <mi>", description: "Filter by distance from the given lat/long", field: "distance" },
        ...dateRangeFilter("dateCreated", "created"),
      ],
    }),
    v2: {
      list: {
        route: "/centers",
        queryField: "Name",
        filters: [{ option: "--name <text>", description: "Filter by center name", field: "Name" }],
      },
      // No dedicated get route on v2 and no Id filter on list → `get` exits 9.
      create: { route: "/centers/save", fieldMap: CENTER_V2_CREATE },
      update: { route: "/centers/update", idField: "Id", fieldMap: CENTER_V2_UPDATE },
      hardDelete: { route: "/centers/delete", idField: "Id" },
    },
  },
  {
    ...v3Entity("charge", "charges", "/charges", {
      listFilters: [
        { option: "--client-id <id>", description: "Filter by client id", field: "clientId" },
        { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
        { option: "--service-id <id>", description: "Filter by service id", field: "serviceId" },
        { option: "--contact-id <id>", description: "Filter by contact id", field: "contactId" },
        { option: "--description <text>", description: "Filter by description", field: "description" },
        { option: "--memorized <bool>", description: "Filter by memorized flag (true/false)", field: "memorized" },
        ...dateRangeFilter("dateCreated", "created"),
        ...dateRangeFilter("dateOfCharge", "charged"),
      ],
    }),
    v2: {
      // v2 exposes two list variants (/charges, /charges/all); the CLI wires the
      // primary /charges route. No update/delete/get routes exist for charges.
      list: {
        route: "/charges",
        filters: [
          { option: "--client-id <id>", description: "Filter by client id", field: "ClientId" },
          { option: "--start-date <date>", description: "Window start date", field: "StartDate" },
          { option: "--end-date <date>", description: "Window end date", field: "EndDate" },
          { option: "--date-selector <sel>", description: "Date selector mode", field: "DateSelector" },
        ],
      },
      create: { route: "/charges/new", fieldMap: CHARGE_V2_CREATE },
    },
  },
  {
    ...v3Entity("service", "services", "/services", {
      listFilters: [
        { option: "--name <text>", description: "Filter by service name", field: "name" },
        { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
        { option: "--description <text>", description: "Filter by description", field: "description" },
        { option: "--tax-id <id>", description: "Filter by tax id", field: "taxId" },
        { option: "--parent-service-id <id>", description: "Filter by parent service id", field: "parentServiceId" },
        { option: "--meta-service-id <id>", description: "Filter by meta service id", field: "metaServiceId" },
        { option: "--special-type <type>", description: "Filter by special service type (SpecialServiceTypes: None, CallCount, CallMinutes, IncomingCallCount, OutgoingCallCount, IncomingCallMinutes, OutgoingCallMinutes, Product, AIMinutes, AICall, AIChatMessage)", field: "specialType" },
        { option: "--code <code>", description: "Filter by service code", field: "code" },
        ...dateRangeFilter("dateCreated", "created"),
      ],
    }),
    v2: {
      // v2 supports ONLY list for services.
      list: {
        route: "/services",
        queryField: "Name",
        filters: [
          { option: "--center-id <id>", description: "Filter by center id", field: "CenterId" },
          { option: "--parent-service-id <id>", description: "Filter by parent service id", field: "ParentServiceId" },
        ],
      },
    },
  },
  {
    ...v3Entity("industry", "industries", "/industries", {
      listFilters: [
        { option: "--name <text>", description: "Filter by industry name", field: "name" },
        ...dateRangeFilter("dateCreated", "created"),
      ],
    }),
    v2: {
      list: { route: "/industries" },
      create: { route: "/industries/save", fieldMap: INDUSTRY_V2_CREATE },
      update: { route: "/industries/update", idField: "IndustryId", fieldMap: INDUSTRY_V2_UPDATE },
      hardDelete: { route: "/industries/delete", idField: "IndustryId" },
    },
  },
  v3Entity("category", "categories", "/categories", {
    listFilters: [
      { option: "--name <text>", description: "Filter by category name", field: "name" },
      { option: "--description <text>", description: "Filter by description", field: "description" },
      { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
      { option: "--role <role>", description: "Filter by category role (CategoryRoles: None, CallDisposition)", field: "role" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("department", "departments", "/departments", {
    listFilters: [
      { option: "--name <text>", description: "Filter by department name", field: "name" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("calendar", "calendars", "/calendars", {
    listFilters: [
      { option: "--name <text>", description: "Filter by calendar name", field: "name" },
      { option: "--client-id <id>", description: "Filter by client id", field: "clientId" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("contract", "contracts", "/contracts", {
    listFilters: [
      { option: "--name <text>", description: "Filter by contract name", field: "name" },
      { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
      { option: "--master-id <id>", description: "Filter by master contract id", field: "masterId" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  {
    ...v3Entity("meeting-room", "meeting-rooms", "/meeting-rooms", {
      listFilters: [
        { option: "--name <text>", description: "Filter by meeting room name", field: "name" },
        { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
        { option: "--visibility <vis>", description: "Filter by visibility (MeetingRoomVisibility: Everyone, InternalUseOnly, ReadOnlyExternal)", field: "visibility" },
        { option: "--bill-as-service-id <id>", description: "Filter by bill-as service id", field: "billAsServiceId" },
        ...dateRangeFilter("dateCreated", "created"),
      ],
    }),
    v2: {
      // v2 supports list + a dedicated single-get; no create/update/delete.
      list: {
        route: "/scheduling/meeting-rooms",
        filters: [{ option: "--center-id <id>", description: "Filter by center id", field: "CenterId" }],
      },
      getOne: { route: "/scheduling/meeting-room", idField: "Id" },
    },
  },
  v3Entity("resource", "resources", "/scheduled-resources", {
    listFilters: [
      { option: "--name <text>", description: "Filter by resource name", field: "name" },
      { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
      { option: "--description <text>", description: "Filter by description", field: "description" },
      { option: "--bill-as-service-id <id>", description: "Filter by bill-as service id", field: "billAsServiceId" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),

  // Scheduling: body-id PATCH (API-NOTES §4) + a CLIENT-SIDE ≤7-day list window
  // guard (maxListWindowDays) enforced before the request.
  {
    ...v3Entity("reservation", "reservations", "/reservations", {
      patchStyle: "body-id",
      maxListWindowDays: 7,
      listStyle: "events",
      listFilters: [
        // ListEvents<T> exposes scalar Start/End (NOT from/to, NOT a DateRangeFilter object).
        { option: "--from <date>", description: "Window start (ISO date; ≤7-day span)", field: "start" },
        { option: "--to <date>", description: "Window end (ISO date; ≤7-day span)", field: "end" },
        { option: "--meeting-room-id <id>", description: "Filter by meeting room id (repeatable)", field: "meetingRoomIds", repeatable: true },
      ],
    }),
    v2: {
      list: {
        route: "/scheduling/reservations",
        filters: [
          { option: "--meeting-room-id <id>", description: "Filter by meeting room id (repeatable)", field: "MeetingRoomIds", repeatable: true },
          { option: "--center-id <id>", description: "Filter by center id", field: "CenterId" },
          { option: "--client-id <id>", description: "Filter by client id", field: "ClientId" },
          { option: "--start-time <ts>", description: "Window start time", field: "StartTime" },
          { option: "--end-time <ts>", description: "Window end time", field: "EndTime" },
          { option: "--status <status>", description: "Filter by reservation status", field: "Status" },
          { option: "--payment-status <status>", description: "Filter by payment status", field: "PaymentStatus" },
          { option: "--last-modified-after <ts>", description: "Modified after", field: "LastModifiedAfter" },
          { option: "--last-modified-before <ts>", description: "Modified before", field: "LastModifiedBefore" },
        ],
      },
      getOne: { route: "/scheduling/reservations/details", idField: "Id" },
      create: { route: "/scheduling/schedule", fieldMap: RESERVATION_V2_CREATE },
      // Full reschedule; /scheduling/update-payment-status is a narrower update not
      // expressible in the single update slot and is omitted.
      update: { route: "/scheduling/reschedule", idField: "ReservationId", fieldMap: RESERVATION_V2_UPDATE },
      // `delete` (default) cancels via /scheduling/cancel; `--hard` truly deletes.
      archive: { route: "/scheduling/cancel", idField: "ReservationId" },
      hardDelete: { route: "/scheduling/reservations/delete", idField: "Id" },
    },
  },
  v3Entity("appointment", "appointments", "/appointments", {
    patchStyle: "body-id",
    maxListWindowDays: 7,
    listStyle: "events",
    listFilters: [
      { option: "--from <date>", description: "Window start (ISO date; ≤7-day span)", field: "start" },
      { option: "--to <date>", description: "Window end (ISO date; ≤7-day span)", field: "end" },
    ],
  }),

  // --- CRM / long tail (v3 only) -------------------------------------------
  v3Entity("lead", "leads", "/leads", {
    listFilters: [...dateRangeFilter("dateCreated", "created")],
  }),
  v3Entity("lead-source", "lead-sources", "/lead-source", {
    listFilters: [
      { option: "--name <text>", description: "Filter by lead source name", field: "name" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("lead-stage", "lead-stages", "/lead-stages", {
    listFilters: [
      { option: "--name <text>", description: "Filter by lead stage name", field: "name" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("team-member", "team-members", "/team-members", {
    listFilters: [
      { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
      { option: "--first-name <text>", description: "Filter by first name", field: "firstName" },
      { option: "--last-name <text>", description: "Filter by last name", field: "lastName" },
      { option: "--user-name <text>", description: "Filter by user name", field: "userName" },
      { option: "--user-group-id <id>", description: "Filter by user group id", field: "userGroupId" },
      { option: "--email <text>", description: "Filter by email address", field: "emailAddress" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("user-group", "user-groups", "/user-groups", {
    listFilters: [
      { option: "--name <text>", description: "Filter by user group name", field: "name" },
      { option: "--type <type>", description: "Filter by user group type (UserGroupTypes: Team, Client, Any)", field: "type" },
      { option: "--parent-center-id <id>", description: "Filter by parent center id", field: "parentCenterId" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("administrator", "administrators", "/administrators", {
    listFilters: [
      { option: "--user-name <text>", description: "Filter by user name", field: "userName" },
      { option: "--email <text>", description: "Filter by email address", field: "emailAddress" },
      { option: "--first-name <text>", description: "Filter by first name", field: "firstName" },
      { option: "--last-name <text>", description: "Filter by last name", field: "lastName" },
      { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("webhook", "webhooks", "/webhooks", {
    listFilters: [
      { option: "--url <url>", description: "Filter by webhook URL", field: "url" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("speed-dial", "speed-dials", "/speed-dials", {
    listFilters: [
      { option: "--name <text>", description: "Filter by speed dial name", field: "name" },
      { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("tax", "taxes", "/taxes", {
    listFilters: [
      { option: "--name <text>", description: "Filter by tax name", field: "name" },
      { option: "--type <type>", description: "Filter by tax type (TaxTypes: Percentage, Flat)", field: "type" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("relationship", "relationships", "/relationships", {
    listFilters: [
      { option: "--name <text>", description: "Filter by relationship name", field: "name" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("responsibility", "responsibilities", "/responsibilities", {
    listFilters: [
      { option: "--name <text>", description: "Filter by responsibility name", field: "name" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("phone-system", "phone-systems", "/phone-systems", {
    listFilters: [
      { option: "--name <text>", description: "Filter by phone system name", field: "name" },
      { option: "--run-on-server-id <id>", description: "Filter by run-on server id", field: "runOnServerId" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("form", "forms", "/forms", {
    listFilters: [
      { option: "--name <text>", description: "Filter by form name", field: "name" },
      { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
      { option: "--client-id <id>", description: "Filter by client id", field: "clientId" },
      { option: "--contact-id <id>", description: "Filter by contact id", field: "contactId" },
      { option: "--bill-as-service-id <id>", description: "Filter by bill-as service id", field: "billAsServiceId" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("template", "templates", "/templates", {
    listFilters: [
      { option: "--name <text>", description: "Filter by template name", field: "name" },
      { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
      { option: "--client-id <id>", description: "Filter by client id", field: "clientId" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("integration", "integrations", "/integrations", {
    listFilters: [
      { option: "--name <text>", description: "Filter by integration name", field: "name" },
      { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("reception-call", "reception-calls", "/reception-calls", {
    listFilters: [
      { option: "--call-type <type>", description: "Filter by call type (CallTypes: Voice, Text, AI)", field: "callType" },
      { option: "--type <type>", description: "Filter by reception call type (ReceptionCallTypes: Incoming, Outgoing, Transfer)", field: "type" },
      { option: "--client-id <id>", description: "Filter by client id", field: "clientId" },
      { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
      { option: "--caller <text>", description: "Filter by caller", field: "caller" },
      ...dateRangeFilter("dateCreated", "created"),
      ...dateRangeFilter("startTime", "start"),
    ],
  }),
  v3Entity("call-insight", "call-insights", "/callinsights", {
    listFilters: [
      { option: "--name <text>", description: "Filter by call insight name", field: "name" },
      { option: "--client-id <id>", description: "Filter by client id", field: "clientId" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("server", "servers", "/servers", {
    listFilters: [
      { option: "--name <text>", description: "Filter by server name", field: "name" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),

  // ai-session survives only as a plain entity for legacy cleanup (PLAN §1).
  v3Entity("ai-session", "ai-sessions", "/ai-sessions", {
    listFilters: [
      { option: "--center-id <id>", description: "Filter by center id", field: "centerId" },
      { option: "--purpose <text>", description: "Filter by purpose", field: "purpose" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),

  // --- read-only resources -------------------------------------------------
  v3Entity("email", "emails", "/email", {
    readOnly: true,
    listFilters: [
      { option: "--status <status>", description: "Filter by status (EmailMessageStatuses: Draft, NotSentYet, Sent, NotRead, Read, Error)", field: "status" },
      { option: "--subject <text>", description: "Filter by subject", field: "subject" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("completed-form", "completed-forms", "/completed-forms", {
    readOnly: true,
    listFilters: [
      { option: "--name <text>", description: "Filter by form name", field: "name" },
      { option: "--form-id <id>", description: "Filter by form id", field: "formId" },
      { option: "--client-id <id>", description: "Filter by client id", field: "clientId" },
      { option: "--contact-id <id>", description: "Filter by contact id", field: "contactId" },
      { option: "--email-subject <text>", description: "Filter by email subject", field: "emailSubject" },
      { option: "--caller-number <text>", description: "Filter by caller number", field: "callerNumber" },
      ...dateRangeFilter("dateCreated", "created"),
      ...dateRangeFilter("dateCompleted", "completed"),
    ],
  }),
  v3Entity("webhook-call", "webhook-calls", "/webhookcalls", {
    readOnly: true,
    listFilters: [
      { option: "--webhook-id <id>", description: "Filter by webhook id", field: "webhookId" },
      { option: "--event <event>", description: "Filter by event (WebhookEvents: ClientCreated, ClientUpdated, ClientArchived, ReservationScheduled, ReservationUpdated, ReservationCancelled, ReservationDeleted, ContactCreated, ContactUpdated, ContactArchived)", field: "event" },
      { option: "--status <status>", description: "Filter by status (WebhookCallStatuses: Attempting, Success, Error)", field: "status" },
      ...dateRangeFilter("dateCreated", "created"),
    ],
  }),
  v3Entity("ai-session-change", "ai-session-changes", "/ai-session-changes", { readOnly: true }),

  // --- singleton -----------------------------------------------------------
  v3Entity("system-settings", "system-settings", "/system-settings", { singleton: true }),
];

/** Look up an entity by its CLI noun. */
export function findEntity(noun: string): EntityDef | undefined {
  return ENTITIES.find((e) => e.noun === noun);
}

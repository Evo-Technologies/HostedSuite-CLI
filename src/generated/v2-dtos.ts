/**
 * Hand-written TypeScript surface for the v2 API request/response DTOs the CLI
 * implements. The v2 API (`Evo.HostedSuite.Core`) is excluded from ServiceStack's
 * TypeScript generator (API-NOTES §5/§6), so these are transcribed by hand from
 * the server's `ServiceModel/Shared.cs` — field names are load-bearing (the CLI's
 * v2 fieldMaps in `src/entities.ts` must match them exactly).
 *
 * Only the client / contact / auth surface used in this phase is modelled. These
 * are compile-time references only; the wire creds (CustomerName/UserName/Password)
 * are injected by `src/http.ts` at send time and never live in a plan/preview.
 *
 * NOTE: every v2 request also carries `CustomerName`, `UserName`, `Password`
 * (RequestBase<T>). Those are added by the transport, so they are modelled here
 * as an optional mixin (`V2Credentials`) rather than required on each DTO.
 */

export interface V2Credentials {
  CustomerName?: string;
  UserName?: string;
  Password?: string;
}

/** `{}`-ish success marker returned by v2 delete/archive/restore routes. */
export interface DefaultResponse {
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Auth (POST /authenticate → UserInfo)
// ---------------------------------------------------------------------------

export interface UserInfo {
  authenticated: boolean;
  userType?: string;
  alert?: string;
  name?: string;
  companyName?: string;
  userId?: string;
  clientId?: string;
  photoUrl?: string;
}

export type AuthenticateRequest = V2Credentials;

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

/** POST /clients — filtered list (bare `List<ClientInfo>`). */
export interface ListClientsRequest extends V2Credentials {
  ClientId?: string;
  Name?: string;
  CenterId?: string;
  ThirdPartyAccountId?: string;
  ScreenPop?: string;
  CategoryIds?: string[];
  CustomFieldsFilter?: Record<string, string>;
}

/** POST /clients/save — create. */
export interface NewClientRequest extends V2Credentials {
  Name: string;
  CenterId?: string;
  Greeting?: string;
  CallInstructions?: string;
  PopupInformation?: string;
  Information?: string;
  ContractId?: string;
  Location?: string;
  ThirdPartyAccountId?: string;
  FaxNumber?: string;
  WebSiteUrl?: string;
  InformationCSV?: string;
  IndustryId?: string;
  CategoryId?: string;
  CategoryIds?: string[];
}

/** POST /clients/update — update (bespoke `New*` field names). */
export interface UpdateClientRequest extends V2Credentials {
  ClientId?: string;
  NewName?: string;
  NewCenterId?: string;
  CallInstructions?: string;
  Greeting?: string;
  PopupInformation?: string;
  Information?: string;
  ThirdPartyAccountId?: string;
  ContractId?: string;
  Location?: string;
  FaxNumber?: string;
  WebSiteUrl?: string;
  InformationCSV?: string;
  /** Set to empty string `""` to clear the industry reference. */
  IndustryId?: string;
}

export interface ClientIdRequest extends V2Credentials {
  ClientId?: string;
  ClientName?: string;
}

/** Partial view of the v2 ClientInfo response row. */
export interface ClientInfo {
  id?: string;
  name?: string;
  centerId?: string;
  centerName?: string;
  industryId?: string;
  industryName?: string;
  location?: string;
  thirdPartyAccountId?: string;
  dateLastModified?: string;
  entityStatus?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

/** POST /contacts — filtered list (bare `List<ContactInfo>`). */
export interface ListContactsRequest extends V2Credentials {
  ClientId?: string;
  CenterId?: string;
  ContactId?: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  ThirdPartyAccountId?: string;
  EmailAddress?: string;
}

/** POST /contacts/new — create. */
export interface NewContactRequest extends V2Credentials {
  ClientId: string;
  FirstName?: string;
  LastName?: string;
  Information?: string;
  GreetingOverride?: string;
  MoreInformation?: string;
  Alert?: string;
  Status?: string;
  LongDistanceCode?: string;
  CallInstructions?: string;
  Title?: string;
  ThirdPartyAccountId?: string;
  EmergencyInstructions?: string;
  TimeZoneId?: string;
}

/** POST /contacts/update — update. */
export interface UpdateContactRequest extends V2Credentials {
  ContactId?: string;
  FirstName?: string;
  LastName?: string;
  Information?: string;
  GreetingOverride?: string;
  MoreInformation?: string;
  Alert?: string;
  AlertExpirationDate?: string;
  Status?: string;
  StatusExpirationDate?: string;
  Location?: string;
  LongDistanceCode?: string;
  CallInstructions?: string;
  Title?: string;
  ThirdPartyAccountId?: string;
  EmergencyInstructions?: string;
  TimeZoneId?: string;
}

export interface ContactIdRequest extends V2Credentials {
  ContactId?: string;
  ContactPhoneNumber?: string;
}

/** Partial view of the v2 ContactInfo response row. */
export interface ContactInfo {
  id?: string;
  clientId?: string;
  clientName?: string;
  centerId?: string;
  centerName?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  status?: string;
  title?: string;
  dateLastModified?: string;
  entityStatus?: string;
  [key: string]: unknown;
}

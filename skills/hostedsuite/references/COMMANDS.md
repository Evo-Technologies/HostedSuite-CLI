# hs — command reference

Full per-command reference. SKILL.md has the safety rules and use-case patterns; this file has every
flag. All examples use placeholder tenants (`acme`, `acme.example.com`, `user@example.com`) — never a
real hostname or customer name.

## Global flags

Available on every leaf command.

| Flag | Purpose |
|---|---|
| `-j, --json` | Force compact JSON (default already when stdout is piped; on a TTY, unflagged output is pretty-printed) |
| `-p, --plain` | Tab-separated output, top-level scalars only (operates on `.items[]` for list envelopes) |
| `--select <fields>` (alias `--fields`) | Comma list of top-level fields to project (applied across `.items[]` for lists) |
| `--out <path>` | Write JSON to `<path>`; stdout becomes `{"path":"<resolved-absolute-path>"}` |
| `-n, --dry-run` | Print the planned `{method,path,query,body}` (or, for `patch`, a fetched-current field diff) and exit 0 without calling the API |
| `--no-input` | Never prompt (e.g. for a password); fail instead |
| `--force` (alias `--yes`) | Required for single `delete` and for `hs api` write methods. Does **not** bypass the bulk two-phase gate — no flag does |
| `-v, --verbose` | Verbose progress to stderr |
| `--quiet` | Suppress the routine tenant banner on stderr. Never suppresses safety notes (recent-switch warning, phase-1 instructions) |
| `--raw` | Disable casing/envelope normalization (see the wire body as-is). Credential redaction still applies |
| `--tenant <alias>` | Override the active tenant for this one call. Counts as a "switch" for the recent-switch guard. Rejected by `hs confirm` |
| `--timeout <ms>` | Per-request timeout override (default 30000) |

## Response shapes

| Command | Returns |
|---|---|
| `<noun> list` | `{ items: T[], totalCount?, totalPages? }` — v2 bare arrays are wrapped the same way |
| `<noun> get <id>` | The entity directly |
| `<noun> create` | The created entity |
| `<noun> patch <id>` | The updated entity (or, under `--dry-run`, `{dryRun:true, method, path, tenant, diff:[...], body}`) |
| `<noun> delete <id>` | `{ok:true}` or the server's (usually empty) body |
| `<noun> bulk-*` | Phase 1: `{requiresConfirmation:true, token, expiresAt, action, tenant, summary, affectedCount, previewPath, recentTenantSwitch}`, written directly to stdout (bypasses `--select`/`--out`) |
| `confirm <token>` | `{token, action, applied: N, failed: [{index,path,error}], failuresPath?}` |

`list` exits **3 (EMPTY)** — not an error — when `items` resolves to zero rows; `--out` still writes
the empty payload to disk first.

## tenant

```
hs tenant list
hs tenant add <alias> --base-url <url> --customer <name> --user <email>
               [--password <pw|->] [--api-version v2|v3]
hs tenant use <alias>
hs tenant current
hs tenant show [alias]
hs tenant remove <alias>
hs tenant probe [alias]
```

- `add` requires `--base-url`, `--customer`, `--user`. Password precedence for input:
  `--password` flag → `-` reads stdin → interactive hidden prompt (fails under `--no-input` or a
  non-TTY stdin). Stamps `tenantChangedAt` to now. If `--api-version` is omitted, probes the
  deployment (below) to classify v2/v3; the probe does **not** itself validate the password — a wrong
  password can still add and probe successfully as long as the route shape matches. First tenant added
  becomes the active tenant automatically.
- `use <alias>` switches the active tenant and re-stamps `tenantChangedAt` (this is what feeds the
  recent-switch guard — see SKILL.md).
- `show [alias]` (default: active) and `list` both redact the password to `"***"`.
- `remove <alias>` deletes the profile; clears `activeTenant`/`lastWriteTenant` if either pointed at it.
- `probe [alias]` (default: active) re-runs version detection and persists the result. Requires a
  resolvable password (flag/env/profile) — fails with exit 4 otherwise.

**Probe logic** (`hs tenant add` without `--api-version`, and `hs tenant probe`):
1. `GET /auth/info` — a 200 response whose JSON body has an `isAuthenticated` key (any value) ⇒ **v3**.
2. Otherwise `POST /authenticate` — any well-formed JSON object response (including an error-shaped
   one) ⇒ **v2**, since the route existing at all proves v2.
3. A network/TLS/DNS failure while probing throws exit 8 (retryable) — never silently misclassified.
4. Neither route responds with a well-formed body ⇒ exit 10, "not a HostedSuite API".

## whoami / auth

```
hs whoami                # top-level shortcut
hs auth whoami           # identical
hs auth check            # same fetch, plus exits 4 if not authenticated
```

`whoami`: v3 → `GET /auth/info`; v2 → `POST /authenticate`. Returns
`{tenant: {alias, baseUrl, customerName, apiVersion, userName, password:"***"|undefined,
tenantChangedAt}, auth: {...normalized server response...}}`. Run this before any write and after any
tenant pivot — it is the only ground truth; the stderr banner is cosmetic.

## confirm

```
hs confirm <token>
```

Executes a two-phase bulk plan. Always targets the tenant **pinned at phase-1 time** — ignores both
`--tenant` (usage error, exit 2, if passed) and whatever tenant is currently active. Token consumption
is atomic (the plan directory is renamed before any write is issued) — a second concurrent `confirm`
on the same token loses the race.

| Failure | Exit | Notes |
|---|---|---|
| Unknown / expired (>5 min) / already-consumed token | 4 | Re-run phase 1 for a fresh token |
| `--tenant` passed | 2 | Not allowed on `confirm` — remove the flag |
| Plan's pinned tenant no longer resolves (removed) or its `baseUrl`/`customerName` changed since phase 1 | 10 | Config drifted; re-run phase 1 |
| Any individual record fails | (still exit 1 overall) | Per-record failures are collected, not fail-fast; `failed[]` + `failuresPath` in the result |

Requests execute **serially** (no concurrency flag currently). Progress is appended to
`progress.json` after every record — a killed mid-run process leaves an accurate applied-set on disk,
usable to build a retry `--ids-file`.

## `<noun>` — generic entity commands

Every registry noun (table below) gets the same five verbs from one command factory, except
read-only nouns (`list`/`get` only) and the `system-settings` singleton (`get`/`patch`, no id).

```
hs <noun> list   [--page N] [--count N] [--all [--max N]] [--query <text>] [--ids a,b,c]
                 [--archived] [--brief] [--sort <field>] [--desc] [<entity filters>]
hs <noun> get    <id>
hs <noun> create -f <file|->
hs <noun> patch  <id> [-f <file|->] [--restore]
hs <noun> delete <id> --force [--hard]
```

### `list` flags

| Flag | v3 | v2 |
|---|---|---|
| `--page <n>` (0-based) | yes | rejected, exit 2 |
| `--count <n>` (CountPerPage) | yes | rejected, exit 2 |
| `--all` (client-paginates every page; hard cap 50,000 unless `--max`) | yes | rejected, exit 2 |
| `--max <n>` (raise the `--all` cap) | yes | rejected, exit 2 |
| `--ids a,b,c` | yes | rejected, exit 2 |
| `--archived` (include archived/deleted) | yes | rejected, exit 2 |
| `--brief` (id + display name only) | yes | rejected, exit 2 |
| `--sort <field>` / `--desc` | yes | rejected, exit 2 |
| `--query <text>` | contains match on name-ish fields | maps to the entity's `queryField` if one is defined, else exit 2 |
| entity-specific filters | per `v3.listFilters` | per `v2.list.filters` |

`--all`'s internal page size defaults to 200 (or `--count` if given) — separate from the plain `list`
default page size of 25.

### `get`

v3: direct `GET /<base>/{id}`. v2 (no single-get routes exist): emulated via `list` filtered by the
entity's `idFilterField`; zero results → exit 5 (not found).

### `create` / `patch` bodies

Always **v3 camelCase** in the `-f` file (or `-` for stdin), regardless of tenant version — e.g.
`{"name": "Acme", "centerId": "64ab..."}`. On a v2 tenant the CLI translates each key via the entity's
field map; **any key with no mapping exits 2**, naming the key, the entity, and the tenant's version.

`patch` needs `-f` and/or `--restore` — at least one. `--restore` maps to v3 `{"__Restore": true}`
(merged into the same PATCH) or the v2 `restore` route. `--dry-run` on `patch` fetches the current
record and prints a diff:

- Unchanged-by-null fields: `field: (null ignored — PATCH cannot clear via null)`
- Reference-clearing (`""` on an `...Id` field): `CLEARS REFERENCE centerId (was 64ab... "Downtown")`
- Ordinary changes: `field: oldValue → newValue`

### `delete`

Requires `--force`. v3: `DELETE /<base>/{id}` — always a soft archive, recoverable via
`patch --restore`; `--hard` is rejected (exit 2) since v3 has no separate hard-delete route. v2:
posts to the entity's `archive` route by default; `--hard` posts to `hardDelete` instead, if the
entity defines one — otherwise exit 9 naming which (`archive`/`hard delete`) isn't mapped.

## `<noun>` bulk-patch / bulk-archive / bulk-restore

Attached to every writable, non-singleton noun (not `email`, `completed-form`, `webhook-call`,
`ai-session-change`, or `system-settings`).

```
hs <noun> bulk-patch   (--ids a,b,c | --ids-file f | --query <text> | <entity filters>) -f <file|->
                       [--archived] [--max N]
hs <noun> bulk-archive (same selectors, no body)
hs <noun> bulk-restore (same selectors, no body)
```

- Selector required: `--ids`, `--ids-file` (JSON array, or newline/comma-delimited text, `-` for
  stdin), `--query`, `--archived`, or any entity filter flag. None supplied ⇒ exit 2. Selector
  resolves to zero records ⇒ exit 3, **no plan/token created**.
- Bulk-selector safety cap: 10,000 matched targets by default (`--max` raises it) — distinct from the
  50,000 cap on `list --all`. This cap and the underlying pagination loop apply to **v3** selector
  resolution only; v2 selector resolution is a single list call with whatever it returns (v2 has no
  general pagination mechanism to loop over), so `--max` has no effect there.
- **Always** gates — exits 11 with the phase-1 JSON (see Response shapes above) and never executes on
  the same invocation, regardless of match count.
- `bulk-patch` needs a v2 field map to run against a v2 tenant (currently only `client`/`contact`);
  other nouns exit 9 on v2. `bulk-archive`/`bulk-restore` work on both versions for any writable noun.
- Preview: first 10 records' diffs (patch) or method/path (archive/restore) print to stderr; the full
  per-record preview is written to the absolute `previewPath` from the phase-1 JSON.
- Plan storage: `~/.cache/hostedsuite/plans/<token>/{plan.json,preview.json}` (mode 600, no
  credentials). On `confirm`, renamed to `<token>.consumed/` containing `progress.json` and
  (if any failures) `failures.json`.
- `--dry-run` has **no additional effect** on `bulk-*` — phase 1 itself never applies a write (it only
  resolves targets and previews), so a bulk command behaves the same with or without the flag: it
  still creates a real plan/token and exits 11. There is no way to preview a bulk selector without
  creating a token; the token simply expires unused (5 min) if you decide not to confirm it.

## api

```
hs api <GET|POST|PATCH|PUT|DELETE> <path> [--query k=v ...] [-f <file|->]
```

Raw escape hatch on the active tenant. v2 tenants get body credentials injected automatically
(redacted from all output). Write methods (POST/PATCH/PUT/DELETE) individually require `--force`.
**Never loop this for bulk work** — it has no gate; use `bulk-patch`/`bulk-archive`/`bulk-restore`.

## report

```
hs report list
hs report run <name> [--param k=v ...] [--format xlsx|pdf|json] [--out <path>]
```

v3 only (exit 9 on v2). `report list` shows a representative, non-exhaustive subset — `report run`
accepts any `/reports/*` route name (with or without the leading `/reports/`), listed or not.
`--format xlsx|pdf` requires `--out` (binary streamed to disk, prints `{"path","bytes","format"}`);
`--format json` (default) prints inline or writes via `--out` through the normal JSON contract.
Report endpoints are concurrency-capped server-side (429 + `Retry-After`, retried automatically for
reads) — run them one at a time.

## file

```
hs file get    <fileId> --out <path>
hs file upload <noun> <id> <field> -f <path>
```

v3 only. `get` downloads `GET /files/{id}` and streams it to `--out` (required). `upload` posts one
image file (multipart) to `<base>/{id}/{field}` (e.g. `hs file upload center <id> invoiceLogo -f
logo.png`) — content-type is validated client-side against a fixed image extension list (`png jpg
jpeg gif webp bmp tif tiff svg ico heic`); anything else is rejected before the request is made, since
the server only accepts `image/*`.

## client ai-settings / prompt-lint

Attached only under `hs client` (AI settings ride the client entity's `aiSettings` field).

```
hs client ai-settings get <id>
hs client ai-settings set <id> -f <file|->
hs client prompt-lint <id>
```

v3 only (exit 9 on v2). `ai-settings get` fetches `GET /clients/{id}` and returns just `.aiSettings`
(exit 5 if absent). `ai-settings set` does `PATCH /clients/{id} {aiSettings: <body>}`; if the
*current* or *incoming* `configSource` is `"ResellerPortal"` it prints a loud warning (the write still
applies, but has no live effect — config is managed at the reseller portal) before writing.
`prompt-lint` walks every string field in `aiSettings` and lists any `{{SNIPPET ...}}` marker found
(these fail silently server-side when unresolved) — it only reports, it cannot resolve them.

## schema / exit-codes

```
hs schema [path...] --json      # full tree, or narrowed to a subtree, e.g. `hs schema client patch`
hs exit-codes --json
```

`schema` walks the live commander tree (same metadata `--help` renders from, so it can't drift) and
emits `{name, description, usage, aliases, arguments[], options[], subcommands[]}` recursively.

## Environment variables

| Variable | Purpose |
|---|---|
| `HS_PASSWORD` | Fallback password source (flag → `HS_PASSWORD` → stored profile → prompt) |
| `HOSTEDSUITE_CONFIG_DIR` | Override config dir (default `~/.config/hostedsuite`) |
| `HOSTEDSUITE_CACHE_DIR` | Override cache dir for bulk plans (default `~/.cache/hostedsuite`) |
| `HOSTEDSUITE_NO_BANNER` | Set to `1` to suppress the routine tenant banner globally |

## The entity registry

One declarative table (`src/entities.ts`) drives every `<noun>` command above. "v2" means the noun
has a working v2 mapping (list at minimum); a blank v2 column means the noun is v3-only and every
verb exits 9 on a v2 tenant.

| Noun | v3 base | v2 | Notes |
|---|---|---|---|
| `client` | `/clients` | yes (full CRUD) | `ai-settings`/`prompt-lint` attach here |
| `contact` | `/contacts` | yes (full CRUD) | v2 exposes `--first-name/--last-name/--email/--phone`; `--query`→`LastName` |
| `center` | `/centers` | — | |
| `charge` | `/charges` | — | `--client-id` filter |
| `service` | `/services` | — | |
| `industry` | `/industries` | — | |
| `category` | `/categories` | — | |
| `department` | `/departments` | — | |
| `calendar` | `/calendars` | — | |
| `contract` | `/contracts` | — | |
| `meeting-room` | `/meeting-rooms` | — | |
| `resource` | `/scheduled-resources` | — | |
| `reservation` | `/reservations` | — | body-id PATCH; server enforces ≤7-day list window (not yet client-validated) |
| `appointment` | `/appointments` | — | body-id PATCH; same 7-day note |
| `lead` | `/leads` | — | |
| `lead-source` | `/lead-source` | — | |
| `lead-stage` | `/lead-stages` | — | |
| `team-member` | `/team-members` | — | |
| `user-group` | `/user-groups` | — | |
| `administrator` | `/administrators` | — | |
| `webhook` | `/webhooks` | — | |
| `speed-dial` | `/speed-dials` | — | |
| `tax` | `/taxes` | — | |
| `relationship` | `/relationships` | — | |
| `responsibility` | `/responsibilities` | — | |
| `phone-system` | `/phone-systems` | — | |
| `form` | `/forms` | — | |
| `template` | `/templates` | — | client templates |
| `integration` | `/integrations` | — | |
| `reception-call` | `/reception-calls` | — | |
| `call-insight` | `/callinsights` | — | |
| `server` | `/servers` | — | |
| `ai-session` | `/ai-sessions` | — | legacy-cleanup entity only (§ SKILL.md); no apply/discard command exists |
| `email` | `/email` | — | read-only (`list`/`get` only) |
| `completed-form` | `/completed-forms` | — | read-only |
| `webhook-call` | `/webhookcalls` | — | read-only |
| `ai-session-change` | `/ai-session-changes` | — | read-only |
| `system-settings` | `/system-settings` | — | singleton: `get`/`patch` only, no id, no bulk |

### v2 field maps (client / contact)

The only two nouns with v2 write support. `create`/`update` map v3 camelCase keys to v2 PascalCase
field names; a key not listed here is rejected (exit 2) rather than silently dropped.

**`client` create** (`POST /clients/save`) — `name→Name`, `centerId→CenterId`, `greeting→Greeting`,
`callInstructions→CallInstructions`, `popupInformation→PopupInformation`, `information→Information`,
`contractId→ContractId`, `location→Location`, `thirdPartyAccountId→ThirdPartyAccountId`,
`faxNumber→FaxNumber`, `webSiteUrl→WebSiteUrl`, `informationCsv→InformationCSV`,
`industryId→IndustryId`, `categoryId→CategoryId`, `categoryIds→CategoryIds`.

**`client` update** (`POST /clients/update`) — same fields except `name→NewName` and
`centerId→NewCenterId` (renamed on update specifically; everything else unchanged, and
`categoryId(s)` is not updatable via this route).

**`contact` create** (`POST /contacts/new`) — `clientId→ClientId`, `firstName→FirstName`,
`lastName→LastName`, `information→Information`, `greetingOverride→GreetingOverride`,
`moreInformation→MoreInformation`, `alert→Alert`, `status→Status`,
`longDistanceCode→LongDistanceCode`, `callInstructions→CallInstructions`, `title→Title`,
`thirdPartyAccountId→ThirdPartyAccountId`, `emergencyInstructions→EmergencyInstructions`,
`timeZoneId→TimeZoneId`.

**`contact` update** (`POST /contacts/update`) — same as create minus `clientId`, plus
`alertExpirationDate→AlertExpirationDate`, `statusExpirationDate→StatusExpirationDate`,
`location→Location`.

Both entities' v2 `archive`/`restore`/`hardDelete` routes use `ClientId`/`ContactId` respectively as
the sole body field.

## Coverage

Every registry noun above already has `list`/`get` (+ `create`/`patch`/`delete` unless read-only, +
`bulk-patch`/`bulk-archive`/`bulk-restore` unless read-only or singleton) wired through the generic
command factory. `tenant`, `whoami`/`auth`, `confirm`, `api`, `report`, `file`,
`client ai-settings`/`prompt-lint`, `schema`, `exit-codes` are all implemented. What's *not* built:
per-entity v2 write support beyond `client`/`contact`; client-side ≤7-day pre-validation for
reservation/appointment windows; `--concurrency` on `confirm` (currently always serial); AI
plans/usage/onboarding (explicitly out of scope); any AI-session apply/discard/changes-review command
(explicitly out of scope — legacy MCP system, not used by this CLI).

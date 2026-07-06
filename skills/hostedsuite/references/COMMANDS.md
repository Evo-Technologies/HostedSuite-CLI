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
| `--tenant <alias>` | Override the active tenant for this one call. Highest priority in tenant resolution (`--tenant` flag > `HS_TENANT` env pin > config's active tenant). Counts as a "switch" for the recent-switch guard. Rejected by `hs confirm` |
| `--timeout <ms>` | Per-request timeout override (default 30000) |

Tenant resolution precedence is `--tenant` > `HS_TENANT` > the config's active tenant (see `## tenant`
and `## config` below). In **strict mode** (`require-tenant`), a command given neither `--tenant` nor
`HS_TENANT` exits **2** instead of silently falling back to the active tenant.

## Response shapes

| Command | Returns |
|---|---|
| `<noun> list` | `{ items: T[], totalCount?, totalPages? }` — v2 bare arrays are wrapped the same way |
| `<noun> get <id>` | The entity directly |
| `<noun> create` | The created entity |
| `<noun> patch <id>` | The updated entity (or, under `--dry-run`, `{dryRun:true, method, path, tenant, diff:[...], body}`) |
| `<noun> delete <id>` | `{ok:true}` or the server's (usually empty) body; a v2 `--hard` delete instead prints the phase-1 JSON (see `bulk-*` row) and exits 11 |
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

**Tenant resolution & strict mode.** Precedence: `--tenant <alias>` (per-call override) → `HS_TENANT`
env pin → the config's `activeTenant` (set via `use`). Setting `HS_TENANT=<alias>` in a shell/tab pins
every command run there to `<alias>` regardless of what `hs tenant use` sets elsewhere — the routine
banner renders `[<alias> · PINNED]` instead of `[<alias>]` so a pinned session is visually obvious.
**Strict mode** (`hs config set require-tenant true`, or `HS_REQUIRE_TENANT=1` for one session only)
refuses the final fallback: a command given neither `--tenant` nor `HS_TENANT` exits **2** rather than
silently acting on the active tenant — this stops a stale/forgotten tab from acting on the wrong
account. `hs tenant` management subcommands themselves are exempt (they must keep working with no
tenant selected).

**Probe logic** (`hs tenant add` without `--api-version`, and `hs tenant probe`):
1. `GET /auth/info` — a 200 response whose JSON body has an `isAuthenticated` key (any value) ⇒ **v3**.
2. Otherwise `POST /authenticate` — any well-formed JSON object response (including an error-shaped
   one) ⇒ **v2**, since the route existing at all proves v2.
3. A network/TLS/DNS failure while probing throws exit 8 (retryable) — never silently misclassified.
4. Neither route responds with a well-formed body ⇒ exit 10, "not a HostedSuite API".

## config

```
hs config list
hs config get <key>
hs config set <key> <value>
```

Persisted CLI settings — org-wide behavior toggles, not tied to any tenant (the command itself never
targets a tenant). Stored under `settings` in the config file (`~/.config/hostedsuite/config.json`).
Currently one key:

- `require-tenant` (bool: `true`/`false`/`1`/`0`) — strict mode. When on, every command must be
  given a tenant explicitly via `--tenant <alias>` or `HS_TENANT=<alias>`; the ambient active tenant
  (`hs tenant use`) is refused and the command exits 2 instead. `hs tenant` management subcommands are
  exempt — they keep working with no explicit tenant even in strict mode. `HS_REQUIRE_TENANT=1` forces
  it on for one session without persisting it.
  **Default when unset: ON once 2+ tenants are configured** (the wrong-tenant footgun only exists with
  multiple tenants; a single-tenant setup stays lax). `true` forces it on even single-tenant; `false`
  turns it fully off.

Example: `hs config set require-tenant false` — opt out of strict mode; allow the ambient active tenant.

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

## history / undo

Every write (`create`/`patch`/`delete`/`restore`, single and bulk, v2+v3) appends a before/after entry
to a per-tenant journal at `~/.cache/hostedsuite/journal/<alias>.jsonl`. Disable with `HS_NO_JOURNAL=1`.

```
hs history [--tenant <alias>] [-n <N=20>] [--all]   # recent ops: opId, ts, action, #records, (undone)
hs undo [<opId>]                                     # revert an op (default = latest not-yet-undone)
```

`hs undo` reverses each record: `update` → reverse-patch to the prior value, `create` → archive,
`delete` → restore, `restore` → archive. It **pins to the journaled tenant** (aborts, exit 10, if that
alias no longer maps to the same customer+host) and is **concurrency-safe**: any record whose current
state differs from the journaled `after` is **skipped** (never clobbers an intervening edit) and
reported in `skipped[]`. Result: `{ undone, reverted: N, skipped: [{id, reason}], newOpId }`. Undo is
itself journaled, so it is redoable (`hs undo <the-undo-opId>`).

**Limit:** undo reverts DATA only — it does not un-send notifications or un-fire webhooks. Not routed
through the bulk gate (it's an explicit recovery action), but it prints the tenant banner.

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

Two filter shapes recur across many entities' filter sets (both work identically on `list` and on
`bulk-*` selectors):

- **Date-range pairs** — `--<label>-after`/`--<label>-before` (e.g. `--created-after`/`--created-before`
  on nearly everything; `--charged-after`/`--charged-before` on `charge`; `--start-after`/`--start-before`
  on `reception-call`; `--completed-after`/`--completed-before` on `completed-form`). Each pair merges
  into one nested v3 `DateRangeFilter` (`{"dateCreated":{"start":...,"end":...}}`) — pass plain ISO dates
  to both flags and the CLI encodes the object correctly; you never build it by hand.
- **Repeatable array filters** — flags marked "(repeatable)" (`client --category-id`,
  `reservation --meeting-room-id`) may be passed more than once and collect into one array field
  (`categoryIds`, `meetingRoomIds`).

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

A v2 `--hard` delete is genuinely irreversible (no restore route), so it does not execute on this
invocation — it two-phase gates the same way as `bulk-*`: it prints the phase-1 JSON and exits **11**;
run `hs confirm <token>` to actually delete. It is also **not journaled** (no `hs undo` after the
fact — there's nothing to reverse). Plain `delete` (no `--hard`) and v3 delete are ordinary single
writes: not gated, and journaled/undoable via `hs undo`.

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
- `bulk-patch` needs a v2 `update` map to run against a v2 tenant — `client`/`contact`/`center`/
  `industry`/`reservation`/`reception-call` have one; other nouns exit 9 on v2. `bulk-archive` needs a
  v2 `archive` route (`client`/`contact`/`reservation`); `bulk-restore` needs a v2 `restore` route
  (`client`/`contact` only) — both exit 9 on v2 for nouns without the specific route mapped, even if
  `bulk-patch` works for that same noun.
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

## v2-only data & config commands

Standalone commands (not part of the `<noun>` registry, no `bulk-*`). Most have no v3 equivalent at all
— they exit 9 there. `time-zones` is the one that works unchanged on both versions; `dialing-rule`
splits (v3 read-only list, v2 full read/write).

```
hs call-allowance --start-date <d> --end-date <d> [--client-id <id>] [--bill-hold] [--bill-talk]
                   [--bill-transfer] [--bill-ring] [--call-rounding None|NextMinute|Next30Seconds]
                   [--min-duration <n>] [--max-duration <n>]
hs dialing-rule list
hs dialing-rule create -f <file|->                  # v2 only; body: name, template, centerId
hs dialing-rule update <id> -f <file|->              # v2 only
hs time-zones
hs remote-phones
hs availability room       --room-id <id> --start <ts> --end <ts>
hs availability resource   --resource-id <id> [--resource-id <id2> ...] --start <ts> --end <ts>
hs meeting-room-resources --meeting-room-id <id>
hs my-contacts <contactId>
```

| Command | v2 | v3 | Endpoint |
|---|---|---|---|
| `call-allowance` | yes | exit 9 (`hs report run call-allowance-report` instead) | `POST /call-allowance/balance` |
| `dialing-rule list` | yes | yes, read-only | v2 `POST /settings/dialing-rules`; v3 `GET /dialing-rules` |
| `dialing-rule create`/`update` | yes | exit 9 | `POST /settings/dialing-rules/new` / `.../dialing-rule/update` |
| `time-zones` | yes | yes | v2 `GET /settings/time-zones`; v3 `GET /time-zones` |
| `remote-phones` | yes | exit 9, no v3 equivalent | `POST /remote-phones` |
| `availability room` | yes | exit 9 | `POST /scheduling/check-availability` |
| `availability resource` | yes | exit 9 | `POST /scheduling/check-resource/availability` |
| `meeting-room-resources` | yes | exit 9, no v3 equivalent | `POST /scheduling/available-resources` |
| `my-contacts <contactId>` | yes | exit 9, no v3 equivalent | `POST /contacts/my-contacts` |

All are read-only except `dialing-rule create`/`update`. Those two are two-phase gated the same way as
`bulk-*` — a dialing rule write has no delete route (not undoable), so instead of writing immediately
it prints the phase-1 JSON and exits **11**; run `hs confirm <token>` to apply. There is no bulk form
of these commands — the gate is reused for a single-record write purely because it is irreversible,
same reasoning as a v2 `<noun> delete --hard`. Like hard-delete, these are **not journaled** (no `hs
undo` afterward). v3 tenants are read-only for dialing rules — `create`/`update` exit 9 there.

## reception-call — call records (CDR)

```
hs reception-call list [--call-type Voice|Text|AI] [--type Incoming|Outgoing|Transfer]
                       [--client-id <id>] [--center-id <id>] [--caller <text>]
                       [--min-duration <n>] [--max-duration <n>]
                       [--created-after/-before <date>] [--start-after/-before <date>]
hs reception-call get <id>
hs reception-call patch <id> (-f <file|-> | --restore)
hs reception-call create -f <file|->        # v3 only
hs reception-call delete <id> --force       # v3 only
hs reception-call bulk-patch -f <file|->    # v3: any field; v2: notes only
hs reception-call bulk-archive / bulk-restore    # v3 only
```

v3: full CRUD + bulk-* at `/reception-calls`, generated the same way as any other noun.

v2: this is the legacy **call records** surface — `list` is `POST /calls` (filters: `--start-date`,
`--end-date`, `--client-id`, `--center-id`, `--min-duration`/`--max-duration`,
`--call-type Incoming|Outgoing`); `get` is emulated via `list` filtered by `CallRecordId`; `patch`
(single or `bulk-patch`) maps only `notes` → `POST /calls/update` (`--restore` and every other field
are unmapped — exit 2/9). `create`/`delete`/`bulk-archive`/`bulk-restore` have no v2 mapping and exit 9.

## completed-form

```
hs completed-form list [--name <text>] [--form-id <id>] [--client-id <id>] [--contact-id <id>]
                       [--email-subject <text>] [--caller-number <text>]
                       [--created-after/-before <date>] [--completed-after/-before <date>]
hs completed-form get <id>
hs completed-form mark-read <formId>
```

Read-only on both versions — no `create`/`patch`/`delete`/`bulk-*`. v3: `/completed-forms`. v2: `list`
is `POST /forms/completed` (`--start-date`, `--end-date`, `--client-id`, `--form-id`); v2 has no id
filter, so `get` exits 9 there. `mark-read <formId>` is the one v2-only write (`POST /forms/mark-read`)
— exits 9 on v3.

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
| `HS_TENANT` | Pin the active tenant for this session/shell (e.g. a tab) to `<alias>`, overriding the config's active tenant. The routine banner shows `[<alias> · PINNED]`. A per-call `--tenant <alias>` flag still wins over the pin. Naming an alias absent from the config exits 10 |
| `HS_REQUIRE_TENANT` | Set to `1` to force strict mode for this session only (see `hs config set require-tenant true`), without persisting it |
| `HS_NO_JOURNAL` | Set to `1` to disable the write journal entirely (no reads, no writes) — `hs history`/`hs undo` have nothing to show while this is set |
| `HOSTEDSUITE_CONFIG_DIR` | Override config dir (default `~/.config/hostedsuite`) |
| `HOSTEDSUITE_CACHE_DIR` | Override cache dir for bulk plans (default `~/.cache/hostedsuite`) |
| `HOSTEDSUITE_NO_BANNER` | Set to `1` to suppress the routine tenant banner globally |

Tenant resolution precedence: `--tenant` flag > `HS_TENANT` env pin > the config's active tenant
(`hs tenant use`). See `## config` and `## tenant` above for strict mode and the `PINNED` banner tag.

## The entity registry

One declarative table (`src/entities.ts`) drives every `<noun>` command above. "v2" means the noun
has a working v2 mapping (list at minimum); a blank v2 column means the noun is v3-only and every
verb exits 9 on a v2 tenant.

| Noun | v3 base | v2 | Notes |
|---|---|---|---|
| `client` | `/clients` | yes (full CRUD) | `ai-settings`/`prompt-lint` attach here |
| `contact` | `/contacts` | yes (full CRUD) | v2 exposes `--first-name/--last-name/--email/--phone`; `--query`→`LastName` |
| `center` | `/centers` | partial (list/create/update/hard-delete) | no v2 `get` (no id filter) or archive/restore — plain `delete` (no `--hard`) exits 9 |
| `charge` | `/charges` | list + create only | v3 adds `--service-id`/`--contact-id`/`--memorized`/`--charged-after/-before` (dateOfCharge); v2 list uses `--start-date`/`--end-date`/`--date-selector` instead; no v2 update/delete/get |
| `service` | `/services` | list only | |
| `industry` | `/industries` | partial (list/create/update/hard-delete) | no v2 `get` or archive/restore |
| `category` | `/categories` | — | |
| `department` | `/departments` | — | |
| `calendar` | `/calendars` | — | |
| `contract` | `/contracts` | — | |
| `meeting-room` | `/meeting-rooms` | list + dedicated get | no v2 create/update/delete |
| `resource` | `/scheduled-resources` | — | |
| `reservation` | `/reservations` | yes (list/get/create/update/archive/hard-delete; no restore) | body-id PATCH; server enforces ≤7-day list window (not yet client-validated); v2 update is a full reschedule |
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
| `reception-call` | `/reception-calls` | list/get/patch (notes only) + bulk-patch | v2 = call-records/CDR surface via `/calls`; no v2 create/delete/bulk-archive/bulk-restore — see § reception-call |
| `call-insight` | `/callinsights` | — | |
| `server` | `/servers` | — | |
| `ai-session` | `/ai-sessions` | — | legacy-cleanup entity only (§ SKILL.md); no apply/discard command exists |
| `email` | `/email` | — | read-only (`list`/`get` only) |
| `completed-form` | `/completed-forms` | list only | read-only both versions; v2 `get` exits 9 (no id filter); v2-only `mark-read` action — see § completed-form |
| `webhook-call` | `/webhookcalls` | — | read-only |
| `ai-session-change` | `/ai-session-changes` | — | read-only |
| `system-settings` | `/system-settings` | — | singleton: `get`/`patch` only, no id, no bulk |

### v2 field maps (client / contact)

`client`/`contact` have the fullest v2 write support (create + update + archive/restore/hard-delete).
`center`/`industry`/`reservation`/`reception-call` also have partial v2 write support (a narrower
mapped subset — see the entity registry table above and, for `reception-call`, § reception-call).
Every `create`/`update` maps v3 camelCase keys to v2 PascalCase field names; a key not listed for that
entity is rejected (exit 2) rather than silently dropped. Full field maps below are given for
`client`/`contact` only (the two with the richest mappings) — the others are small enough to be fully
described by their table row / dedicated section.

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
command factory. `tenant`, `config`, `whoami`/`auth`, `confirm`, `history`/`undo`, `api`, `report`,
`file`, `client ai-settings`/`prompt-lint`, `completed-form mark-read`, the v2-only data/config commands
(`call-allowance`, `dialing-rule`, `time-zones`, `remote-phones`, `availability`,
`meeting-room-resources`, `my-contacts`), `schema`, `exit-codes` are all implemented. What's *not*
built: per-entity v2 write support beyond `client`/`contact`/`center`/`industry`/`reservation`/
`reception-call` (and even those are partial — see the entity registry); client-side ≤7-day
pre-validation for reservation/appointment windows; `--concurrency` on `confirm` (currently always
serial); AI plans/usage/onboarding (explicitly out of scope); any AI-session apply/discard/changes-review
command (explicitly out of scope — legacy MCP system, not used by this CLI).

**What's gated vs. undoable:** two-phase gating (phase 1 exits **11**, `hs confirm <token>` applies)
covers `bulk-patch`/`bulk-archive`/`bulk-restore` (gated for blast radius — but still journaled and
undoable via `hs undo` once confirmed), a v2 `<noun> delete --hard`, and `dialing-rule create`/`update`
(the latter two gated because they are genuinely irreversible — no delete/restore route — and are
**not** journaled). Every other write (`create`, `patch`, plain `delete`, v3 delete) is an ordinary
single write gated only by `--force`, and is journaled/undoable via `hs history`/`hs undo`.

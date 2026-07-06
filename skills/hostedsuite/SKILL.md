---
name: hostedsuite
description: Administer HostedSuite tenants via the hs CLI — look up and fix clients, contacts, centers, reservations, charges; run reports; manage AI settings; bulk-update records with confirmation gates; switch between tenant deployments (v2 and v3 APIs). Use whenever the user asks about HostedSuite data, tenants, clients, contacts, centers, reservations, AI sessions or settings.
allowed-tools: Bash(hs *), Bash(jq *), Bash(cat *), Bash(echo *), Bash(date *)
---

# hs — HostedSuite CLI

Thin, host-agnostic CLI over the HostedSuite REST API. No tenant is baked in — every deployment is
added at runtime with `hs tenant add`. List responses are always wrapped — use `jq '.items[]'`, not
`jq '.[]'`. Every tenant is production; there is no staging environment.

## ⚠ Tenant safety — read first

**Every configured tenant is a real production deployment.** There's no dev/staging distinction to
fall back on. The failure mode this guards against: the human says "do X" mid-conversation, you're
still pointed at the tenant from three turns ago, and every flag you fill in matches your own stale
state instead of theirs.

**Run `hs whoami` before any write, and again after any pivot** ("now do the same on Beta", switching
tenants, or right after `hs tenant add`). The stderr banner (`[acme] customer=Acme · acme.example.com
· v3 · user=user@example.com`) is informational only — `hs whoami`'s JSON is the source of truth.
`--quiet` silences the routine banner but never a safety note.

**Always pass `--tenant <alias>` explicitly on every command — never rely on the ambient active
tenant.** Another tab or session may have run `hs tenant use` and moved it out from under you; the
active tenant is shared mutable state. If the org runs **strict mode** (`hs config set require-tenant
true`, or `HS_REQUIRE_TENANT=1` in the environment), a command with no `--tenant` and no `HS_TENANT`
**errors (exit 2)** instead of silently falling back — that is the safe default. Otherwise a missing
tenant *silently uses whatever tenant is currently active*, which is exactly the stale-state footgun
above. A tab/session can also be **pinned** by exporting `HS_TENANT=<alias>`: every command in that
session then targets that tenant unless `--tenant` overrides it, and the banner tag shows `· PINNED`
(`[acme · PINNED]`) so it is obvious the session is locked. `--tenant` still wins over `HS_TENANT`,
which still wins over the active tenant.

**Hard deletes and dialing-rule writes are two-phase gated** (exit 11 → `hs confirm <token>`), like
bulk writes, because they **cannot be undone**: `hs <noun> delete <id> --hard --force` (v2 true delete,
no restore route) and `hs dialing-rule create` / `hs dialing-rule update` (rare config writes with no
delete/undo path). They build a plan and exit 11 with the same phase-1 contract as bulk — quote the
`summary` verbatim, get an explicit yes, then `hs confirm`. (A plain v3/v2 soft `delete` still archives
immediately and stays recoverable via `patch --restore` / `hs undo`.)

### Single writes: banner + dry-run, no gate

`create`, `patch`, single `delete` are **not** two-phase gated — support does dozens a day and a
approval step here is what killed the predecessor tool. In exchange:

- **Always `--dry-run` a `patch` first.** It fetches the current record and prints a field diff. PATCH
  ignores `null` (cannot clear a field that way) and treats an empty string `""` as "detach this
  reference" — the dry-run prints `CLEARS REFERENCE centerId (was 64ab... "Downtown")` for that case.
  If you see a CLEARS REFERENCE line you didn't intend, stop and confirm with the user before applying.
- `delete` requires `--force` (v3: soft-archives, recoverable via `patch --restore`; v2: same via the
  `--hard` opt-in for a true delete where mapped).
- A stderr `NOTE: this write targets a different tenant than your last write (acme → other) —
  re-verify with the user.` fires on single writes too, whenever the target tenant differs from the
  last one actually written to, or was switched-to/added within the last 10 minutes. This note is
  never suppressed by `--quiet`. Stop and re-verify before proceeding when you see it.

### State the tenant before any write

The human talks to **you** — they do not see the terminal, the banner, or `whoami`'s JSON. So the
only way they learn which account a change will hit is if **you tell them**. Before any write —
single or bulk — say which tenant it targets in plain language, e.g. *"On **Acme Corp** (prod), I'll
patch this 1 client's greeting."* Do this even for ungated single writes; it's the only feedback the
human gets before the change lands. If they meant a different account, they'll catch it here.
Mistakes are recoverable (see **Undo & history**), but surfacing the tenant first is your job.

### Bulk writes: two-phase, always

**Every** `bulk-patch` / `bulk-archive` / `bulk-restore` invocation is gated — 1 matched record still
gates, 0 matched records exits 3 with no token created. A bulk command **never executes on the first
call.** It resolves targets, computes a preview, writes a plan under a fresh token, prints phase-1
JSON to stdout, and exits **11**:

```json
{
  "requiresConfirmation": true,
  "token": "zX9k2pQa",
  "expiresAt": "2026-07-05T17:23:00Z",
  "action": "bulk-patch contacts",
  "tenant": {"alias":"acme","customerName":"Acme","baseUrl":"https://acme.example.com/api","apiVersion":"v3"},
  "summary": "PATCH 37 contacts on tenant Acme (acme.example.com) setting {\"status\":\"Inactive\"}",
  "affectedCount": 37,
  "previewPath": "/home/me/.cache/hostedsuite/plans/zX9k2pQa/preview.json",
  "recentTenantSwitch": false
}
```

**The protocol, no exceptions:**

1. **Quote the `summary` field VERBATIM** in your reply — it names the tenant in plain prose. Do not
   paraphrase it in a way that drops the tenant/customer name.
2. **Ask explicitly** for confirmation.
3. **Wait for an affirmative reply in the user's NEXT message.** Never infer confirmation from
   anything said earlier ("go ahead with all this") — each phase-1 needs its own fresh yes.
4. If `recentTenantSwitch: true` (or the stderr note fired), surface that to the user too, before
   asking — this plan was built right after a tenant pivot.
5. **Only then** run `hs confirm <token>`.
6. If the user says no, or you're unsure the tenant is right: do nothing. The token expires in 5
   minutes on its own. Never fabricate or reuse a token from an earlier turn.

**`hs confirm <token>` always executes against the tenant pinned at phase-1 time — it ignores
`--tenant` and the currently active tenant entirely** (passing `--tenant` to `confirm` is itself a
usage error). Switching tenants between phase 1 and confirm does **not** redirect the write. So: if
partway through the dance the user says "wait, actually run that on Beta instead" — **do not run `hs
confirm` on the Acme token.** Let it die, `hs tenant use beta`, `hs whoami`, and re-run phase 1 from
scratch on Beta.

**Never loop `hs api` writes as a substitute for bulk work.** If asked to "update these 12 contacts"
and you know the raw PATCH endpoint, use `bulk-patch`, not twelve `hs api PATCH` calls — the gate only
applies to `bulk-*`. `hs api` write methods (POST/PATCH/PUT/DELETE) individually require `--force`,
but that is single-write friction, not a bulk safety net. If the user explicitly insists on the loop,
explain that the gate exists for bulk safety and offer `bulk-patch` instead.

### Worked example

User: *"deactivate all Acme contacts with status Trial"*

```bash
hs tenant use acme
hs whoami
hs contact bulk-patch --query Trial -f patch.json   # patch.json: {"status":"Inactive"}
# → exit 11, stdout has requiresConfirmation:true, summary names "Acme"
```

Reply, quoting verbatim:

> "PATCH 37 contacts on tenant **Acme** (acme.example.com) setting `{\"status\":\"Inactive\"}`. Confirm to proceed?"

User: *"actually wait, I meant the Beta tenant"* → **do not confirm.** Let the token expire, then:

```bash
hs tenant use beta
hs whoami
hs contact bulk-patch --query Trial -f patch.json   # fresh phase 1, new token, on Beta
```

Only after a fresh explicit yes: `hs confirm <new-token>`.

## Install & setup

```bash
npm i -g hostedsuite-cli                # installs the `hs` binary
hs tenant add acme --base-url https://acme.example.com/api --customer Acme --user user@example.com
# prompts for the password, probes the API generation (v2 or v3), stamps tenantChangedAt
hs tenant use acme
hs whoami
```

The probe only classifies v2 vs v3 — it does **not** itself verify the password is correct (a
misconfigured password can still add and probe successfully). Always run `hs whoami` or `hs auth
check` right after `tenant add` to confirm auth actually works before doing anything else.

Non-interactive: `hs tenant add acme --base-url ... --customer ... --user ... --password - <<<"$PW"`
or set `HS_PASSWORD` in the environment. `--api-version v2|v3` skips the probe entirely.

## Response shape

Every `list` returns `{ items: [...], totalCount?, totalPages? }` regardless of API version — pipe to
`jq '.items[]'`, never `jq '.[]'`. `get`/`create`/`patch` return the entity directly. `delete` returns
`{ok:true}` or the server's (usually empty) body.

**Absent ≠ false on v3** (`ExcludeDefaultValues`) — a boolean field that's `false` may simply be
missing from the JSON. `jq 'has("aiEnabled")'` before trusting an apparently-missing flag.

`--raw` disables the camelCase/`{items}` normalization (useful to see the literal wire shape) but
credential redaction still applies — passwords never appear in output, even under `--raw`.

## v2 vs v3 tenants

The same command surface exists on both; `hs tenant show` reveals which API generation is active.
Reads are normalized to one shape either way. **Write bodies are always v3 camelCase** (`{"name":
"...", "centerId": "..."}`) — on a v2 tenant the CLI translates known fields internally; a field with
no translation for that entity **exits 2, naming the field and the tenant's API version.** It never
guesses or silently drops a field.

`client`/`contact` have the fullest v2 write support (create/update/archive/restore/hard-delete).
`center`/`industry`/`reservation`/`reception-call` also have partial v2 write support (a narrower
mapped subset — see COMMANDS.md's entity registry for exactly which verbs). Every other entity noun is
v3-only: on a v2 tenant, `hs lead list` (or any verb on a v3-only noun) **exits 9** naming the
limitation — `'lead list' is not available on this tenant; beta runs the v2 API`. Report this to the
user; don't retry or route around it.

List flags differ too: `--page/--count/--all/--max/--ids/--archived/--brief/--sort/--desc` are v3
only and exit 2 on a v2 tenant. `--query` maps to a per-entity field (clients → `Name`, contacts →
`LastName`); v2 contacts instead expose `--first-name/--last-name/--email/--phone`.

**v2-only data endpoints**: `call-allowance`, `remote-phones`, `availability` (room/resource),
`meeting-room-resources`, and `my-contacts` have no v3 equivalent — they exit 9 there. `dialing-rule`'s
write verbs (`create`/`update`) are v2-only too (its `list` also works read-only on v3). `time-zones`
is the one exception that works unchanged on both API generations. See COMMANDS.md for each one's
flags and underlying endpoint.

Call records ride `hs reception-call list/get/patch` — it works on **both** versions. v3 has full
CRUD + bulk-*; v2 only maps `list`/`get` (emulated) and `patch`/`bulk-patch` (edits `notes` only, via
the legacy `/calls` routes) — v2 `create`/`delete`/`bulk-archive`/`bulk-restore` exit 9.

## Large payloads

`--out <path>` writes the JSON to disk and prints `{"path":"..."}` to stdout instead of dumping the
body into context — the standard move before `jq`:

```bash
hs client list --query acme --out /tmp/clients.json
jq '.items | length' /tmp/clients.json
jq '[.items[] | {id, name, centerId}]' /tmp/clients.json
```

`--brief` (v3) drops detail to id + display name only; `--select id,name,status` (or `--fields`, same
thing) projects to specific top-level fields (applied across `.items[]` for list envelopes). `--all`
paginates every page client-side (v3 only; hard-stops at 50,000 items unless `--max` raises it — this
is a different, separate cap from the bulk-selector cap below). For a scan across hundreds/thousands
of records, delegate to a sub-agent with the on-disk path rather than pulling it into main context.

## Finding & fixing records

```bash
# v3: --query is a case-insensitive contains match
hs client list --query acme --select id,name,centerId --plain

# v2 clients: --query maps to Name; v2 contacts: use --last-name/--email/--first-name/--phone instead
hs contact list --last-name Smith --client-id <id>

hs client get <id>
```

Most `list` commands also take a date-range filter pair — `--<field>-after`/`--<field>-before`
(`--created-after`/`--created-before` almost everywhere; per-entity variants like charges'
`--charged-after`/`--charged-before` or reception-call's `--start-after`/`--start-before`). Just pass
plain ISO dates to both flags — the CLI encodes the nested server-side range object correctly, it just
works.

Then a targeted patch with only the changed fields, **dry-run first**:

```bash
echo '{"status":"Inactive"}' > /tmp/patch.json
hs client patch <id> -f /tmp/patch.json --dry-run     # prints the field diff
hs client patch <id> -f /tmp/patch.json               # apply
```

Un-archive: `hs client patch <id> --restore` (a flag on `patch`, not a separate verb — combine with
`-f` to restore and change fields in one call). Soft-delete: `hs client delete <id> --force` (v3
archives, recoverable; v2 archives by default, `--hard` opts into the true delete route where one
exists — see COMMANDS.md for which entities have it).

**The CLEARS-REFERENCE footgun**: on v3, PATCH applies only non-null fields — `null` is silently
ignored, so you cannot use `null` to clear a reference. The *only* way to detach an `xId` reference
field is `""`. Always `--dry-run` a patch touching a reference field and read the `CLEARS REFERENCE`
line (it shows the value being detached, e.g. the center name) before applying it for real.

Reservations and appointments PATCH by **body id**, not path id (`{"id": "...", ...}` in the body,
not `/reservations/{id}`) — the CLI handles this transparently; you never need to think about it.
The server also enforces a ≤7-day window on their `list`/bulk-selector date ranges — the CLI does not
currently pre-validate this client-side, so an over-wide `--from`/`--to` fails server-side; narrow it
yourself if you hit that error.

## Bulk updates

```bash
# Preview only — this ALWAYS gates, even for a single matched record
hs contact bulk-patch --query Trial -f /tmp/patch.json
# → exit 11; full per-record diff at the previewPath in the JSON; first 10 shown on stderr

# Selector matched nothing:
hs contact bulk-patch --query nonexistent -f /tmp/patch.json
# → exit 3 (EMPTY), no token/plan created

# After the human confirms (see the safety section above):
hs confirm zX9k2pQa
# → { token, action, applied: 37, failed: [] }  (exit 0 if all applied, exit 1 if any failed)
```

Selectors: `--ids a,b,c`, `--ids-file path.json` (JSON array or newline/comma-delimited, `-` for
stdin), `--query <text>`, `--archived` (resolve from archived rows, e.g. to build a `bulk-restore`
list), or any of the entity's list filter flags. At least one is required. The bulk-selector safety
cap is 10,000 matched targets by default (`--max` raises it) — a **separate, smaller** cap than the
50,000 used by `list --all`.

`bulk-archive`/`bulk-restore` take the same selectors with no `-f` body (fixed archive/restore
requests); on v3 they work for any writable entity. `bulk-patch` needs a per-entity v2 update map to
work on v2 tenants — `client`/`contact`/`center`/`industry`/`reservation`/`reception-call` have one,
other nouns exit 9. `bulk-archive`/`bulk-restore` need v2 archive/restore routes specifically, which is
a narrower set still (see COMMANDS.md's entity registry) — don't assume bulk-patch support on a v2 noun
implies bulk-archive/bulk-restore support too.

If `hs confirm` is killed mid-run, `progress.json` next to the consumed plan shows exactly which
records were already applied — build a retry `--ids-file` from the unapplied set (or the
`failuresPath` the command reports) and re-run phase 1 fresh; a consumed token is never resurrected.

## Undo & history

Every write is journaled (before + after, per record, per tenant) — so a mistake is one command to
reverse. This is the recovery net that lets single writes stay ungated.

```sh
hs history                       # recent operations on the active tenant: opId, action, #records, (undone)
hs history --tenant beta -n 50   # a specific tenant, more rows
hs undo                          # revert the most recent not-yet-undone operation
hs undo mr9l60ku-4705c8          # revert a specific operation by opId
```

`hs undo` reverses each record the way you'd expect: a field patch goes back to its prior value, a
create is archived, a delete is restored. It **pins to the operation's tenant** (aborts if that alias
no longer maps to the same customer+host), and it is **concurrency-safe** — it SKIPS any record that
changed since your write (so it never clobbers someone else's edit) and reports which it skipped
(`reverted: N, skipped: [...]`). Undo is itself journaled, so it's redoable.

When the user says "undo that" / "put it back" / "revert", use `hs undo` (or `hs history` first to
pick the right op). **One caveat to tell them:** undo reverts the **data**, not side effects — it does
not un-send notifications or un-fire webhooks. For a change that triggers integrations (e.g. anything
that fires a webhook to the reseller portal), say plainly that those already went out.

## AI settings

AI settings ride the normal `client` entity (`aiSettings` field on `GET`/`PATCH /clients/{id}`), v3
only:

```bash
hs client ai-settings get <id> --out /tmp/ai.json
echo '{"aiEnabled":true}' > /tmp/ai.json
hs client ai-settings set <id> -f /tmp/ai.json --dry-run
hs client prompt-lint <id>          # flags unresolved {{SNIPPET ...}} markers
```

**ResellerPortal gotcha**: if `aiSettings.configSource == "ResellerPortal"`, HostedSuite ignores local
edits — that client's AI config is managed externally, in a separate reseller portal. `ai-settings
set` warns loudly when it detects this (current or incoming), but still applies the write if you
proceed; tell the user the change had no effect on live AI behavior.

AI plans/usage/onboarding are **out of scope** — a separate product now; say so if asked, don't try to
wrap those routes. The legacy MCP AI-session preview/approval system is not used by this CLI at all;
`hs ai-session list/get/delete` exists only to find and clean up leftover legacy sessions (archived
sessions' MCP URLs keep working, which is exactly why cleanup matters) — there is no apply/discard
command and none should be invented.

## Reports

```bash
hs report list                     # a representative subset; run <name> accepts ANY /reports/* route
hs report run client-excel-report --param from=2026-01-01 --param to=2026-06-30 \
  --format xlsx --out /tmp/report.xlsx
hs report run utilization-report --format json     # json prints inline (or --out)
```

v3 only. Binary formats (`xlsx`/`pdf`) require `--out`. Report endpoints are concurrency-capped
server-side — run them serially, don't fan out several `report run` calls in parallel.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `errorCode: Unauthorized` / exit 4 | Bad/stale credentials. `hs whoami`, re-check `hs tenant show`. |
| exit 9 `NOT_IMPLEMENTED` | Wrong API generation for this noun/verb. Report the limitation — don't retry. |
| exit 11 `CONFIRMATION_REQUIRED` | Bulk phase 1. Quote `summary` verbatim, get an explicit yes, then `hs confirm`. |
| `hs confirm` exit 4 | Token unknown/expired (5 min TTL)/already consumed. Re-run phase 1 for a fresh one. |
| `hs confirm` exit 10 | The pinned tenant's config changed since phase 1 (removed/edited). Re-run phase 1. |
| `hs confirm --tenant x` | Usage error — confirm never takes `--tenant`; drop the flag. |
| `jq '.[]'` returns nothing on `list` | Use `jq '.items[]'` — lists are always wrapped. |
| exit 3 `EMPTY` on a `list` | 0 matching records — not an error; narrow or accept the empty set. |
| Reservation/appointment list fails oddly | Check the date window — server caps it at 7 days. |
| `NOTE: ... different tenant than your last write` | Re-verify the tenant with the user before writing. |
| Unmapped field on v2 write, exit 2 | That field has no v2 translation for this entity — use only mapped fields. |
| `"***"` in output where a value should be | Working as intended — credential redaction, not a bug. |

## Introspection

```bash
hs schema --json                 # full command tree
hs schema client patch --json    # one subtree
hs exit-codes --json             # exit-code map
hs <noun> <verb> --help          # flags + example + Safety: section, always present
```

## Exit codes

`0` ok · `1` err · `2` usage · `3` empty result · `4` auth · `5` not-found · `6` forbidden ·
`7` rate-limit · `8` retryable upstream · `9` not-implemented (wrong API generation) · `10` config ·
**`11` confirmation-required**

## Reference

See [references/COMMANDS.md](references/COMMANDS.md) for the full flag table, the entity registry,
and v2 field maps. See [references/SKILL-TESTS.md](references/SKILL-TESTS.md) for the behavior
checklist used to validate this file.

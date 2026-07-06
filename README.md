# hostedsuite-cli

Command-line interface for **HostedSuite** — built for support staff and AI agents (Claude Code).
Installs the `hs` binary and a paired Claude Code skill.

`hs` is a thin, fully self-documenting CLI over the HostedSuite REST API. It is **host-agnostic**:
there are no default hosts baked in. You add each tenant deployment at runtime with `hs tenant add`,
and every command targets whichever tenant is active (or the one named by `--tenant`).

## What it does

- Look up and correct **client**, **contact**, **center**, **reservation** and related records.
- Run **reports** and download **files**.
- Perform **guarded bulk updates** across tenant deployments.
- Present **one read contract** regardless of the tenant's API generation — responses come back as
  camelCase JSON wrapped in an `{ items: [...] }` envelope, so you can pipe straight to `jq`.
- Ship with a companion **Claude Code skill** that teaches agents how to drive it safely.

Every command is documented via `--help`, and every write prints a `Safety:` help section describing
its gate behavior.

## Install

Published to npm under the Evo team:

```sh
npm install -g hostedsuite-cli
```

This puts the `hs` binary on your PATH.

Install the companion Claude Code skill:

```sh
npx skills add -g Evo-Technologies/HostedSuite-CLI
```

## Quick start

All examples below use **placeholder** values — substitute your own tenant details.

```sh
# 1. Add a tenant (the CLI probes whether it speaks the v2 or v3 API for you).
hs tenant add acme \
  --base-url https://acme.example.com/api \
  --customer acme \
  --user user@example.com

# 2. Make it the active tenant.
hs tenant use acme

# 3. Confirm who you are talking to.
hs whoami

# 4. Read freely.
hs client list --query acme
hs client get <id> --json
hs contact list --client-id <id> | jq '.items[]'

# 5. Single writes require --force and print a tenant banner first.
hs client patch <id> -f patch.json --dry-run   # preview the field diff
hs client patch <id> -f patch.json --force
```

The active tenant, `--tenant <alias>`, and stored credentials are read from your local config at
runtime. Credentials are **never** printed — they are redacted to `***` in every banner, dry-run,
error, log, and stored plan file.

## Safety model

Every HostedSuite tenant is production, so `hs` layers three guardrails:

1. **Tenant banner.** Before any write, `hs` prints the target tenant to stderr —
   `[acme] customer=acme · acme.example.com · v3 · user=user@example.com` — so you always see which
   deployment you are about to change. A **recent-switch note** additionally fires if you are writing
   to a tenant you just switched to or have not written to recently.

2. **Bulk operations are two-phase, always.** `bulk-patch`, `bulk-archive`, and `bulk-restore` never
   execute on first invocation. They resolve the target set, build a **credential-free** plan under a
   fresh token, print a phase-1 summary (agent-parseable JSON on stdout, human summary on stderr), and
   exit `11`. This holds even for a single target. `--force` does **not** bypass this gate. Zero
   matches exit `3` and create no token.

3. **`hs confirm <token>`.** Phase 2 executes the plan against the tenant that was **pinned at phase 1**
   — it ignores `--tenant` and the current active tenant, so you cannot accidentally redirect a
   confirmed batch to the wrong deployment. Tokens are single-use and time-limited; a consumed or
   expired token is rejected before any write.

```sh
hs client bulk-archive --query "old account"
#   → prints a summary and a token, exits 11
hs confirm <token>
#   → executes against the pinned tenant, writes progress + failures artifacts
```

## Exit codes

`hs exit-codes` prints the full machine-readable map. In brief: `0` success, `2` usage, `3` empty
result, `4` auth, `5` not found, `6` forbidden, `7` rate limited, `8` retryable, `9` not implemented
on this API version, `10` config, `11` bulk confirmation required.

## Coverage & phase note

`hs` ships in phases. The entity registry currently covers `client` and `contact` on **both** the v2
and v3 APIs, plus the full v3 operational and CRM surface (centers, reservations, charges, services,
leads, and more). Nouns that exist on only one API generation exit `9` with an explanatory message on
the other — `--help` stays identical everywhere so the boundary is taught rather than hidden.
Additional v2 nouns and later-phase features (scheduling window guards, file uploads) are filled in
subsequent phases.

## License

[MIT](LICENSE)

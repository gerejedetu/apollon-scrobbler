# Scrobbler: guide for coding agents

A ListenBrainz-compatible scrobbler that runs on Cloudflare Workers (Hono + D1 + KV), with accounts and
user tokens from Better Auth. Monorepo managed by Vite+ (`vp`) and pnpm workspaces.

## Layout

```
apps/
  api/            Hono Worker: ListenBrainz API v1 under /1, Better Auth under /api/auth
packages/
  types/          Wire (ListenBrainz) and domain types. No runtime code.
  core/           Business rules behind ports. No I/O, no Cloudflare, no Better Auth.
  db-d1/          D1 implementation of core's Repositories + all SQL migrations
  cache-kv/       Workers KV implementation of core's Cache
  auth/           Better Auth setup (username + API key plugins) + core's TokenVerifier
  testing/        Node-only doubles: D1 on node:sqlite, KV in memory
```

## Dependency rules (keep them)

- `types` depends on nothing. `core` depends only on `types`.
- Adapters (`db-*`, `cache-*`, `auth`) depend on `core` and `types`, never on each other or on apps.
- Only `apps/api/src/http/container.ts` picks concrete adapters. Routes talk to `c.var.services` only.
- `testing` and every `*/testing` subpath are for tests: never import them from runtime code.
- Internal packages are consumed as TypeScript source (`exports` points to `src/index.ts`); no build step.
- Imports use explicit `.ts` extensions. One module per folder with an `index.ts` or a named file; no catch-all utils.

## Adding a storage backend

Implement `Repositories` from `@scrobbler/core` (see `packages/db-d1/src/repositories/*` for the reference
behaviour) in a new `packages/db-<name>`, test it with the same cases as `packages/db-d1/tests`, then switch
the container. Better Auth needs its own adapter for that database too.

## Database (D1)

- Migrations live in `packages/db-d1/migrations`, applied by wrangler (`vp run @scrobbler/api#db:migrate:local`).
- `0001_auth.sql` is generated: `vp run @scrobbler/auth#migration` prints it. Regenerate when Better Auth or its plugins change, and add a new numbered migration for the difference rather than editing an applied one.
- Query budget matters (D1 limits statements per invocation, 100 bound parameters per statement, rows read/written are billed):
  - batch inserts go through one `json_each` statement per ~900 KB of listens;
  - `users.listen_count` is maintained in the same batch via `changes()`, never by counting;
  - every listen read is bounded by the `(user_id, listened_at, track_name)` index;
  - stats are cached in KV, keyed by the user's listen count (new listens invalidate naturally).
- Tests assert round trips through `SqliteD1.roundTrips`; keep hot paths at one round trip.

## Auth

- Accounts, sessions and API keys are Better Auth's (`user`, `session`, `account`, `verification`, `apikey`).
- A ListenBrainz user token is a Better Auth API key, sent as `Authorization: Token <key>`.
- The scrobbler profile (`users` row) is created by the `user.create.after` hook; its `name` is the username.
- Token checks are cached per isolate for 60 s (`AUTH_CACHE_TTL`), so a revoked key keeps working up to that long.

## Commands

```
vp install            # after pulling
vp check --fix        # format, lint, type-check
vp run -r test        # all tests
cd apps/api && vp run dev   # local Worker on :8787 (copy .dev.vars.example to .dev.vars first)
```

## Conventions

- Errors leave the API as `{ "code": <status>, "error": "<message>" }` (`ApiError` in core).
- Timestamps are Unix seconds (UTC) everywhere.
- Every module gets tests; behaviour that mirrors ListenBrainz cites its rule in a comment.
- Never commit secrets: `.dev.vars` and `.env*` are ignored; production secrets go through `wrangler secret put`.

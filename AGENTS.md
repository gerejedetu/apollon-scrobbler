# Scrobbler: guide for coding agents

A ListenBrainz-compatible scrobbler that runs on Cloudflare Workers (Hono + D1 + KV), with accounts and
user tokens from Better Auth. Monorepo managed by Vite+ (`vp`) and pnpm workspaces.

## Layout

```
apps/
  api/            Hono Worker. src/protocols/native → /v1 (own JSON API, OpenAPI at /v1/openapi.json),
                  src/protocols/listenbrainz → /1 (ListenBrainz-compatible), Better Auth → /api/auth
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
- A protocol (`apps/api/src/protocols/<name>`) only maps its wire format to core services; rules live in core,
  so every protocol behaves the same. A new protocol (e.g. Last.fm) is a new folder mounted in `app.ts`.
- The native API is documented by hand: shapes in `protocols/native/openapi.ts`, prose (overview, tags, operation and parameter descriptions, examples) in `openapi-docs.ts`. Tests check every documented path is routed, every response field is documented, and every operation/parameter has a description. Served at `/v1/openapi.json`, browsable at `/v1/docs`.
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
- Private profiles (`users.is_private`): every read of a user's data goes through `readableUser()` (apps/api/src/http/require-user.ts), which 404s for anyone but the owner. New read routes must use it.
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
- Never commit secrets or account-specific IDs: `.dev.vars`, `.env*` are ignored; production secrets go through `wrangler secret put`. `wrangler.jsonc` keeps placeholder D1/KV IDs; the real ones live in `apps/api/.env.cloudflare` and `vp run deploy` / `vp run db:migrate:remote` inject them.

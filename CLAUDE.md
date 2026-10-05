# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a personal assignment tracker, built mainly as a **distributed-systems learning project**: microservices, gRPC, a message queue, cache-aside, and a CQRS-style read model. It is deliberately over-engineered for the problem it solves. That scope is intentional, so don't try to simplify it away.

The stack is TypeScript throughout: a React frontend, an Express API gateway, and gRPC backend services (`auth`, `assignment`, `notification`, `stats`). Everything runs in Docker Compose. There is no root workspace: each of `frontend/`, `gateway/`, and `services/*/` is its own pnpm package with its own lockfile, `node_modules`, `tsconfig.json`, `.oxlintrc.json`, and `.oxfmtrc.json`. Service folders have no `-service` suffix (`services/auth`), while compose service names do (`auth-service`). There are no tests yet.

## Commands

Run the full stack (dev) from the repo root. These are also the VS Code tasks in `.vscode/tasks.json`:

```sh
docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml up --build
docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml down
```

For prod-style testing, swap in `.env.prod` and `docker-compose.prod.yml`. Env files are always passed explicitly with `--env-file`; there is no default `.env`. Required vars are listed in `.env.template`.

Run these from inside a package directory (`gateway/`, `services/<name>/`, `frontend/`):

```sh
pnpm install
pnpm dev               # nodemon: tsc then node dist/index.js on src/ changes (frontend: vite on :3000)
pnpm build             # tsc -> dist/ (frontend: tsc -b && vite build)
pnpm exec oxlint       # lint (frontend also has `pnpm lint`)
pnpm exec oxfmt        # format (frontend also has `pnpm format`)
pnpm proto:generate    # backend packages only; regenerate gRPC TS from ../proto (requires protoc)
```

A local, untracked `.git/hooks/pre-commit` (zsh) runs `pnpm oxlint`/`oxfmt` on staged `.ts`/`.tsx` files. It groups files by their nearest `package.json`, uses `(cd "$PKG_DIR" && pnpm ...)` subshells because `pnpm --dir` was unreliable, and re-stages the formatted files. It needs `grealpath` (`brew install coreutils`). Watch for zsh-specific splitting when editing it: `${(f)VAR}` splits on newlines and `${=VAR}` splits on words.

## Architecture

### Communication patterns

Each of these is deliberately a different pattern:
- **gRPC** (sync request/response): gateway ↔ services, insecure, inside `backend_net`. The gateway exposes REST at `/api/v1/*` on :8080.
- **RabbitMQ** (async fan-out): Assignment Service publishes events like `assignment.created`, `assignment.completed`, and `assignment.due_date_changed`. Notification and Stats each subscribe independently. The fan-out is why this isn't a direct service call.
- **Redis cache-aside**, used twice with the same pattern: (1) Assignment Service read-heavy queries, (2) Stats Service's only storage.
- **Redis for fast revocation**: this backs `token_version` checks (see Auth). It is not caching for speed.

Only the gateway and frontend are exposed to the host in prod. In compose, the frontend is on `frontend_net` only, and the gateway connects both networks.

### Services

| Service | Port | Storage | Role |
|---|---|---|---|
| `auth-service` | 50051 | Postgres `postgres-auth` + Redis | Google OAuth, JWT issuance, owns `users` |
| `assignment-service` | 50052 | Postgres `postgres-assignment` + Redis | Semesters/classes/assignments/types; publishes events |
| `stats-service` | 50053 | Redis only | Dashboard aggregates |
| `notification-service` | — | (planned table) | In-app due-date reminders |

- **Semesters, classes, and assignments are one bounded context** (a strict containment hierarchy with constant joins), so they are deliberately not split into separate services.
- **Stats is a rebuildable read model, not a source of truth**, which is why it has no Postgres. On a cache miss it calls Assignment Service and computes the aggregates. On any assignment event it `DEL`s that user's cached aggregate instead of patching it incrementally, which is simpler and correct by construction. TTL is only a safety net.
- **Notification is for in-app reminders, not a generic relay.** The plan: the gateway owns the WebSocket per user (an in-memory `user_id → socket` map), Notification calls the gateway over gRPC to push, and a persisted notifications table backs a feed for offline users, since push is fire-and-forget. It also needs a scheduled "due in 24h" check, because reminder time ≠ event time.
- **Database-per-service:** `user_id` in the assignment DB is a plain UUID with no FK to `users`. It is trusted from the already-verified JWT. A `user.deleted` event from Auth was discussed and deliberately deferred.

### Protobuf / gRPC

`proto/*.proto` is the source of truth. Currently only `authentication.proto` (`AuthenticationService`) exists; `assignment.proto` and `stats.proto` still need to be written. Generated code (ts-proto with `outputServices=grpc-js`) is committed to each package under `src/generated/`, so after editing a `.proto` you must regenerate it in **every** package (gateway and each service). Never hand-edit `src/generated/`. ts-proto converts snake_case fields to camelCase (`google_auth_token` → `googleAuthToken`).

### Backend service layering

This pattern is established in `services/auth/src/`; follow it in the other services:
- `index.ts` builds the clients (pg `Pool`, redis) and wires Repository → Service → `startServer`.
- `repository/` holds an interface (`AuthRepository`) plus an `*Impl` for data access via `pg`. New IDs are `uuid` v7.
- `service/` holds an interface (`AuthService`) plus an `*Impl` for business logic.
- `grpcImpl.ts` adapts the service interface to the generated `*Server` type and routes errors through `handleMicroserviceError`.
- `error/MicroserviceError.ts` carries a `code`, a `userFacingMessage` (sent over gRPC), and a `loggingMessage`.

### Auth

- Google OAuth was chosen so the app never owns passwords. The client ID is public (frontend). The client secret lives **only** in Auth Service.
- Users are upserted by `google_id`, not email, because email can change. Name, email, and avatar are overwritten from Google on every login. There's no password field and no "change Google account" feature.
- The JWT has a 7-day TTL and embeds `tokenVersion`. Revocation works by comparing that claim against `users.token_version`, cache-aside in Redis under `token-version:{userId}` (`SoftValidateJwt`). **Logout bumps the version and kills every session on every device.** This is a deliberate simplification, with no separate per-device logout. Account deletion is a soft delete (`deleted_at`) and also clears the Redis key.
- The frontend login flow is still in progress (`Login.tsx` has a TODO for posting to the backend). The frontend plans to store the JWT in `localStorage`, an accepted trade-off at this scale.

### Schema notes

The schemas live in `services/<name>/init.sql`.
- `user_id` is deliberately denormalized onto `classes` and `assignments` so the hottest query ("my assignments") avoids a 3-way join.
- `assignments.done` is deliberately binary. The goal is tracking submission, not grading state.
- `init.sql` is mounted into `docker-entrypoint-initdb.d`, so it **only runs on an empty data volume**. If a schema change isn't showing up, first check whether the volume was actually wiped. There's no migration tool yet.

### Gateway and frontend

- **Gateway:** `initAPI.ts` sets up the middleware (rate limit, helmet, morgan, body/cookie parsers) and listens on `process.env.PORT`. `index.ts` mounts routers from `endpoints/` under `/api/v1/...` and puts `errorHandler.ts` last. The error handler returns details only when `NODE_ENV=development`. The gateway is also the planned owner of the notification WebSockets.
- **Frontend:** React 19, Vite, Tailwind v4, and `react-router` (not `react-router-dom`), with the React Compiler enabled through babel. Shared components live in `src/components/` and routes in `src/pages/`. Config comes from `VITE_GOOGLE_CLIENT_ID` and `VITE_API_BASE_URL`. In prod it is served by nginx.

## Conventions

- Each source file starts with a two-line header comment: `// fileName.ts` followed by `// short description`.
- Interfaces are documented with JSDoc that includes `@throws {MicroserviceError}`.
- Formatting follows oxfmt: 4-space indent, 120-char line width, no trailing commas, `arrowParens: avoid`, and sorted imports.
- Backend packages are **CommonJS** (`tsconfig` `module: commonjs`). `"type": "module"` together with tsc's CommonJS output crashes with `exports is not defined in ES module scope`. CommonJS was chosen over real ESM to avoid `.js`-extension import quirks.

## Docker and deploy

- **Layered compose files:**
  - `docker-compose.yml` is the base topology. It intentionally has no `image:` for RabbitMQ or the app services.
  - `docker-compose.dev.yml` adds bind mounts, exposed ports, `target: dev`, and `rabbitmq:4-management-alpine` (UI on :15672).
  - `docker-compose.prod.yml` adds GHCR `image:`s with no `build:`, `restart: unless-stopped`, the `x-logging` rotation anchor, and `rabbitmq:4-alpine`.
- Each Dockerfile has `dev`, `build`, and `prod` stages. In dev, the package directory is bind-mounted to `/app` and runs `pnpm dev`. Backend images are built with the **repo root** as context, in both compose and CI. The Dockerfiles `COPY <pkg path>/...` (only their own package), and ignore rules live in a root-relative `<pkg>/Dockerfile.dockerignore`, because a root context ignores per-folder `.dockerignore` files. The frontend is the exception: it builds from `./frontend`.
- **Recurring gotchas:**
  - **Build context mismatches.** A new service must use root context in both compose and its workflow.
  - **`COPY --from=<stage>` paths.** These resolve from the stage's filesystem root, not `WORKDIR`, so use absolute paths like `/app/dist`.
  - **Postgres 18 volumes.** They must mount at `/var/lib/postgresql`, not `.../data`.
  - **pnpm base image prompt.** `ghcr.io/pnpm/pnpm:11` runs a dependency check on container start that fails without a TTY. Every Node service in dev compose needs `CI: true`.
- **CI/CD:** there is one workflow per package (`.github/workflows/<pkg>.yml`), filtered by `paths:` to that package's folder (backend services also trigger on `proto/**`). Each workflow builds the `prod` target, pushes `:latest` and `:<sha>` to GHCR, then SSHes to the prod host and runs `docker compose pull <service>` + `up -d <service>`. **Always scope pull/up to the one service.** **Never add compose files to a per-service workflow's `paths:`**, because that fires every workflow at once and races the deploys. Compose changes go through `redeploy.yml` (full-stack pull + up, no build). GHCR packages are public, so the prod host needs no registry login.

## Open work

- Gateway: auth routes (`endpoints/authRoutes.ts` is empty), JWT middleware, and WebSockets.
- `assignment.proto`, `stats.proto`, and the Assignment Service gRPC server and repository.
- Stats aggregation logic.
- Notification: the push mechanism, the notifications table, and the scheduled reminders.
- `POST /assignment-types`, so the type list can grow.
- A Postgres migration tool.
- Frontend: only the routing shell, `Login`, and `PageNotFound` exist. The dashboard, CRUD UI, and account page are still to build.

## Working with Dylan

- Explain the *why* and the trade-offs (e.g. cache-aside vs write-through, consistency under database-per-service), not just the fix.
- He pushes back on complexity that isn't worth it at this scale. Don't re-open settled simplifications unprompted: soft delete, logout-everywhere, binary `done`, and no Redis pub/sub fan-out until there are multiple gateway instances.
- He often debugs by pasting raw compose or terminal output plus the relevant file, so expect to diagnose from logs and partial context.

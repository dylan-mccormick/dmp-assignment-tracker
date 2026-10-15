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

A local, untracked `.git/hooks/pre-commit` (zsh) runs `pnpm oxlint`/`oxfmt` on staged `.ts`/`.tsx` files. It groups files by their nearest `package.json`, uses `(cd "$PKG_DIR" && pnpm ...)` subshells because `pnpm --dir` was unreliable, and re-stages the formatted files, except partially staged ones (files that also have unstaged changes), which it formats in the working tree but leaves unstaged with a warning so the unstaged changes don't get swept into the commit. It skips `*/generated/*`, so committed generated code stays exactly what ts-proto emits (re-running `proto:generate` on an unchanged proto should produce no diff). It needs `grealpath` (`brew install coreutils`). Watch for zsh-specific splitting when editing it: `${(f)VAR}` splits on newlines and `${=VAR}` splits on words.

## Architecture

### Communication patterns

Each of these is deliberately a different pattern:
- **gRPC** (sync request/response): gateway ↔ services, insecure, inside `backend_net`. The gateway exposes REST at `/api/v1/*` on :8080.
- **RabbitMQ** (async fan-out): after each committed write, Assignment Service publishes to the durable topic exchange `assignment.events` with routing keys `semester.*`, `class.*` and `assignment.*` (`created`, `updated` with `{ before, after }`, `deleted`). Every message is a persistent JSON envelope `{ id, type, userId, occurredAt, data }` (see `services/assignment/src/events/EventPublisher.ts`). There are no `assignment.completed` / `due_date_changed` keys: consumers derive those from `before`/`after`. Cascading deletes publish only the parent's event. Notification and Stats each subscribe independently, and the fan-out is why this isn't a direct service call.
- **Redis cache-aside**: today this is Stats Service's only storage. Caching Assignment Service's read-heavy queries the same way is a planned requirement but isn't built yet (see Open work).
- **Redis for fast revocation**: this backs `token_version` checks (see Auth). It is not caching for speed.

Only the frontend is exposed to the host in prod (`15007`); the gateway is reachable only through the frontend's nginx at `/api/`, so a client can't skip the proxies that `TRUST_PROXY` counts. In compose, the frontend is on `frontend_net` only, and the gateway connects both networks.

### Services

| Service | Port | Storage | Role |
|---|---|---|---|
| `auth-service` | 50051 | Postgres `postgres-auth` + Redis | Google OAuth, JWT issuance, owns `users` |
| `assignment-service` | 50052 | Postgres `postgres-assignment` (Redis planned) | Semesters/classes/assignments/types; publishes events |
| `stats-service` | 50053 | Redis only | Dashboard aggregates |
| `notification-service` | — | (planned table) | In-app due-date reminders |

- **Semesters, classes, and assignments are one bounded context** (a strict containment hierarchy with constant joins), so they are deliberately not split into separate services.
- **Stats is a rebuildable read model, not a source of truth**, which is why it has no Postgres. It serves one RPC, `GetDashboard`. Details (`services/stats/src/`):
  - **It caches inputs, not answers.** Redis holds only what changes when data changes: the user's semesters, and per semester its classes, a slim list of assignments, and the type names. On a miss these come from Assignment Service's existing List RPCs. The parts that depend on the clock (semester progress, this week, upcoming, overdue) are computed from that snapshot on every request, because time passing fires no event.
  - **Invalidation is a per-user version, not `DEL`.** Keys are `stats:{userId}:version`, `stats:{userId}:semesters`, and `stats:{userId}:semester:{semesterId}`. Each value is stored tagged with the version read *before* it was fetched, and a read (one `MGET` of version + value) accepts it only if the tag still matches. That closes the cache-aside race where a slow miss writes stale data after an invalidation. The durable queue `stats.invalidate` binds `#` and `INCR`s the event's user's version, acking only after it lands. Duplicates are harmless, and cascades are covered without knowing what changed. Values have a 10-min TTL as a safety net against lost events.
  - **The caller supplies the clock.** The gateway passes the client's `today` and Monday-to-Monday week bounds (they depend on its timezone), plus its own `now`. With no `semester_id`, the active semester is the one containing today (the most recently started if they overlap), else the next to start, else the most recently ended.
- **Notification is for in-app reminders, not a generic relay.** The plan: the gateway owns the WebSocket per user (an in-memory `user_id → socket` map), Notification calls the gateway over gRPC to push, and a persisted notifications table backs a feed for offline users, since push is fire-and-forget. It also needs a scheduled "due in 24h" check, because reminder time ≠ event time.
- **Database-per-service:** `user_id` in the assignment DB is a plain UUID with no FK to `users`. It is trusted from the already-verified JWT. A `user.deleted` event from Auth was discussed and deliberately deferred.

### Protobuf / gRPC

`proto/*.proto` is the source of truth. `authentication.proto` has `AuthenticationService`, and `assignment.proto` has `SemesterService`, `ClassService`, and `AssignmentService` (which also serves the read-only `ListAssignmentTypes`); `stats.proto` has `StatsService`. Generated code (ts-proto with `outputServices=grpc-js`) is committed to each package under `src/generated/`, so after editing a `.proto` you must regenerate it in **every** package (gateway and each service). Never hand-edit `src/generated/`. ts-proto converts snake_case fields to camelCase (`google_auth_token` → `googleAuthToken`).

### Backend service layering

This pattern is established in `services/auth/src/`; follow it in the other services:
- `index.ts` builds the clients (pg `Pool`, redis) and wires Repository → Service → `startServer`.
- `repository/` holds an interface (`AuthRepository`) plus an `*Impl` for data access via `pg`. New IDs are `uuid` v7.
- `service/` holds an interface (`AuthService`) plus an `*Impl` for business logic.
- `grpcImpl.ts` adapts the service interface to the generated `*Server` type and routes every rejection through `handleMicroserviceError`, which always calls the callback. Unknown errors become `INTERNAL`.
- `error/MicroserviceError.ts` carries a **gRPC `status`** `code` (not an HTTP code), a `userFacingMessage` (sent over gRPC as `details`), and a `loggingMessage`. Use `NOT_FOUND`, `ALREADY_EXISTS`, `INVALID_ARGUMENT`, and `UNAUTHENTICATED` for user-caused errors. The gateway passes their message straight to the user.
- In repositories, map database errors inside each `try` but throw domain errors (e.g. `NOT_FOUND`) **outside** it, so they don't get rewrapped as `INTERNAL`. Unique violations (`23505`) map to `ALREADY_EXISTS`.
- **Assignment service** (`services/assignment/src/`) uses the same layering. It will host several gRPC services (semesters, classes, assignments), so the error handler is shared in `error/handleMicroserviceError.ts`, and `startServer` takes a list of `{ definition, implementation }` to register. Rules for its data:
  - **Ownership:** every request carries the `user_id` from the verified JWT (the gateway passes `getAuthUser(res).id`), and every query filters by it. Another user's row returns `NOT_FOUND`, never `PERMISSION_DENIED`, so its existence isn't revealed.
  - **Dates:** DATE columns travel over protobuf as `"YYYY-MM-DD"` strings.
  - **Deletes cascade:** `ON DELETE CASCADE` means deleting a semester silently removes its classes and assignments. Once Stats and Notification consume assignment events, cascading deletes must publish events too (e.g. one `semester.deleted`), or those consumers go stale.
- The Redis client is connected in `index.ts` with `disableOfflineQueue: true`, so commands fail fast while Redis is down and cache-aside falls back to Postgres instead of hanging. Cache reads and writes are best effort, but a failed cache *invalidation* is an error, because it would let revoked tokens through until the TTL expires.
  - **`disableOfflineQueue` doesn't cover a frozen or partitioned Redis** whose connection still looks open: a command already sent waits for its reply forever. node-redis's `commandOptions.timeout` doesn't help either, since it only bounds the wait *to be written*. Stats wraps every Redis call in its own 500ms timeout (`StatsCacheImpl`). Auth doesn't yet, so it hangs in that case.
- **RabbitMQ connections use amqplib 2's built-in `recovery`** with `waitForConnect: false`, so a service starts even if the broker isn't up. Channels and consumers don't survive a reconnect and are recreated in `setup()`. The publisher uses a confirm channel, so a message written into a dying connection makes `publish()` reject (and get logged) instead of vanishing. Publishing is best effort after the commit; an outbox table would make it reliable.
- gRPC servers bind `GRPC_PORT` when it's set (defaults 50052 / 50053), so a test instance can run beside the dev stack.

### Auth

- Google OAuth was chosen so the app never owns passwords. The client ID is public (frontend). The client secret lives **only** in Auth Service.
- **Flow (auth-code, popup):** the frontend's `useGoogleLogin({ flow: "auth-code" })` yields a `code`. It's sent to `POST /api/v1/auth/google`, and auth-service exchanges it with the client secret using redirect URI `"postmessage"` (required for popup-flow codes). Auth-service then fetches the Google profile and upserts the user.
- Users are upserted by `google_id`, not email, because email can change. This is one atomic `INSERT … ON CONFLICT (google_id) DO UPDATE` (`upsertUserByGoogleId`), and `created` is true when the returned id is the newly generated one. Name, email, and avatar are overwritten from Google on every login. The avatar is optional. A soft-deleted user who signs in again is **restored** (`deleted_at = NULL`), and `SignInUser` returns `restored: true` so the frontend can say so. A `previous` CTE reads the row's pre-upsert `deleted_at`, because `RETURNING` only sees the new values. For now this works at any time after deletion; see Open work for the planned grace period. There's no password field and no "change Google account" feature.
- **The JWT** is HS256 with a 7-day TTL, and its claims are only `{ sub, email, name, avatarUrl, tokenVersion }`. Don't sign the full `User`: its `Date`s become strings and then fail to re-encode as protobuf `Timestamp`s. `SoftValidateJwt` builds its returned `User` from those claims (no googleId or timestamps), so validation never needs a DB read for the profile.
- **Revocation:** the `tokenVersion` claim is compared against `users.token_version`, cache-aside in Redis under `token-version:{userId}` (5-min TTL). **Logout bumps the version (atomically, `incrementTokenVersion`) and kills every session on every device.** This is a deliberate simplification, with no separate per-device logout. Account deletion is a soft delete (`deleted_at`), which also bumps the version and clears the Redis key. Repository reads ignore deleted users.
- **Frontend:** `Login.tsx` posts the code, the JWT is stored in `localStorage` (an accepted trade-off at this scale) and sent as `Authorization: Bearer <jwt>` by `apiClient`, `UserContextProvider` restores the session on load, and the header menu signs out. A 401 from any page's load signs the user out (`useGetJson`).

### Schema notes

The schemas live in `services/<name>/init.sql`.
- `user_id` is deliberately denormalized onto `classes` and `assignments` so the hottest query ("my assignments") avoids a 3-way join.
- `assignments.done` is deliberately binary. The goal is tracking submission, not grading state.
- `semesters` must satisfy `end_date >= start_date` (CHECK `semesters_end_after_start`). Same-day semesters are fine, and semesters **may overlap**. The service should also return a friendly `INVALID_ARGUMENT` before the constraint fires. `semesters` and `classes` have `created_at`/`updated_at` like `assignments`; as in auth, the app sets `updated_at` on update (there's no trigger).
- `init.sql` is mounted into `docker-entrypoint-initdb.d`, so it **only runs on an empty data volume**. If a schema change isn't showing up, first check whether the volume was actually wiped. There's no migration tool yet.

### Gateway and frontend

- **Gateway:** `initAPI.ts` sets up the middleware (a 100 req/min per-IP rate limit, helmet, morgan, body/cookie parsers) and listens on `process.env.PORT` (set to 8080 in compose). `TRUST_PROXY` is the number of reverse proxies in front of it (2 in prod: the host's TLS nginx, then the frontend's nginx). Without it, every request looks like the nearest proxy and all users share one rate-limit budget; set too high, clients can spoof their IP. The site is behind Cloudflare, which doesn't add a hop: the host nginx uses `real_ip_header CF-Connecting-IP` (trusted only from Cloudflare's `set_real_ip_from` ranges) and *overwrites* `X-Forwarded-For` with that one IP. Cloudflare appends to a client-supplied `X-Forwarded-For`, so passing its chain through would make the client's entry spoofable. `index.ts` mounts routers from `endpoints/` under `/api/v1/...`, then a JSON 404, then `errorHandler.ts` last. The gateway is also the planned owner of the notification WebSockets.
  - **gRPC clients** live in `src/grpc/`. They are promise wrappers (`unary(...)`) around the generated clients with a 10s deadline, and they reject with the gRPC `ServiceError`. Express 5 forwards async rejections to the error handler, so route handlers just `await` and `throw`.
  - **Errors:** throw `HttpError(status, message)` for gateway-level validation. `errorHandler` maps gRPC statuses to HTTP (`INVALID_ARGUMENT` 400, `UNAUTHENTICATED` 401, `PERMISSION_DENIED` 403, `NOT_FOUND` 404, `ALREADY_EXISTS` 409, with the service's message passed through). `UNAVAILABLE` and `DEADLINE_EXCEEDED` become a generic 503, and everything else is a 500, with details only when `NODE_ENV=development`.
  - **Auth:** `middleware/requireAuth.ts` validates `Authorization: Bearer <jwt>` via `SoftValidateJwt` and exposes the user through `getAuthUser(res)`. Responses expose only `{ id, email, name, avatarUrl }`.
  - **Endpoints:** `POST /auth/google { code }` returns `{ user, jwt, created, restored }` (201 if created, 200 if returning or restored). `GET /auth/me` returns `{ user }`. `POST /auth/logout` returns 204. `GET /stats/dashboard?today=YYYY-MM-DD&weekStart=&weekEnd=[&semesterId=]` (week bounds are ISO timestamps with an offset) returns `{ semester, progress, assignmentsDone, assignmentsTotal, classes, week, upcoming, overdue }`, where `semester`/`progress` are `null` when the user has no semesters.
- **Frontend:** React 19, Vite, Tailwind v4, and `react-router` (not `react-router-dom`), with the React Compiler enabled through babel. Shared components live in `src/components/`, routes in `src/pages/`, and global state in `src/context/`.
  - **No non-null assertions (`x!`) on not-yet-loaded state inside component closures.** The React Compiler treats `data!.classes` in a callback as a plain `data.classes` dependency, and checks it on every render (even while `data` is still undefined, which crashes). It also stops guarding `data?.classes` elsewhere in the component. Pass the loaded value in as an argument from JSX that's already inside the `data && ...` guard instead.
  - **Dark mode follows the browser (`prefers-color-scheme`) by swapping color tokens, not by `dark:` classes.** `index.css` redefines the palette variables Tailwind compiles every color class to. Write components with the palette *by role* and they theme themselves: `white` = surface, `gray-50/100` = subtle fills/hovers, `200/300` = borders, `400-600` = muted text, `700-900`/`black` = strongest ink, and status tints as `-50` backgrounds with `-700/800` text. Any new shade a component uses needs a dark value there, chosen and contrast-checked (AA) against the dark surface. In dark mode `white`/`black` invert, so the dimming overlay is its own `overlay` token. SVG/chart colors go through CSS variables (`components/dashboard/ringColors.ts`). The black logo uses `dark:invert`, since there's no light version on the CDN.
  - **Context pattern:** each context is split into `XContext.tsx` (type + `createContext` defaults) and `XContextProvider.tsx` (state), and they're stacked in `App.tsx` via `ComposeProviders`.
  - **Style** (modelled on dmp-registry-frontend): minimal, `--color-primary: #074885`, with `PrimaryButton`/`SecondaryButton`/`TertiaryButton`. Feedback goes through a dismissable **`BannerContext`** banner (`setBanner({ level: "success" | "error" | "info", message })`, rendered by `StandardLayout`) and an imperative **`ModalContext`** (`showModal({ type: "alert" | "confirm" | "buttonless", ... })`). The usual mutation pattern is a confirm modal, then a `buttonless` modal with `loadingSpinner` while the request runs, then `closeModal()` + `setBanner(...)`. `LoadingBannerContext` (`addProcess`/`removeProcess`) drives a full-screen loading overlay. Logos load from `https://cdn.mnmzc.dev/logos/` (not `mnmzc.us.to`).
  - **API config:** `VITE_GOOGLE_CLIENT_ID` and `VITE_API_BASE_URL` (`/api/v1`). In dev, Vite proxies `/api` to `API_PROXY_TARGET` (`http://gateway:8080` in compose), so the browser only talks to its own origin and the gateway needs no CORS. Vite inlines `VITE_*` at **build** time, so in prod the runtime `environment:` entry in `docker-compose.prod.yml` has no effect. Prod relies on `/api/v1` being same-origin: the frontend container's `nginx.conf` proxies `/api/` to `gateway:8080` over `frontend_net`, and the host nginx only terminates TLS and forwards everything to the frontend. That nginx resolves `gateway` per request through Docker's DNS (`127.0.0.11`), so it survives the gateway being recreated with a new IP.

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
- **CI/CD:** there is one workflow per package (`.github/workflows/<pkg>.yml`), filtered by `paths:` to that package's folder (backend services also trigger on `proto/**`). Each workflow builds the `prod` target, pushes `:latest` and `:<sha>` to GHCR, then SSHes to the prod host and runs `docker compose pull <service>` + `up -d <service>`. **Always scope pull/up to the one service.** **Never add compose files to a per-service workflow's `paths:`**, because that fires every workflow at once and races the deploys. Compose changes go through `redeploy.yml` (full-stack pull + up, no build). The prod host only has what CI copies to it: `redeploy.yml` scp's `docker-compose.yml`, `docker-compose.prod.yml` and both `init.sql` files into `PROD_COMPOSE_DIR` on every run. It first clears any *directory* Docker left at those paths (a bind mount with a missing source file creates one), and `.env.prod` lives only on the host and is never touched. `init.sql` isn't a trigger path (that would race the service's own deploy), so run `redeploy.yml` by hand (`workflow_dispatch`) to ship one. A fresh database only runs `init.sql` on an empty volume anyway. GHCR packages are public, so the prod host needs no registry login.

## Open work

- Gateway: WebSockets for notifications.
- The notification package doesn't build yet: its generated code needs `@grpc/grpc-js`, which it doesn't depend on. The old `services/*-service/` folders (just `node_modules`/`.pnpm-store`) are leftovers from the folder rename and can be deleted.
- An outbox table for assignment events, if lost events (and the stale-until-TTL dashboard they cause) start to matter.
- Auth's Redis calls need the same per-call timeout as Stats (see Backend service layering).
- Notification: the push mechanism, the notifications table, and the scheduled reminders.
- **Due-soon reminders** (e.g. "due in 24h"). These fire on a schedule, not on a change, so events can't drive them: Notification needs a periodic job that scans every user's not-done assignments by `due`. That cross-user scan wants a partial index like `(due) WHERE done = false`, which the current `(user_id, due)` and `(class_id, due)` indexes don't serve.
- **Account deletion: a 30-day grace period, then permanent deletion.** Signing in during the grace period restores the account (today that works with no time limit). After 30 days, a scheduled purge in auth-service hard-deletes the user and publishes `user.deleted` on RabbitMQ. Then the assignment service deletes their semesters (which cascade to classes and assignments), the stats service drops their cache, and the notification service deletes their notifications, with each consumer idempotent. Signing in after the purge creates a fresh account.
- **Assignment Service Redis cache.** Cache-aside for its read-heavy queries (e.g. a user's assignment list) is a requirement, but the service has no Redis code or `redis` dependency yet. Compose already gives it `REDIS_URL` and `depends_on: redis` in anticipation. Reuse Stats' per-user version invalidation and per-call timeout rather than plain `DEL`.
- `POST /assignment-types`, so the type list can grow.
- A Postgres migration tool.
- Frontend: sign-in, the account page, CRUD pages for semesters, classes and assignments, and the dashboard are built. Still to come: a semester picker on the dashboard (the API already takes `semesterId`) and the notification feed.

## Working with Dylan

- Explain the *why* and the trade-offs (e.g. cache-aside vs write-through, consistency under database-per-service), not just the fix.
- He pushes back on complexity that isn't worth it at this scale. Don't re-open settled simplifications unprompted: soft delete, logout-everywhere, binary `done`, and no Redis pub/sub fan-out until there are multiple gateway instances.
- He often debugs by pasting raw compose or terminal output plus the relevant file, so expect to diagnose from logs and partial context.

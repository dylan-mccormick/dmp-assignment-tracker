# DMP Assignment Tracker

A personal assignment tracker for semesters, classes, and assignments, with a dashboard that shows semester progress, what's due this week, and what's overdue.

It's mainly a **distributed-systems learning project**. It's deliberately over-engineered for what it does, so it can use microservices, gRPC, a message queue, cache-aside caching, and a CQRS-style read model.

## Architecture

```
Browser ──► frontend (React, nginx) ──► gateway (Express, REST /api/v1) ──gRPC──► auth-service
                                                                         ├─gRPC──► assignment-service ──► RabbitMQ ──┬─► stats-service
                                                                         └─gRPC──► stats-service                     └─► notification-service
```

| Component | Port | Storage | Role |
|---|---|---|---|
| `frontend` | 3000 (dev) | — | React 19 + Vite + Tailwind v4 SPA |
| `gateway` | 8080 | — | REST API, JWT auth middleware, rate limiting |
| `auth-service` | 50051 | Postgres + Redis | Google OAuth sign-in, JWT issuance and revocation |
| `assignment-service` | 50052 | Postgres (Redis planned) | Semesters, classes, assignments; publishes change events |
| `stats-service` | 50053 | Redis only | Dashboard aggregates, a rebuildable read model |
| `notification-service` | — | (planned) | In-app due-date reminders (in progress) |

Each piece uses a different communication pattern on purpose:

- **gRPC** for synchronous request/response between the gateway and the services. The `.proto` files in [`proto/`](proto/) are the source of truth.
- **RabbitMQ** for async fan-out. After each write, the assignment service publishes to the `assignment.events` topic exchange (`semester.*`, `class.*`, `assignment.*`), and stats and notification each subscribe on their own.
- **Redis cache-aside** as the stats service's only storage, invalidated by a per-user version bump when an event arrives. The assignment service will cache its read-heavy queries the same way, but that isn't built yet.
- **Redis for revocation**: JWTs carry a `tokenVersion` that's checked against the user's current version, so logging out invalidates every session.

Sign-in is Google OAuth only (auth-code popup flow), so the app never stores passwords.

## Running locally

Requirements: Docker with Compose. To work on a single package outside Docker you'll also need Node and pnpm, and `protoc` to regenerate gRPC code.

1. Copy `.env.template` to `.env.dev` and fill in the values. You'll need a Google OAuth client ID and secret.
2. Start the stack from the repo root:

   ```sh
   docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```

3. Open http://localhost:3000. The RabbitMQ management UI is at http://localhost:15672.

Stop it with:

```sh
docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml down
```

In dev, each package is bind-mounted and rebuilds on change. Each schema in `services/<name>/init.sql` runs only on an empty database volume, so remove the volume if a schema change doesn't show up.

## Repository layout

```
frontend/            React SPA
gateway/             Express API gateway
services/auth/       auth-service
services/assignment/ assignment-service
services/stats/      stats-service
services/notification/ notification-service
proto/               gRPC service definitions
.github/workflows/   one build-and-deploy workflow per package, plus redeploy.yml
```

There's no root workspace. Each package has its own `package.json` and lockfile, so run these from inside the package directory:

```sh
pnpm install
pnpm dev              # watch mode
pnpm build
pnpm exec oxlint      # lint
pnpm exec oxfmt       # format
pnpm proto:generate   # backend packages: regenerate src/generated/ from ../proto
```

After editing a `.proto`, regenerate the code in **every** backend package and the gateway. Generated code is committed, and shouldn't be edited by hand.

## Deployment

Pushing to `main` triggers the workflow for each package that changed. It builds that package's `prod` image, pushes it to GHCR, and redeploys just that one service on the prod host with `docker compose pull` and `up -d`. Changes to the compose files or `init.sql` ship through the `redeploy.yml` workflow. In production only the frontend is exposed, and its nginx proxies `/api/` to the gateway.

## Status

Sign-in, account management, CRUD for semesters, classes, and assignments, and the dashboard are working. Still to come are notifications (WebSocket push, a feed, and due-soon reminders), a Redis cache for the assignment service, a semester picker on the dashboard, and a 30-day grace period before deleted accounts are purged. See [`CLAUDE.md`](CLAUDE.md) for detailed design notes.

## License

[MIT](LICENSE)

# Local Infrastructure

This document defines how the store's supporting services (PostgreSQL and
Redis) run during **development and testing**, how environment variables and
credentials are handled, and which database actions are pre-approved for
local use.

Read it alongside [`CLAUDE.md`](../CLAUDE.md) and
[`domain-model.md`](domain-model.md). Where this document and `CLAUDE.md`
disagree, flag it. Don't pick one silently.

**Scope**: local development and tests only. Production hosting and
deployment are out of scope (see `CLAUDE.md`). Nothing here applies to a
production database.

---

## 1. Overview

Development happens in a **GitHub Codespace**. A dev container provides a
pinned Node.js and Docker. Docker Compose runs only the supporting services;
the Medusa backend and the Next.js storefront run directly in the dev
container.

```
GitHub Codespace (dev container, Node 24 LTS)
├── medusa develop        → :9000  (Store API + Medusa Admin at /app)
├── next dev              → :3000  (storefront)
└── docker compose (project "capstone")
    ├── postgres:17-alpine → :5432
    └── redis:7-alpine     → :6379
```

| Decision | Choice |
|---|---|
| Primary dev environment | GitHub Codespaces dev container |
| Node.js | 24 LTS (dev container and CI) |
| What Compose runs | Postgres and Redis only |
| PostgreSQL | `postgres:17-alpine` |
| Redis | `redis:7-alpine`, always on in dev |
| Integration test databases | Throwaway databases in the same Postgres container |

---

## 2. Dev environment

- **Dev container.** `.devcontainer/` pins **Node 24 LTS** and enables
  Docker inside the Codespace (docker-in-docker). The same
  `docker-compose.yml` is used everywhere.
- **Why Node 24.** Medusa requires Node `>=22.22.0` and supports **LTS
  versions only**. Node 26 is not LTS yet. A Node version installed on a
  developer's own machine doesn't matter inside the Codespace. If the
  project is ever run outside it, an `.nvmrc` / `engines` entry warns about
  a mismatch.
- **Machine size.** Use a **4-core** Codespace. Medusa, Next.js, Postgres,
  and Redis together are tight on 2 cores, and Playwright adds more.
- **Quota.** Personal GitHub accounts get a limited monthly allowance of
  Codespaces core-hours and storage. Check GitHub's current numbers. Stop
  Codespaces you aren't using; they also stop on their own after 30
  minutes idle.
- **Data lifetime.** Docker volumes survive stopping and restarting a
  Codespace, but **not deleting it**. Dev data is disposable: resetting and
  seeding must always be one command (section 8).
- **Running locally instead.** Docker Desktop (WSL2 backend on Windows) can
  run the same Compose file later. It is not the documented path yet.

---

## 3. Services

| Service | Image | Port | Volume | Healthcheck |
|---|---|---|---|---|
| `postgres` | `postgres:17-alpine` | 5432 | named volume for data | `pg_isready` |
| `redis` | `redis:7-alpine` | 6379 | none needed | `redis-cli ping` |

- Pin **major versions**. Never use `latest`.
- Ports are published on `127.0.0.1` only, so nothing outside the machine
  can reach the dev database.
- CI (GitHub Actions) uses the **same images** as service containers, so
  dev, CI, and tests run against the same versions.
- `docker compose down` keeps data. `docker compose down -v` deletes the
  volume and gives a clean database.

### Application ports

| Process | Port | URL |
|---|---|---|
| Medusa server | 9000 | `http://localhost:9000` |
| Medusa Admin | 9000 | `http://localhost:9000/app` |
| Storefront | 3000 | `http://localhost:3000` |

---

## 4. Databases

| Database | Used by | Lifetime |
|---|---|---|
| `medusa_dev` | `medusa develop`, seed script | Persists in the Postgres volume until reset |
| Throwaway test databases | Backend integration tests | Created and dropped by the test runner per run |

- One Postgres container serves both.
- Integration tests use `medusaIntegrationTestRunner`
  (`@medusajs/test-utils`), which **creates and drops its own temporary
  databases**. The Postgres user therefore needs the `CREATEDB` permission.
- Tests **never** use the `medusa_dev` database name. Running the test
  suite must never change dev data.
- Confirm the exact env vars the test runner reads when the backend is
  scaffolded, and record them in `backend/.env.example`.

---

## 5. Redis

Redis is **always on** in development: `REDIS_URL` is always set, even
though Medusa can fall back to in-memory modules without it. Dev then
behaves like production.

Medusa uses Redis for:

- **Event bus.** Events such as "order placed" are published for
  subscribers to react to.
- **Cache.** Faster repeated reads.
- **Workflow engine.** Tracks the state of multi-step workflows such as
  checkout.
- **Locking.** Stops two processes changing the same record at once. If
  two customers check out the last animal of a kind at the same moment,
  only one succeeds. This supports the **no-overselling** rule
  ([`domain-model.md`](domain-model.md), business rule 1).

---

## 6. Environment variables

All env files are **never committed**. Each directory keeps an
up-to-date `.env.example` with placeholder values. Dev secrets are
obviously fake and never reused anywhere else.

### Docker Compose

Compose reads these with dev defaults (`${POSTGRES_USER:-medusa}`), so it
works with no setup.

| Variable | Dev default |
|---|---|
| `POSTGRES_USER` | `medusa` |
| `POSTGRES_PASSWORD` | `medusa` |
| `POSTGRES_DB` | `medusa_dev` |

### `backend/.env`

| Variable | Dev value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgres://medusa:medusa@localhost:5432/medusa_dev` | **Must match the Compose values above.** |
| `REDIS_URL` | `redis://localhost:6379` | Always set (section 5). |
| `JWT_SECRET` | a fake dev value | |
| `COOKIE_SECRET` | a fake dev value | |
| `STORE_CORS` | `http://localhost:3000` | Storefront calls are server-side (section 7). |
| `ADMIN_CORS` | `http://localhost:9000` + the Codespace URL for port 9000 | |
| `AUTH_CORS` | `http://localhost:3000,http://localhost:9000` + the Codespace URL for port 9000 | |

In a Codespace, the forwarded URL for port 9000 has the form
`https://<codespace-name>-9000.app.github.dev`. Confirm the exact CORS
values needed when the backend is scaffolded.

### `storefront/.env.local`

| Variable | Dev value | Notes |
|---|---|---|
| `MEDUSA_BACKEND_URL` | `http://localhost:9000` | Server-side only. |
| `MEDUSA_PUBLISHABLE_KEY` | from Medusa Admin | Server-side only. Created after the backend first runs, so it can't be filled in before then. |

Neither variable uses the `NEXT_PUBLIC_` prefix, because the browser never
calls Medusa directly (section 7).

---

## 7. Codespaces networking constraint

Codespaces exposes ports as **private** forwarded URLs, which require a
GitHub login. A browser `fetch` from the storefront's forwarded URL to the
backend's forwarded URL can fail on that login redirect.

Rules:

- **Port 9000 stays private.** Making it public would expose Medusa Admin to
  the internet.
- **The storefront calls Medusa server-side only**: server components and
  server actions, through `storefront/lib/data/`, at
  `http://localhost:9000`. This matches `CLAUDE.md` (prefer server
  components; all data access through `storefront/lib/data/`).
- **Medusa Admin** works through the forwarded port-9000 URL, because it is
  served from the same origin as the API.

---

## 8. Migrations and resets

`CLAUDE.md` says to stop and ask before running migrations. The following is
**approved** for **local dev and test databases only**:

- Running Medusa's built-in migrations (`medusa db:migrate`).
- Resetting the dev database: drop → migrate → seed.

Still requires asking a human first:

- Any **custom** migration (one written for this project).
- **Any** migration or reset against a database that isn't the local dev or
  test database.

### Commands

These npm scripts are added to `backend/package.json` when the backend is
scaffolded:

| Script | Does |
|---|---|
| `db:reset` | Drop `medusa_dev`, run Medusa's migrations, and seed. |
| `seed` | Load the seed catalogue from [`ProductData.json`](../ProductData.json) as mapped in [`domain-model.md`](domain-model.md). |

---

## 9. Common tasks

| Task | How |
|---|---|
| Start services | `docker compose up -d` |
| Stop services (keep data) | `docker compose down` |
| Stop services and delete data | `docker compose down -v` |
| Reset the dev database | `npm run db:reset` in `backend/` |
| Seed only | `npm run seed` in `backend/` |
| Run backend integration tests | the backend's integration test script (defined at scaffold time) |

---

## 10. CI parity

GitHub Actions runs with the **same versions** as the dev container:
Node 24 LTS, `postgres:17-alpine`, and `redis:7-alpine` as service
containers. When a version changes, it changes in the dev container,
Compose, and CI together.

---

## 11. Next branch checklist

Done on branch `infra/local-services`:

1. [x] Root `.gitignore` ignoring `.env` and `.env.*` (except
   `.env.example`) and `node_modules/`.
2. [x] `docker-compose.yml` (project `capstone`, the services in section 3).
3. [x] `.devcontainer/` (Node 24 LTS image, docker-in-docker, ports 3000 and
   9000 forwarded, 5432 and 6379 not auto-forwarded, 4-core minimum,
   `docker compose up -d` on start).
4. [x] Root `.env.example` with the Compose variables from section 6.
5. [x] `.nvmrc` set to `24`.

Deferred to the scaffold branches, because `backend/` and `storefront/` don't
exist yet:

- `backend/.env.example` and `storefront/.env.example` (section 6), once
  the exact variables are confirmed.
- `engines` (`"node": ">=24 <25"`) in each app's `package.json`.
- A dev container `postCreateCommand` running `npm ci` in each app.
- Build output ignores (`.medusa/`, `.next/`, Playwright output) in each
  app's own `.gitignore`.

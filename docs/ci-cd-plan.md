# CI/CD Plan

This document plans the store's continuous integration pipeline and the
security, review, and test tooling around it. It is a **plan only**:
workflow files are written phase by phase after this plan is approved.

Read it alongside [`CLAUDE.md`](../CLAUDE.md) and
[`local-infrastructure.md`](local-infrastructure.md). Where this document and
either of those disagree, flag it. Don't pick one silently.

**Markers used below**

- **[Inferred]**: not seen in the repo. It comes from Medusa, GitHub, or
  vendor conventions and must be confirmed when the code exists.
- **[Verify]**: pricing, free-tier limits, or plan requirements. These change
  often, so check the vendor's own page before relying on them.

**Scope**: CI, code scanning, dependency updates, and PR review for a solo,
public GitHub repo. Production deployment is listed as a later decision
(section 9) and is not designed here.

---

## 0. Repo state and conflicts

### What exists today (checked 2026-10-27)

| Item | State |
|---|---|
| `backend/` | **Created.** Medusa 2.22.1 from `medusa-starter-default`, npm, own lockfile. Scripts: `lint` (`medusa lint`), `typecheck`, `test` (unit), `build`, `test:integration:http`, `test:integration:modules` |
| `storefront/` | **Created.** Next.js 16 App Router, no Tailwind, npm, own lockfile. Scripts: `lint`, `typecheck`, `test` (Vitest), `build` |
| `docker-compose.yml`, `.devcontainer/`, `.nvmrc`, `.env.example` files | **Created** (see [`local-infrastructure.md` §11](local-infrastructure.md#11-next-branch-checklist)) |
| `.github/` (workflows, Dependabot config) | **CI workflow** (`.github/workflows/ci.yml`, Phases 1–3), with shared setup in `.github/actions/setup-package`. **Dependabot config** (`.github/dependabot.yml`) |
| Test config and tests | Vitest: one unit test file (`storefront/lib/format-price.test.ts`). Jest: config, the scaffold's HTTP health test, and the Phase 2 integration specs (`inventory`, `guest-checkout`). No backend unit tests yet |
| `.gitignore` | Root file plus one per app covering build output |
| Seed script, `db:reset` | **Planned only** ([`local-infrastructure.md` §8](local-infrastructure.md#8-migrations-and-resets)). Seed data is [`ProductData.json`](../ProductData.json) |
| Repo visibility | **Public** (`JasoFal/ExoticEcommerce`) |
| Secret scanning + push protection | **Already enabled** |
| Dependabot security updates | Disabled |
| Branch protection / rulesets on `main` | None |

Script names and test-runner env vars below are now confirmed against the
scaffolds. **[Inferred]** markers that remain are still unconfirmed.

### Conflicts and how they are resolved

| Brief said | Repo says | Resolution |
|---|---|---|
| A Docker image build stage | Compose runs only Postgres and Redis. No app Dockerfiles are planned, and hosting is undecided | **Deferred** until hosting is chosen (section 9). Kept as a placeholder stage |
| Vitest tests for "price and discount helpers" | `CLAUDE.md`: never compute pricing in the frontend. There are no promotions or discounts in scope ([`domain-model.md`](domain-model.md)) | Replaced with tests for **price display formatters** (Medusa amount → string, no math) and **`/shop` filter-param builders** |
| Integration priority: cart, pricing, order creation | `CLAUDE.md` priority: inventory guards, guest checkout, search and filter | **Merged** (section 3.4). Pricing is checked by reading the totals Medusa returns, not by testing Medusa's pricing engine |
| "Avoid chasing coverage numbers" | `CLAUDE.md`: enforce a coverage threshold on custom code in `backend/` | Record coverage from day one. Set a **low** threshold on custom backend code only once real tests exist. Open question 3 |
| Playwright: add to cart → check out → confirmation | Live Animals cannot complete checkout (no Shipping Options, domain-model rule 5) | The E2E test buys a **Supply** (e.g. a feeder) |
| "Medusa backend using the Medusa JS SDK" | The JS SDK is the **storefront's** client. The backend is built on the Medusa framework | Wording only. No change to the plan |

---

## 1. Goals, non-goals, and "done"

**Goals**

- Catch regressions before merge. Much of the code is AI-written, so tests
  and scanning are the main safety net.
- Gate merges to `main` on lint, types, tests, build, and security findings.
- Stay on free tiers. Flag anything paid.
- Keep the pipeline fast (PR checks under 10 minutes) so it gets used rather
  than bypassed.

**Non-goals (this stage)**

- Deployment, environments, Docker images, release automation.
- AI model, prompt, or eval gates. The store has no AI features.
- Coverage targets as a goal in themselves.
- Visual regression, accessibility, and API contract checks (deferred in
  `CLAUDE.md`).

**Done for the first working pipeline**

- [ ] Every PR to `main` runs lint, typecheck, unit tests, and build for both
      `backend/` and `storefront/`.
- [ ] All of them pass in under 10 minutes.
- [ ] They are required checks on `main`.
- [ ] A deliberately broken PR (a lint error) cannot be merged.

---

## 2. Pipeline stages

Install is a **step inside each job**, not its own job. Restoring the npm
cache and running `npm ci` is faster than passing `node_modules` between
jobs.

| # | Stage | Job name | PR | Push to `main` | Nightly | Runs in parallel with |
|---|---|---|---|---|---|---|
| 1 | Install | (step in every job) | ✓ | ✓ | ✓ | — |
| 2 | Lint (ESLint) | `lint` (matrix: backend, storefront) | ✓ | ✓ | | 3, 4, 5, 6 |
| 3 | Type-check (`tsc --noEmit`) | `typecheck` (matrix) | ✓ | ✓ | | 2, 4, 5, 6 |
| 4 | Unit tests (Jest / Vitest) | `unit` (matrix) | ✓ | ✓ | | 2, 3, 5, 6 |
| 5 | Backend integration tests | `integration-backend` | ✓ | ✓ | | 2, 3, 4, 6 |
| 6 | Build (`medusa build`, `next build`) | `build` (matrix) | ✓ | ✓ | | 2, 3, 4, 5 |
| 7 | Docker image build | `docker-build` | — | **Deferred** | — | — |
| 8 | End-to-end (Playwright) | `e2e` | | ✓ | ✓ | Runs alone (full stack) |

- **Stages 2–6 all run in parallel.** There is no ordering between them, so
  the slowest job sets the PR time. Running "lint → typecheck → unit →
  integration" in parallel still satisfies `CLAUDE.md`'s list. Every one of
  them must pass.
- **E2E stays off PRs**, as `CLAUDE.md` says. It also gets a manual
  "run workflow" trigger so it can be run on a branch when needed.
- **Superseded PR runs are cancelled** (a concurrency group per branch), so
  pushing twice doesn't pay for two runs.
- Matrix jobs show up as separate checks, e.g. `lint (backend)` and
  `lint (storefront)`.

---

## 3. Test execution in CI

The test layers are already decided in `CLAUDE.md` and are not revisited
here. **No tests or test config exist yet**, so this section plans how they
run once they do.

### 3.1 Backend integration tests (`integration-backend`)

| Item | Plan |
|---|---|
| Postgres | Service container `postgres:17-alpine`, the same image as Compose. Healthcheck `pg_isready` |
| Redis | Service container `redis:7-alpine`. Healthcheck `redis-cli ping` |
| Credentials | Fake, throwaway literals in the workflow. These are not secrets: the database only lives for the run |
| Test databases | `medusaIntegrationTestRunner` creates and drops its own database per run. The official Postgres image's user is a superuser, so it has `CREATEDB` |
| Env vars the runner reads | `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` (confirmed, listed in `backend/.env.example`) |
| Redis in tests | `backend/medusa-config.ts` moves the event bus, workflow engine, and locking to Redis whenever `REDIS_URL` is set, and the runner loads that config, so CI exercises Redis-backed locking. Without `REDIS_URL` it falls back to in-memory, but boot fails if `NODE_ENV=production`. Caching stays unwired: each test file gets a fresh database but would share one Redis, so a cached read could leak across files |
| Test data | `backend/integration-tests/fixtures.ts` builds a Region, Sales Channel, Stock Location, publishable key, flat Shipping Option, and one Live Animal and one Supply through Medusa workflows. The real seed waits for Phase 4 |
| Leftover databases | A final `if: always()` step lists databases named `medusa-%-integration-%` and fails if any remain |
| Script | `test:integration:http` (Jest, `--runInBand`), confirmed in `backend/package.json` |

**Keeping it small.** `--runInBand` runs test files one after another, and
each file boots a Medusa app. So:

- Keep **few files with many `it` cases each**, grouped by journey (cart,
  checkout, search).
- Test pure logic in unit tests, not integration tests.
- **Budget: under 5 minutes.** If it goes over, merge files before adding
  more parallelism.
- Run module integration tests only once custom modules exist. Today there
  are none ([`domain-model.md` §2](domain-model.md#2-entity-model)).

### 3.2 Unit tests (`unit`)

- `backend/`: Jest, as Medusa expects.
- `storefront/`: Vitest, plus React Testing Library for the cart and filter
  client components, and MSW at the SDK boundary for `storefront/lib/data/`.
- Neither needs services. Both should finish in about a minute.

### 3.3 End-to-end (`e2e`)

One job starts the full stack on the runner:

1. Postgres and Redis as service containers.
2. `npm ci` in both packages, plus restore the Playwright browser cache.
3. Run Medusa migrations, then the seed script.
4. Build and start the backend on `:9000`.
5. Build and start the storefront on `:3000` (production build, not
   `next dev`).
6. Wait until both ports respond.
7. Run Playwright with **Chromium only**.
8. On failure, upload the trace and screenshots as an artifact, kept for
   7 days.

**Prerequisites the seed must provide (gap):**

- A **publishable API key** linked to the storefront Sales Channel. CI must
  be able to read it and pass it to the storefront as
  `MEDUSA_PUBLISHABLE_KEY`. Today [`local-infrastructure.md` §6](local-infrastructure.md#6-environment-variables)
  says the key is created by hand in Admin, which can't happen in CI.
- A **Shipping Option on the default Shipping Profile**, so a Supply can be
  checked out.
- Product images are hotlinked from Wikimedia and some may not resolve
  ([`domain-model.md` §5](domain-model.md#5-open-questions)). E2E must
  **not** assert on images. Otherwise external outages become test flakes.

### 3.4 Test priorities

Write these first. Don't write tests to raise a coverage number.

| # | Layer | Test |
|---|---|---|
| 1 | Backend integration | **Inventory guards**: adding more than Available Stock to a cart fails, and backorders are off. Cover a Live Animal and a Supply |
| 2 | Backend integration | **Guest cart → order**: create a cart, add a Supply, set email, address, and shipping, pay with the manual provider, complete. Assert on the **totals Medusa returns**, never recomputed ones |
| 3 | Backend integration | **Search and filter**: `q`, Department, Animal Type (including descendants), and tags return the expected seed products |
| 4 | Playwright | **One happy path**: add a Supply to the cart → check out → see the order confirmation |
| 5 | Vitest | Price **display** formatter and `/shop` filter-param builders |
| 6 | Vitest + RTL | Quantity picker can't go past Available Stock. Add to Cart is disabled when sold out |

### 3.5 Gaps today

- No backend unit tests: there is no custom backend code yet, so
  `backend`'s `test` script runs Jest with `--passWithNoTests`. Remove that
  flag when the first custom helper and its test land.
- The seed script doesn't exist. It must also create the publishable key and
  the Supply Shipping Option (3.3).
- The Live Animal checkout block (domain-model rule 5) needs a test once the
  cart notice exists. It must assert only on what Medusa returns.

---

## 4. CloudBees Smart Tests

CloudBees Smart Tests (formerly Launchable) predicts which tests a change
needs. Add it **only after Phase 4 is stable** (section 11).

### 4.1 Runners and report formats

| Runner | Used for | Report format | Notes |
|---|---|---|---|
| Jest | `backend/` unit + integration | JUnit XML via `jest-junit` | `jest-junit` is a new dev dependency. Check first, per `CLAUDE.md` |
| Vitest | `storefront/` unit + component | JUnit XML via Vitest's built-in `junit` reporter | No new package |
| Playwright | E2E | JUnit XML via Playwright's built-in `junit` reporter | No new package |

**[Verify]** the CLI's name and install method (historically the Python
`launchable` CLI, which also needed Java), and its per-runner profile names,
on CloudBees' docs.

### 4.2 Token and fork PRs

- Store the API token as a **GitHub Actions repository secret**. The
  env var name is **[Verify]** (historically `LAUNCHABLE_TOKEN`).
- **Fork PRs get no secrets.** On those runs, every Smart Tests step is
  skipped and the **full suite runs**. Nothing is recorded, and nothing fails
  because of it.
- Never switch to `pull_request_target` to get secrets onto fork PRs
  (section 5.5).
- Smart Tests steps are allowed to fail without failing the job. If
  CloudBees is down or the subset call errors, fall back to the full suite.

### 4.3 Rollout phases

| Phase | What happens | Leave it when |
|---|---|---|
| A. Record | Every run on `main` and on same-repo PRs uploads results. Nothing is skipped | At least 4 weeks or 50 recorded runs |
| B. Observe | PRs ask for a subset in **observation mode**. The full suite still runs, and the "would have skipped" result is logged | All switch criteria below are met |
| C. Subset | PRs run only the predicted subset. `main` runs everything | Indefinitely, while the escaped-defect check stays clean |

**Criteria for switching to real skipping (B → C), all required:**

- [ ] PR test time is over about **10 minutes**. Below that, skipping saves
      too little to be worth the risk.
- [ ] Phase B has covered at least **4 weeks or 50 runs**.
- [ ] **Escaped-defect check is clean.** No test that failed on a `main`
      full run would have been skipped by the PR subset. Apply this most
      strictly to **checkout, cart, and pricing/totals tests**.
- [ ] Checkout, cart, and inventory tests are in a **separate session that
      is never subset**. They always run on every PR.

### 4.4 Always run everything on `main`

Every push to `main` and every nightly run executes the **full** suite and
records it. A skipped test on a PR can therefore delay finding a regression
by one merge at most. It can never hide one.

### 4.5 Is the suite big enough yet?

**No.** The suite is empty today. Smart Tests pays off when PR test time is
long, roughly 10 minutes or more. With the budgets in section 3 (unit about
1 minute, integration under 5), that may not happen for months. Phase A
recording is cheap, so it can start early to build history. Subsetting can
wait.

### 4.6 Pricing and fallback

- Free tier, plan limits, and open-source eligibility: **[Verify on
  CloudBees' page]**.
- **Fallback if there is no usable free tier:** use the runners' own
  changed-file selection **on PRs only**, with the full suite on `main`:
  - Jest: `--changedSince=origin/main` (unit only, not integration)
  - Vitest: `--changed`
  - Playwright: `--only-changed`

---

## 5. Security

### 5.1 Tool configuration

| Tool | How to enable | Configuration | Blocks a PR | Only warns |
|---|---|---|---|---|
| CodeQL | Settings → Code security → Code scanning → **Default setup** (no workflow file) | Languages: **JavaScript/TypeScript** and **GitHub Actions**. Default query suite. Runs on PRs, pushes to `main`, and weekly (default setup picks the schedule) | **High** and **Critical** security alerts, and **Error**-level alerts, via the ruleset's "Require code scanning results" rule (section 7) | Medium, Low, Warning, Note |
| Secret scanning | Settings → Code security | **Already enabled.** Also consider validity checks and non-provider patterns, **[Verify]** availability on public repos | Push protection **blocks the push** itself | Alerts for patterns that push protection doesn't cover |
| Dependabot alerts | Settings → Code security → Dependabot alerts | — | — | Alerts |
| Dependabot security updates | Settings → Code security → **enable** (currently disabled) | Opens fix PRs right away, outside the weekly schedule | — | — |
| Dependabot version updates | `.github/dependabot.yml`, written in Phase 3 | See 5.2 | — | — |

- Switch from CodeQL default setup to advanced setup (a workflow file) only
  if a custom query set or path filter becomes necessary.
- **Plan and visibility:** CodeQL and secret scanning are free on **public**
  repos. If the repo ever becomes private, both need a paid GitHub
  Code Security / Secret Protection plan **[Verify]**.

### 5.2 Dependabot (low noise)

| Setting | Plan |
|---|---|
| Ecosystems | npm in `/backend`, npm in `/storefront`, `github-actions` in `/` and `/.github/actions/*` |
| Not covered | Container images (dev container, Compose, CI services). They change in all three places **in one PR**, by hand (section 8.3), so Dependabot can't split them |
| Schedule | **Weekly** (Monday) for version updates. Security updates arrive right away regardless |
| Open-PR limit | 5 per ecosystem |
| Group `medusa` | All `@medusajs/*` packages in **one PR, always**. Medusa packages must stay on the same version |
| Group `next-react` | `next`, `react`, `react-dom`, `eslint-config-next` in the storefront, majors included |
| Group `minor-patch` | All other minor and patch updates, one PR per directory |
| Group `github-actions` | All action pin updates in one PR |
| Majors | Separate PRs, never auto-merged |
| Ignored | React majors in `backend/`. Medusa Admin decides that version, so it moves with a Medusa upgrade |

**Dependency overrides** (`overrides` in `backend/package.json`)

These force a patched version of a transitive dependency when the package
that pulls it in hasn't released a fix yet. `package.json` can't hold
comments, so the reasons are recorded here. Dependabot doesn't update
overrides. When the weekly `medusa` group PR arrives, check whether each one
can be removed.

| Package | Forced version | Alerts | Why | Remove when |
|---|---|---|---|---|
| `zod` | 4.6.6 | GHSA-mrhx-c7xc-m3w5 | Medusa 2.22.1 pins 4.2.0, and Medusa uses zod to validate API requests, so storefront traffic reaches it | Medusa's own pin is 4.6.6 or later |
| `lodash` | 4.18.1 | GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh | `inquirer` (Medusa CLI) and `@graphql-codegen` resolve to 4.17.23, and codegen only accepts 4.17.x | Neither resolves below 4.18.0 without the override |

### 5.3 GitHub Actions hardening

- [ ] Default workflow `GITHUB_TOKEN` permission is **read-only**. Jobs ask
      for more only when needed.
- [ ] Third-party actions are pinned to a **commit SHA**. Dependabot's
      `github-actions` ecosystem keeps the pins updated.
- [ ] Settings → Actions → **Require approval for all external
      contributors** before their workflows run.
- [ ] "Allow GitHub Actions to create and approve pull requests" is **off**.

### 5.4 Secrets plan

**Nothing secret is ever committed.** Dev values are obviously fake and
never reused anywhere else ([`local-infrastructure.md` §6](local-infrastructure.md#6-environment-variables)).

| Secret | Development (Codespaces) | CI (GitHub Actions) | Production (later) |
|---|---|---|---|
| `DATABASE_URL`, `REDIS_URL` | `backend/.env` with the local Compose values | Built from service containers with fake literals. Not a secret | Host's secret store |
| `JWT_SECRET`, `COOKIE_SECRET` | `backend/.env`, fake values | Fake literals in the workflow | Host's secret store, strong random values |
| `MEDUSA_PUBLISHABLE_KEY` | `storefront/.env.local`, created after the first backend run | Produced by the seed during the E2E job (3.3) | Host's secret store |
| Smart Tests API token | — | **Actions secret** | — |
| S3 credentials (later) | **Codespaces secret** if a real dev bucket is used | Actions secret only if a test needs it | Host's secret store |
| Payment provider keys (later) | **Codespaces secret**, test-mode keys only | Actions secret, test-mode keys only, never on fork PRs | Host's secret store |

- **Codespaces secrets** (Settings → Secrets and variables → Codespaces) are
  scoped to this repo and arrive as env vars when the Codespace starts. Use
  them only for **real** values. Fake dev values stay in the env files.
- **Actions secrets** are for real tokens only. Throwaway CI databases don't
  need them.

**Check that env files are ignored and never committed.** Run these in
Phase 0, and again whenever env handling changes:

```sh
# 1. Only .env.example files should be tracked
git ls-files | grep -E '(^|/)\.env'

# 2. No env file has ever been in history (expect no output)
git log --all --full-history --oneline -- '*.env' '*.env.local' '**/.env' '**/.env.local'

# 3. The ignore rules match (expect each path to be reported as ignored)
git check-ignore -v backend/.env storefront/.env.local
```

If check 2 ever finds something, rotate the exposed value first. Then decide
whether to rewrite history. That is destructive, so ask first.

### 5.5 Public repo: fork PRs and what must never be committed

- Workflows triggered by `pull_request` from a fork run with a **read-only
  token and no secrets**. That is the safe default. Keep every workflow on
  `pull_request`.
- **Never use `pull_request_target`** (or `workflow_run`) to check out and run
  fork code. Those triggers run with secrets and a write token.
- Fork PR workflows need approval before they run (5.3). Read the diff
  before approving, especially changes to `.github/`, `package.json`
  scripts, and lockfiles.
- **Never commit:** `.env` / `.env.local`, real or test payment keys, S3
  credentials, Smart Tests or other API tokens, database dumps, production
  URLs with credentials in them, Codespace or private-port URLs paired with
  tokens.

---

## 6. AI tooling in the workflow

| Tool | Where it fits | Free-tier notes |
|---|---|---|
| CodeRabbit | Installed as a GitHub App. It reviews every PR automatically and leaves comments. It runs no builds or tests and is **not** a required check | Free for public repos, with limits **[Verify]** |
| Copilot "Explain error" | When a job fails, open the failed job → **Explain error**, as a starting point for diagnosis | Copilot Free has monthly chat and request limits **[Verify]** |

**PR flow**

1. Open a PR (agent-written or hand-written). CI and CodeRabbit start.
2. Read CodeRabbit's comments. Fix, or reply with the reason for not fixing.
   Resolve each thread. The ruleset requires resolved conversations
   (section 7).
3. If CI fails, use Copilot "Explain error" on the failed job. Then confirm
   the cause yourself before changing anything.
4. Merge only when the required checks are green and you have read the diff.

**Later:** add a `.coderabbit.yaml` with path instructions taken from
`CLAUDE.md`: no SDK calls outside `storefront/lib/data/`, no hand-written
`fetch` to Medusa, no pricing, totals, or stock math in the storefront, no
raw SQL in `backend/`.

**Rules**

- **A human makes every merge decision.** No auto-merge, including
  Dependabot PRs, at least until the pipeline has run cleanly for a while.
- **A human reviews every AI-suggested fix** from CodeRabbit, Copilot, or a
  coding agent before committing it. Don't click "Commit suggestion" without
  reading it.
- Commit descriptions say whether a change was agent-generated, hand-written,
  or agent-generated-then-hand-edited (`CLAUDE.md`).
- AI tools never receive secrets. Don't paste env files or tokens into chats.

---

## 7. Branch protection checklist (manual)

Configure this by hand in GitHub. Don't automate it. Use a **ruleset**:
Settings → Rules → Rulesets → New branch ruleset.

**Ruleset `main` (target: default branch, enforcement: Active)**

- [ ] Restrict deletions
- [ ] Block force pushes
- [ ] Require a pull request before merging
  - [ ] Required approvals: **0**. A solo developer can't approve their own
        PR, so anything higher blocks every merge
  - [ ] Require conversation resolution before merging. This forces every
        CodeRabbit thread to be read
- [ ] Require status checks to pass (list below)
  - [ ] Require branches to be up to date before merging. Optional: safer,
        but costs extra runs
- [ ] Require code scanning results: tool **CodeQL**, security alerts
      **High or higher**, alerts **Errors**
- [ ] Require linear history. Optional, and pairs with squash merge
- [ ] Bypass list: **empty**. If you add yourself as an admin for
      emergencies, note that it also lets you skip red checks

**Other settings**

- [ ] Settings → General → Pull Requests: allow **squash merging** only, and
      turn on **automatically delete head branches**
- [ ] Settings → Actions → General: workflow permissions **read-only**. Don't
      allow Actions to create or approve PRs. Require approval for external
      contributors (5.3)
- [ ] Settings → Code security: Dependabot alerts and security updates on
      (5.1)

**Required status check names**

Add each one once its workflow exists and has run at least once. GitHub only
offers check names it has already seen.

| Phase | Check name |
|---|---|
| 1 | `lint (backend)`, `lint (storefront)` |
| 1 | `typecheck (backend)`, `typecheck (storefront)` |
| 1 | `unit (backend)`, `unit (storefront)` |
| 1 | `build (backend)`, `build (storefront)` |
| 2 | `integration-backend` |
| 3 | CodeQL, through the code-scanning rule above, not as a status check |
| — | `e2e` is **not** required. It doesn't run on PRs |

**Gotcha:** don't put workflow-level `paths-ignore` (e.g. skip docs-only PRs)
on a workflow that contains required checks. A required check that never
runs stays "pending" and blocks the merge. A docs-only PR just runs the
cheap checks.

---

## 8. Codespaces and Docker

### 8.1 Compose and seed data in a Codespace

Planned in [`local-infrastructure.md`](local-infrastructure.md). None of it
exists yet.

| Step | When | What |
|---|---|---|
| Dev container | Codespace creation | **[Inferred]** a Node 24 devcontainer image with the docker-in-docker feature, forwarding ports 3000 and 9000 |
| Install | `postCreateCommand` | `npm ci` in `backend/` and `storefront/` |
| Services | `postStartCommand` | `docker compose up -d` (Postgres and Redis) |
| First-time data | By hand, once per new Codespace | `npm run db:reset` in `backend/` (migrate + seed) |
| Publishable key | By hand after the first run, until the seed creates it (3.3) | Copy it into `storefront/.env.local` |

Docker volumes survive stopping a Codespace but not deleting it. Reset and
seed must always be one command.

### 8.2 Codespaces secrets

- Set them in Settings → Secrets and variables → **Codespaces**, scoped to
  this repo.
- They arrive as **environment variables** at Codespace start. After
  changing one, **rebuild or restart** the Codespace.
- **[Inferred]** Real env vars normally take precedence over `.env` files.
  Confirm how Medusa's env loading and Next.js treat a variable that is set
  in both places.

### 8.3 Keeping CI and Codespaces the same

| Version | Single source | Used by |
|---|---|---|
| Node 24 LTS | `.nvmrc` | Dev container image tag, `engines`, CI `setup-node` (reading the version from `.nvmrc`) |
| `postgres:17-alpine` | `docker-compose.yml` | CI service container |
| `redis:7-alpine` | `docker-compose.yml` | CI service container |

- When a version changes, it changes in **the dev container, Compose, and CI
  in one PR** ([`local-infrastructure.md` §10](local-infrastructure.md#10-ci-parity)).
  Dependabot doesn't watch images (5.2), so it can't split them.
- Use a **4-core** Codespace. It uses up the monthly core-hour quota twice as
  fast as 2-core, so stop it when you're not using it. Quota: **[Verify]**
  on GitHub's Codespaces billing page.

---

## 9. Production deployment (later decision)

**Not decided, and not designed here.** These options are listed so the
Docker stage and secrets plan point the right way.

| Option | Shape | Cost / free tier | Rollback | Trade-offs |
|---|---|---|---|---|
| **Medusa Cloud** | Managed Medusa backend with Postgres, Redis, and storage. Storefront hosted alongside or separately | Paid, likely no free tier **[Verify]** | Built-in deploy history **[Verify]** | Least ops and made for Medusa. Highest cost and some lock-in. No Dockerfiles needed |
| **Railway** | Backend, storefront, Postgres, and Redis as services in one project. Medusa documents deploying here | Usage-based with a small monthly plan or trial credit **[Verify]** | Redeploy any earlier deployment in one click | Low ops at a moderate cost. Database backups depend on the plan **[Verify]** |
| **VPS + Docker Compose** (e.g. Hetzner, DigitalOcean) | One server running all four, behind a reverse proxy with TLS | Cheapest and predictable monthly price **[Verify]** | Redeploy the previous image tag | You own OS patching, backups, TLS, and monitoring. Needs the deferred Docker images |

Notes:

- Vercel is a common storefront host, but its free Hobby plan forbids
  commercial use **[Verify]**, so a production store would need a paid plan.
- Render's free tier sleeps and its free Postgres expires **[Verify]**, so it
  doesn't suit production.

**Recommendation (not a decision):** lean toward **Railway** for a solo
developer. It keeps all four services in one place, deploys from Git, and
rolls back in one click without you running servers. Revisit Medusa Cloud if
ops time becomes the bottleneck, or a VPS if cost does. The chosen host
decides whether the deferred `docker-build` stage is needed at all.

---

## 10. Caching and cost

**Actions minutes:** standard GitHub-hosted runners are **free for public
repos** **[Verify]**. If the repo ever becomes private, a monthly free
allowance applies **[Verify]**, and E2E and integration jobs would use most
of it.

| What | How | Key |
|---|---|---|
| npm downloads | `setup-node` built-in npm cache (caches `~/.npm`, not `node_modules`) | Each package's lockfile |
| Next.js build cache | Cache `storefront/.next/cache` | Lockfile + storefront source hash |
| Playwright browsers | Cache `~/.cache/ms-playwright`. Install **Chromium only** | Installed Playwright version |
| Docker layers | GitHub Actions cache backend for Buildx | When `docker-build` exists (deferred) |
| Service container images | Not cacheable. Alpine images keep the pull small | — |

**Staying within free limits**

- Cancel superseded PR runs (section 2).
- Keep E2E off PRs. Run it on `main`, nightly, and on manual dispatch.
- Keep the integration suite under 5 minutes (3.1).
- Keep failure artifacts (Playwright traces) for **7 days**, not the
  default 90.
- Actions cache storage has a per-repo cap and evicts entries unused for
  about a week **[Verify]**.
- Codespaces: stop when idle, use 4-core only while running the full stack,
  skip prebuilds (they cost storage) **[Verify quota]**.

---

## 11. Phased rollout checklist

Each phase is one branch and one PR, sized for one sitting.

### Phase 0: Prerequisites (not CI, but CI needs them)

- [x] Root `.gitignore` covering `.env`, `.env.*`, and `node_modules`. Run
      the checks in 5.4. `.next` and Playwright output are ignored by the
      storefront's own `.gitignore` when it is scaffolded
- [x] `docker-compose.yml`, `.devcontainer/`, `.nvmrc`, root `.env.example`
      ([`local-infrastructure.md` §11](local-infrastructure.md#11-next-branch-checklist)).
      `backend/.env.example` and `storefront/.env.example` come with each scaffold
- [x] Scaffold `backend/` and `storefront/`, each with `lint`, `typecheck`,
      `test` (unit), and `build` scripts. The storefront has one real test.
      The backend has none yet (see 3.5)
- [x] Decide the package manager (open question 1): npm, one lockfile per
      package

**Success:** all four scripts pass in a fresh Codespace, and the 5.4 checks
are clean.

### Phase 1: Basic PR checks

- [x] CI workflow: `lint`, `typecheck`, `unit`, `build`, as a matrix over
      both packages, with npm caching, concurrency cancel, and a read-only
      token (`.github/workflows/ci.yml`). Actions use major-version tags;
      SHA pinning waits for Phase 3
- [x] Install the CodeRabbit GitHub App
- [x] Create the `main` ruleset (section 7) with the Phase 1 checks required
- [x] Start the metrics log (section 12): [`ci-metrics.md`](ci-metrics.md)

**Success:** a PR shows 8 green checks in **under 10 minutes**, and a PR with
a deliberate lint error **can't be merged**.

### Phase 2: Integration tests with service containers

- [x] `integration-backend` job with Postgres and Redis service containers
      (Redis modules wired in `backend/medusa-config.ts`)
- [x] First tests: inventory guards (3.4, #1), then guest cart → order (#2)
- [x] Add `integration-backend` to the required checks

**Success:** green on PRs in **under 5 minutes**, and no test database is
left behind in the container after the run.

### Phase 3: Security

- [ ] CodeQL default setup (JavaScript/TypeScript, GitHub Actions)
- [ ] Turn on Dependabot alerts and security updates
- [x] Add `dependabot.yml` (5.2)
- [ ] Confirm secret scanning and push protection are still on
- [ ] Actions hardening settings (5.3)
- [x] SHA-pin existing actions, with shared setup moved to
      `.github/actions/setup-package` so each pin appears once per action
- [ ] Add "Require code scanning results" to the ruleset

**Success:** the first CodeQL scan finishes with no High or Critical alerts,
the first grouped Dependabot PR appears, and the settings match 5.1.

### Phase 4: Playwright

- [ ] Seed creates the publishable key and the Supply Shipping Option (3.3)
- [ ] `e2e` job on `main`, nightly, and manual dispatch. Browser cache and
      trace upload on failure
- [ ] One happy-path test: add a Supply to the cart → check out → see the
      confirmation

**Success:** **3 green consecutive runs** on `main` with no retries or flakes.

### Phase 5: Smart Tests, recording only

- [ ] Confirm the free tier and CLI requirements on CloudBees' page (4.6)
- [ ] JUnit reports from Jest, Vitest, and Playwright
- [ ] Token as an Actions secret. Steps skip on fork PRs and never fail the job
- [ ] Record on `main` and same-repo PRs. No subsetting

**Success:** test sessions from all three runners appear in Smart Tests, and
a simulated fork PR (no secret) still passes with the full suite.

### Later

- [ ] Smart Tests observation, then subsetting (4.3 criteria)
- [ ] `docker-build`, once hosting is chosen (section 9)
- [ ] `.coderabbit.yaml` with path rules (section 6)
- [ ] Coverage threshold on custom backend code (open question 3)

---

## 12. Metrics from day one

Record these from Phase 1, weekly, in a small table in
[`ci-metrics.md`](ci-metrics.md). Use the `gh` CLI, which costs nothing. No
dashboards yet.

| Metric | Definition | Source |
|---|---|---|
| Lead time for changes | PR opened → merged to `main` (median per week) | `gh pr list --state merged --json createdAt,mergedAt` |
| Pipeline duration | Wall-clock time of the CI workflow on PRs (median and slowest). Track E2E separately | `gh run list --json createdAt,updatedAt,conclusion,event` |
| Failure rate | Share of CI runs that failed, split into PR and `main` | Same as above |
| Time to fix a red build | First failed `main` run → next green `main` run | Same as above, filtered to `main` |

Also note any "escaped defect": a bug found after merge that a test should
have caught. This feeds the Smart Tests check (4.3).

---

## 13. Open questions

1. ~~**Package manager and layout.**~~ **Resolved (2026-10-27):** npm with a
   separate lockfile per package. No workspaces.
2. **Seed bootstrap for CI.** How does the seed create the publishable key
   and the Supply Shipping Option, and how does it hand the key to the
   storefront in the E2E job?
3. **Coverage threshold.** `CLAUDE.md` requires one on custom backend code.
   When is it switched on, and at what level, without chasing numbers?
4. ~~**CodeQL block level and bypass.**~~ **Resolved (2026-10-28):** High
   and above security alerts, plus Error alerts, block merges. The `main`
   bypass list stays empty.
5. **Smart Tests timing.** Start recording in Phase 5 regardless, or wait
   until PR test time nears 10 minutes? This depends on the free tier.
6. **Hosting timeline.** When will hosting be chosen? That decides whether
   `docker-build` is needed.
7. **E2E on PRs.** Should a label let you run `e2e` on a PR that touches
   cart or checkout?
8. **Dependabot auto-merge.** Ever allow it for patch-level dev
   dependencies once the pipeline is trusted?

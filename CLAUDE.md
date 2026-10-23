# CLAUDE.md

This file gives Claude (and other coding agents) context and rules for working
in this repository. Read it fully before making any changes. If a request
conflicts with anything here, flag the conflict instead of silently picking one.

## Project overview

This is a **headless ecommerce store for reptiles and similar exotic pets**.
It sells live animals along with the feeders, enclosures, and accessories
needed to keep them. The project is **production-bound**: write code as if it
will serve real customers and real staff. That means correct, secure, and
maintainable, but still simple. Do not add features, services, or
dependencies that were not asked for.

The app has two sides: a public storefront for customers and an internal
dashboard for staff.

### Public storefront (customers)

The public can:

- **Browse** products by category (live animals, feeders, enclosures,
  accessories) and by animal type (e.g. lizard → gecko → crested gecko).
- **Search** products by keyword, and **filter** by category, animal type,
  and tags (e.g. `beginner-friendly`, `nocturnal`, `advanced`).
- **View product detail pages** with images, descriptions, price,
  availability, care-level tags, care-sheet links, and videos.
- **Add products to a cart**, update quantities, and remove items.
- **Check out as a guest.** Customer accounts (login, order history, and
  other member-only features) are planned for later but are **not** part of
  the current scope. Don't build account features until asked.

### Internal staff (Medusa Admin)

Staff use the **built-in Medusa Admin dashboard**. In it, staff can:

- **Create, edit, and delete products**, including prices, images,
  categories, and tags.
- **Check and adjust stock** (inventory levels) for every product.
- **View and manage orders** placed through the storefront.

Do not build a custom admin interface unless explicitly asked. If staff need
something Admin doesn't provide, extend Admin through Medusa's supported
admin extension points (widgets, UI routes), not with a separate app.

### Single tenant

This is a **single-tenant** application: one business, one store, one
catalog, one staff team, and one deployment. There are no other stores,
vendors, or organizations sharing the system. Do **not** add tenant IDs,
per-tenant configuration, multi-store or multi-vendor logic, or any other
tenancy abstraction. If a request seems to need multi-tenancy, flag it.

### Live animals

Live animals are not ordinary products. Follow these rules:

- Every live animal is **inventory-managed** (`manage_inventory` on,
  backorders off). A live animal must never be oversold, and cart quantity
  can never exceed available stock.
- Show care-level tags (`beginner-friendly`, `intermediate`, `advanced`)
  prominently so customers can judge whether an animal suits them.
- Shipping restrictions, legal and permit requirements, and age checks for
  live animals are **unresolved**. Do not invent or implement rules for them.
  Ask a human.

### Tech stack

```
Next.js storefront  →  Medusa backend (Node.js, REST API)  →  PostgreSQL
                              ↓
                      Medusa Admin dashboard (built in)
```

- **Next.js** is the customer-facing storefront.
- **Medusa** is the commerce backend. It owns products, carts, orders,
  inventory, customers, and auth. It is a separate Node.js server that the
  storefront calls over its API.
- **PostgreSQL** is the database. Medusa connects to it; the storefront never
  talks to it directly.
- **Medusa Admin** is the built-in staff dashboard (see above).

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js | Storefront built **from scratch** |
| Database | PostgreSQL | Used by Medusa only |
| Commerce backend | Medusa | Open source, MIT licensed, TypeScript/Node.js |
| Styling | Plycss (`ply-css`) | Styling rules live in a separate design plan |
| Language | TypeScript | Across the storefront and all Medusa customizations |
| Storefront-to-backend calls | Medusa JS SDK | Always through `storefront/lib/data/`. Never hand-written `fetch` calls |
| Search | Medusa Store API (`q` param) | Plus filtering by category, animal type, and tags |
| Cache / event bus / locking | Redis | Required for anything production-like. In-memory fallbacks only in local dev |
| Local services | Docker Compose | Runs Postgres and Redis locally |
| File storage | Local in development | S3 or an S3-compatible service for production |

## Non-negotiable rules

1. **Never write a raw data-access query outside the shared layer.** All data
   access goes through the shared data-access layer. If a new query pattern
   doesn't fit the existing layer, extend the layer. Don't bypass it. (The
   layer is `storefront/lib/data/`, a wrapper around the Medusa JS SDK. Pages
   and components never call the SDK directly. On the backend, data access
   goes through Medusa modules, services, and workflows, never raw SQL.)
2. **Never touch production credentials, secrets, or run destructive
   migrations.** Only use `.env.local` / dev database connections. If a task
   seems to require prod access, stop and ask a human.
3. **Never modify auth or billing logic without explicit human sign-off**,
   even if the change looks small. "Auth" includes Medusa auth configuration
   and any admin or customer route guards. "Billing" includes payment,
   checkout, pricing, totals, and tax logic.
4. **Every change lives on its own branch.**

## Working conventions

- **Language/style**: TypeScript strict mode, no `any` without a comment
  explaining why. Match existing formatting (Prettier/ESLint config in repo).
  Don't introduce a new style in a new file.
- **Commits**: Commit descriptions should note whether the change was
  agent-generated, hand-written, or agent-generated-then-hand-edited.
- **Dependencies**: don't add a new package without checking if an existing
  dependency already covers the need.
- **Repo layout**: storefront code (Next.js) and backend code (Medusa) live
  in separate directories (`storefront/` and `backend/`), each with its own
  `package.json`.
- **Secrets**: all secrets and connection strings go in env files
  (`storefront/.env.local`, `backend/.env`), which are never committed. Keep
  an up-to-date `.env.example` with placeholder values in each directory.
- **Backend customization**: use Medusa's extension points (custom modules,
  workflows, subscribers, API routes, admin extensions). Never modify
  Medusa's core packages.
- **No duplicated commerce logic**: the storefront reads product, cart, and
  order data from Medusa. Never compute pricing, totals, tax, or inventory in
  the frontend.
- **Next.js components**: keep components small. Prefer server components;
  use client components only where interactivity requires it.

## What to do when uncertain

- If a task requires touching auth, billing, or migrations, and the
  instructions aren't explicit about the approach: stop and ask, don't guess.
- If existing code conflicts with a rule in this file, flag it rather than
  quietly working around it. The rule or the code may need to change.
- Prefer extending existing patterns (data-access layer, auth guards, error
  handling) over introducing new ones. Consistency matters more than
  cleverness in a codebase multiple people (and multiple agents) are editing.

## Decisions already made

- The storefront is **built from scratch**. Do **not** scaffold from Medusa's
  official Next.js starter storefront. It may be consulted as a reference for
  how cart, checkout, and API calls are wired, but don't copy in its code or
  its Tailwind styling. Don't add Tailwind or any other CSS framework.
- **No payment provider is chosen yet.** Do not integrate Stripe, PayPal, or
  any other provider. Use Medusa's built-in manual/system payment provider,
  and keep payment logic behind Medusa's payment module so a real provider
  can be added later without restructuring.
- **Guest checkout only** for now. Customer accounts come later.
- **Staff use Medusa Admin**, not a custom dashboard.
- **Search uses Medusa's built-in Store API search.** No external search
  engine.
- **Testing is layered, and CI gates it.** Use the layers below and don't
  add other test frameworks without asking.

  | Layer | Tool | Scope |
  |---|---|---|
  | Static | TypeScript strict + ESLint | Everything |
  | Unit | Vitest (`storefront/`), Jest (`backend/`, as Medusa expects) | Pure helpers, formatters, filter-param builders |
  | Backend integration | `medusaIntegrationTestRunner` (`@medusajs/test-utils`) + real Postgres | Workflows, subscribers, API routes, inventory rules |
  | Storefront component | Vitest + React Testing Library | Interactive client components (cart, filters) |
  | API mocking | MSW at the Medusa SDK boundary | `storefront/lib/data/` and components without a live backend |
  | E2E | Playwright against the Docker Compose stack | A few critical journeys |

  - **Priority coverage:** (1) inventory guards: a live animal can't be
    oversold and cart quantity can't exceed stock; (2) guest checkout with
    the manual payment provider; (3) search and filter by category, animal
    type, and tags.
  - **Tests read, never recompute.** Tests touching checkout, totals, or
    pricing assert on values Medusa returns. They must not reimplement
    that logic (see the no-duplicated-commerce-logic rule).
  - **Test data:** tests use only throwaway dev/test databases, never
    production credentials (see non-negotiable rule 2).
  - **CI (GitHub Actions):** every PR runs lint → typecheck → unit →
    integration, with Postgres and Redis as service containers. E2E runs on
    `main` or nightly because it is the slowest layer.
  - **Coverage:** enforce a threshold on custom code in `backend/` only,
    never on Medusa internals. Don't write low-value tests just to hit it.
  - **Deferred:** visual regression, accessibility (`axe-core`), and API
    contract checks wait until the Plycss design settles.

## Out of scope (defer unless asked)

- Real payment processing
- External search engines (Algolia, Meilisearch, Typesense)
- Transactional and marketing email
- Tax calculation
- Customer accounts and member-only features
- Custom admin interface
- Shipping, legal, and permit rules for live animals
- Production hosting and deployment configuration (the project is headed to
  production, but deployment hasn't been planned yet)

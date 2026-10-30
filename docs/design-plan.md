# Storefront Design Plan

This is the brief for **Claude Design**. It says how the storefront should
look and be built with ply (`ply-css`), which components exist, how every
page is laid out, and how every finished design is scored before it is
accepted.

Read these first. This plan builds on them and does not repeat them:

- [`plycss-reference.md`](./plycss-reference.md): how ply really works and
  where its own docs are wrong. **Where ply's docs, `PLY.md`, or
  `ply-classes.json` disagree with that file, follow that file.**
- [`site-map.md`](./site-map.md): the pages and what each one does.
- [`domain-model.md`](./domain-model.md): the glossary. Use its terms in
  every label, heading, and class name: **Department**, **Animal Type**,
  **Care Level**, **Live Animal**, **Supply**, **Available Stock**. Never say
  "category" on its own.
- [`CLAUDE.md`](../CLAUDE.md): project rules. Commerce values (prices,
  totals, stock) always come from Medusa. A design shows them; it never
  works them out.

**Version pin:** `ply-css@1.8.0`. Every ply class named in this plan has been
checked against that version's `dist/css/ply.css`.

---

## 1. Decisions at a glance

| Topic | Decision |
|---|---|
| Install | Plain CSS import of `ply-css/dist/css/ply.min.css` in `app/layout.tsx`. No Sass, no purge step. |
| Custom CSS | CSS Modules, one per custom component. In prototypes, custom classes use the `sf-` prefix (see §2.5). |
| Dark mode | Automatic, following the OS. Brand values go on `:root` and dark values go in a `prefers-color-scheme: dark` block. Never set `data-theme`. No toggle. |
| Brand | Claude Design proposes the palette and fonts within §3's constraints. Once accepted, they are written into §3's token table and frozen. |
| Icons | Inline SVG through one `Icon` component. No icon package. |
| Fonts | Loaded with `next/font` (built into Next.js). No font package. |
| Add-to-Cart feedback | Inline status text plus the header cart count. No toast, no dialog. |
| Home page top | A one-sentence `<h1>` and a one-line lead, beside the Care Levels guide card. No Home search bar (search lives in the header). No full-screen hero. |
| Missing images | A flat neutral panel with an SVG silhouette and the product title. No gradients. |
| Product images | Stored on the Product in Medusa (`thumbnail` + images). Rendered with `next/image` `unoptimized` until file storage and hosting are decided. |
| Care Guides | One native `<details>` per top-level Animal Type. |
| Quality gate | The AI Audit scorecard (§9) runs on every page. To pass, a page needs **≥ 90 overall and no UX failures**. |

---

## 2. ply ground rules

These are short versions of [`plycss-reference.md`](./plycss-reference.md)
§6. Break any of them and the prototype won't work in the Next.js build.

### 2.1 Use only classes that exist

These names appear in ply's docs or agent files but are **not** in the
shipped CSS. Never use them:

| Don't use | Use instead |
|---|---|
| `phone-hide`, `tablet-hide`, `desktop-hide`, `phone-only`, `tablet-only` | `hide-on-mobile`, `hide-on-desktop` (they switch at 767px) |
| `dropdown`, `caret`, `caret-up` | The custom mega-menu (§6.1) |
| `text-centered` | `text-center` |
| `btn-big`, `btn-small`, `btn-smaller` | `btn-lg`, `btn-sm`, `btn-xs` |
| `input-big`, `input-small`, `input-smaller` | `input-lg`, `input-sm`, `input-xs` |
| `background-black` | `bg-black` |
| `table-hover` | `table-hovered` |
| `modal`, `modal-box`, `modal-blur`, `tooltip*`, `accordion-*`, `autocomplete`, `filterbox*` | Native `<dialog>`, native `<details>`, or a custom component |

When a class isn't listed in this plan, check that it exists in
`ply-css@1.8.0/dist/css/ply.css` before using it.

### 2.2 Breakpoints are desktop-first

The base `unit-*` class sets the **desktop** width. Prefixes override it on
smaller screens:

| Prefix | Applies at | Used for |
|---|---|---|
| `small-desktop-unit-*` | ≤ 1024px | Small laptops, tablets in landscape |
| `tablet-unit-*` | ≤ 767px | Tablets in portrait. Also where `hide-on-mobile` / `hide-on-desktop` switch |
| `large-phone-unit-*` | ≤ 650px | Large phones |
| `phone-unit-*` | ≤ 480px | Phones |

**PLY.md and llms-full.txt give the wrong numbers** for `tablet` and `phone`.
Use the table above.

### 2.3 Rows don't stack unless you tell them to

- Every `unit-*` that isn't `unit-100` needs at least a `tablet-unit-*`
  class. Otherwise a four-column row stays four columns on a phone.
- The viewport prefixes have no `12`, `38`, `62`, `88`, or `auto` sizes. Don't
  use those widths for columns that have to respond to screen size.
- A `unit-*` element has to be the **direct child** of its `units-row`. In
  React, the component that renders the row also renders the `unit-*`
  wrappers. A child component never returns its own `unit-*` div.

### 2.4 React and Next.js caveats

- `<dialog>` only traps focus when it's opened with `showModal()` from a
  client component. This design has no dialogs, so keep it that way unless
  a later request needs one.
- `.message` (ply's toast) is always visible. This design doesn't use it.
- Menu toggles are real `<button>` elements with `aria-expanded` and
  `aria-controls`. Never use the docs' `<span class="navigation-toggle">`.
- A `<details>` element is either left uncontrolled, or controlled through
  `onToggle`.

### 2.5 Naming custom classes

ply has global classes with common names: `.success`, `.error`, `.label`,
`.badge`, `.hide`, `.border`, `.message`, `.step`, `.lead`, `.fixed`,
`.circle`, `.bold`, and more. Our own classes must never reuse these.

- **In code:** each custom component has its own CSS Module
  (`ProductCard.module.css`), so its class names are hashed.
- **In prototypes:** prefix custom classes with `sf-` and the component
  name, and keep the part name after it: `sf-card`, `sf-card-media`,
  `sf-stepper-input`. Each prefix maps one-to-one to a future CSS Module.
- Custom CSS reads ply's `--ply-*` variables (§3) for color, spacing, radius,
  and type. It never hard-codes a color.

### 2.6 Prototypes are real ply

Claude Design builds prototypes as HTML that loads `ply-css@1.8.0`. It can
use the CDN in prototypes; the app imports ply from npm. Prototypes use only
classes from this plan plus `sf-` custom classes. **No Tailwind, inline
utility styles, or any other CSS framework.** Then each prototype maps
straight onto components.

---

## 3. Brand and theme

### 3.1 Constraints for the proposal

Claude Design proposes the palette and fonts. The proposal must fit these
constraints. Most come from the audit (§9).

- **Mood:** natural and calm, like a well-kept terrarium. The store sells
  live animals, so it should feel knowledgeable and trustworthy rather than
  flashy. No neon, no "gamer" look, no cartoon mascots.
- **Colors: at most three.** One main brand color, one grayscale ramp, and
  one accent. Status colors (Care Level, Sold out, alerts) are separate and
  don't count toward the three (§9.2).
- **No gradients** anywhere: no gradient backgrounds, buttons, or
  placeholders.
- **No alternating section backgrounds.** Sections are separated by space
  and structure, not by gray stripes.
- **Fonts:** never Inter, Roboto, or Open Sans as the main font. ply's
  default font stack includes Roboto, so `--ply-font-body` and
  `--ply-font-heading` **must** be overridden. Headings and body must differ
  in family, weight, or spacing. At most two families, both loaded through
  `next/font`.
- **Type rhythm:** headings use a line-height of 1.1–1.3 and body text uses
  1.6–1.8. Large headings (`h1`, `h2`) get deliberate letter-spacing. Each
  heading level is clearly bigger than the next, not one step up.
- **Contrast:** every text and background pair meets WCAG AA (4.5:1 for
  body text, 3:1 for large text and UI parts), in light **and** dark mode.
  ply's AA claim only covers its default colors.
- **Shadows on two element types at most:** the mega-menu panel, plus ply's
  built-in control states (pressed, disabled, and input focus). Cards, tiles,
  and sections are flat, with a border instead of a shadow. Don't use
  `layer-*` or `shadow-*` classes.

### 3.2 Token table (frozen)

Accepted from the Claude Design prototype's `theme.css`, which is now
`storefront/app/theme.css`. Brand: **Moss** `#2E5E3E` (main), a warm stone
gray ramp, and **Ochre** `#9C5416` (accent). The main text and background
pairs were checked against WCAG AA in both modes. Input borders are closest
to the limit, at 3.03:1 in light mode.

| Group | Variable | Light | Dark |
|---|---|---|---|
| Background | `--ply-bg-body` | `#F6F7F4` | `#111612` |
| | `--ply-bg-surface` | `#FFFFFF` | `#182019` |
| | `--ply-bg-surface-alt` | `#ECEEE9` | `#202922` |
| | `--ply-bg-muted` | `#E1E5DE` | `#29332B` |
| Text | `--ply-color-body` | `#1F2621` | `#E2E7E1` |
| | `--ply-color-headings` | `#141A16` | `#F2F5F0` |
| | `--ply-color-secondary` | `#47524A` | `#B6C0B7` |
| | `--ply-color-muted` | `#56615A` | `#A5AFA6` |
| | `--ply-color-placeholder` | `#66716A` | `#8F9990` |
| | `--ply-color-text-inverse` | `#FFFFFF` | `#0F1A12` |
| Borders | `--ply-border-color` | `#D5DBD2` | `#313C33` |
| | `--ply-border-strong` | `#9AA59C` | `#5A675D` |
| | `--ply-border-radius` | `6px` | (same) |
| Interactive | `--ply-color-accent` | `#9C5416` | `#E2A35E` |
| | `--ply-color-focus` | `#2E5E3E` | `#8FCA9E` |
| | `--ply-color-link` | `#2E5E3E` | `#8FCA9E` |
| | `--ply-color-link-hover` | `#1B3A26` | `#B4DEC0` |
| Buttons | `--ply-btn-default-bg` / `-hover` / `-active` | `#2E5E3E` / `#244B31` / `#1B3A26` | `#7DBB8E` / `#95CBA3` / `#AAD7B6` |
| | `--ply-btn-default-color` | `#FFFFFF` | `#111612` |
| | `--ply-btn-secondary-bg` / `-hover` / `-active` | `#2A322C` / `#1F2621` / `#141A16` | `#E2E7E1` / `#F2F5F0` / `#CBD3CB` |
| | `--ply-btn-secondary-color` | `#FFFFFF` | `#111612` |
| | `--ply-btn-ghost-color` | `#2E5E3E` | `#8FCA9E` |
| | `--ply-btn-border-radius` | `6px` | (same) |
| Forms | `--ply-color-input-bg` | `#FFFFFF` | `#182019` |
| | `--ply-color-input-border` | `#8C978E` | `#6C7A6F` |
| | `--ply-color-error` | `#A12A1F` | `#F2A197` |
| | `--ply-color-success` | `#23673A` | `#8FCA9E` |
| Navigation | `--ply-nav-bg` | `transparent` | `transparent` |
| | `--ply-nav-color` | `#1F2621` | `#E2E7E1` |
| | `--ply-nav-border` | `#D5DBD2` | `#313C33` |
| | `--ply-nav-hover` | `#ECEEE9` | `#202922` |
| Tables | `--ply-color-table-border` | `#D5DBD2` | `#313C33` |
| | `--ply-color-table-striped` | `#F0F2EE` | `#151B16` |
| Type | `--ply-font-heading` | Bricolage Grotesque (500–800, variable) | (same) |
| | `--ply-font-body` | Source Sans 3 (400, 600, 700) | (same) |
| Radius | `--ply-radius-sm` / `-md` / `-lg` | `4px` / `8px` / `12px` | (same) |
| | `--ply-label-radius` / `--ply-badge-radius` | `4px` / `999px` | (same) |
| Status: Beginner-friendly | `--sf-care-beginner-bg` / `-fg` / `-border` | `#E2F0E5` / `#1C5A2D` / `#93C4A0` | `#1B3222` / `#A8DCB5` / `#3D6A4A` |
| Status: Intermediate | `--sf-care-intermediate-*` | `#FBEED6` / `#6F3F05` / `#DDB06A` | `#372811` / `#F1C88A` / `#6D5126` |
| Status: Advanced | `--sf-care-advanced-*` | `#FAE3E0` / `#862317` / `#DF9D94` | `#3B1D19` / `#F3B2A9` / `#733F39` |
| Status: Sold out | `--sf-soldout-*` | `#ECEEE9` / `#3A443D` / `#B7C0B8` | `#202922` / `#C8D0C8` / `#4A564D` |
| Header bar | `--sf-bar-bg` / `--sf-bar-fg` | `#2E5E3E` / `#FFFFFF` | `#1B3A26` / `#F2F5F0` |
| Cart count | `--sf-count-bg` / `--sf-count-fg` | `#9C5416` / `#FFFFFF` | `#E2A35E` / `#111612` |

Fonts load through `next/font/google` as `--font-heading` and
`--font-body`. The theme reads them into `--ply-font-heading` and
`--ply-font-body`, with a `"Segoe UI", system-ui, sans-serif` fallback.

**Type rhythm:** body line-height 1.7. `h1` is 2.75rem / 1.12 / −0.025em,
`h2` is 1.75rem / 1.2 / −0.015em, and `h3` is 1.125rem / 1.3. At ≤ 767px,
`h1` drops to 2.125rem and `h2` to 1.5rem.

Set the button `-bg-hover` and `-bg-active` values explicitly. ply's
`color-mix()` fallback doesn't work in older browsers.

### 3.3 Where the tokens go

```css
/* storefront/app/theme.css, imported after ply in app/layout.tsx */
:root {
  /* light values from §3.2 */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    /* dark values from §3.2 */
  }
}
```

- `<html>` never gets a `data-theme` attribute. Setting one turns off the
  dark block.
- Because there's no toggle, no script is needed and there's no theme flash.
- In prototypes, put the same two blocks in a `<style>` tag after the ply
  stylesheet.

---

## 4. Shared components

**Rule:** a piece of UI used on more than one page is its own component in
`storefront/components/`. A piece used on one page is still a small
component, but it lives next to that page (§5). It moves to
`components/` when a second page needs it.

Server components are the default. Only the components marked
**client** below need `"use client"`. Page-local client pieces are listed
in §5.

| Component | Used on | Kind | ply building blocks | Custom CSS (`sf-`) |
|---|---|---|---|---|
| **SiteHeader** | Every page | Server | `skip-link`, `units-container`, `display-flex`, `items-center`, `justify-between`, `badge` | `sf-header` |
| **CatalogNav** | SiteHeader | **Client** | `navbar`, `btn btn-ghost`, nested `<details>` (mobile) | `sf-megamenu` (§6.1) |
| **SearchForm** | SiteHeader | Server | `input-groups`, `btn-append`, `btn btn-primary`, `sr-only` | `sf-search` |
| **SiteFooter** | Every page | Server | `units-row`, `unit-*`, `text-secondary` | `sf-footer` |
| **ProductGrid** | Home, Shop | Server | `container-query`, `units-row`, `flat-list`, `unit-25` + `container-tablet-unit-50` | — |
| **ProductCard** | Home, Shop (inside ProductGrid) | Server | — (not `no-link-style`; see below) | `sf-card` (§6.2) |
| **ProductImage** | ProductCard, ShopTile, Product detail | **Client** (load-failure fallback) | — | `sf-image`, fallback (§6.6) |
| **ShopTile** | Home (inside TileGrid) | Server | — | `sf-tile` |
| **TileGrid** | Home | Server | `container-query`, `units-row`, `flat-list`, `unit-25` + `container-tablet-unit-50` | — |
| **CareLevelGuide** | Home, Care Guides | Server | — | `sf-care-guide` |
| **CareLevelBadge** | ProductCard, Product detail, Care Guides | Server | — (not `.label`, which forces uppercase) | `sf-care` |
| **StockBadge** | ProductCard, Product detail | Server | — | `sf-stock` |
| **Price** | ProductCard, Product detail, Cart, Checkout, Confirmation | Server | `font-semibold` | — |
| **QuantityStepper** | Product detail, Cart | **Client** | `form`, `btn btn-secondary-outline btn-icon` | `sf-stepper` (§6.5) |
| **OrderSummary** | Cart, Checkout, Confirmation | Server (row actions are client, §5) | `table-container`, `table-stroked` | `sf-summary` |
| **CareLinks** | Product detail, Care Guides | Server | `flexible-embed` | — |
| **Notice** | Cart, Checkout | Server | `alert`, `alert-yellow` / `alert-red` / `alert-blue`, `alert-content` | — |
| **EmptyState** | 404, Error, empty Cart, Shop with no results | Server | `text-center`, `btn btn-primary` | `sf-empty` |
| **Icon** | Many | Server | `sr-only` (for a label, when the icon isn't decorative) | — |

### Component details

- **SiteHeader** has three rows. (1) A utility bar, desktop only: the Live
  Animal shipping `[PLACEHOLDER]` on the left, and "Care Guides" and "New
  to reptiles? Start here" (→ `/care-guides` for now) on the right. (2) The
  skip link, the logo (mark, "Reptile Store", and "Reptiles · Amphibians ·
  Invertebrates"; links to `/`), SearchForm, and icon links for Care Guides
  and the cart. The cart link is labelled "Cart, 2 items", with a `badge`
  for the unit count read from the Medusa cart. With no cart there is no
  badge. (3) A brand bar (`--sf-bar-bg`): the "All Animal Types" CatalogNav
  button, "Browse all products" → `/shop`, the four Departments, and
  "Beginner-friendly" → `/shop?care_level=beginner-friendly`. At ≤ 767px the
  utility bar is hidden, the menu button, logo, and icon links share the
  first row, SearchForm spans the full width below, and the brand bar
  scrolls sideways. The header is not sticky.
- **CatalogNav** is one client component with two variants (site map §2).
  **Desktop:** the "All Animal Types" button opens a full-width panel with
  one column per top-level Animal Type. The Departments are already in the
  brand bar. **Mobile:** the menu button opens an accordion with the
  Departments (plus "Shop all"), the Animal Type tree ("All lizards", then
  each child), and Care Guides. Every Animal Type link goes to
  `/shop?animal_type=…`. Behavior is in §6.1.
- **SearchForm** is `<form role="search" action="/shop">` with a "Search
  in" Department `<select name="department">` ("All Departments" sends no
  filter), a labelled `q` input, and a Search button. It works without
  JavaScript. At ≤ 767px the select is hidden and the button shows only its
  icon; the text stays in the accessible name. It appears only in the
  header. Home has no search bar of its own.
- **SiteFooter** has links to Care Guides and the four Departments, plus
  store information. No newsletter or social icons: those are out of scope.
- **ProductGrid** renders a `units-row` and wraps each ProductCard in its own
  `unit-*` div (rule §2.3). It uses container queries, so the same grid works
  in a full-width row on Home and in the 75% results column on Shop:
  `unit-25 container-tablet-unit-50`, with `container-query` on the
  wrapper. That gives 4 columns, then 2 once the container is ≤ 767px,
  phones included (as in the Home mockup).
- **ProductCard** is one link holding
  ProductImage, the title, Price, a CareLevelBadge (Live Animals only), and a
  StockBadge when the product is sold out. It has no buttons inside: Add to
  Cart lives on the product page. It's flat, with a border and no shadow. On
  hover or focus, the border uses the accent color. The title and price
  are underlined. The card's CSS Module removes the link's own underline:
  ply's `no-link-style` only styles `a` elements *inside* the classed
  element, so it does nothing when put on the link itself.
- **ShopTile** is one link into a filtered Shop view: a 3:2 decorative image
  (`alt=""`, because the title names the tile), the title, a one-line
  subtitle, and an arrow. The image is a chosen photo, else a stand-in
  product's Medusa image, else the icon on a flat panel (§6.6).
- **CareLevelGuide** is the "Care Levels, at a glance" card: each
  CareLevelBadge with its one-line meaning.
- **CareLevelBadge** names the level in words: "Beginner-friendly",
  "Intermediate", or "Advanced". It is never color alone. It also shows a
  1-, 2-, or 3-pip marker as a shape cue for people who can't tell the
  colors apart. On the product page and Care Guides it's larger (the
  `size="lg"` variant), because the site map says to show Care Level
  prominently.
- **StockBadge** reads "Sold out" in neutral styling. On the product page,
  the in-stock state reads "In stock". It never shows a count unless Medusa
  provides one and a human asks for it.
- **Price** formats the amount and currency code Medusa returns
  (`Intl.NumberFormat`, en-US). It does no math.
- **QuantityStepper** is a − button, a labelled number input, and a +
  button. Its minimum is 1 and its maximum is the Available Stock passed in
  from Medusa. + is disabled at the maximum, and − is disabled at 1. Each
  target is at least 44 × 44px. Details are in §6.5.
- **OrderSummary** is a table of Line Items (product, unit price, quantity,
  line total) followed by the totals, all exactly as Medusa returns them.
  On Cart, each row gets an actions slot for QuantityStepper and a Remove
  button. On Checkout and Confirmation, it's read-only. It sits in a
  `table-container`, so it scrolls sideways instead of overflowing on phones.
- **CareLinks** shows a "Read the care sheet" link (external, with an icon
  and "opens in a new tab" in `sr-only` text) and each Video in a
  `flexible-embed` iframe with `loading="lazy"` and a `title`.
- **Notice** wraps ply's `alert`. Information notices use `role="status"`
  and errors use `role="alert"`. The text always explains the problem, not
  just the color.
- **EmptyState** has a heading, one sentence, and one button-style link
  (usually back to `/shop`).
- **Icon** draws inline SVG from a small fixed set: search, cart, menu,
  close, chevron, plus, minus, external link, and one silhouette per
  top-level Animal Type (lizard, snake, frog, spider) plus a generic Supply
  silhouette. Icons are `aria-hidden="true"` unless they're the only label,
  in which case the button carries an `aria-label`. **No emoji as icons.**

---

## 5. Page layouts

Every page uses `units-container`, has exactly one `<h1>`, and keeps its
headings in order. Body text is left-aligned. Only short empty states and
the 404 page are centered.

**Space between sections changes on purpose** (audit §9, Layout). Use
`margin-bottom-lg` between related blocks and `margin-bottom-xl` or more
before a new topic. Don't use one fixed gap everywhere.

### Home (`/`)

| # | Section | Layout | Notes |
|---|---|---|---|
| 1 | Intro | `units-row`: `unit-60 tablet-unit-100` holds the `<h1>` ("Reptiles, amphibians, and invertebrates, with the feeders, enclosures, and gear to keep them.") and a one-line lead. `unit-35 tablet-unit-100` holds CareLevelGuide. | No full-screen hero, no background image, and no search bar (it's in the header). |
| 2 | Shop animals and supplies | TileGrid of 8 ShopTiles: 4 across, 2 on phones | Lizards, Snakes, Amphibians, Invertebrates → `/shop?department=live-animals&animal_type=…` (Live Animals only). Feeders, Enclosures, Accessories → `/shop?department=…`. All Live Animals ("Every animal we carry") → `/shop?department=live-animals`. |
| 3 | Beginner-friendly picks | Heading row (`justify-between`; the link drops below the heading on phones) + ProductGrid | One link: "See all beginner-friendly animals" → `/shop?care_level=beginner-friendly`. Medusa picks the products: the newest beginner-friendly Live Animals that are in stock, at most 4. Sold-out animals are left out. With none in stock, the whole section, heading included, is hidden. |

Only one section on the page is a product card grid. Tile photos are
stand-ins until real ones are chosen (site map §5). Each tile uses a fixed
product's Medusa image, picked so the same photo doesn't repeat in the
picks row.

### Shop (`/shop`)

| Area | Layout | Notes |
|---|---|---|
| Heading | `<h1>` reflects the active filter or search ("Geckos", "Results for 'uvb'", "Shop all") | |
| Toolbar | `display-flex justify-between items-center`: result count and sort `<select>` (Name A–Z, Newest) | No price sort (site map §3). |
| Filters | `unit-25 tablet-unit-100` → page-local **FilterPanel** (client) | |
| Results | `unit-75 tablet-unit-100` → ProductGrid, then `nav[aria-label="Pagination"] > ul.pagination` | No results → EmptyState with a "Clear filters" link. |

**FilterPanel** (page-local, client) is a `.form` with one `fieldset` and
`legend` per filter: Department (checkboxes), Animal Type (nested
checkboxes following the tree), Care Level (radios with "Any"), and Tags
(checkboxes). Each change updates the URL. Active filters show as removable
chips at the top of the results, and there's a "Clear all" link. At ≤ 767px,
the panel folds behind a full-width `<button aria-expanded>` that reads
"Filters (2 active)". It is open by default on desktop.

### Product detail (`/products/[handle]`)

| Area | Layout | Notes |
|---|---|---|
| Breadcrumbs | `nav[aria-label="Breadcrumb"] > ul.breadcrumbs`: Department › Animal Type path › product | Page-local. |
| Media | `unit-50 tablet-unit-100` → page-local **ImageGallery** | One main ProductImage. A row of thumbnail buttons appears only when there's more than one image. No carousel and no autoplay. |
| Buy box | `unit-50 tablet-unit-100` | `<h1>` title, Price, CareLevelBadge (`lg`, Live Animals), StockBadge, Tags as plain text links to `/shop?tag=…`, page-local **AddToCart** (client: QuantityStepper + `btn btn-primary btn-lg` "Add to cart" + inline `role="status"` "Added. View cart"). The button is disabled with "Sold out" text when Available Stock is 0. |
| Details | Full width below | Description, CareLinks, and for Live Animals only, a "Shop supplies for {Animal Type}" link (site map §3). |

### Care Guides (`/care-guides`)

- `<h1>` and one sentence explaining the page.
- One `<details>` per top-level Animal Type (Lizard, Snake, Amphibian,
  Invertebrate). The `<summary>` is an `h2`-styled label with the number of
  animals.
- Inside, each Live Animal is a row: name (links to its product page),
  CareLevelBadge, then CareLinks. Rows are grouped under `h3` subheadings by
  the next Animal Type level down.
- Lazy iframes inside a closed `<details>` don't load until it's opened, so
  the page needs no client JavaScript.

### Cart (`/cart`)

| Area | Layout | Notes |
|---|---|---|
| Live Animal notice | Full width, above everything | Notice `alert-yellow`, `role="status"`, shown when the cart holds any Live Animal. **Wording is a placeholder until a human decides it** (site map §5). |
| Line Items | `unit-66 tablet-unit-100` → OrderSummary with page-local **LineItemActions** (client: QuantityStepper + Remove `btn btn-ghost btn-sm`) | |
| Totals | `unit-33 tablet-unit-100` → the totals block from OrderSummary + a "Continue to checkout" link (`btn btn-primary btn-lg`) | When a Live Animal blocks checkout, the link isn't rendered, and the notice explains why. |
| Empty | EmptyState: "Your cart is empty" → `/shop` | |

### Checkout (`/checkout`)

- `<h1>` "Checkout", then `ol.steps` with five `li.step` items (Contact,
  Shipping address, Shipping method, Payment, Review). Each item uses
  `active`, `completed`, or `step-error` and has a `step-label`. At
  ≤ 767px, add `steps-vertical`.
- `unit-66 tablet-unit-100`: page-local **CheckoutSteps** (client). Each
  section is a `.form` in a `step-panel` with `fieldset` and `legend`, and
  `step-nav` holds Continue. A finished section collapses to a one-line
  summary with an "Edit" button. Only the current section is open.
- `unit-33 tablet-unit-100`: read-only OrderSummary.
- Field errors use `input-error` with a text message linked by
  `aria-describedby`. Section-level errors use Notice `alert-red`.
- **Payment copy is a placeholder.** Its wording about Medusa's manual
  provider needs human sign-off, because it's billing (CLAUDE.md rule 3).

### Order confirmation (`/order/[id]/confirmed`)

- `<h1>` "Order {display number} placed", then one sentence. Below that,
  a read-only OrderSummary, the shipping address, and a "Keep shopping" link
  to `/shop`. No account sign-up prompt.

### 404 and error

- EmptyState with a page-specific heading ("We couldn't find that page" or
  "Something went wrong") and a link to `/shop`. The error boundary also has
  a "Try again" button.

---

## 6. Custom CSS (what ply doesn't provide)

All custom CSS reads `--ply-*` and `--sf-*` variables, and works in both
color schemes and with `prefers-reduced-motion`.

### 6.1 Mega-menu and mobile accordion (`sf-megamenu`)

- **Desktop (> 767px):** an "All Animal Types" `<button aria-expanded
  aria-controls>` in the brand bar opens a full-width panel under the
  header. The panel has one column per top-level Animal Type, showing its
  descendants as nested lists. The Departments are links in the brand bar. It opens on **click or Enter/Space, never
  only on hover**. Escape closes it and returns focus to the button. So
  does clicking outside or moving focus out of the panel. The panel is
  one of the two element types allowed a shadow (§3.1).
- **Mobile (≤ 767px):** a menu `<button>` with the menu or close icon and
  `aria-expanded` opens the Departments, the tree, and Care Guides as
  nested `<details>`, one level at a time. Every `<summary>` and link is at
  least 44px tall.
- Following a link closes the menu, because the header stays mounted across
  client-side navigations.
- One component and one data source (the Animal Type tree and the four
  Departments from Medusa) serve both.

### 6.2 Product card (`sf-card`)

A fixed-ratio image (4:3) on top, then a content area with the title (two
lines, then cut off with an ellipsis), Price, and badges. Use
`--ply-bg-surface`, a 1px `--ply-border-color` border, and
`--ply-radius-md`. The whole card is one focus target, with a visible
focus ring from `--ply-color-focus`.

### 6.3 Icons

These are inline `<svg>` elements, `currentColor`, 1.25em by default. There's
no sprite file and no package.

### 6.4 Image gallery (page-local, product page)

One main image plus thumbnail `<button>`s marked with `aria-pressed`. The
main image's `alt` is the product title. There's no zoom, swipe, or
carousel.

### 6.5 Quantity stepper (`sf-stepper`)

A − / input / + group with a shared border. The input is
`type="number"` with `inputmode="numeric"`, `min="1"`, and `max` set to
Available Stock. It has a visible or `sr-only` label ("Quantity"), and the
buttons have `aria-label` "Decrease quantity" and "Increase quantity". If a
typed value is out of range, it snaps back to the nearest allowed value,
and a short `role="status"` message says why ("Only 3 available"). Medusa
is still the final check.

### 6.6 Image fallback (`sf-image`)

When a product has no image or its image fails to load, show a flat
`--ply-bg-surface-alt` panel at the same 4:3 ratio. It holds the silhouette
icon for the product's top-level Animal Type, or the Supply silhouette, and
the product title. **No gradient, no shimmer, no stock photo.**

---

## 7. Accessibility obligations

ply handles focus outlines, its own default contrast, reduced motion, and
high contrast. The design is still responsible for:

- `lang="en"` on `<html>`, one `<h1>` per page, and headings in order.
- `alt` text on every product image (the product title, or a better
  description when Medusa has one).
- A `<label>` for every input, and error messages in text, not just color.
- **Links navigate, buttons act.** ProductCard, "Shop supplies for X",
  "Continue to checkout", and breadcrumbs are links. Add to cart, quantity
  changes, Remove, filter toggles, and menu toggles are buttons.
- Touch targets of at least **44 × 44px** at ≤ 767px. That covers nav
  links, stepper buttons, filter checkboxes (the whole label row counts),
  pagination, and the cart link.
- Contrast checks for every color in §3.2, in both modes, including the
  status colors and text on `--ply-bg-surface-alt`.

**Manual keyboard and screen-reader checks** (axe-core is deferred, per
CLAUDE.md): CatalogNav (open, move through, Escape, focus return),
FilterPanel (mobile fold, URL updates announced through the result count),
QuantityStepper (limits and announcements), AddToCart status, CheckoutSteps
(focus moves to the newly opened section's heading), and ImageGallery
thumbnails.

---

## 8. Copy rules

- Use the glossary terms (Department, Animal Type, Care Level, Live Animal,
  Supply). Never "category" on its own.
- **Banned words:** unlock, empower, seamless, leverage, streamline, robust,
  cutting-edge, elevate, harness, delve.
- **Calls to action say what happens:** "Add to cart", "Continue to
  checkout", "Shop supplies for Crested Geckos", "See all
  beginner-friendly animals". Never "Learn more" or "Click here".
- Section headings use concrete words ("Shop by Animal Type", not
  "Explore").
- A subtitle is one sentence at most.
- **At most two call-to-action buttons per section.**
- **Placeholders only for undecided topics:** Live Animal shipping, legal,
  permit, and age wording, and payment wording. Mark them
  `[PLACEHOLDER: needs human decision]`. Don't make up policy.

---

## 9. AI Audit scorecard (required gate)

Every page design is scored with the prompt below before it's accepted.
The prompt comes from
[*AI-Generated Website Checklist*, AI ToolPick](https://aitoolpick.org/blog/ai-generated-website-checklist/),
section "The AI Audit Prompt — Copy, Paste, Score" (last reviewed
2026-04-26). It's copied word for word, without the site's inline links.
Don't edit it. Project-specific rulings go in §9.2.

### 9.1 The prompt (verbatim)

```text
You are a web design auditor specialized in detecting AI-generated design patterns.

I will provide my website's HTML/CSS code (or a screenshot). Analyze it against the 30 checks below and return a structured report.

## Scoring

For each category (6 total), check 5 items. Score each item as PASS or FAIL.
Category score = (passed items / 5) × 100.
Overall score = average of all 6 category scores.

## Categories & Checks

### 1. Colors (5 checks)
- [ ] No purple-to-blue gradient backgrounds
- [ ] No gradient buttons or CTAs
- [ ] 3 colors max (main + grayscale + 1 accent)
- [ ] No box-shadow on more than 2 element types
- [ ] No alternating section background colors (#f5f5f5/#fafafa pattern)

### 2. Typography (5 checks)
- [ ] Not using Inter, Roboto, or Open Sans as primary font
- [ ] Headings and body text use different font styles (family, weight, or spacing)
- [ ] Clear size contrast between heading levels (not uniform increments)
- [ ] Different line-height for headings (1.1-1.3) vs body (1.6-1.8)
- [ ] Intentional letter-spacing on large headings (not browser default)

### 3. Layout (5 checks)
- [ ] No 3+ consecutive sections with identical 3-column card grids
- [ ] Sections have visually different structures (not all heading→desc→cards)
- [ ] Not everything is center-aligned (left-align for body text)
- [ ] Spacing varies between sections (not uniform padding everywhere)
- [ ] Hero section isn't the standard fullscreen + big text + 2 CTAs template

### 4. Copy & Microcopy (5 checks)
- [ ] No AI buzzwords: unlock, empower, seamless, leverage, streamline, robust, cutting-edge, elevate, harness, delve
- [ ] No "[X] を、もっと [Y] に" pattern (Japanese AI copy tell)
- [ ] CTAs are specific ("Calculate your budget") not generic ("Learn more")
- [ ] Section headings use concrete words, not abstract ones (Features → What you can track)
- [ ] Subtitles are 1 sentence max, not multi-sentence paragraphs

### 5. Images & Icons (5 checks)
- [ ] No emoji used as section or card icons
- [ ] Images match the content they illustrate (no mismatched stock photos)
- [ ] No same image reused across multiple pages/sections
- [ ] No AI-generated illustrations with visible artifacts
- [ ] No gradient placeholder boxes where real images should be

### 6. UX & Interaction (5 checks)
- [ ] First viewport clearly communicates the page's purpose
- [ ] Long content is folded (accordion, tabs, "show more") not dumped
- [ ] Scroll animations don't block content visibility
- [ ] Touch targets are 44px+ on mobile
- [ ] Max 2 CTA buttons per section

## Output Format

Return this exact structure:

### Overall Score: [X]/100

| Category | Score | Issues |
|----------|-------|--------|
| Colors | X/100 | [list failures] |
| Typography | X/100 | [list failures] |
| Layout | X/100 | [list failures] |
| Copy | X/100 | [list failures] |
| Images & Icons | X/100 | [list failures] |
| UX | X/100 | [list failures] |

### Top 3 Priority Fixes
1. [Most impactful fix with specific instructions]
2. [Second fix]
3. [Third fix]

### What's Already Good
[List items that passed — positive reinforcement matters]
```

### 9.2 Project context (paste after the prompt)

```text
Project context for this audit:
- This is an ecommerce storefront for reptiles and exotic pets, styled with ply-css 1.8.0.
- Status colors do NOT count toward the "3 colors max" check: the three Care Level
  badge colors (Beginner-friendly, Intermediate, Advanced), the Sold out badge, and
  alert colors (info, warning, error, success). Judge the 3-color limit on the brand
  palette only.
- A product grid (the Shop results, the Home "Beginner-friendly picks") is content,
  not a decorative card section. It still counts toward "3+ consecutive identical
  card grids" if three such grids appear in a row.
- ply's built-in control-state shadows (pressed/disabled buttons, focused inputs)
  count as ONE element type for the box-shadow check.
- The Japanese copy check does not apply (English-only site): mark it PASS (N/A).
- Text marked [PLACEHOLDER: needs human decision] is intentionally unfinished; do not
  fail copy checks on it.
- The page being audited is: <page name and URL from site-map.md>.
```

### 9.3 How to run it

1. **Who:** a fresh agent session, not the one that produced the design.
2. **Input, one page at a time:** the page's HTML and CSS (with the theme
   block from §3.3), a full-page desktop screenshot at 1280px, and a
   full-page mobile screenshot at 375px. Check both color schemes. If they
   score differently, record the lower score.
3. **Paste:** the §9.1 prompt, then the §9.2 project context, then the
   inputs.
4. **Pass bar:** **overall ≥ 90 AND every UX & Interaction check passes.**
   One failure anywhere else (for example 29/30, giving 96.7) can pass. Any
   UX failure is a hard fail.
5. **Record:** save the full report to `docs/design-audits/<page>.md`
   (`home`, `shop`, `product`, `care-guides`, `cart`, `checkout`,
   `order-confirmed`, `not-found`). Put a header line with the date, design
   version, and pass/fail. Re-run after fixes and keep the latest report.
   History stays in git.
6. **Shared components** are judged as part of every page they appear on.
   A failure in SiteHeader is fixed once, then every affected page is
   re-run.

---

## 10. Hand-off checklist (each Claude Design output)

- [ ] Uses only classes from this plan, or classes checked against
      `ply-css@1.8.0/dist/css/ply.css`. None from the §2.1 "don't use" list.
- [ ] Every non-full-width `unit-*` has responsive prefixes (§2.2–2.3), and
      every `unit-*` is a direct child of its `units-row`.
- [ ] Custom classes use the `sf-` prefix and map to a component in §4 or §5.
- [ ] Every shared element comes from §4. No one-off copies of the header,
      search, card, badges, stepper, or summary.
- [ ] The theme is set on `:root` + `prefers-color-scheme`, with no
      `data-theme`. Every §3.2 variable is set.
- [ ] Prices, totals, and stock are shown as Medusa placeholders, never
      calculated or invented.
- [ ] Undecided topics are marked `[PLACEHOLDER: needs human decision]`.
- [ ] §7 accessibility items are met, and the manual keyboard checks are
      noted.
- [ ] The AI Audit passed (§9.3), and the report is saved in
      `docs/design-audits/`.

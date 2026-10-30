# Plycss Reference for the Design Plan

This document tells the agent writing the storefront design plan how ply
(`ply-css`) works and where it goes wrong. It is a briefing to read before
writing that plan. It is not the design plan itself.

**Source and version.** This is based on a full read of
[plycss.com](https://www.plycss.com/) (every docs page, `llms.txt`, and
`llms-full.txt`), plus the files that ship in the npm package
(`PLY.md`, `ply-classes.json`, `snippets/`, and `dist/css/ply.css`).
Checked on 2026-10-27 against **`ply-css@1.8.0`**, the latest release.
Wherever the docs and the shipped CSS disagree, this document follows the
CSS and says so.

Project terms follow [`domain-model.md`](./domain-model.md). The pages being
styled are listed in [`site-map.md`](./site-map.md).

---

## 1. What ply is

- A single CSS stylesheet with **no JavaScript**. It has about 458 classes,
  120+ `--ply-*` CSS custom properties, and default styles for 13 semantic
  HTML elements.
- **Semantic HTML first.** ply styles `<nav>`, `<table>`, `<code>`, `<pre>`,
  `<kbd>`, `<blockquote>`, `<mark>`, `<details>`/`<summary>`, `<dialog>`,
  `<progress>`, `<meter>`, `<hr>`, and `h1`–`h6` without any classes. Use
  those elements before adding classes.
- **Theming uses CSS custom properties.** Every themeable color, radius,
  space, and font is a `--ply-*` variable. Dark mode, high contrast
  (`prefers-contrast: more`), and reduced motion are built in.
- **It is the only CSS framework.** ply's docs say it conflicts with
  Tailwind and Bootstrap, and `CLAUDE.md` already rules those out.
- **No icons, no image or card component, no dropdown menu.** See §5.

---

## 2. Installing it in the Next.js storefront

The package name is **`ply-css`**. `llms-full.txt` also says "`plycss`",
which is wrong. Never run `npm install plycss`.

There are two ways to install it. The design plan has to pick one.

| Option | How | New dependencies | Gives you |
|---|---|---|---|
| **A. Plain CSS (simplest)** | `import 'ply-css/dist/css/ply.min.css'` once, in `app/layout.tsx` | None besides `ply-css` | Every class and every `--ply-*` variable. Theme by overriding variables in our own global CSS. |
| **B. Sass source** | `@use 'ply-css/src/scss/ply' as *;` in a `.scss` file | `sass` (dev) | Option A, plus Sass color maps, spacing variables, and mixins such as `button-variant`. |

- **Recommendation: Option A.** Theming through `--ply-*` variables covers
  what the store needs, and it adds no build dependency. Choose Option B
  only if the plan needs the Sass mixins. Per `CLAUDE.md`, any new
  dependency (`sass`, a purge tool, an icon library) has to be justified
  first.
- **Don't use the CDN link** from the docs' starter template in production.
  The docs call the CDN "prototyping only", and we already ship CSS through
  Next.js.
- **Smaller bundles exist**: `ply-core.min.css` (~17 KB gzipped; it leaves
  out labels, dropdowns, loaders, and print styles),
  `ply-essentials.min.css` (~7 KB; grid and helpers only), and
  `ply-helpers.min.css`. The full `ply.min.css` is ~21 KB gzipped. The
  "~5 KB" on the homepage is only reached after purging (§6.8).
- **Agent reference files ship in the package**: `node_modules/ply-css/PLY.md`
  (~8.7k tokens) and `node_modules/ply-css/ply-classes.json`. They are useful,
  but they contain errors (§6.1). Trust the shipped CSS over them.

---

## 3. Core usage

### 3.1 Page layout (grid)

```html
<div class="units-container">          <!-- max-width 1200px, centered, 0.75rem padding -->
  <div class="units-row">              <!-- flex row, wraps, 1rem gap by default -->
    <div class="unit-25 tablet-unit-100">Filters</div>
    <div class="unit-75 tablet-unit-100">Results</div>
  </div>
</div>
```

- **Widths are percentages**: `unit-10, 12, 20, 25, 30, 33, 35, 38, 40, 50,
  60, 62, 65, 66, 70, 75, 80, 88, 90, 100`, and `unit-auto`. The browser
  subtracts the gap for you, so `unit-50 unit-50` fits on one row.
- **Responsive prefixes**, as shipped in the CSS:

  | Prefix | Applies when |
  |---|---|
  | `x-large-screen-unit-*` | ≥ 1800px |
  | `large-screen-unit-*` | ≥ 1400px |
  | `small-desktop-unit-*` | ≤ 1024px |
  | `tablet-unit-*` | ≤ 767px |
  | `large-phone-unit-*` | ≤ 650px |
  | `phone-unit-*` | ≤ 480px |
  | `forever-unit-*` | Always. These never collapse. |

- **Container queries**: put `container-query` on a parent element, then use
  `container-{small-desktop|tablet|large-phone|phone}-unit-*` inside it.
  These respond to the parent's width, not the viewport. Use them for
  components that get placed in spaces of different widths, like product
  cards.
- **Row modifiers**: `equal-height`, `reverse-direction`, `centered-content`,
  `joined` (removes gutters), `stacked` (removes bottom margin), and
  `gap-xs|sm|lg|xl|xxl`.
- **Offsets and nesting**: `unit-push-*` adds a left offset. A `units-row`
  can sit inside any `unit-*`.
- **Uniform lists**: `<ul class="blocks-2…6">` turns list items into equal
  columns. They go to full width at ≤ 767px unless you add
  `blocks-mobile-50` or `blocks-mobile-33`.

### 3.2 Typography

- Sizes: `text-xs` (12px), `text-sm`, `text-base`, `text-lg`, `text-xl`,
  `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl` (60px).
- Weights: `font-normal`, `font-medium`, `font-semibold`, `font-bold`.
- `.h1`–`.h6` give any element heading styles without changing its heading
  level. `lead` (alias `lead-subhead`) is for intro text.
- Other helpers: `text-left`, `text-center`, `text-right`,
  `leading-tight|snug|normal|relaxed`, `text-balance` (for headings),
  `no-orphan` (for paragraphs), `nowrap`, `uppercase`, `italic`.
- Text colors (theme-aware): `text-primary`, `text-secondary`,
  `text-tertiary` (alias `text-muted`), `text-inverse`, `text-on-color`,
  `success`, and `error`.

### 3.3 Color, theme, and dark mode

- **Dark mode is automatic.** It follows `prefers-color-scheme`, but only
  when `<html>` has **no** `data-theme` attribute. `data-theme="light"` and
  `data-theme="dark"` force a mode.
- **Custom theme**: write `[data-theme="brand"] { --ply-…: …; }` and set
  `<html data-theme="brand">`. `ply-classes.json` lists the variables to
  override. The minimum set is `--ply-bg-body`, `--ply-bg-surface`,
  `--ply-bg-muted`, `--ply-color-body`, `--ply-color-headings`,
  `--ply-color-secondary`, `--ply-border-color`, `--ply-border-radius`,
  `--ply-btn-default-bg`, `--ply-btn-secondary-bg`, `--ply-color-accent`,
  `--ply-btn-border-radius`, `--ply-nav-bg`, and `--ply-nav-border`.
  It also gives a longer recommended list.
- **Token scales**: `--ply-space-xs…xxl` (`--ply-space` is 16px),
  `--ply-radius-none…full`, and `--ply-control-{font|py|px|lh}[-lg|-sm|-xs]`.
  The control tokens give buttons, inputs, and selects the same height at
  each size.
- **Palette** (10 hues: blue, red, green, yellow, indigo, purple, pink,
  orange, teal, cyan), each with theme-aware variables:
  `--ply-{hue}-surface`, `-border`, `-1`, `-2`, `-3`. For a tinted card that
  works in both modes, use the surface + border + `-1` text pattern.
- **Surfaces and elevation**: `bg-surface`, `layer-0` through `layer-3`
  (background plus a matching shadow), `shadow-1` through `shadow-3`, and
  `bg-glass`.
- **Static colors** (`bg-blue|red|green|yellow|black`, `btn-blue` and so on,
  `label-*`, `alert-*`) keep the same color in every theme.

### 3.4 Components (all CSS-only)

| Need | ply pattern |
|---|---|
| Buttons | `btn` + `btn-primary` / `btn-secondary` / `btn-primary-outline` / `btn-secondary-outline` / `btn-ghost`; sizes `btn-lg`, `btn-sm`, `btn-xs`; `btn-icon` for icon-only buttons (needs an `aria-label`); `btn-group`, `btn-group joined`, `btn-group fill-width`. `.btn` also works on `<a>`, so `<Link className="btn btn-primary">` is fine. |
| Forms | Wrap in `.form`. Inputs go inside `<label>`, or use `for`/`id`. Validation: `input-error`, `input-success`, plus `.error`/`.success` text. Sizes: `input-lg`, `input-sm`, `input-xs`. Layouts: `form-inline`, `form-list`, `form-desc` (help text). `input-search` gives a pill-shaped search box. `fieldset` and `legend` are styled. |
| Input add-ons | `.input-groups` with `.input-prepend`, `.input-append`, or `.btn-append`. A button must sit inside `.input-append` or `.btn-append`. |
| Steps (checkout) | `<ol class="steps">` with `<li class="step [active|completed|step-error]">` and `<span class="step-label">`. `steps-vertical` stacks them. `step-panel` and `step-nav` hold the content and the Back/Continue buttons. |
| Navigation | `nav.navbar > ul > li.active > a[aria-current=page]`, with modifiers `navbar-centered`, `navbar-right`, `navbar-thick`, `navbar-borderless`, `navbar-border-{color}`, `navbar-stack`, and `navbar-vertical`. Also `navbar-pills`, `nav-tabs`, `nav-stacked`, `nav-stacked-blocked`, `breadcrumbs`, and `pagination` (`pagination-solid`, `-sm`, `-lg`). |
| Tables | Plain `<table>` is already styled. Modifiers: `table-bordered`, `table-striped`, `table-hovered`, `table-stroked`, `table-simple`, `table-flat`. Wrap in `table-container` for horizontal scroll. `th.sortable` with `sort-asc` / `sort-desc` shows sort arrows. |
| Alerts | `alert alert-{blue|green|red|yellow|black}`, with optional `alert-outline` or `alert-ghost`. Put the text in `alert-content`. Add `role="status"` for information and `role="alert"` for errors. |
| Labels and badges | `label label-{blue|red|green|yellow|black|white}` and `label-outline`. Labels are always **uppercase**. `badge badge-{color}` and `badge-small` are pill-shaped counters. |
| Dialog | Native `<dialog>` with `dialog-header`, `dialog-body`, `dialog-footer`, and `dialog-close`. Sizes: `dialog-sm`, `dialog-lg`, `dialog-full`. `dialog-confirm` is a confirmation layout. |
| Accordion | Native `<details><summary>`. ply adds a caret that rotates when open. |
| Toast | `alert alert-green message`, fixed to the top right. See §6.5. |
| Misc | `flexible-embed` (16:9 iframe or video), `loader`, `spinning`, `fade-in`, `no-link-style` (strips color and underline from `a` elements *inside* it; it does nothing on the link itself), `sr-only`, `skip-link`. |

### 3.5 Utilities

- Display and flex: `display-flex|block|inline-block|grid|none`,
  `items-center|start|end|stretch|baseline`,
  `justify-center|start|end|between|around`, `flex-wrap`.
- Spacing: `padding` and `margin` default to **0.75rem**. Sizes `-xs`
  (0.25), `-sm` (0.5), `-lg` (1.5), and `-xl` (2). Directional:
  `padding-top-lg`, `margin-bottom-sm`, and so on. Removal: `no-margin`,
  `no-padding`, `no-top-margin`, and similar. Logical (RTL-safe):
  `margin-inline-start`, `padding-inline-end`.
- Borders: `border`, `border-{side}`, `border-thick`, `no-border`,
  `border-radius`, `border-radius-lg|xl`, `circle`.
- Size: `width-*` and `height-*` (percentages), plus the responsive width
  prefixes `small-desktop-`, `tablet-`, `large-phone-`, and `phone-`.
- Position: `relative`, `absolute`, `fixed`, `sticky`, `static`.
- Visibility: `hide`, `sr-only`, `skip-link`, `hide-on-mobile`,
  `hide-on-desktop` (the switch happens at 767px).

### 3.6 What ply handles, and what we still owe

ply gives us focus-visible outlines (2px, themeable through
`--ply-color-focus`), AA contrast for its **default** colors in light and
dark mode, reduced-motion handling, high-contrast handling, `sr-only`, and
`skip-link`.

The app still has to provide: `alt` text, one `<h1>` per page with headings
in order, `lang` on `<html>`, a `<label>` for every input, text error
messages (not just color), ARIA and keyboard support for every custom JS
widget (mega-menu, filters, quantity stepper), focus return after a dialog
closes, and contrast checks on any color we override.

---

## 4. How the storefront maps to ply

This mapping is based on [`site-map.md`](./site-map.md). It is a starting
point for the design plan, not a decision.

| Storefront element | ply building blocks | Notes |
|---|---|---|
| Global header and nav | `nav.navbar`, `skip-link`, `sticky` | ply has no mega-menu or dropdown (§6.2). The mega-menu needs custom CSS built on `--ply-*` variables. |
| Mobile menu (accordion) | Nested `<details>`/`<summary>` | Use a real `<button>` for the hamburger, not the docs' `<span class="navigation-toggle">`, which can't receive keyboard focus. |
| Header search | `<form role="search" class="form">`, `input-groups`, `btn-append`, `input-search` | |
| Cart link with count | `badge` | Give it an accessible name, e.g. "Cart, 3 items". |
| Department tiles and product cards | `units-row` + `unit-*` with responsive prefixes, or `container-query`; `layer-1`, `border`, `border-radius` | ply has no card or image component. A small custom card is expected. |
| Care Level badge | `label label-{color}` or palette surface variables | Color alone can't carry meaning: the label text must name the level. Labels render in uppercase. |
| Sold out | `label` (neutral or black) | Same rule: the text says "Sold out". |
| `/shop` filters | `.form`, `fieldset`/`legend`, checkboxes, radios, `select` | |
| `/shop` pagination | `nav[aria-label] > ul.pagination` | |
| Product detail | `breadcrumbs`, `flexible-embed` for videos, `.form` + `input[type=number]` for quantity, `btn btn-primary` for Add to Cart | Quantity limits come from Medusa (`CLAUDE.md`). The CSS only displays them. |
| Cart Line Items | `<table>` + `table-container` (+ `table-stroked`) | |
| Live Animal checkout notice | `alert alert-yellow` + `role="status"` | |
| Checkout sections | `ol.steps` + `step-panel` + `step-nav`, each section a `.form` | |
| Add-to-cart confirmation | `alert … message` toast, or an inline `role="status"` region | §6.5 |
| 404 and error | Plain semantic HTML + `btn` link back to `/shop` | |

---

## 5. Gaps: things ply does not provide

These need small custom CSS, and that CSS must use `--ply-*` variables:

- **Mega-menu or dropdown.** The docs list `dropdown`, `caret`, and
  `caret-up`, but none of them exist in the shipped CSS (§6.1).
- **Card and product image** components. The official snippets write their
  own `.card` classes.
- **Icons.** PLY.md suggests Lucide through a CDN script tag. That pattern
  doesn't fit React. The React package (`lucide-react`) would be a new
  dependency that needs approval, and inline SVG is the zero-dependency
  option.
- **Carousel or image gallery** for product images.
- **Quantity stepper** (− / + buttons around a number input).
- **Tooltips, modal-blur, accordion classes, autocomplete, filterbox, and
  drop areas.** These are listed in `ply-classes.json` but are not compiled
  into `ply.css` (§6.1).

---

## 6. Where an agent can trip up

### 6.1 The docs reference classes that don't exist

Each of these was checked against `dist/css/ply.css` in 1.8.0:

| Documented class | Where it's documented | Reality |
|---|---|---|
| `phone-hide`, `tablet-hide`, `desktop-hide`, `phone-only`, `tablet-only` | PLY.md, llms-full.txt, `snippets/responsive-header.html` | **Do not exist.** The only visibility helpers are `hide-on-mobile` and `hide-on-desktop` (switching at 767px). This matters most because it's the docs' own responsive header pattern, the one an agent will copy. |
| `dropdown`, `caret`, `caret-up` | Utilities page | Do not exist. |
| `text-centered` | Typography page ("alias") | Does not exist. Use `text-center`. |
| `btn-big`, `btn-small`, `btn-smaller`, `input-big`, `input-small`, `input-smaller`, `background-black` | llms-full.txt alias table | Do not exist. Use `btn-lg|sm|xs`, `input-lg|sm|xs`, and `bg-black`. |
| `table-hover` | `ply-classes.json` (table tip) | Does not exist. The class is `table-hovered`. |
| `modal`, `modal-box`, `modal-blur`, `tooltip*`, `accordion-*`, `autocomplete`, `filterbox*`, `tools-droparea*`, `block-first`, `padding-xxl-*` | `ply-classes.json` | Not in `ply.css`. The SCSS files exist but aren't compiled into the bundle. |
| "Hidden by default" toast (`message`) | Alerts page | Not hidden. `.message` is only `position: fixed` in the top right (§6.5). |

**Rule for the plan**: don't treat `PLY.md` or `ply-classes.json` as the
final word. They are the main sources ply tells agents to trust, and they
are wrong in the places above. Before relying on a class, grep the CSS:

```bash
grep -c "\.class-name" node_modules/ply-css/dist/css/ply.css
```

### 6.2 Breakpoint numbers disagree between sources

- The Grid docs page is **correct**: `tablet-unit-*` applies at ≤ 767px and
  `phone-unit-*` at ≤ 480px.
- PLY.md and llms-full.txt are **wrong**. They say `tablet-unit-*` is
  ≤ 1024px and `phone-unit-*` is ≤ 767px.
- The Grid page's own demo is mislabeled too: "Sidebar (stacks on tablet)"
  uses `phone-unit-100`, which only stacks at ≤ 480px.
- The prefixes are mostly **max-width** rules (desktop-first): the base
  class is the desktop width, and smaller-screen prefixes override it. Only
  `large-screen` and `x-large-screen` are min-width. This is the opposite of
  Tailwind's mobile-first `md:` habit.
- There are only three layout breakpoints that matter on phones and tablets
  (1024, 767, and 480/650). Plan layouts around those exact numbers.

### 6.3 Columns don't stack on their own

- The homepage says the grid "collapses cleanly at every breakpoint", but
  that only happens if you add prefixes. A row of `unit-25`s stays four
  across on a phone unless each unit has `tablet-unit-*` and/or
  `phone-unit-*`.
- The **viewport** prefixes only come in `100, 90, 80, 75, 70, 66, 65, 60,
  50, 40, 35, 33, 30, 25, 20, 10`. There is **no** `tablet-unit-12`,
  `-38`, `-62`, `-88`, or `-auto`. (The `container-*` and `forever-*`
  prefixes do include all 21 sizes.)
- `unit-*` has to be a **direct child** of `units-row`. Putting a wrapper
  element or a React fragment in between breaks the flex math. A component
  that returns a `unit-*` div has to be rendered directly inside the row.

### 6.4 Custom themes turn off automatic dark mode

- Automatic dark mode only applies to `:root:not([data-theme])`. Setting
  **any** `data-theme`, including our own brand theme, turns it off.
  `ply-classes.json` says this. The site's marketing copy doesn't.
- The CSS only has a `[data-theme=dark]` rule. `data-theme="light"` works
  only because any `data-theme` attribute turns automatic mode off.
- So the plan has to choose one of these:
  1. Don't set `data-theme`. Apply brand overrides on `:root` and repeat the
     dark versions inside `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { … } }`.
  2. Use two named themes (e.g. `brand` and `brand-dark`) and switch between
     them.
  3. Light mode only.

  Choosing nothing gives you option 3 without anyone deciding it.
- The site's warm theme example only sets about 15 variables. Anything not
  overridden keeps ply's default blue and gray, so defaults "leak" into
  focus rings, input borders, code blocks, and so on. Use the
  `themeRecommended` list in `ply-classes.json`.
- If the theme is toggled with JS, setting `data-theme` on the client after
  hydration causes a flash of the wrong theme and a React hydration warning.
  Either set it on the server, or use a small inline script that runs
  before the page paints, plus `suppressHydrationWarning` on `<html>`.
- Button hover and active colors are computed with `color-mix()` (Chrome
  111+, Safari 16.4+). On older browsers, set the `-bg-hover` and
  `-bg-active` variables explicitly.

### 6.5 Assumptions in the docs that don't fit React/Next.js

- The examples are HTML. In JSX, use `className`, `htmlFor`,
  `style={{ top: 0 }}`, and self-closing `<input />`.
- **`<dialog>`** only traps focus and shows a backdrop when it's opened with
  `ref.current.showModal()` in a **client component**. Rendering it with
  `<dialog open>` makes a non-modal dialog without those. The docs'
  "browsers handle focus trapping" assumes `showModal()`.
- **`<details>`** in React: let the browser control `open`, or keep it
  controlled through `onToggle`. Setting `open` without handling the toggle
  gets out of sync.
- **Toast (`.message`)**: it's always visible and fixed to the top right.
  Render it conditionally in React. Auto-dismiss info toasts after 5–10
  seconds, but never error toasts.
- **Server components by default** (`CLAUDE.md`): ply is CSS-only, so
  almost all markup can stay in server components. Only the widgets listed
  in `site-map.md` §4 need `"use client"`.
- **Global CSS import**: import ply once, in the root `app/layout.tsx`.
  Custom component CSS should be CSS Modules or a single global stylesheet,
  as the design plan decides.

### 6.6 Generic class names can collide

ply defines **global** classes with common names: `.success`, `.error`,
`.hide`, `.label`, `.badge`, `.message`, `.lead`, `.step`, `.steps`,
`.code`, `.border`, `.padding`, `.margin`, `.gap`, `.fixed`, `.absolute`,
`.relative`, `.sticky`, `.circle`, `.centered`, `.bold` (which is
`!important`), `.sans`, `.serif`, and `.mono`.

- Never reuse these names for our own global classes. CSS Modules (hashed
  names) avoid the problem entirely.
- Note that `.form button` and `.form .btn` override button padding. A
  button inside `.form` won't match the exact size of the same button
  outside it.

### 6.7 Accessibility claims are about defaults, not guarantees

- The "WCAG 2.1 AA, no audits to fail" claim covers ply's **default
  colors** used **in the documented patterns**. Any `--ply-*` override, any
  `label-yellow` / `bg-yellow` combination we make up, any text on an image,
  and any custom component has to be checked again.
- The Navigation docs' `navigation-toggle` is a `<span>`, which isn't
  focusable. Use a `<button aria-expanded aria-controls>` instead.
- `nav-tabs` in the docs is a `<div>` of links. Real tabs (if any) need the
  `role="tablist"` pattern that PLY.md describes.
- "Use `<button>` not `<a>`" means: **actions** use `<button>`,
  **navigation** uses `<a>` / `<Link>`. Product cards, "Shop supplies for
  X", and "Continue to checkout" are links. Add to Cart, quantity changes,
  and Remove are buttons. Don't turn links into buttons to satisfy the rule.
- `CLAUDE.md` defers `axe-core` until the ply design settles. The design
  plan should still note which custom pieces need manual keyboard and
  contrast checks.

### 6.8 Purging (tree-shaking)

- The purge tool (`ply-css/purge` PostCSS plugin or the `ply-purge` CLI)
  needs `purgecss` / `@fullhuman/postcss-purgecss`. That's a **new dev
  dependency**.
- Adding a `postcss.config.js` **replaces** Next.js's built-in PostCSS
  config, so its defaults have to be re-added by hand.
- Class names built with template strings (`` `unit-${n}` ``,
  `` `label-${color}` ``) are invisible to purge and get stripped. Write
  class names out in full (use a lookup object), or add them to the safelist.
- Recommendation: leave purging out of the first design plan. It's an
  optimization once the design is stable.

### 6.9 Small inconsistencies to normalize in the plan

- **Spacing defaults differ**: a `units-row` gap is **1rem**, but the `gap`
  utility is **0.75rem**. So `units-row gap` (used in PLY.md examples)
  makes the gap *smaller*. `padding` and `margin` default to 0.75rem, while
  the `--ply-space` token is 1rem.
- **Utilities**: the docs page lists gaps up to `gap-xl`, but `gap-xxl`
  also exists.
- **Contradiction**: PLY.md says `color-gray-60` "does not exist". It does
  (`color-gray-10…90` and `color-white-10…90` are real). Still, prefer the
  theme-aware `text-secondary` and `text-tertiary`, because the gray
  opacity scales don't adapt to dark mode.
- **Navbar on mobile**: by default it scrolls sideways at ≤ 767px. Use
  `navbar-stack` to wrap items instead.
- **Label case**: `.label` forces uppercase. Make sure Care Level text still
  reads well that way, or use palette-surface custom styling instead.
- **PLY.md inline styles**: PLY.md's sticky-header example uses inline
  `style` for `top` and `z-index` while also saying "don't use inline
  styles for layout". Put those values in our own CSS.

---

## 7. Checklist for the design-plan agent

1. Pin the version: `ply-css@1.8.0` (the docs drift between releases).
2. Choose Option A (CSS import) or B (Sass) and justify any new dependency.
3. Choose a dark-mode strategy (§6.4) explicitly.
4. List every `--ply-*` variable the brand theme overrides, starting from
   `themeMinimum` + `themeRecommended`.
5. Use only classes confirmed in `dist/css/ply.css` (§6.1). Give every
   custom class a name that can't collide (§6.6).
6. Give every `units-row` responsive prefixes, using the real breakpoints
   (§6.2, §6.3).
7. List the custom components (§5) and say which `--ply-*` variables each
   one uses.
8. Keep the commerce rules out of the CSS. Stock caps, prices, and totals
   come from Medusa (`CLAUDE.md`).

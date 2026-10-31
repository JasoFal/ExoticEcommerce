# AI Audit: Shop (`/shop`)

**Date:** 2026-10-30 · **Design version:** Shop v1 (branch claude/browse-products-page-6d5eb1) · **Result: PASS** (overall 96.7, every UX & Interaction check passes)

Run per design-plan §9: the §9.1 prompt, the §9.2 project context (page: Shop, `/shop`), and the inputs listed at the end. The auditor did not build the page. This is a re-run after fixes to checks 20 and 29. The first run failed at 90.0 because touch targets failed. Light and dark mode scored the same on every check.

### Overall Score: 96.7/100

| Category | Score | Issues |
|----------|-------|--------|
| Colors | 100/100 | None |
| Typography | 100/100 | None |
| Layout | 100/100 | None |
| Copy | 100/100 | None (see the check 20 note below) |
| Images & Icons | 80/100 | The same Supply silhouette fills the image slot on 42 of 70 products: all 24 cards on page 2, 15 of 21 on the Geckos view, and both cards for "uvb" |
| UX | 100/100 | None |

### Top 3 Priority Fixes

1. **Stop one silhouette from filling whole pages of the grid.** Ideally, give the seed Supplies real photos, so most cards show a photo. If some must stay without photos, map Supplies to the Department silhouettes the Icon set already has (`enclosure`, `lamp`, `leaf`, `feeder`) instead of the single `supply` box. Also consider dropping the repeated title inside the fallback panel on cards, because the card already shows the title just below it.
2. **Line up the phone breadcrumb.** The touch-target fix made the "Shop" and "Lizard" links 44px-tall flex boxes, but the current crumb ("Gecko") is still a 20px inline span. "Gecko" now sits about 12px higher than the links, and the "›" separators sit at two different heights. At ≤ 767px, give `.crumbs ul [aria-current]` the same `display: inline-flex; align-items: center; min-height: 44px`, or make the `ul` a flex row with `align-items: center`. A small `padding-inline` on the links, instead of `min-width: 44px`, would also stop "Shop" from leaving a gap before its "›".
3. **Make the preview stub match the one-sentence rule.** The stub's Gecko description is still two sentences. Shorten it to one, so future audit screenshots show what staff are told to write (design-plan §5).

### What's Already Good

- **Colors:** no gradients anywhere (no computed `background-image` gradient on the page). Only the brand palette (Moss, the stone gray ramp, Ochre on hover and the cart count) plus the exempt Care Level and Sold out colors. The only shadow is the CatalogNav panel, plus ply's control states. Sections are separated by borders and space, not by gray stripes.
- **Typography:** Bricolage Grotesque headings with Source Sans 3 body text. `h1` is 44px, line-height 1.12, letter-spacing -0.025em. Body text is 16px with line-height 1.7, and card titles are 17px with line-height 1.3. The jump from page heading to card heading is large and clear.
- **Layout:** one product grid (4 columns, 2 on phones) beside a left filter column, under a left-aligned header. No hero. Spacing varies between the header, filters, toolbar, grid, pagination, and footer.
- **Copy:** no banned words and no "Learn more". CTAs say what they do: "Clear filters", "Browse all products", "Go to page 1", "Show 21 products". Headings and labels are concrete. Every subtitle written in code is one sentence.
- **Images & Icons:** no emoji. Icons are hand-drawn inline SVGs. The product photos match their products and show no AI artifacts. Missing images get a flat panel, never a gradient box.
- **UX:** the `<h1>` names the view in the first viewport at both widths. On phones the filters fold behind a 48px button, the Animal Type tree only opens the chosen branch, and results page at 24. There are no scroll animations. No section has more than two buttons. Every link, button, input, and select measured at 375px is at least 44×44, in light and dark, on all four URLs and with the Filters panel open.

## Per-check results

| # | Category | Check | Result | Reason |
|---|---|---|---|---|
| 1 | Colors | No purple-to-blue gradient backgrounds | PASS | No gradient on any element (computed-style scan), in light or dark. |
| 2 | Colors | No gradient buttons or CTAs | PASS | Buttons are flat Moss (`btn-primary`) or outlined. |
| 3 | Colors | 3 colors max | PASS | Moss, the stone gray ramp, and Ochre (card hover border, cart count). Care Level and Sold out colors are exempt under §9.2. |
| 4 | Colors | Box-shadow on ≤ 2 element types | PASS | Only the CatalogNav mega-menu panel, plus ply's control states (one type under §9.2). Cards, chips, and the toolbar are flat. |
| 5 | Colors | No alternating section backgrounds | PASS | Body `#F6F7F4` with white surfaces. Sections are split by borders and space. |
| 6 | Typography | Not Inter/Roboto/Open Sans | PASS | Bricolage Grotesque for headings and Source Sans 3 for body text, via next/font. |
| 7 | Typography | Headings and body differ | PASS | Different families, and headings are weight 600–700. |
| 8 | Typography | Clear size contrast between heading levels | PASS | `h1` 44px (34px on phones), card `h3` 17px, EmptyState `h3` 24px. The visible `h2`s are deliberately styled as small labels or hidden. |
| 9 | Typography | Heading line-height 1.1–1.3, body 1.6–1.8 | PASS | `h1` 1.12, `h3` 1.3, body 1.7. |
| 10 | Typography | Intentional letter-spacing on large headings | PASS | `h1` -0.025em, `h2` -0.015em (theme.css). |
| 11 | Layout | No 3+ consecutive identical 3-column card grids | PASS | One product grid, 4 columns (2 on phones). |
| 12 | Layout | Sections have different structures | PASS | Header (breadcrumb, `h1`, intro, chips), filter form column, chip row, toolbar, grid, pagination, footer. |
| 13 | Layout | Not everything center-aligned | PASS | Everything is left-aligned except the empty state card. |
| 14 | Layout | Spacing varies between sections | PASS | Header 1.5rem, layout 2rem/4.5rem, toolbar 1.5rem, pagination 2.5rem, footer 4rem. |
| 15 | Layout | Hero isn't the standard template | PASS | No hero. A plain `h1` and the results. |
| 16 | Copy | No AI buzzwords | PASS | None in the page or shared components (grep plus rendered text). |
| 17 | Copy | No Japanese AI copy pattern | PASS | N/A: the site is English-only (§9.2). |
| 18 | Copy | CTAs are specific | PASS | "Clear filters", "Browse all products", "Go to page 1", "Show 21 products", "Search". |
| 19 | Copy | Section headings use concrete words | PASS | Department, Animal Type, Care Level, Tags, Narrow to, Active filters. |
| 20 | Copy | Subtitles are 1 sentence max | PASS | Every subtitle written in code is one sentence, including the empty-catalogue message, which is now "Nothing is listed right now, so please check back later." The Animal Type intro is staff content: the real seed creates categories with only a name and parent (`backend/src/lib/seed/catalogue.ts`), so it's hidden in practice, and design-plan §5 now limits it to one sentence. The two-sentence Gecko text on the preview is stub data, not the design. Caveat: the stub still shows two sentences (fix 3). |
| 21 | Images & Icons | No emoji as icons | PASS | Inline SVG Icon component. Pagination uses the text characters ‹ ›, not emoji. |
| 22 | Images & Icons | Images match content | PASS | Photos match their products. The generic Supply box is neutral, not a wrong picture. |
| 23 | Images & Icons | No same image reused across pages/sections | **FAIL** | The same Supply silhouette is the card image on 42 of 70 products: every card on page 2, 15 of 21 cards on Geckos, and both "uvb" results. It is the designed missing-photo fallback (design-plan §6.6) and comes from the catalogue data, but on screen it reads as one image repeated down the grid and across pages. |
| 24 | Images & Icons | No AI illustrations with artifacts | PASS | Real photos and simple hand-drawn SVGs. |
| 25 | Images & Icons | No gradient placeholder boxes | PASS | The fallback is a flat `--ply-bg-surface-alt` panel with a silhouette and the title. |
| 26 | UX | First viewport communicates purpose | PASS | The `h1` names the view, and the breadcrumb, count, sort, and first cards are visible at 1280px and 375px. |
| 27 | UX | Long content is folded | PASS | Filters fold behind a button at 375px, the tree opens only the chosen branch, and results page at 24. |
| 28 | UX | Scroll animations don't block content | PASS | No scroll animations. |
| 29 | UX | Touch targets 44px+ on mobile | PASS | Re-measured at 375px in light and dark: breadcrumb "Shop" and "Lizard" 44×44, logo link 211×44, search input 283×44, Search button 68×44. Every other link, button, input, and select on `?animal_type=gecko`, `?q=uvb`, `?q=zebra&tag=aquatic`, and `?page=2` is ≥ 44 in both dimensions. That includes the 23 Filters panel rows (44px tall), "Show 21 products" (48px), and pagination (five 44×44 targets). The only smaller elements are not tap targets: the visually hidden search labels and the "Sort by" text label beside its 44px select. |
| 30 | UX | Max 2 CTA buttons per section | PASS | The no-results state has two buttons, and the phone filter panel has one ("Show N products"). |

**Scoring:** Colors 5/5 (100), Typography 5/5 (100), Layout 5/5 (100), Copy 5/5 (100), Images & Icons 4/5 (80), UX 5/5 (100). Overall = 580 / 6 = **96.7**. That is ≥ 90 with no UX failures, so the page **passes** under §9.3.

## Other observations (not scored)

- **New with this fix:** the phone breadcrumb is out of line. The current crumb sits about 12px above the two links, and the separators sit at two heights (fix 2).
- The header search box is empty on the results page (`?q=uvb`), so a customer can't edit the search they ran.
- With `?q=zebra&tag=aquatic`, the toggle reads "Filters (1 active)" while the chip row shows two chips (Search and Aquatic). The count leaves out the search.
- In the Newest sort, the Geckos view shows four Supply silhouettes in the first row, and the two geckos come last.
- On phones, Previous and Next are bare ‹ › characters with no box. They meet 44×44, but they're harder to see than the numbered pages.
- On a no-results page, "Clear filters" keeps the search, so with a search that matches nothing it leads to another empty page.
- The touch-target fixes to SiteHeader and SearchForm are shared, so Home needs a re-run (design-plan §9.3 step 6).

## Inputs

- **Code:** `storefront/app/shop/` (page.tsx, ShopHeader, FilterPanel, ActiveFilters, ShopToolbar, SortSelect, Pagination, HiddenParams, shop-copy.ts, page.module.css). Shared: ProductGrid, ProductCard, ProductImage, EmptyState, CareLevelBadge, StockBadge, Icon, SiteHeader, SearchForm, CatalogNav, SiteFooter, and their CSS modules in `storefront/component-css/`. Also `storefront/app/theme.css`, `app/fonts.ts`, `app/layout.tsx`, and `lib/data/products.ts` (silhouette choice). For check 20: design-plan §5 and `backend/src/lib/seed/catalogue.ts` and `animal-types.ts`.
- **Running page:** dev server at http://localhost:3100 against the stub backend with the seed catalogue (70 products, 28 with photos). Viewed in the browser pane.
  - First run:
    - `/shop?animal_type=gecko`: 1280px light and dark, 375px light and dark, with the Filters panel opened at 375px in both schemes
    - `/shop?q=uvb`: 1280px dark, 375px dark
    - `/shop?q=zebra&tag=aquatic`: 1280px dark, 375px light
    - `/shop?page=2`: 1280px dark (top of page), 375px light (grid end and pagination)
  - Re-run after the fixes:
    - `/shop?animal_type=gecko`: 375px light (screenshot plus measurements, with the Filters panel closed and open) and 375px dark (screenshot plus measurements)
    - `/shop?q=uvb`, `/shop?q=zebra&tag=aquatic`, and `/shop?page=2`: measured at 375px in light, each loaded in a 375px frame
- **Measurements** used JavaScript in the page: `getBoundingClientRect` on every visible link, button, input, select, and label at 375px; computed styles for fonts, line-heights, letter-spacing, `box-shadow`, gradients, and every text, background, and border color; photo and fallback counts on pages 1 to 3.
- **Limits:** in the hidden browser pane, the 1280px dark screenshots of the lower half of `?page=2` rendered blank on the first run, so the desktop pagination was judged from the DOM, the CSS, and the 375px screenshot. The fixes all sit inside `@media (max-width: 767px)` rules, so the 1280px views were not re-screenshotted. The empty-catalogue state can't be reached with the stub catalogue, so its new message was checked in code only.

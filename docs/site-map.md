# Site Map

This document lays out the storefront's pages: which page leads where, and
what each page does. It is the plan to follow when the Next.js storefront is
scaffolded. It covers pages only. Hosting and deployment are out of scope
(see [`CLAUDE.md`](../CLAUDE.md)).

Terms follow the glossary in [`domain-model.md`](./domain-model.md):
**Department**, **Animal Type**, **Care Level**, **Live Animal**,
**Supply**, **Available Stock**. Never say "category" on its own.

**Scope**: guest checkout only, one Region (United States, USD). There are
no account, order lookup, About, FAQ, or legal pages.

---

## 1. Page tree

```
Global layout (header + footer on every page)
│
├── /                         Home
│   ├──→ /shop?q=…            (search bar)
│   ├──→ /shop?department=…   (Department tiles)
│   ├──→ /shop?animal_type=…  (Shop by Animal Type)
│   └──→ /products/[handle]   (Beginner-friendly picks)
│
├── /shop                     Shop: search, filter, and sort
│   └──→ /products/[handle]
│
├── /products/[handle]        Product detail
│   ├──→ /cart                (Add to Cart)
│   └──→ /shop?animal_type=…&department=feeders,enclosures,accessories
│                             ("Shop supplies for X", Live Animals only)
│
├── /care-guides              Care Guides
│   └──→ /products/[handle]
│
├── /cart                     Cart
│   └──→ /checkout
│
├── /checkout                 Guest checkout (one page, stepped sections)
│   └──→ /order/[id]/confirmed
│
├── /order/[id]/confirmed     Order confirmation
│
└── not-found / error         404 page and error boundary
```

URLs have no country-code prefix, because there is only one Region.

---

## 2. Global layout

- **Header**: the logo links to Home. A **mega-menu** shows the four
  Departments and the full Animal Type tree (Lizard → Gecko → Crested
  Gecko, and so on). Every menu link goes to `/shop` with that filter set.
  The header also has a search box that goes to `/shop?q=`, a Care Guides
  link, and a cart link showing the item count from the Medusa cart.
- **Mobile**: a hamburger button opens the same tree as an **accordion**
  that expands one level at a time. The desktop mega-menu and the mobile
  accordion share one client component.
- **Footer**: links to Care Guides and the four Departments, plus basic
  store information.

---

## 3. Pages

### Home (`/`)

- A **search bar** that submits to `/shop?q=`.
- **Department tiles**: one tile each for Live Animals, Feeders, Enclosures,
  and Accessories, linking to `/shop?department=…`.
- **Shop by Animal Type**: the top-level Animal Types (Lizard, Snake,
  Amphibian, Invertebrate), linking to `/shop?animal_type=…`.
- **Beginner-friendly picks**: a row of Live Animals tagged
  `beginner-friendly`, filtered by Medusa rather than chosen by hand.

### Shop (`/shop`)

This one listing page handles both browsing and search. Every filter lives
in the URL, so any view can be linked or bookmarked.

| Param | Filters by | Notes |
|---|---|---|
| `q` | Keyword | Passed to the Medusa Store API's `q` search. |
| `department` | Department | One or more Departments. |
| `animal_type` | Animal Type | Includes descendants, so choosing Gecko also shows Crested Gecko and Gargoyle Gecko. |
| `care_level` | Care Level | Pick one: `beginner-friendly`, `intermediate`, or `advanced`. |
| `tag` | Tags | Pick several. A product matches if it has **any** of them (OR). |
| `sort` | Order | **Name A–Z** or **Newest**. |

- **Product cards** show the image, title, price, and, for Live Animals,
  the Care Level badge. A **Sold out** badge appears when Available Stock
  is 0. Sold-out products stay in the list.
- **Pagination** uses the Store API's limit and offset.
- **No price sort.** The Store API can't sort by price directly, and
  sorting in the browser would mean computing commerce data on the frontend.

### Product detail (`/products/[handle]`)

- Images, description, and price.
- **Availability**: in stock, or Sold out.
- **Care Level**, shown prominently on Live Animals, plus the product's
  other Tags.
- A **Care Sheet** link and embedded **Videos**, when the product has them.
- **Add to Cart** with a quantity picker. The quantity can't go above
  Available Stock, and the button is disabled when the product is sold out.
- Live Animals only: a **"Shop supplies for X"** link to `/shop` showing
  that animal's Animal Type in the Feeders, Enclosures, and Accessories
  Departments.

### Care Guides (`/care-guides`)

- One page laid out by the Animal Type tree.
- Each Live Animal shows its Care Level, its Care Sheet link, its Videos,
  and a link to its product page.
- All of this comes from Medusa product data. Nothing is entered separately.

### Cart (`/cart`)

- Lists Line Items, each with a quantity control (capped at Available
  Stock) and a remove button.
- Subtotal and totals come from Medusa.
- **Live Animal notice**: when the cart holds any Live Animal, a notice
  says Live Animal orders can't be completed online yet, and checkout is
  blocked. This only reflects that Medusa has no Shipping Options for Live
  Animals. The storefront adds no shipping, legal, or age rule of its own.

### Checkout (`/checkout`)

One page, with sections that unlock in order:

1. **Contact**: email address.
2. **Shipping address.**
3. **Shipping method**: chosen from the Shipping Options Medusa returns.
4. **Payment**: Medusa's built-in manual payment provider.
5. **Review & place order.**

Each section is saved to the Medusa cart before the next one unlocks. All
totals come from Medusa.

### Order confirmation (`/order/[id]/confirmed`)

- Shows the order number, Line Items, totals, and shipping address exactly
  as Medusa returns them.
- There is no order history or order lookup, because customer accounts are
  out of scope.

### 404 and error

- A friendly not-found page and an error boundary, both linking back to
  `/shop`.

---

## 4. Server and client components

Pages are server components. Client components are used only where the page
needs interactivity:

- The mega-menu and mobile accordion.
- The `/shop` filter and sort controls, which update the URL.
- Add to Cart with its quantity picker.
- The cart's quantity and remove controls.
- The checkout section forms.

All data goes through `storefront/lib/data/`. Pages and components never
call the Medusa SDK directly.

---

## 5. Open items

These are tracked in [`domain-model.md` §5](./domain-model.md#5-open-questions):

- **Live Animal checkout notice.** Its wording, and when it can be removed,
  depend on the unresolved Live Animal shipping, legal, permit, and age
  rules.
- **Price sort.** Deferred until Medusa can sort by price on the server.

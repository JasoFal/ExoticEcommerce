import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { BACKEND_URL, server } from "../../test/msw-server";
import type { ShopQuery } from "../shop-params";
import { listBeginnerPicks, listProducts } from "./products";

type VariantFixture = {
  inventory_quantity: number;
  manage_inventory?: boolean;
  allow_backorder?: boolean;
};

function liveAnimal(handle: string, variants: VariantFixture[] = [{ inventory_quantity: 3 }]) {
  return {
    id: `prod_${handle}`,
    handle,
    title: handle,
    thumbnail: `${BACKEND_URL}/static/${handle}.jpg`,
    type: { id: "ptyp_live", value: "live-animals" },
    tags: [
      { id: "ptag_beginner", value: "beginner-friendly" },
      { id: "ptag_nocturnal", value: "nocturnal" },
    ],
    categories: [{ id: "pcat_crested", handle: "crested-gecko" }],
    variants: variants.map((v, i) => ({
      id: `variant_${handle}_${i}`,
      manage_inventory: v.manage_inventory ?? true,
      allow_backorder: v.allow_backorder ?? false,
      inventory_quantity: v.inventory_quantity,
      calculated_price: { calculated_amount: 59.99, currency_code: "usd" },
    })),
  };
}

const list = <K extends string>(key: K, items: unknown[]) =>
  HttpResponse.json({ [key]: items, count: items.length, offset: 0, limit: 50 });

let productRequests: URL[];

function serveCatalogue(products: unknown[], { beginnerTagExists = true } = {}) {
  productRequests = [];
  server.use(
    http.get(`${BACKEND_URL}/store/regions`, () =>
      list("regions", [{ id: "reg_us", currency_code: "usd" }]),
    ),
    http.get(`${BACKEND_URL}/store/product-tags`, ({ request }) => {
      const value = new URL(request.url).searchParams.get("value");
      return list(
        "product_tags",
        value === "beginner-friendly" && beginnerTagExists
          ? [{ id: "ptag_beginner", value }]
          : [],
      );
    }),
    http.get(`${BACKEND_URL}/store/product-types`, ({ request }) => {
      const value = new URL(request.url).searchParams.get("value");
      return list(
        "product_types",
        value === "live-animals" ? [{ id: "ptyp_live", value }] : [],
      );
    }),
    http.get(`${BACKEND_URL}/store/product-categories`, () =>
      list("product_categories", [
        {
          id: "pcat_lizard",
          name: "Lizard",
          handle: "lizard",
          rank: 0,
          parent_category_id: null,
          category_children: [
            {
              id: "pcat_crested",
              name: "Crested Gecko",
              handle: "crested-gecko",
              rank: 0,
              parent_category_id: "pcat_lizard",
              category_children: [],
            },
          ],
        },
      ]),
    ),
    http.get(`${BACKEND_URL}/store/products`, ({ request }) => {
      productRequests.push(new URL(request.url));
      return list("products", products);
    }),
  );
}

describe("listBeginnerPicks", () => {
  beforeEach(() => serveCatalogue([liveAnimal("crested-gecko")]));

  it("asks Medusa for the newest beginner-friendly Live Animals, with stock and prices", async () => {
    await listBeginnerPicks();

    const params = productRequests[0].searchParams;
    expect(params.get("tag_id")).toBe("ptag_beginner");
    expect(params.get("type_id")).toBe("ptyp_live");
    expect(params.get("order")).toBe("-created_at");
    expect(params.get("region_id")).toBe("reg_us");
    expect(params.get("limit")).toBe("24");
    expect(params.get("fields")).toContain("+variants.inventory_quantity");
    expect(params.get("fields")).toContain("*variants.calculated_price");
  });

  it("maps a product to what a ProductCard shows", async () => {
    const [pick] = await listBeginnerPicks();

    expect(pick).toEqual({
      id: "prod_crested-gecko",
      handle: "crested-gecko",
      title: "crested-gecko",
      thumbnail: `${BACKEND_URL}/static/crested-gecko.jpg`,
      price: { amount: 59.99, currencyCode: "usd" },
      careLevel: "beginner-friendly",
      soldOut: false,
      silhouette: "lizard",
    });
  });

  it("drops a thumbnail Medusa doesn't serve, so the card shows its silhouette", async () => {
    serveCatalogue([
      {
        ...liveAnimal("crested-gecko"),
        thumbnail: "https://upload.wikimedia.org/crested-gecko.jpg",
      },
    ]);

    const [pick] = await listBeginnerPicks();

    expect(pick.thumbnail).toBeNull();
  });

  it("leaves out sold-out animals and keeps the first four in stock", async () => {
    serveCatalogue([
      liveAnimal("a"),
      liveAnimal("sold-out-1", [{ inventory_quantity: 0 }]),
      liveAnimal("b"),
      liveAnimal("c"),
      liveAnimal("sold-out-2", [{ inventory_quantity: 0 }, { inventory_quantity: 0 }]),
      liveAnimal("d", [{ inventory_quantity: 0 }, { inventory_quantity: 1 }]),
      liveAnimal("e"),
    ]);

    const picks = await listBeginnerPicks();

    expect(picks.map((p) => p.handle)).toEqual(["a", "b", "c", "d"]);
  });

  it("returns no picks when every animal is sold out", async () => {
    serveCatalogue([liveAnimal("sold-out", [{ inventory_quantity: 0 }])]);

    expect(await listBeginnerPicks()).toEqual([]);
  });

  it("returns no picks, without listing products, when the beginner-friendly Tag doesn't exist", async () => {
    serveCatalogue([liveAnimal("crested-gecko")], { beginnerTagExists: false });

    expect(await listBeginnerPicks()).toEqual([]);
    expect(productRequests).toHaveLength(0);
  });
});

const SHOP_TAGS: Record<string, string> = {
  "beginner-friendly": "ptag_beginner",
  advanced: "ptag_advanced",
  arboreal: "ptag_arboreal",
  nocturnal: "ptag_nocturnal",
};
const SHOP_TYPES: Record<string, string> = {
  "live-animals": "ptyp_live",
  feeders: "ptyp_feeders",
};

/** A Shop catalogue: Lizard › Gecko › Crested Gecko, plus Snake. */
function serveShop(products: unknown[], count = products.length) {
  productRequests = [];
  server.use(
    http.get(`${BACKEND_URL}/store/regions`, () =>
      list("regions", [{ id: "reg_us", currency_code: "usd" }]),
    ),
    http.get(`${BACKEND_URL}/store/product-tags`, ({ request }) => {
      const value = new URL(request.url).searchParams.get("value") ?? "";
      return list("product_tags", SHOP_TAGS[value] ? [{ id: SHOP_TAGS[value], value }] : []);
    }),
    http.get(`${BACKEND_URL}/store/product-types`, ({ request }) => {
      const value = new URL(request.url).searchParams.get("value") ?? "";
      return list("product_types", SHOP_TYPES[value] ? [{ id: SHOP_TYPES[value], value }] : []);
    }),
    http.get(`${BACKEND_URL}/store/product-categories`, () => {
      const crested = {
        id: "pcat_crested",
        name: "Crested Gecko",
        handle: "crested-gecko",
        parent_category_id: "pcat_gecko",
        category_children: [],
      };
      const gecko = {
        id: "pcat_gecko",
        name: "Gecko",
        handle: "gecko",
        parent_category_id: "pcat_lizard",
        category_children: [crested],
      };
      return list("product_categories", [
        {
          id: "pcat_lizard",
          name: "Lizard",
          handle: "lizard",
          parent_category_id: null,
          category_children: [gecko],
        },
        { id: "pcat_snake", name: "Snake", handle: "snake", parent_category_id: null, category_children: [] },
      ]);
    }),
    http.get(`${BACKEND_URL}/store/products`, ({ request }) => {
      productRequests.push(new URL(request.url));
      return HttpResponse.json({ products, count, offset: 0, limit: 24 });
    }),
  );
}

const SHOP: ShopQuery = {
  q: null,
  departments: [],
  animalType: null,
  careLevel: null,
  tags: [],
  sort: "newest",
  page: 1,
};

/** Every value sent for a filter, however the SDK spells array keys. */
function sent(params: URLSearchParams, key: string): string[] {
  return [...params.entries()]
    .filter(([k]) => k === key || (k.startsWith(key) && /^\[\d*\]$/.test(k.slice(key.length))))
    .map(([, v]) => v);
}

describe("listProducts", () => {
  it("asks for the first page of everything, newest first, with stock and prices", async () => {
    serveShop([liveAnimal("crested-gecko")], 31);

    const page = await listProducts(SHOP);

    const params = productRequests[0].searchParams;
    expect(params.get("order")).toBe("-created_at");
    expect(params.get("limit")).toBe("24");
    expect(params.get("offset")).toBe("0");
    expect(params.get("region_id")).toBe("reg_us");
    expect(params.get("fields")).toContain("+variants.inventory_quantity");
    expect(sent(params, "type_id")).toEqual([]);
    expect(sent(params, "category_id")).toEqual([]);
    expect(sent(params, "tag_id")).toEqual([]);
    expect(page.count).toBe(31);
    expect(page.products.map((p) => p.handle)).toEqual(["crested-gecko"]);
  });

  it("keeps sold-out products in the results", async () => {
    serveShop([liveAnimal("sold-out", [{ inventory_quantity: 0 }])]);

    const { products } = await listProducts(SHOP);

    expect(products).toHaveLength(1);
    expect(products[0].soldOut).toBe(true);
  });

  it("passes the keyword to Medusa's search", async () => {
    serveShop([]);

    await listProducts({ ...SHOP, q: "uvb" });

    expect(productRequests[0].searchParams.get("q")).toBe("uvb");
  });

  it("sorts by name and pages by offset", async () => {
    serveShop([]);

    await listProducts({ ...SHOP, sort: "name", page: 3 });

    const params = productRequests[0].searchParams;
    expect(params.get("order")).toBe("title");
    expect(params.get("offset")).toBe("48");
  });

  it("filters by every chosen Department", async () => {
    serveShop([]);

    await listProducts({ ...SHOP, departments: ["live-animals", "feeders"] });

    expect(sent(productRequests[0].searchParams, "type_id")).toEqual(["ptyp_live", "ptyp_feeders"]);
  });

  it("includes the descendants of the chosen Animal Type", async () => {
    serveShop([]);

    await listProducts({ ...SHOP, animalType: "lizard" });

    expect(sent(productRequests[0].searchParams, "category_id")).toEqual([
      "pcat_lizard",
      "pcat_gecko",
      "pcat_crested",
    ]);
  });

  it("matches any one of the Tags", async () => {
    serveShop([]);

    await listProducts({ ...SHOP, tags: ["arboreal", "nocturnal"] });

    expect(sent(productRequests[0].searchParams, "tag_id")).toEqual([
      "ptag_arboreal",
      "ptag_nocturnal",
    ]);
  });

  it("filters by the Care Level on its own", async () => {
    serveShop([]);

    await listProducts({ ...SHOP, careLevel: "advanced" });

    expect(sent(productRequests[0].searchParams, "tag_id")).toEqual(["ptag_advanced"]);
  });

  it("needs the Care Level and any one of the Tags when both are set", async () => {
    serveShop([]);

    await listProducts({ ...SHOP, careLevel: "beginner-friendly", tags: ["arboreal", "nocturnal"] });

    const params = productRequests[0].searchParams;
    expect(sent(params, "tag_id")).toEqual([]);
    expect(sent(params, "$and[0][tag_id]")).toEqual(["ptag_beginner"]);
    expect(sent(params, "$and[1][tag_id]")).toEqual(["ptag_arboreal", "ptag_nocturnal"]);
  });

  it("ignores a Tag Medusa doesn't have when another one exists", async () => {
    serveShop([]);

    await listProducts({ ...SHOP, tags: ["arboreal", "sparkly"] });

    expect(sent(productRequests[0].searchParams, "tag_id")).toEqual(["ptag_arboreal"]);
  });

  it.each<[string, Partial<ShopQuery>]>([
    ["an unknown Animal Type", { animalType: "dragon" }],
    ["only unknown Tags", { tags: ["sparkly"] }],
    ["a Department with no ProductType", { departments: ["enclosures"] }],
  ])("returns no products, without listing any, for %s", async (_, filter) => {
    serveShop([liveAnimal("crested-gecko")]);

    expect(await listProducts({ ...SHOP, ...filter })).toEqual({ products: [], count: 0 });
    expect(productRequests).toHaveLength(0);
  });
});

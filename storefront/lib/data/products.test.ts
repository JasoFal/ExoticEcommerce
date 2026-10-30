import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { BACKEND_URL, server } from "../../test/msw-server";
import { listBeginnerPicks } from "./products";

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
    thumbnail: `https://img.test/${handle}.jpg`,
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
      thumbnail: "https://img.test/crested-gecko.jpg",
      price: { amount: 59.99, currencyCode: "usd" },
      careLevel: "beginner-friendly",
      soldOut: false,
      silhouette: "lizard",
    });
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

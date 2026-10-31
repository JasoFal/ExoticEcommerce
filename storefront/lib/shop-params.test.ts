import { describe, expect, it } from "vitest";

import { shopHref } from "./shop-href";
import { activeFilterCount, parseShopParams, toShopParams, type ShopQuery } from "./shop-params";

const EMPTY: ShopQuery = {
  q: null,
  departments: [],
  animalType: null,
  careLevel: null,
  tags: [],
  sort: "newest",
  page: 1,
};

describe("parseShopParams", () => {
  it("reads an empty URL as the unfiltered Shop", () => {
    expect(parseShopParams({})).toEqual(EMPTY);
  });

  it("reads every param", () => {
    expect(
      parseShopParams({
        q: "gecko",
        department: ["live-animals", "feeders"],
        animal_type: "gecko",
        care_level: "beginner-friendly",
        tag: ["arboreal", "nocturnal"],
        sort: "name",
        page: "2",
      }),
    ).toEqual({
      q: "gecko",
      departments: ["live-animals", "feeders"],
      animalType: "gecko",
      careLevel: "beginner-friendly",
      tags: ["arboreal", "nocturnal"],
      sort: "name",
      page: 2,
    });
  });

  it("drops empty values, as the header search sends for All Departments", () => {
    expect(parseShopParams({ q: "  ", department: "", animal_type: "", care_level: "" })).toEqual(
      EMPTY,
    );
  });

  it("drops unknown Departments, Care Levels, and sorts", () => {
    expect(
      parseShopParams({
        department: ["feeders", "snacks"],
        care_level: "expert",
        sort: "price",
      }),
    ).toEqual({ ...EMPTY, departments: ["feeders"] });
  });

  it("keeps Tags outside the filter list, since product pages link to them", () => {
    expect(parseShopParams({ tag: "colourful" }).tags).toEqual(["colourful"]);
  });

  it("takes the first Animal Type and Care Level when a URL repeats them", () => {
    const query = parseShopParams({
      animal_type: ["gecko", "snake"],
      care_level: ["advanced", "intermediate"],
    });

    expect(query.animalType).toBe("gecko");
    expect(query.careLevel).toBe("advanced");
  });

  it("removes repeated values", () => {
    expect(parseShopParams({ department: ["feeders", "feeders"], tag: ["large", "large"] })).toEqual(
      { ...EMPTY, departments: ["feeders"], tags: ["large"] },
    );
  });

  it.each(["0", "-2", "1.5", "two", ""])("falls back to page 1 for page=%j", (page) => {
    expect(parseShopParams({ page }).page).toBe(1);
  });
});

describe("toShopParams", () => {
  it("round-trips a view through its URL", () => {
    const query: ShopQuery = {
      q: "uvb",
      departments: ["accessories"],
      animalType: "lizard",
      careLevel: null,
      tags: ["large"],
      sort: "name",
      page: 2,
    };

    const url = new URL(shopHref(toShopParams(query)), "http://store.test");
    const params = Object.fromEntries(
      [...new Set(url.searchParams.keys())].map((key) => [key, url.searchParams.getAll(key)]),
    );

    expect(parseShopParams(params)).toEqual(query);
  });

  it("leaves out the default sort and page 1", () => {
    expect(shopHref(toShopParams({ ...EMPTY, animalType: "gecko" }))).toBe(
      "/shop?animal_type=gecko",
    );
  });
});

describe("activeFilterCount", () => {
  it("counts each filter value, but not the keyword or sort", () => {
    expect(activeFilterCount(EMPTY)).toBe(0);
    expect(
      activeFilterCount({
        ...EMPTY,
        q: "gecko",
        sort: "name",
        departments: ["feeders", "enclosures"],
        animalType: "gecko",
        careLevel: "advanced",
        tags: ["large"],
      }),
    ).toBe(5);
  });
});

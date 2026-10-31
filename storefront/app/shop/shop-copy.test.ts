import { describe, expect, it } from "vitest";

import type { ShopQuery } from "../../lib/shop-params";
import { animalType } from "../../test/animal-type-fixture";
import { resultCount, shopHeading } from "./shop-copy";

const EMPTY: ShopQuery = {
  q: null,
  departments: [],
  animalType: null,
  careLevel: null,
  tags: [],
  sort: "newest",
  page: 1,
};

const gecko = animalType("Gecko", "gecko");
const lizardPath = [animalType("Lizard", "lizard", [gecko]), gecko];

describe("shopHeading", () => {
  it("names the search first", () => {
    expect(shopHeading({ ...EMPTY, q: "uvb", animalType: "gecko" }, lizardPath)).toBe(
      "Results for “uvb”",
    );
  });

  it("names the chosen Animal Type in the plural", () => {
    expect(shopHeading({ ...EMPTY, animalType: "gecko" }, lizardPath)).toBe("Geckos");
  });

  it("names a single Department", () => {
    expect(shopHeading({ ...EMPTY, departments: ["feeders"] }, [])).toBe("Feeders");
  });

  it("names a Care Level", () => {
    expect(shopHeading({ ...EMPTY, careLevel: "beginner-friendly" }, [])).toBe(
      "Beginner-friendly animals",
    );
  });

  it("falls back to Shop all", () => {
    expect(shopHeading(EMPTY, [])).toBe("Shop all");
    expect(shopHeading({ ...EMPTY, departments: ["feeders", "enclosures"] }, [])).toBe(
      "Shop all",
    );
  });
});

describe("resultCount", () => {
  it("gives the range on this page", () => {
    expect(resultCount(1, 24, 31)).toBe("Showing 1–24 of 31 products");
    expect(resultCount(2, 7, 31)).toBe("Showing 25–31 of 31 products");
  });

  it("drops the range when everything fits on one page", () => {
    expect(resultCount(1, 2, 2)).toBe("Showing 2 of 2 products");
    expect(resultCount(1, 1, 1)).toBe("Showing 1 of 1 product");
  });

  it("gives just the total when this page is empty", () => {
    expect(resultCount(1, 0, 0)).toBe("0 products");
    expect(resultCount(9, 0, 31)).toBe("31 products");
  });
});

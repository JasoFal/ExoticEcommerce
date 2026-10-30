import { describe, expect, it } from "vitest";

import { shopHref } from "./shop-href";

describe("shopHref", () => {
  it("links to the unfiltered Shop page", () => {
    expect(shopHref()).toBe("/shop");
    expect(shopHref({})).toBe("/shop");
  });

  it("sets one filter", () => {
    expect(shopHref({ department: "feeders" })).toBe("/shop?department=feeders");
    expect(shopHref({ care_level: "beginner-friendly" })).toBe(
      "/shop?care_level=beginner-friendly",
    );
  });

  it("combines filters in the site map's param order", () => {
    expect(shopHref({ animal_type: "lizard", department: "live-animals" })).toBe(
      "/shop?department=live-animals&animal_type=lizard",
    );
  });

  it("encodes a search keyword", () => {
    expect(shopHref({ q: "crested gecko & uvb" })).toBe(
      "/shop?q=crested+gecko+%26+uvb",
    );
  });

  it("repeats a param for several values", () => {
    expect(shopHref({ tag: ["nocturnal", "arboreal"] })).toBe(
      "/shop?tag=nocturnal&tag=arboreal",
    );
  });

  it("leaves out empty values", () => {
    expect(shopHref({ q: "", department: undefined, tag: [] })).toBe("/shop");
  });
});

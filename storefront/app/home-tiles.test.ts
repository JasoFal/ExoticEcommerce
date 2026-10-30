import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { homeTiles } from "./home-tiles";

describe("homeTiles", () => {
  it("lists the eight tiles in the mockup's order, each linking to a Shop view", () => {
    const tiles = homeTiles();

    expect(tiles.map((t) => [t.title, t.href])).toEqual([
      ["Lizards", "/shop?department=live-animals&animal_type=lizard"],
      ["Snakes", "/shop?department=live-animals&animal_type=snake"],
      ["Amphibians", "/shop?department=live-animals&animal_type=amphibian"],
      ["Invertebrates", "/shop?department=live-animals&animal_type=invertebrate"],
      ["Feeders", "/shop?department=feeders"],
      ["Enclosures", "/shop?department=enclosures"],
      ["Accessories", "/shop?department=accessories"],
      ["All Live Animals", "/shop?department=live-animals"],
    ]);
    expect(tiles.at(-1)?.subtitle).toBe("Every animal we carry");
  });

  it("gives every tile a committed photo under public/tiles/", () => {
    for (const { title, image } of homeTiles()) {
      const photo = image ?? "";
      expect(photo, title).toMatch(/^\/tiles\/[a-z-]+\.jpg$/);
      expect(existsSync(new URL(`../public${photo}`, import.meta.url)), photo).toBe(true);
    }
  });
});

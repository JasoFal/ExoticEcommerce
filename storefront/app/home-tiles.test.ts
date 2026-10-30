import { describe, expect, it } from "vitest";

import { HOME_TILES, homeTiles, standInHandles } from "./home-tiles";

describe("homeTiles", () => {
  it("lists the eight tiles in the mockup's order, each linking to a Shop view", () => {
    const tiles = homeTiles(new Map());

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

  it("uses the stand-in product's Medusa thumbnail until a photo is chosen", () => {
    const tiles = homeTiles(new Map([["ball-python", "https://img.test/python.jpg"]]));

    expect(tiles.find((t) => t.title === "Snakes")?.image).toBe("https://img.test/python.jpg");
  });

  it("falls back to the icon when the stand-in has no thumbnail", () => {
    const tiles = homeTiles(new Map());

    expect(tiles.find((t) => t.title === "Snakes")).toMatchObject({ image: null, icon: "snake" });
  });

  it("prefers a chosen photo over the stand-in", () => {
    const [snakes] = homeTiles(new Map([["ball-python", "https://img.test/python.jpg"]]), [
      { ...HOME_TILES[1], photo: "/tiles/snakes.jpg" },
    ]);

    expect(snakes.image).toBe("/tiles/snakes.jpg");
  });
});

describe("standInHandles", () => {
  it("names the product behind each tile that has no photo yet", () => {
    expect(standInHandles()).toEqual([
      "northern-blue-tongued-skink",
      "ball-python",
      "axolotl",
      "emperor-scorpion",
      "large-dubia-roaches-34-1-25-count",
      "tall-arboreal-vivarium-kit-18x18x36",
      "deep-dome-lamp-fixture-85",
      "red-eyed-tree-frog",
    ]);
  });
});

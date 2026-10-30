import type { IconName } from "../components/Icon";
import type { ShopTileProps } from "../components/ShopTile";
import { shopHref } from "../lib/shop-href";

type HomeTile = {
  title: string;
  subtitle: string;
  href: string;
  icon: IconName;
  /**
   * A chosen photo in public/tiles/, e.g. "/tiles/snakes.jpg". None are
   * chosen yet (docs/site-map.md §5).
   */
  photo?: string;
  /** Until then, this product's image from Medusa stands in. */
  standIn: string;
};

/**
 * Home's "Shop animals and supplies" grid: the four top-level Animal Types
 * (Live Animals only), the three Supply Departments, and all Live Animals.
 * Stand-ins avoid the beginner-friendly animals, so the same photo doesn't
 * appear twice on Home; Ball Python is the exception, by request.
 */
export const HOME_TILES: readonly HomeTile[] = [
  {
    title: "Lizards",
    subtitle: "Geckos, skinks, and tegus",
    href: shopHref({ department: "live-animals", animal_type: "lizard" }),
    icon: "lizard",
    standIn: "northern-blue-tongued-skink",
  },
  {
    title: "Snakes",
    subtitle: "Pythons and colubrids",
    href: shopHref({ department: "live-animals", animal_type: "snake" }),
    icon: "snake",
    standIn: "ball-python",
  },
  {
    title: "Amphibians",
    subtitle: "Frogs and axolotls",
    href: shopHref({ department: "live-animals", animal_type: "amphibian" }),
    icon: "amphibian",
    standIn: "axolotl",
  },
  {
    title: "Invertebrates",
    subtitle: "Tarantulas and scorpions",
    href: shopHref({ department: "live-animals", animal_type: "invertebrate" }),
    icon: "invertebrate",
    standIn: "emperor-scorpion",
  },
  {
    title: "Feeders",
    subtitle: "Insects, rodents, and diets",
    href: shopHref({ department: "feeders" }),
    icon: "feeder",
    standIn: "large-dubia-roaches-34-1-25-count",
  },
  {
    title: "Enclosures",
    subtitle: "Terrariums and vivarium kits",
    href: shopHref({ department: "enclosures" }),
    icon: "enclosure",
    standIn: "tall-arboreal-vivarium-kit-18x18x36",
  },
  {
    title: "Accessories",
    subtitle: "Lighting, heat, and substrate",
    href: shopHref({ department: "accessories" }),
    icon: "lamp",
    standIn: "deep-dome-lamp-fixture-85",
  },
  {
    title: "All Live Animals",
    subtitle: "Every animal we carry",
    href: shopHref({ department: "live-animals" }),
    icon: "leaf",
    standIn: "red-eyed-tree-frog",
  },
];

/** Handles whose Medusa thumbnails the tiles without a photo need. */
export function standInHandles(tiles: readonly HomeTile[] = HOME_TILES): string[] {
  return tiles.filter((tile) => !tile.photo).map((tile) => tile.standIn);
}

/** The tiles, each with its photo, its stand-in's thumbnail, or no image (icon). */
export function homeTiles(
  thumbnails: Map<string, string>,
  tiles: readonly HomeTile[] = HOME_TILES,
): ShopTileProps[] {
  return tiles.map(({ photo, standIn, ...tile }) => ({
    ...tile,
    image: photo ?? thumbnails.get(standIn) ?? null,
  }));
}

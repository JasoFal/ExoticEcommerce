import type { IconName } from "../components/Icon";
import type { ShopTileProps } from "../components/ShopTile";
import { shopHref } from "../lib/shop-href";

type HomeTile = {
  title: string;
  subtitle: string;
  href: string;
  icon: IconName;
  /** A Pixabay photo committed to public/tiles/ (credits in CREDITS.md there). */
  photo: string;
};

/**
 * Home's "Shop animals and supplies" grid: the four top-level Animal Types
 * (Live Animals only), the three Supply Departments, and all Live Animals.
 */
export const HOME_TILES: readonly HomeTile[] = [
  {
    title: "Lizards",
    subtitle: "Geckos, skinks, and tegus",
    href: shopHref({ department: "live-animals", animal_type: "lizard" }),
    icon: "lizard",
    photo: "/tiles/lizards.jpg",
  },
  {
    title: "Snakes",
    subtitle: "Pythons and colubrids",
    href: shopHref({ department: "live-animals", animal_type: "snake" }),
    icon: "snake",
    photo: "/tiles/snakes.jpg",
  },
  {
    title: "Amphibians",
    subtitle: "Frogs and axolotls",
    href: shopHref({ department: "live-animals", animal_type: "amphibian" }),
    icon: "amphibian",
    photo: "/tiles/amphibians.jpg",
  },
  {
    title: "Invertebrates",
    subtitle: "Tarantulas and scorpions",
    href: shopHref({ department: "live-animals", animal_type: "invertebrate" }),
    icon: "invertebrate",
    photo: "/tiles/invertebrates.jpg",
  },
  {
    title: "Feeders",
    subtitle: "Insects, rodents, and diets",
    href: shopHref({ department: "feeders" }),
    icon: "feeder",
    photo: "/tiles/feeders.jpg",
  },
  {
    title: "Enclosures",
    subtitle: "Terrariums and vivarium kits",
    href: shopHref({ department: "enclosures" }),
    icon: "enclosure",
    photo: "/tiles/enclosures.jpg",
  },
  {
    title: "Accessories",
    subtitle: "Lighting, heat, and substrate",
    href: shopHref({ department: "accessories" }),
    icon: "lamp",
    photo: "/tiles/accessories.jpg",
  },
  {
    title: "All Live Animals",
    subtitle: "Every animal we carry",
    href: shopHref({ department: "live-animals" }),
    icon: "leaf",
    photo: "/tiles/all-live-animals.jpg",
  },
];

/** The tiles as ShopTile props, each showing its photo. */
export function homeTiles(): ShopTileProps[] {
  return HOME_TILES.map(({ photo, ...tile }) => ({ ...tile, image: photo }));
}

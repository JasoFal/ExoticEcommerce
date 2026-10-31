import { CARE_LEVELS, DEPARTMENTS, FILTER_TAGS } from "../../lib/catalog";
import type { AnimalTypeNode } from "../../lib/data/animal-types";
import { SHOP_PAGE_SIZE, type ShopQuery } from "../../lib/shop-params";

/** "Geckos". Every name in the tree pluralises with a trailing "s". */
export const pluralName = (node: AnimalTypeNode) => `${node.name}s`;

export const departmentLabel = (value: string) =>
  DEPARTMENTS.find((d) => d.value === value)?.label ?? value;

export const careLevelLabel = (value: string) =>
  CARE_LEVELS.find((c) => c.value === value)?.label ?? value;

/** A Tag outside the filter list shows as its raw value. */
export const tagLabel = (value: string) =>
  FILTER_TAGS.find((t) => t.value === value)?.label ?? value;

/**
 * The Shop's `<h1>`: what the view is (design-plan §5). `path` runs from
 * the top-level Animal Type down to the chosen one.
 */
export function shopHeading(query: ShopQuery, path: AnimalTypeNode[]): string {
  const animalType = path.at(-1);
  if (query.q) return `Results for “${query.q}”`;
  if (animalType) return pluralName(animalType);
  if (query.departments.length === 1) return departmentLabel(query.departments[0]);
  if (query.careLevel) return `${careLevelLabel(query.careLevel)} animals`;
  return "Shop all";
}

const products = (n: number) => `${n} ${n === 1 ? "product" : "products"}`;

/** "Showing 1–24 of 31 products", for the toolbar. */
export function resultCount(page: number, shown: number, count: number): string {
  if (count === 0 || shown === 0) return products(count);
  if (shown === count) return `Showing ${shown} of ${products(count)}`;
  const start = (page - 1) * SHOP_PAGE_SIZE + 1;
  return `Showing ${start}–${start + shown - 1} of ${products(count)}`;
}

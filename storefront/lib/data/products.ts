import type { HttpTypes } from "@medusajs/types";
import { cache } from "react";

import { careLevelOf, type CareLevel } from "../catalog";
import { animalTypeRoots, getAnimalTypeTree } from "./animal-types";
import { sdk } from "./client";
import { getRegion } from "./regions";

/** The silhouette a missing product image falls back to (design-plan §6.6). */
export type Silhouette = "lizard" | "snake" | "amphibian" | "invertebrate" | "supply";

const ANIMAL_SILHOUETTES: readonly string[] = [
  "lizard",
  "snake",
  "amphibian",
  "invertebrate",
] satisfies Silhouette[];

/** True for a top-level Animal Type handle that has its own silhouette. */
function hasSilhouette(handle: string | undefined): handle is Silhouette {
  return handle !== undefined && ANIMAL_SILHOUETTES.includes(handle);
}

/** What a ProductCard shows. Every value is read from Medusa as-is. */
export type ProductSummary = {
  id: string;
  handle: string;
  title: string;
  thumbnail: string | null;
  price: { amount: number; currencyCode: string } | null;
  careLevel: CareLevel | null;
  soldOut: boolean;
  silhouette: Silhouette;
};

const SUMMARY_FIELDS = [
  "*type",
  "*tags",
  "*categories",
  "*variants.calculated_price",
  "+variants.inventory_quantity",
].join(",");

/** How many beginner-friendly picks Home shows. */
const PICKS_SHOWN = 4;
/** How many to ask for, so sold-out animals can be left out. */
const PICKS_FETCHED = 24;

const findTagId = cache(async (value: string) => {
  const { product_tags } = await sdk.client.fetch<HttpTypes.StoreProductTagListResponse>(
    "/store/product-tags",
    { query: { value, limit: 1 } },
  );
  return product_tags[0]?.id ?? null;
});

const findTypeId = cache(async (value: string) => {
  const { product_types } = await sdk.client.fetch<HttpTypes.StoreProductTypeListResponse>(
    "/store/product-types",
    { query: { value, limit: 1 } },
  );
  return product_types[0]?.id ?? null;
});

/**
 * Sold out when no Variant can be bought. Reads Medusa's own
 * `inventory_quantity` (Available Stock); nothing is calculated here.
 */
function isSoldOut(product: HttpTypes.StoreProduct): boolean {
  return !(product.variants ?? []).some(
    (variant) =>
      !variant.manage_inventory ||
      variant.allow_backorder ||
      (variant.inventory_quantity ?? 0) > 0,
  );
}

function toSummary(
  product: HttpTypes.StoreProduct,
  roots: Map<string, string>,
): ProductSummary {
  const price = product.variants?.[0]?.calculated_price;
  const root = (product.categories ?? [])
    .map((category) => roots.get(category.handle))
    .find((handle) => handle !== undefined);
  const isLiveAnimal = product.type?.value === "live-animals";

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    thumbnail: product.thumbnail,
    price:
      price?.calculated_amount != null && price.currency_code
        ? { amount: price.calculated_amount, currencyCode: price.currency_code }
        : null,
    careLevel: careLevelOf((product.tags ?? []).map((tag) => tag.value)),
    soldOut: isSoldOut(product),
    silhouette: isLiveAnimal && hasSilhouette(root) ? root : "supply",
  };
}

/**
 * Home's "Beginner-friendly picks": the newest beginner-friendly Live
 * Animals that are in stock, at most four. Medusa picks and orders them.
 */
export async function listBeginnerPicks(): Promise<ProductSummary[]> {
  const [tagId, typeId] = await Promise.all([
    findTagId("beginner-friendly"),
    findTypeId("live-animals"),
  ]);
  if (!tagId || !typeId) return [];

  const [region, tree] = await Promise.all([getRegion(), getAnimalTypeTree()]);
  const { products } = await sdk.store.product.list({
    tag_id: tagId,
    type_id: typeId,
    region_id: region.id,
    order: "-created_at",
    limit: PICKS_FETCHED,
    fields: SUMMARY_FIELDS,
  });

  const roots = animalTypeRoots(tree);
  return products
    .map((product) => toSummary(product, roots))
    .filter((summary) => !summary.soldOut)
    .slice(0, PICKS_SHOWN);
}

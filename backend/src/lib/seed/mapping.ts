import type { CreateProductWorkflowInputDTO } from "@medusajs/framework/types"
import { toHandle } from "@medusajs/framework/utils"
import { ancestorsOf, toAnimalTypeName } from "./animal-types"
import type { Department, ProductDataEntry } from "./product-data"

// Pure mapping from ProductData.json to Medusa workflow input, following
// docs/domain-model.md §3. No Medusa calls here, so it's unit-tested directly.

/** Tags are lowercase-kebab: `UVB` → `uvb`, `New-Caledonia` → `new-caledonia`. */
export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase()
}

/** Every distinct normalized tag across the catalogue. */
export function uniqueTags(entries: ProductDataEntry[]): string[] {
  return [...new Set(entries.flatMap((e) => e.tags.map(normalizeTag)))]
}

/**
 * The most-specific-node rule: assign a Product to each listed Animal Type
 * that has no listed descendant. `["lizard", "gecko", "crested gecko"]` →
 * Crested Gecko. A listed node with no listed children means "all of it".
 */
export function mostSpecificAnimalTypes(dataNames: string[]): string[] {
  const listed = dataNames.map(toAnimalTypeName)
  return listed.filter(
    (name) => !listed.some((other) => ancestorsOf(other).includes(name))
  )
}

/** The "Seed corrections" in docs/domain-model.md §3. */
export function applySeedCorrections(entry: ProductDataEntry): ProductDataEntry {
  if (entry.id === "la-001") {
    // Its description says it's "an excellent choice for intermediate
    // reptile keepers", so its Care Level is intermediate.
    return {
      ...entry,
      tags: entry.tags.map((t) =>
        t === "beginner-friendly" ? "intermediate" : t
      ),
    }
  }
  return entry
}

export type SeedVariant = {
  title: string
  sku: string
  options: Record<string, string>
  stock: number
}

/**
 * One default Variant per Product, except e-003, which comes in Black and
 * White. SKUs must be unique, so its Variants get a color suffix. The 4/3
 * stock split is a placeholder until a human decides it (domain-model §5).
 */
export function variantsFor(entry: ProductDataEntry): SeedVariant[] {
  if (entry.id === "e-003") {
    return [
      { title: "Black", sku: "e-003-black", options: { Color: "Black" }, stock: 4 },
      { title: "White", sku: "e-003-white", options: { Color: "White" }, stock: 3 },
    ]
  }
  return [
    {
      title: "Default",
      sku: entry.id,
      options: { Default: "Default" },
      stock: entry.stock,
    },
  ]
}

/** Ids of the records each Product links to, created before the Products. */
export type CatalogueRefs = {
  salesChannelId: string
  defaultShippingProfileId: string
  liveAnimalsShippingProfileId: string
  departmentIds: Map<Department, string>
  tagIds: Map<string, string>
  animalTypeIds: Map<string, string>
  /** Each seed image's URL once uploaded through the File module. */
  imageUrls: Map<string, string>
}

export function toProductInput(
  entry: ProductDataEntry,
  refs: CatalogueRefs
): CreateProductWorkflowInputDTO {
  const isLiveAnimal = entry.category === "live-animals"
  const variants = variantsFor(entry)
  const optionTitle = Object.keys(variants[0].options)[0]
  const imageUrl = entry.image ? refs.imageUrls.get(entry.image) : undefined

  return {
    title: entry.name,
    handle: toHandle(entry.name),
    description: entry.description,
    status: "published",
    // No image: the storefront shows the silhouette (design-plan §6.6).
    ...(imageUrl && { thumbnail: imageUrl, images: [{ url: imageUrl }] }),
    type_id: refs.departmentIds.get(entry.category),
    tag_ids: entry.tags.map((t) => refs.tagIds.get(normalizeTag(t))!),
    category_ids: mostSpecificAnimalTypes(entry.animalCategory).map(
      (name) => refs.animalTypeIds.get(name)!
    ),
    // Live Animal shipping is unresolved, so their profile has no Shipping
    // Options yet (domain-model rule 5).
    shipping_profile_id: isLiveAnimal
      ? refs.liveAnimalsShippingProfileId
      : refs.defaultShippingProfileId,
    sales_channels: [{ id: refs.salesChannelId }],
    metadata: isLiveAnimal
      ? { care_sheet_url: entry.careSheet, video_urls: entry.video }
      : undefined,
    options: [
      { title: optionTitle, values: variants.map((v) => v.options[optionTitle]) },
    ],
    variants: variants.map((v) => ({
      title: v.title,
      sku: v.sku,
      options: v.options,
      // No overselling, for every Product (domain-model rule 1).
      manage_inventory: true,
      allow_backorder: false,
      prices: [{ currency_code: "usd", amount: entry.price }],
    })),
  }
}

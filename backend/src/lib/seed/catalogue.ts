import { readFileSync } from "fs"
import path from "path"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createProductTagsWorkflow,
  createProductTypesWorkflow,
  uploadFilesWorkflow,
} from "@medusajs/medusa/core-flows"
import type { StoreSetup } from "../store-setup"
import { animalTypesByDepth } from "./animal-types"
import {
  applySeedCorrections,
  toProductInput,
  uniqueTags,
  variantsFor,
} from "./mapping"
import {
  SEED_IMAGES_DIR,
  seedImageNames,
  type Department,
  type ProductDataEntry,
} from "./product-data"

const DEPARTMENTS: Department[] = [
  "live-animals",
  "feeders",
  "enclosures",
  "accessories",
]

async function createDepartments(
  container: MedusaContainer
): Promise<Map<Department, string>> {
  const { result } = await createProductTypesWorkflow(container).run({
    input: { product_types: DEPARTMENTS.map((value) => ({ value })) },
  })
  return new Map(result.map((t) => [t.value as Department, t.id]))
}

async function createTags(
  container: MedusaContainer,
  tags: string[]
): Promise<Map<string, string>> {
  const { result } = await createProductTagsWorkflow(container).run({
    input: { product_tags: tags.map((value) => ({ value })) },
  })
  return new Map(result.map((t) => [t.value, t.id]))
}

/**
 * Creates the Animal Type tree one level at a time, so each parent exists
 * before its children. Categories are inactive by default, and the Store API
 * hides inactive ones, so they're created active.
 */
async function createAnimalTypes(
  container: MedusaContainer
): Promise<Map<string, string>> {
  const idByName = new Map<string, string>()

  for (const level of animalTypesByDepth()) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: level.map(({ name, parent }) => ({
          name,
          is_active: true,
          parent_category_id: parent ? idByName.get(parent)! : null,
        })),
      },
    })
    result.forEach((category) => idByName.set(category.name, category.id))
  }

  return idByName
}

/**
 * Uploads each seed image through the File module, so it's stored and served
 * like an image staff upload in Admin (local in development, S3 later).
 */
async function uploadSeedImages(
  container: MedusaContainer,
  entries: ProductDataEntry[]
): Promise<Map<string, string>> {
  const names = seedImageNames(entries)
  if (names.length === 0) return new Map()

  const { result } = await uploadFilesWorkflow(container).run({
    input: {
      files: names.map((filename) => ({
        filename,
        mimeType: "image/jpeg",
        content: readFileSync(path.join(SEED_IMAGES_DIR, filename)).toString(
          "base64"
        ),
        access: "public" as const,
      })),
    },
  })
  // Uploads come back in input order.
  return new Map(names.map((name, i) => [name, result[i].url]))
}

async function stockProducts(
  container: MedusaContainer,
  stockLocationId: string,
  entries: ProductDataEntry[]
): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const stockBySku = new Map(
    entries.flatMap(variantsFor).map((v) => [v.sku, v.stock])
  )

  const { data: items } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
    filters: { sku: [...stockBySku.keys()] },
  })

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: items.map((item) => ({
        location_id: stockLocationId,
        inventory_item_id: item.id,
        stocked_quantity: stockBySku.get(item.sku!)!,
      })),
    },
  })
}

/**
 * Loads the catalogue into the store built by createStoreSetup: Departments,
 * Tags, the Animal Type tree, seed images, every Product, and its Stock
 * (docs/domain-model.md §3).
 */
export async function seedCatalogue(
  container: MedusaContainer,
  setup: StoreSetup,
  data: ProductDataEntry[]
): Promise<void> {
  const entries = data.map(applySeedCorrections)

  const refs = {
    salesChannelId: setup.salesChannelId,
    defaultShippingProfileId: setup.defaultShippingProfileId,
    liveAnimalsShippingProfileId: setup.liveAnimalsShippingProfileId,
    departmentIds: await createDepartments(container),
    tagIds: await createTags(container, uniqueTags(entries)),
    animalTypeIds: await createAnimalTypes(container),
    imageUrls: await uploadSeedImages(container, entries),
  }

  await createProductsWorkflow(container).run({
    input: { products: entries.map((e) => toProductInput(e, refs)) },
  })

  await stockProducts(container, setup.stockLocationId, entries)
}

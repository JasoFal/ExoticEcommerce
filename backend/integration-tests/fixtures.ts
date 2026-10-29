import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { createStoreSetup } from "../src/lib/store-setup"

// Known quantities. Tests assert against these, never against recomputed
// values (CLAUDE.md: tests read, never recompute).
export const LIVE_ANIMAL_STOCK = 2
export const SUPPLY_STOCK = 3

export type StoreFixtures = {
  publishableKey: string
  regionId: string
  shippingOptionId: string
  liveAnimalVariantId: string
  supplyVariantId: string
}

type ProductSeed = {
  title: string
  handle: string
  sku: string
  shippingProfileId: string
  salesChannelId: string
  amount: number
}

async function createProduct(
  container: MedusaContainer,
  seed: ProductSeed
): Promise<string> {
  const { result } = await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: seed.title,
          handle: seed.handle,
          status: "published",
          shipping_profile_id: seed.shippingProfileId,
          sales_channels: [{ id: seed.salesChannelId }],
          options: [{ title: "Default", values: ["Default"] }],
          variants: [
            {
              title: "Default",
              sku: seed.sku,
              options: { Default: "Default" },
              manage_inventory: true,
              allow_backorder: false,
              prices: [{ currency_code: "usd", amount: seed.amount }],
            },
          ],
        },
      ],
    },
  })
  return result[0].variants![0].id
}

/**
 * Builds the minimum store a guest checkout needs: the shared store setup
 * (src/lib/store-setup.ts) plus one Live Animal and one Supply with known
 * stock. Everything goes through Medusa workflows and modules, never raw SQL.
 */
export async function createStoreFixtures(
  container: MedusaContainer
): Promise<StoreFixtures> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const setup = await createStoreSetup(container)

  const liveAnimalVariantId = await createProduct(container, {
    title: "Test Crested Gecko",
    handle: "test-crested-gecko",
    sku: "la-test-001",
    shippingProfileId: setup.liveAnimalsShippingProfileId,
    salesChannelId: setup.salesChannelId,
    amount: 150,
  })
  const supplyVariantId = await createProduct(container, {
    title: "Test Dubia Roaches",
    handle: "test-dubia-roaches",
    sku: "f-test-001",
    shippingProfileId: setup.defaultShippingProfileId,
    salesChannelId: setup.salesChannelId,
    amount: 20,
  })

  const { data: items } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
    filters: { sku: ["la-test-001", "f-test-001"] },
  })
  const itemIdBySku = new Map(items.map((i) => [i.sku, i.id]))
  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: [
        {
          location_id: setup.stockLocationId,
          inventory_item_id: itemIdBySku.get("la-test-001")!,
          stocked_quantity: LIVE_ANIMAL_STOCK,
        },
        {
          location_id: setup.stockLocationId,
          inventory_item_id: itemIdBySku.get("f-test-001")!,
          stocked_quantity: SUPPLY_STOCK,
        },
      ],
    },
  })

  return {
    publishableKey: setup.publishableKey,
    regionId: setup.regionId,
    shippingOptionId: setup.shippingOptionId,
    liveAnimalVariantId,
    supplyVariantId,
  }
}

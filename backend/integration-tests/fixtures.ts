import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"

// Known quantities. Tests assert against these, never against recomputed
// values (CLAUDE.md: tests read, never recompute).
export const LIVE_ANIMAL_STOCK = 2
export const SUPPLY_STOCK = 3
export const SHIPPING_AMOUNT = 10

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
 * Builds the minimum store a guest checkout needs: one US/USD Region with the
 * manual payment provider, one Sales Channel and Stock Location, a publishable
 * key, a flat Shipping Option on the default Shipping Profile, and one Live
 * Animal and one Supply with known stock. Everything goes through Medusa
 * workflows and modules, never raw SQL.
 */
export async function createStoreFixtures(
  container: MedusaContainer
): Promise<StoreFixtures> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const fulfillment = container.resolve(Modules.FULFILLMENT)

  const { result: regions } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "United States",
          currency_code: "usd",
          countries: ["us"],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  })

  const { result: channels } = await createSalesChannelsWorkflow(
    container
  ).run({ input: { salesChannelsData: [{ name: "Storefront" }] } })
  const salesChannelId = channels[0].id

  const { result: locations } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Main Stock Location",
          address: { city: "Austin", country_code: "US", address_1: "1 Test St" },
        },
      ],
    },
  })
  const stockLocationId = locations[0].id

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocationId, add: [salesChannelId] },
  })

  const { result: profiles } = await createShippingProfilesWorkflow(
    container
  ).run({
    input: {
      data: [
        { name: "Default Shipping Profile", type: "default" },
        // Placeholder: Live Animal shipping rules are unresolved, so this
        // profile deliberately has no Shipping Options (domain-model rule 5).
        { name: "Live Animals", type: "live-animals" },
      ],
    },
  })
  const defaultProfile = profiles.find((p) => p.type === "default")!
  const liveAnimalsProfile = profiles.find((p) => p.type === "live-animals")!

  const fulfillmentSet = await fulfillment.createFulfillmentSets({
    name: "US Delivery",
    type: "shipping",
    service_zones: [
      {
        name: "United States",
        geo_zones: [{ country_code: "us", type: "country" }],
      },
    ],
  })
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  })

  const { result: shippingOptions } = await createShippingOptionsWorkflow(
    container
  ).run({
    input: [
      {
        name: "Flat Rate",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: defaultProfile.id,
        type: { label: "Flat", description: "Flat rate", code: "flat" },
        prices: [
          { currency_code: "usd", amount: SHIPPING_AMOUNT },
          { region_id: regions[0].id, amount: SHIPPING_AMOUNT },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  })

  const { result: keys } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        { title: "Test Storefront", type: "publishable", created_by: "" },
      ],
    },
  })
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: keys[0].id, add: [salesChannelId] },
  })

  const liveAnimalVariantId = await createProduct(container, {
    title: "Test Crested Gecko",
    handle: "test-crested-gecko",
    sku: "la-test-001",
    shippingProfileId: liveAnimalsProfile.id,
    salesChannelId,
    amount: 150,
  })
  const supplyVariantId = await createProduct(container, {
    title: "Test Dubia Roaches",
    handle: "test-dubia-roaches",
    sku: "f-test-001",
    shippingProfileId: defaultProfile.id,
    salesChannelId,
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
          location_id: stockLocationId,
          inventory_item_id: itemIdBySku.get("la-test-001")!,
          stocked_quantity: LIVE_ANIMAL_STOCK,
        },
        {
          location_id: stockLocationId,
          inventory_item_id: itemIdBySku.get("f-test-001")!,
          stocked_quantity: SUPPLY_STOCK,
        },
      ],
    },
  })

  return {
    publishableKey: keys[0].token,
    regionId: regions[0].id,
    shippingOptionId: shippingOptions[0].id,
    liveAnimalVariantId,
    supplyVariantId,
  }
}

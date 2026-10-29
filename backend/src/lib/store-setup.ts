import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"

// Placeholder flat rate for Supplies. Staff can change it in Admin.
export const FLAT_SHIPPING_AMOUNT = 10

export type StoreSetup = {
  regionId: string
  salesChannelId: string
  stockLocationId: string
  defaultShippingProfileId: string
  liveAnimalsShippingProfileId: string
  shippingOptionId: string
  publishableKey: string
}

/**
 * Builds the store structure everything else hangs off (docs/domain-model.md
 * rule 4: one of each): the United States Region with the manual payment
 * provider, the storefront Sales Channel and its publishable key, the Stock
 * Location, and a flat Shipping Option for Supplies. Shared by the seed script
 * and the integration-test fixtures so the two can't drift apart.
 */
export async function createStoreSetup(
  container: MedusaContainer
): Promise<StoreSetup> {
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
  const regionId = regions[0].id

  const { result: channels } = await createSalesChannelsWorkflow(
    container
  ).run({ input: { salesChannelsData: [{ name: "Storefront" }] } })
  const salesChannelId = channels[0].id

  // The address is a placeholder until the business's real one is known.
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
          { currency_code: "usd", amount: FLAT_SHIPPING_AMOUNT },
          { region_id: regionId, amount: FLAT_SHIPPING_AMOUNT },
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
      api_keys: [{ title: "Storefront", type: "publishable", created_by: "" }],
    },
  })
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: keys[0].id, add: [salesChannelId] },
  })

  return {
    regionId,
    salesChannelId,
    stockLocationId,
    defaultShippingProfileId: defaultProfile.id,
    liveAnimalsShippingProfileId: liveAnimalsProfile.id,
    shippingOptionId: shippingOptions[0].id,
    publishableKey: keys[0].token,
  }
}

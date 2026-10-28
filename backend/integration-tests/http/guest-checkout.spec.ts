import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { createStoreFixtures, StoreFixtures, SUPPLY_STOCK } from "../fixtures"

jest.setTimeout(120 * 1000)

const address = {
  first_name: "Guest",
  last_name: "Customer",
  address_1: "1 Test St",
  city: "Austin",
  province: "tx",
  postal_code: "78701",
  country_code: "us",
}

// Guest cart -> order (docs/ci-cd-plan.md 3.4 #2) with the manual payment
// provider. Assertions read values Medusa returns. They never recompute
// pricing or totals (CLAUDE.md).
medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    describe("Guest checkout", () => {
      let fixtures: StoreFixtures
      let headers: { "x-publishable-api-key": string }

      beforeEach(async () => {
        fixtures = await createStoreFixtures(getContainer())
        headers = { "x-publishable-api-key": fixtures.publishableKey }
      })

      const checkout = async (quantity: number) => {
        const created = await api.post(
          "/store/carts",
          { region_id: fixtures.regionId, email: "guest@example.com" },
          { headers }
        )
        const cartId = created.data.cart.id as string

        await api.post(
          `/store/carts/${cartId}/line-items`,
          { variant_id: fixtures.supplyVariantId, quantity },
          { headers }
        )
        await api.post(
          `/store/carts/${cartId}`,
          { shipping_address: address, billing_address: address },
          { headers }
        )
        await api.post(
          `/store/carts/${cartId}/shipping-methods`,
          { option_id: fixtures.shippingOptionId },
          { headers }
        )
        const collection = await api.post(
          "/store/payment-collections",
          { cart_id: cartId },
          { headers }
        )
        await api.post(
          `/store/payment-collections/${collection.data.payment_collection.id}/payment-sessions`,
          { provider_id: "pp_system_default" },
          { headers }
        )
        const completed = await api.post(
          `/store/carts/${cartId}/complete`,
          {},
          { headers }
        )
        return { completed }
      }

      it("turns a guest cart into an order using Medusa's totals", async () => {
        const { completed } = await checkout(1)

        expect(completed.status).toEqual(200)
        expect(completed.data.type).toEqual("order")
        const order = completed.data.order
        expect(order.id).toBeTruthy()
        expect(order.email).toEqual("guest@example.com")
        expect(order.items).toHaveLength(1)
        expect(order.items[0].variant_id).toEqual(fixtures.supplyVariantId)
        expect(typeof order.total).toEqual("number")
        expect(order.total).toBeGreaterThan(0)
      })

      it("reserves stock so a later cart's limit drops", async () => {
        const { completed } = await checkout(1)
        expect(completed.data.type).toEqual("order")

        const next = await api.post(
          "/store/carts",
          { region_id: fixtures.regionId },
          { headers }
        )
        const res = await api
          .post(
            `/store/carts/${next.data.cart.id}/line-items`,
            { variant_id: fixtures.supplyVariantId, quantity: SUPPLY_STOCK },
            { headers }
          )
          .catch((e: { response: { status: number } }) => e.response)
        expect(res.status).toEqual(400)
      })
    })
  },
})

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  createStoreFixtures,
  LIVE_ANIMAL_STOCK,
  StoreFixtures,
  SUPPLY_STOCK,
} from "../fixtures"

jest.setTimeout(120 * 1000)

// Inventory guards (docs/ci-cd-plan.md 3.4 #1): cart quantity can never exceed
// Available Stock, and backorders are off. These tests check Medusa's own
// enforcement for correctly configured Variants. Whether every Variant is
// configured that way is an open question in docs/domain-model.md.
medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    describe("Inventory guards", () => {
      let fixtures: StoreFixtures
      let headers: { "x-publishable-api-key": string }

      // The runner restores the database after every test, so build fixtures
      // fresh each time.
      beforeEach(async () => {
        fixtures = await createStoreFixtures(getContainer())
        headers = { "x-publishable-api-key": fixtures.publishableKey }
      })

      const createCart = async () => {
        const res = await api.post(
          "/store/carts",
          { region_id: fixtures.regionId },
          { headers }
        )
        return res.data.cart.id as string
      }

      const addItem = (cartId: string, variantId: string, quantity: number) =>
        api
          .post(
            `/store/carts/${cartId}/line-items`,
            { variant_id: variantId, quantity },
            { headers }
          )
          .catch((e: { response: { status: number } }) => e.response)

      const cases = [
        {
          kind: "Live Animal",
          variant: () => fixtures.liveAnimalVariantId,
          stock: LIVE_ANIMAL_STOCK,
        },
        {
          kind: "Supply",
          variant: () => fixtures.supplyVariantId,
          stock: SUPPLY_STOCK,
        },
      ]

      describe.each(cases)("$kind", ({ variant, stock }) => {
        it("allows adding exactly Available Stock", async () => {
          const cartId = await createCart()
          const res = await addItem(cartId, variant(), stock)
          expect(res.status).toEqual(200)
        })

        it("rejects adding more than Available Stock", async () => {
          const cartId = await createCart()
          const res = await addItem(cartId, variant(), stock + 1)
          expect(res.status).toEqual(400)
        })

        it("rejects raising a Line Item past Available Stock", async () => {
          const cartId = await createCart()
          const added = await addItem(cartId, variant(), 1)
          expect(added.status).toEqual(200)
          const lineId = added.data.cart.items[0].id

          const res = await api
            .post(
              `/store/carts/${cartId}/line-items/${lineId}`,
              { quantity: stock + 1 },
              { headers }
            )
            .catch((e: { response: { status: number } }) => e.response)
          expect(res.status).toEqual(400)
        })

        it("caps repeated adds of the same Variant at the combined quantity", async () => {
          const cartId = await createCart()
          const first = await addItem(cartId, variant(), stock)
          expect(first.status).toEqual(200)
          const second = await addItem(cartId, variant(), 1)
          expect(second.status).toEqual(400)
        })
      })
    })
  },
})

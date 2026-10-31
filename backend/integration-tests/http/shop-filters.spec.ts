import type { MedusaContainer } from "@medusajs/framework/types"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createProductTagsWorkflow,
  createProductTypesWorkflow,
} from "@medusajs/medusa/core-flows"
import { createStoreSetup } from "../../src/lib/store-setup"

jest.setTimeout(120 * 1000)

// Search and filter (docs/ci-cd-plan.md 3.4 #3): the Store API queries the
// storefront's /shop page sends (docs/site-map.md §3) return the products
// they should. Params are spelled the way the Medusa JS SDK spells them.

type Department = "live-animals" | "feeders"
type Tag = "beginner-friendly" | "advanced" | "arboreal" | "nocturnal"
type AnimalType = "lizard" | "gecko" | "crested-gecko" | "snake"

type Catalogue = {
  publishableKey: string
  typeIds: Record<Department, string>
  tagIds: Record<Tag, string>
  categoryIds: Record<AnimalType, string>
}

const TAGS: Tag[] = ["beginner-friendly", "advanced", "arboreal", "nocturnal"]

async function createCategories(
  container: MedusaContainer,
  categories: { name: string; handle: string; parent?: string }[]
): Promise<Record<string, string>> {
  const { result } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: categories.map(({ name, handle, parent }) => ({
        name,
        handle,
        is_active: true,
        parent_category_id: parent ?? null,
      })),
    },
  })
  return Object.fromEntries(result.map((c) => [c.handle, c.id]))
}

/**
 * Lizard › Gecko › Crested Gecko and Snake, three Live Animals, and two
 * Feeders: one Suitable For Geckos and one for no Animal Type. Everything
 * goes through Medusa workflows, never raw SQL.
 */
async function createCatalogue(
  container: MedusaContainer
): Promise<Catalogue> {
  const setup = await createStoreSetup(container)

  const { result: types } = await createProductTypesWorkflow(container).run({
    input: { product_types: [{ value: "live-animals" }, { value: "feeders" }] },
  })
  const { result: tags } = await createProductTagsWorkflow(container).run({
    input: { product_tags: TAGS.map((value) => ({ value })) },
  })

  // One level at a time, so each parent exists first.
  const top = await createCategories(container, [
    { name: "Lizard", handle: "lizard" },
    { name: "Snake", handle: "snake" },
  ])
  const middle = await createCategories(container, [
    { name: "Gecko", handle: "gecko", parent: top.lizard },
  ])
  const bottom = await createCategories(container, [
    { name: "Crested Gecko", handle: "crested-gecko", parent: middle.gecko },
  ])

  const catalogue: Catalogue = {
    publishableKey: setup.publishableKey,
    typeIds: Object.fromEntries(types.map((t) => [t.value, t.id])) as Record<
      Department,
      string
    >,
    tagIds: Object.fromEntries(tags.map((t) => [t.value, t.id])) as Record<
      Tag,
      string
    >,
    categoryIds: { ...top, ...middle, ...bottom } as Record<AnimalType, string>,
  }

  const product = (
    title: string,
    type: Department,
    animalTypes: AnimalType[],
    productTags: Tag[]
  ) => ({
    title,
    status: "published" as const,
    type_id: catalogue.typeIds[type],
    category_ids: animalTypes.map((a) => catalogue.categoryIds[a]),
    tag_ids: productTags.map((t) => catalogue.tagIds[t]),
    shipping_profile_id:
      type === "live-animals"
        ? setup.liveAnimalsShippingProfileId
        : setup.defaultShippingProfileId,
    sales_channels: [{ id: setup.salesChannelId }],
    options: [{ title: "Default", values: ["Default"] }],
    variants: [
      {
        title: "Default",
        options: { Default: "Default" },
        prices: [{ currency_code: "usd", amount: 10 }],
      },
    ],
  })

  await createProductsWorkflow(container).run({
    input: {
      products: [
        product("Crested Gecko", "live-animals", ["crested-gecko"], [
          "beginner-friendly",
          "arboreal",
        ]),
        product("Tokay Gecko", "live-animals", ["gecko"], [
          "advanced",
          "arboreal",
          "nocturnal",
        ]),
        product("Ball Python", "live-animals", ["snake"], [
          "beginner-friendly",
          "nocturnal",
        ]),
        product("Gecko Diet", "feeders", ["gecko"], []),
        product("Dubia Roaches", "feeders", [], []),
      ],
    },
  })

  return catalogue
}

/** `key[0]=a&key[1]=b`, as the SDK's query encoding spells arrays. */
const list = (key: string, values: string[]): [string, string][] =>
  values.map((value, i) => [`${key}[${i}]`, value])

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    describe("Shop search and filters", () => {
      let catalogue: Catalogue

      // The runner restores the database after every test.
      beforeEach(async () => {
        catalogue = await createCatalogue(getContainer())
      })

      const listProducts = (params: [string, string][]) =>
        api.get(
          `/store/products?${new URLSearchParams([
            ["fields", "title"],
            ...params,
          ])}`,
          { headers: { "x-publishable-api-key": catalogue.publishableKey } }
        )

      const titles = async (params: [string, string][]) => {
        const res = await listProducts(params)
        expect(res.status).toEqual(200)
        return (res.data.products as { title: string }[])
          .map((p) => p.title)
          .sort()
      }

      it("searches by keyword", async () => {
        expect(await titles([["q", "gecko"]])).toEqual([
          "Crested Gecko",
          "Gecko Diet",
          "Tokay Gecko",
        ])
      })

      it("filters by Department", async () => {
        const { feeders } = catalogue.typeIds
        expect(await titles(list("type_id", [feeders]))).toEqual([
          "Dubia Roaches",
          "Gecko Diet",
        ])
      })

      it("filters by an Animal Type and its descendants, Supplies included", async () => {
        const { gecko, "crested-gecko": crested } = catalogue.categoryIds
        expect(await titles(list("category_id", [gecko, crested]))).toEqual([
          "Crested Gecko",
          "Gecko Diet",
          "Tokay Gecko",
        ])
      })

      it("narrows an Animal Type to a Department", async () => {
        const { gecko, "crested-gecko": crested } = catalogue.categoryIds
        expect(
          await titles([
            ...list("type_id", [catalogue.typeIds["live-animals"]]),
            ...list("category_id", [gecko, crested]),
          ])
        ).toEqual(["Crested Gecko", "Tokay Gecko"])
      })

      it("matches any one of several Tags", async () => {
        const { arboreal, nocturnal } = catalogue.tagIds
        expect(await titles(list("tag_id", [arboreal, nocturnal]))).toEqual([
          "Ball Python",
          "Crested Gecko",
          "Tokay Gecko",
        ])
      })

      it("needs the Care Level and any one of the Tags when both are set", async () => {
        const { arboreal, nocturnal } = catalogue.tagIds
        const beginner = catalogue.tagIds["beginner-friendly"]
        expect(
          await titles([
            ...list("$and[0][tag_id]", [beginner]),
            ...list("$and[1][tag_id]", [arboreal, nocturnal]),
          ])
        ).toEqual(["Ball Python", "Crested Gecko"])
      })

      it("sorts by name and counts every match across pages", async () => {
        const res = await listProducts([
          ["order", "title"],
          ["limit", "2"],
          ["offset", "0"],
          ...list("type_id", [catalogue.typeIds["live-animals"]]),
        ])

        const products = res.data.products as { title: string }[]
        expect(products.map((p) => p.title)).toEqual([
          "Ball Python",
          "Crested Gecko",
        ])
        expect(res.data.count).toEqual(3)
      })
    })
  },
})

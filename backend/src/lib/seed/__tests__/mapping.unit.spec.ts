import { toHandle } from "@medusajs/framework/utils"
import { animalTypesByDepth } from "../animal-types"
import {
  applySeedCorrections,
  CatalogueRefs,
  mostSpecificAnimalTypes,
  normalizeTag,
  toProductInput,
  uniqueTags,
  variantsFor,
} from "../mapping"
import { loadProductData, ProductDataEntry } from "../product-data"

const data = loadProductData()
const entry = (id: string): ProductDataEntry => {
  const found = data.find((e) => e.id === id)
  if (!found) throw new Error(`No ProductData.json entry ${id}`)
  return found
}

// Fake ids: these tests only check which ref each Product points at.
const refs: CatalogueRefs = {
  salesChannelId: "sc_1",
  defaultShippingProfileId: "sp_default",
  liveAnimalsShippingProfileId: "sp_live",
  departmentIds: new Map([
    ["live-animals", "type_live"],
    ["feeders", "type_feeders"],
    ["enclosures", "type_enclosures"],
    ["accessories", "type_accessories"],
  ]),
  tagIds: new Map(uniqueTags(data).map((t) => [t, `tag_${t}`])),
  animalTypeIds: new Map(
    animalTypesByDepth()
      .flat()
      .map(({ name }) => [name, `cat_${name}`])
  ),
}

// Examples from docs/domain-model.md §3.
describe("Seed mapping", () => {
  describe("normalizeTag", () => {
    it.each([
      ["UVB", "uvb"],
      ["New-Caledonia", "new-caledonia"],
      ["BSFL", "bsfl"],
      ["nocturnal", "nocturnal"],
    ])("%s → %s", (tag, expected) => {
      expect(normalizeTag(tag)).toEqual(expected)
    })
  })

  it("lists each normalized tag once", () => {
    const entries = [
      { ...entry("la-003"), tags: ["UVB", "uvb", "nocturnal"] },
      { ...entry("la-004"), tags: ["nocturnal"] },
    ]
    expect(uniqueTags(entries)).toEqual(["uvb", "nocturnal"])
  })

  describe("mostSpecificAnimalTypes", () => {
    it("gives a Live Animal its leaf (la-003)", () => {
      expect(
        mostSpecificAnimalTypes(["lizard", "gecko", "crested gecko"])
      ).toEqual(["Crested Gecko"])
    })

    it("gives a Supply each node it suits (a-001)", () => {
      const assigned = mostSpecificAnimalTypes(entry("a-001").animalCategory)
      expect(assigned.sort()).toEqual(
        [
          "Skink",
          "Tegu",
          "Corn Snake",
          "Hognose Snake",
          "Tree Frog",
          "Horned Frog",
          "Axolotl",
        ].sort()
      )
    })

    it("keeps a listed node with no listed children (a-020: all geckos)", () => {
      const assigned = mostSpecificAnimalTypes(entry("a-020").animalCategory)
      expect(assigned).toContain("Gecko")
      expect(assigned).not.toContain("Crested Gecko")
    })

    it("matches names ignoring case", () => {
      expect(
        mostSpecificAnimalTypes(["lizard", "Argentine black and white tegu"])
      ).toEqual(["Argentine Black and White Tegu"])
    })

    it("rejects an unknown name", () => {
      expect(() => mostSpecificAnimalTypes(["dragon"])).toThrow(
        'Unknown Animal Type "dragon"'
      )
    })
  })

  it("corrects la-001's Care Level to intermediate", () => {
    const tags = applySeedCorrections(entry("la-001")).tags
    expect(tags).toContain("intermediate")
    expect(tags).not.toContain("beginner-friendly")
  })

  describe("variantsFor", () => {
    it("gives most Products one Variant with the entry's SKU and stock", () => {
      expect(variantsFor(entry("la-003"))).toEqual([
        {
          title: "Default",
          sku: "la-003",
          options: { Default: "Default" },
          stock: entry("la-003").stock,
        },
      ])
    })

    it("splits e-003 into Black and White Variants with unique SKUs", () => {
      const variants = variantsFor(entry("e-003"))
      expect(variants.map((v) => [v.sku, v.stock])).toEqual([
        ["e-003-black", 4],
        ["e-003-white", 3],
      ])
      expect(variants.reduce((sum, v) => sum + v.stock, 0)).toEqual(
        entry("e-003").stock
      )
    })
  })

  describe("toProductInput", () => {
    it("puts a Live Animal on the Live Animals profile with its care content", () => {
      const input = toProductInput(entry("la-003"), refs)
      expect(input.shipping_profile_id).toEqual("sp_live")
      expect(input.type_id).toEqual("type_live")
      expect(input.category_ids).toEqual(["cat_Crested Gecko"])
      expect(input.metadata).toEqual({
        care_sheet_url: entry("la-003").careSheet,
        video_urls: entry("la-003").video,
      })
    })

    it("puts a Supply on the default profile with no metadata", () => {
      const input = toProductInput(entry("a-001"), refs)
      expect(input.shipping_profile_id).toEqual("sp_default")
      expect(input.metadata).toBeUndefined()
    })

    it("never allows overselling", () => {
      for (const variant of toProductInput(entry("e-003"), refs).variants!) {
        expect(variant.manage_inventory).toBe(true)
        expect(variant.allow_backorder).toBe(false)
      }
    })

    it("gives e-003 a Color option", () => {
      expect(toProductInput(entry("e-003"), refs).options).toEqual([
        { title: "Color", values: ["Black", "White"] },
      ])
    })
  })
})

// Guards on the real data file, so a bad edit fails here instead of halfway
// through a seed.
describe("ProductData.json", () => {
  const corrected = data.map(applySeedCorrections)

  it("uses only Animal Types from the tree", () => {
    for (const e of data) {
      expect(() => mostSpecificAnimalTypes(e.animalCategory)).not.toThrow()
    }
  })

  it("has unique handles", () => {
    const handles = data.map((e) => toHandle(e.name))
    expect(new Set(handles).size).toEqual(handles.length)
  })

  it("has unique SKUs", () => {
    const skus = data.flatMap(variantsFor).map((v) => v.sku)
    expect(new Set(skus).size).toEqual(skus.length)
  })

  it("gives every Live Animal exactly one Care Level (domain-model rule 2)", () => {
    const careLevels = ["beginner-friendly", "intermediate", "advanced"]
    for (const e of corrected.filter((e) => e.category === "live-animals")) {
      const levels = e.tags.filter((t) => careLevels.includes(t))
      expect([e.id, levels.length]).toEqual([e.id, 1])
    }
  })
})

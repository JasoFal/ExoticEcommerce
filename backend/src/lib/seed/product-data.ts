import { readFileSync } from "fs"
import path from "path"

export type Department = "live-animals" | "feeders" | "enclosures" | "accessories"

/** One entry of ProductData.json, the seed catalogue (docs/domain-model.md §3). */
export type ProductDataEntry = {
  id: string
  name: string
  description: string
  category: Department
  animalCategory: string[]
  price: number
  imageUrl: string
  stock: number
  tags: string[]
  // Present on Live Animals only.
  careSheet?: string
  video?: string[]
}

// ProductData.json sits at the repo root, outside the backend package. It's
// read at runtime rather than imported so it stays out of `medusa build`.
const PRODUCT_DATA_PATH = path.resolve(__dirname, "../../../../ProductData.json")

export function loadProductData(): ProductDataEntry[] {
  return JSON.parse(readFileSync(PRODUCT_DATA_PATH, "utf8"))
}

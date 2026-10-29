import { MedusaError } from "@medusajs/framework/utils"

// The Animal Type tree from docs/domain-model.md §2. Keep the two in sync.
// It has to be written out: ProductData.json's flat `animalCategory` lists
// (e.g. a-001's) don't say which node is whose parent.
type AnimalTypeTree = { [name: string]: AnimalTypeTree }

export const ANIMAL_TYPE_TREE: AnimalTypeTree = {
  Lizard: {
    Skink: { "Blue-Tongued Skink": {} },
    Gecko: { "Crested Gecko": {}, "Gargoyle Gecko": {} },
    Tegu: { "Argentine Black and White Tegu": {}, "Red Tegu": {} },
  },
  Snake: {
    Python: { "Ball Python": {} },
    Colubrid: { "Corn Snake": {}, "Hognose Snake": {} },
  },
  Amphibian: {
    Frog: { "Tree Frog": {}, "Horned Frog": {} },
    Salamander: { Axolotl: {} },
  },
  Invertebrate: {
    Arachnid: { Tarantula: {}, Scorpion: {} },
  },
}

export type AnimalType = { name: string; parent: string | null }

/** Every node, grouped by depth: roots first, then their children, and so on. */
export function animalTypesByDepth(): AnimalType[][] {
  const levels: AnimalType[][] = []

  const visit = (tree: AnimalTypeTree, parent: string | null, depth: number) => {
    levels[depth] = levels[depth] ?? []
    for (const [name, children] of Object.entries(tree)) {
      levels[depth].push({ name, parent })
      if (Object.keys(children).length > 0) {
        visit(children, name, depth + 1)
      }
    }
  }

  visit(ANIMAL_TYPE_TREE, null, 0)
  return levels
}

const parentByName = new Map(
  animalTypesByDepth()
    .flat()
    .map((node) => [node.name, node.parent])
)
const nameByLowercase = new Map(
  [...parentByName.keys()].map((name) => [name.toLowerCase(), name])
)

/**
 * The tree's name for a ProductData.json name, matched ignoring case
 * ("Argentine black and white tegu" → "Argentine Black and White Tegu").
 */
export function toAnimalTypeName(dataName: string): string {
  const name = nameByLowercase.get(dataName.toLowerCase())
  if (!name) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Unknown Animal Type "${dataName}". Add it to ANIMAL_TYPE_TREE and docs/domain-model.md §2.`
    )
  }
  return name
}

/** The node's ancestors, nearest first. */
export function ancestorsOf(name: string): string[] {
  const parent = parentByName.get(name) ?? null
  return parent ? [parent, ...ancestorsOf(parent)] : []
}

import type { HttpTypes } from "@medusajs/types";
import { cache } from "react";

import { sdk } from "./client";

/** A node in the Animal Type tree (a Medusa ProductCategory). */
export type AnimalTypeNode = {
  name: string;
  handle: string;
  children: AnimalTypeNode[];
};

/** Staff order Animal Types in Admin; unranked ones go first. */
const byRank = (
  a: HttpTypes.StoreProductCategory,
  b: HttpTypes.StoreProductCategory,
) => (a.rank ?? 0) - (b.rank ?? 0);

function toNode(category: HttpTypes.StoreProductCategory): AnimalTypeNode {
  return {
    name: category.name,
    handle: category.handle,
    children: [...(category.category_children ?? [])]
      .sort(byRank)
      .map(toNode),
  };
}

/**
 * The full Animal Type tree, top-level Animal Types first, in the rank
 * order staff set in Admin. Cached for one request, because the header and
 * the page both need it.
 */
export const getAnimalTypeTree = cache(async (): Promise<AnimalTypeNode[]> => {
  const { product_categories } = await sdk.store.category.list({
    include_descendants_tree: true,
    limit: 1000,
  });

  return product_categories
    .filter((category) => category.parent_category_id === null)
    .sort(byRank)
    .map(toNode);
});

/** Maps every Animal Type handle to the handle of its top-level Animal Type. */
export function animalTypeRoots(tree: AnimalTypeNode[]): Map<string, string> {
  const roots = new Map<string, string>();
  const visit = (node: AnimalTypeNode, root: string) => {
    roots.set(node.handle, root);
    node.children.forEach((child) => visit(child, root));
  };
  tree.forEach((root) => visit(root, root.handle));
  return roots;
}

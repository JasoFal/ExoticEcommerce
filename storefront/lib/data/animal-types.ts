import type { HttpTypes } from "@medusajs/types";
import { cache } from "react";

import { sdk } from "./client";

/** A node in the Animal Type tree (a Medusa ProductCategory). */
export type AnimalTypeNode = {
  id: string;
  name: string;
  handle: string;
  /** Staff write it in Admin. Empty when they haven't. */
  description: string;
  children: AnimalTypeNode[];
};

/** Staff order Animal Types in Admin; unranked ones go first. */
const byRank = (
  a: HttpTypes.StoreProductCategory,
  b: HttpTypes.StoreProductCategory,
) => (a.rank ?? 0) - (b.rank ?? 0);

function toNode(category: HttpTypes.StoreProductCategory): AnimalTypeNode {
  return {
    id: category.id,
    name: category.name,
    handle: category.handle,
    description: category.description ?? "",
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

/**
 * The Animal Types from the top level down to the one with this handle, for
 * a breadcrumb. Empty when no Animal Type has the handle.
 */
export function findAnimalTypePath(
  tree: AnimalTypeNode[],
  handle: string,
): AnimalTypeNode[] {
  for (const node of tree) {
    if (node.handle === handle) return [node];
    const path = findAnimalTypePath(node.children, handle);
    if (path.length > 0) return [node, ...path];
  }
  return [];
}

/**
 * The ids of an Animal Type and everything under it. Medusa's `category_id`
 * filter matches only the ids it's given, and choosing Gecko must also
 * show Crested Geckos (docs/site-map.md §3).
 */
export function descendantIds(node: AnimalTypeNode): string[] {
  return [node.id, ...node.children.flatMap(descendantIds)];
}

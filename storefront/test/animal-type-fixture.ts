import type { AnimalTypeNode } from "../lib/data/animal-types";

/** An Animal Type tree node for component tests. */
export function animalType(
  name: string,
  handle: string,
  children: AnimalTypeNode[] = [],
  description = "",
): AnimalTypeNode {
  return { id: `pcat_${handle}`, name, handle, description, children };
}

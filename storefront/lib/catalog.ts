// Fixed catalogue terms from docs/domain-model.md §1. They're store-wide
// vocabulary, not catalogue data, so they live here instead of being
// fetched from Medusa.

/** A Department, keyed by its Medusa ProductType value. */
export const DEPARTMENTS = [
  { value: "live-animals", label: "Live Animals" },
  { value: "feeders", label: "Feeders" },
  { value: "enclosures", label: "Enclosures" },
  { value: "accessories", label: "Accessories" },
] as const;

export type DepartmentValue = (typeof DEPARTMENTS)[number]["value"];

/** The three reserved Care Level Tags, with the copy the storefront shows. */
export const CARE_LEVELS = [
  {
    value: "beginner-friendly",
    label: "Beginner-friendly",
    pips: 1,
    description: "Hardy and forgiving. A good first animal.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    pips: 2,
    description: "Needs tighter control of heat, humidity, or handling.",
  },
  {
    value: "advanced",
    label: "Advanced",
    pips: 3,
    description: "Large or specialised. Best for experienced keepers.",
  },
] as const;

export type CareLevel = (typeof CARE_LEVELS)[number]["value"];

const CARE_LEVEL_VALUES: readonly string[] = CARE_LEVELS.map((c) => c.value);

function isCareLevel(tag: string): tag is CareLevel {
  return CARE_LEVEL_VALUES.includes(tag);
}

/** The Care Level among a product's Tag values, or null for a Supply. */
export function careLevelOf(tags: readonly string[]): CareLevel | null {
  return tags.find(isCareLevel) ?? null;
}

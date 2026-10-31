import {
  CARE_LEVELS,
  DEPARTMENTS,
  SORTS,
  type CareLevel,
  type DepartmentValue,
  type ShopSort,
} from "./catalog";
import type { ShopParams } from "./shop-href";

/** How many products one Shop page shows. */
export const SHOP_PAGE_SIZE = 24;

/**
 * Most Tags one view filters by. Each Tag is a lookup against Medusa, so a
 * hand-built URL can't fan out into hundreds of requests.
 */
export const MAX_TAGS = 10;

/** A Shop view, read from its URL. Every field is already validated. */
export type ShopQuery = {
  q: string | null;
  departments: DepartmentValue[];
  /** One Animal Type handle. Its descendants are included. */
  animalType: string | null;
  careLevel: CareLevel | null;
  tags: string[];
  sort: ShopSort;
  page: number;
};

/** Next.js `searchParams`: a key appears once per value in the URL. */
export type SearchParams = Record<string, string | string[] | undefined>;

const values = (value: string | string[] | undefined): string[] =>
  [value ?? []].flat().map((v) => v.trim()).filter(Boolean);

const first = (value: string | string[] | undefined): string | null =>
  values(value)[0] ?? null;

const oneOf = <T extends string>(allowed: readonly { value: T }[], value: string | null) =>
  allowed.find((option) => option.value === value)?.value ?? null;

/**
 * Reads the `/shop` URL params (docs/site-map.md §3). Unknown Departments,
 * Care Levels, sorts, and pages are dropped, so a hand-edited URL still
 * shows a sensible view.
 */
export function parseShopParams(params: SearchParams): ShopQuery {
  const departments = values(params.department)
    .map((value) => oneOf(DEPARTMENTS, value))
    .filter((value) => value !== null);
  const page = Number(first(params.page));

  return {
    q: first(params.q),
    departments: [...new Set(departments)],
    animalType: first(params.animal_type),
    careLevel: oneOf(CARE_LEVELS, first(params.care_level)),
    tags: [...new Set(values(params.tag))].slice(0, MAX_TAGS),
    sort: oneOf(SORTS, first(params.sort)) ?? "newest",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/**
 * The URL params for a Shop view, for `shopHref`. The default sort and
 * page 1 are left out, so each view has one URL.
 */
export function toShopParams(query: ShopQuery): ShopParams {
  return {
    q: query.q ?? undefined,
    department: query.departments,
    animal_type: query.animalType ?? undefined,
    care_level: query.careLevel ?? undefined,
    tag: query.tags,
    sort: query.sort === "newest" ? undefined : query.sort,
    page: query.page,
  };
}

/** How many filters are set, not counting the keyword or the sort. */
export function activeFilterCount(query: ShopQuery): number {
  return (
    query.departments.length +
    (query.animalType ? 1 : 0) +
    (query.careLevel ? 1 : 0) +
    query.tags.length
  );
}

/**
 * The `/shop` URL params from docs/site-map.md §3, in that table's order.
 * Every filter lives in the URL, so any Shop view can be linked.
 */
export type ShopParams = {
  q?: string;
  department?: string | string[];
  animal_type?: string | string[];
  care_level?: string;
  tag?: string | string[];
  sort?: string;
  /** 1-based results page. Page 1 is left out of the URL. */
  page?: number;
};

const PARAM_ORDER = [
  "q",
  "department",
  "animal_type",
  "care_level",
  "tag",
  "sort",
  "page",
] as const satisfies readonly (keyof ShopParams)[];

/** Builds a link to the Shop page with the given filters set. */
export function shopHref(params: ShopParams = {}): string {
  const search = new URLSearchParams();

  for (const key of PARAM_ORDER) {
    const values = [params[key] ?? []].flat();
    for (const value of values) {
      if (key === "page" && value === 1) continue;
      if (value) search.append(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `/shop?${query}` : "/shop";
}

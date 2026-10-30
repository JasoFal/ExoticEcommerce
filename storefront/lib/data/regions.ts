import { cache } from "react";

import { sdk } from "./client";

/**
 * The store's one Region (United States, USD, docs/domain-model.md rule 4).
 * Medusa needs it to return calculated prices.
 */
export const getRegion = cache(async () => {
  const { regions } = await sdk.store.region.list({ limit: 1 });
  const [region] = regions;
  if (!region) {
    throw new Error("Medusa has no Region. Run `npm run seed` in backend/.");
  }
  return region;
});

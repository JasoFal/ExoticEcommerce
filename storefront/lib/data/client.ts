import Medusa from "@medusajs/js-sdk";

/**
 * The one Medusa SDK instance. Only modules in `lib/data/` import it; pages
 * and components call those modules instead (CLAUDE.md rule 1).
 *
 * Server-side only: the env vars have no NEXT_PUBLIC_ prefix, because the
 * browser never calls Medusa directly (storefront/.env.example).
 */
export const sdk = new Medusa({
  baseUrl: process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000",
  publishableKey: process.env.MEDUSA_PUBLISHABLE_KEY,
});

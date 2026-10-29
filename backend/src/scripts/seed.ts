import { writeFileSync } from "fs"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { seedCatalogue } from "../lib/seed/catalogue"
import { loadProductData } from "../lib/seed/product-data"
import { createStoreSetup } from "../lib/store-setup"

/**
 * Seeds an empty database with the store and the ProductData.json catalogue.
 * Run with `npm run seed`, or `npm run db:reset` to start from scratch.
 *
 * The publishable key is always logged, so it can be copied into
 * storefront/.env.local. When SEED_PUBLISHABLE_KEY_FILE is set, it is also
 * written to that file, which is how CI hands it to the storefront.
 */
export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // The seed isn't idempotent (handles, SKUs, and tags are unique), so refuse
  // to run twice rather than fail halfway through.
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id"],
  })
  if (regions.length > 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "The database is already seeded. Run `npm run db:reset` to start over."
    )
  }

  logger.info("Creating the store setup...")
  const setup = await createStoreSetup(container)

  logger.info("Loading the ProductData.json catalogue...")
  await seedCatalogue(container, setup, loadProductData())

  logger.info(`Publishable key: ${setup.publishableKey}`)
  const keyFile = process.env.SEED_PUBLISHABLE_KEY_FILE
  if (keyFile) {
    writeFileSync(keyFile, setup.publishableKey)
  }

  logger.info("Seed complete.")
}

/**
 * Where Medusa's File module serves uploads (its local provider in
 * development). next.config.ts allows only these in the image optimizer.
 * Same default backend URL as the SDK client (client.ts).
 */
export const MEDUSA_FILES_URL = new URL(
  "/static/",
  process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000",
);

/**
 * The URL if it's a file Medusa serves, else null. Anything else (like the
 * Wikimedia links in a database seeded before #37) would make `next/image`
 * throw in development, so the card shows its silhouette instead.
 */
export function medusaFileUrl(url: string | null | undefined): string | null {
  return url?.startsWith(MEDUSA_FILES_URL.href) ? url : null;
}

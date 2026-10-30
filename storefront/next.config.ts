import type { NextConfig } from "next";

// Same default as the SDK client (lib/data/client.ts).
const medusaUrl = new URL(process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000");

const nextConfig: NextConfig = {
  images: {
    // Product images are files Medusa serves (its File module). The
    // optimizer fetches them server-side and the browser loads them from the
    // storefront, because the browser never calls Medusa directly
    // (docs/local-infrastructure.md §7). Add the S3 host here once
    // production file storage is decided.
    remotePatterns: [new URL("/static/**", medusaUrl)],
    // Next refuses to fetch from local addresses by default. In development
    // Medusa is on localhost; remotePatterns still limits this to its files.
    dangerouslyAllowLocalIP: ["localhost", "127.0.0.1"].includes(medusaUrl.hostname),
  },
};

export default nextConfig;

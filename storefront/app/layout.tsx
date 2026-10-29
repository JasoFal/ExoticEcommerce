import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reptile Store",
  description: "Live reptiles, feeders, enclosures, and accessories.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {/* TEMP: route scaffold. Stands in for SiteHeader (docs/site-map.md §2). */}
        <nav aria-label="Temporary">
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/shop">Shop</Link>
            </li>
            <li>
              <Link href="/care-guides">Care Guides</Link>
            </li>
            <li>
              <Link href="/cart">Cart</Link>
            </li>
          </ul>
        </nav>
        {children}
      </body>
    </html>
  );
}

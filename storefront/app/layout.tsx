import "ply-css/dist/css/ply.min.css";
import "./theme.css";

import type { Metadata } from "next";

import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { getAnimalTypeTree } from "../lib/data/animal-types";
import { getCartItemCount } from "../lib/data/cart";
import { bodyFont, headingFont } from "./fonts";

export const metadata: Metadata = {
  title: "Reptile Store",
  description: "Live reptiles, feeders, enclosures, and accessories.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [tree, cartCount] = await Promise.all([getAnimalTypeTree(), getCartItemCount()]);

  // No data-theme on <html>: it would turn off automatic dark mode
  // (design-plan §3.3).
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>
        <SiteHeader tree={tree} cartCount={cartCount} />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

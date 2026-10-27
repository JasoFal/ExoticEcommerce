import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reptile Store",
  description: "Live reptiles, feeders, enclosures, and accessories.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

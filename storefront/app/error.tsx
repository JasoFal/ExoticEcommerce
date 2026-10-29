"use client"; // Error boundaries must be client components.

import Link from "next/link";

export default function ErrorPage() {
  return (
    <main>
      <h1>Something went wrong</h1>
      {/* TEMP: route scaffold */}
      <Link href="/shop">Back to the shop</Link>
    </main>
  );
}

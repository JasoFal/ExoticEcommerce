import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      {/* TEMP: route scaffold */}
      <Link href="/shop">Back to the shop</Link>
    </main>
  );
}

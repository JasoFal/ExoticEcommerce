import Link from "next/link";

export default function ProductDetail() {
  return (
    <main>
      <h1>Product detail</h1>
      {/* TEMP: route scaffold */}
      <ul>
        <li>
          <Link href="/cart">Add to Cart</Link>
        </li>
        <li>
          <Link href="/shop?animal_type=lizard&department=feeders,enclosures,accessories">
            Shop supplies for this Animal Type
          </Link>
        </li>
      </ul>
    </main>
  );
}

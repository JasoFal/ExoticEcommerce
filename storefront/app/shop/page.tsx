import Link from "next/link";

export default function Shop() {
  return (
    <div className="units-container">
      <h1>Shop</h1>
      {/* TEMP: route scaffold */}
      <ul>
        <li>
          <Link href="/products/example">Product</Link>
        </li>
      </ul>
    </div>
  );
}

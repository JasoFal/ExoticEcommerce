import Link from "next/link";

export default function Cart() {
  return (
    <main>
      <h1>Cart</h1>
      {/* TEMP: route scaffold */}
      <ul>
        <li>
          <Link href="/checkout">Checkout</Link>
        </li>
      </ul>
    </main>
  );
}

import Link from "next/link";

export default function Checkout() {
  return (
    <main>
      <h1>Checkout</h1>
      {/* TEMP: route scaffold */}
      <ul>
        <li>
          <Link href="/order/example/confirmed">Place order</Link>
        </li>
      </ul>
    </main>
  );
}

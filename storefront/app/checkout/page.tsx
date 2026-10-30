import Link from "next/link";

export default function Checkout() {
  return (
    <div className="units-container">
      <h1>Checkout</h1>
      {/* TEMP: route scaffold */}
      <ul>
        <li>
          <Link href="/order/example/confirmed">Place order</Link>
        </li>
      </ul>
    </div>
  );
}

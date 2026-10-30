import Link from "next/link";

export default function CareGuides() {
  return (
    <div className="units-container">
      <h1>Care Guides</h1>
      {/* TEMP: route scaffold */}
      <ul>
        <li>
          <Link href="/products/example">Live Animal</Link>
        </li>
      </ul>
    </div>
  );
}

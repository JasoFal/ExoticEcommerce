import Link from "next/link";

import { shopHref } from "../../../lib/shop-href";

export default function ProductDetail() {
  return (
    <div className="units-container">
      <h1>Product detail</h1>
      {/* TEMP: route scaffold */}
      <ul>
        <li>
          <Link href="/cart">Add to Cart</Link>
        </li>
        <li>
          <Link
            href={shopHref({
              animal_type: "lizard",
              department: ["feeders", "enclosures", "accessories"],
            })}
          >
            Shop supplies for this Animal Type
          </Link>
        </li>
      </ul>
    </div>
  );
}

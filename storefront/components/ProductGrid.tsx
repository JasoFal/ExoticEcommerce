import { ProductCard } from "./ProductCard";
import type { ProductSummary } from "../lib/data/products";

/**
 * Product cards in a ply row. Container queries size the columns by the
 * space the grid gets, so the same grid fits Home's full width and Shop's
 * results column: 4 across, then 2 once the container is ≤ 767px.
 * The row renders its own unit-* wrappers (design-plan §2.3).
 */
export function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    <div className="container-query">
      <ul className="units-row flat-list no-margin" role="list">
        {products.map((product) => (
          <li key={product.id} className="unit-25 container-tablet-unit-50">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}

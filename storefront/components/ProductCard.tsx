import Link from "next/link";

import type { ProductSummary } from "../lib/data/products";
import { CareLevelBadge } from "./CareLevelBadge";
import { Price } from "./Price";
import { ProductImage } from "./ProductImage";
import { StockBadge } from "./StockBadge";
import styles from "../component-css/ProductCard.module.css";

/**
 * One product in a grid: a single link with no buttons inside. Add to Cart
 * lives on the product page (design-plan §4).
 */
export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link href={`/products/${product.handle}`} className={styles.card}>
      <ProductImage
        src={product.thumbnail}
        alt={product.title}
        fallbackIcon={product.silhouette}
        fallbackLabel={product.title}
      />
      <div className={styles.body}>
        <h3 className={styles.title}>{product.title}</h3>
        {product.price && (
          <Price
            amount={product.price.amount}
            currencyCode={product.price.currencyCode}
            className={styles.price}
          />
        )}
        {(product.careLevel || product.soldOut) && (
          <div className={styles.badges}>
            {product.careLevel && <CareLevelBadge level={product.careLevel} />}
            <StockBadge soldOut={product.soldOut} />
          </div>
        )}
      </div>
    </Link>
  );
}

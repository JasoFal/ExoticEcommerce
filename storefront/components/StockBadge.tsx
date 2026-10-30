import styles from "./StockBadge.module.css";

type StockBadgeProps = {
  soldOut: boolean;
  /** The product page also says "In stock"; cards stay quiet. */
  showInStock?: boolean;
};

/** Availability in words. Never shows a count. */
export function StockBadge({ soldOut, showInStock = false }: StockBadgeProps) {
  if (soldOut) return <span className={styles.badge}>Sold out</span>;
  if (showInStock) return <span className={styles.inStock}>In stock</span>;
  return null;
}

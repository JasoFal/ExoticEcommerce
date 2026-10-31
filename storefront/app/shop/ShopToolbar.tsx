import type { ShopQuery } from "../../lib/shop-params";
import { resultCount } from "./shop-copy";
import { SortSelect } from "./SortSelect";
import styles from "../../component-css/ShopToolbar.module.css";

type ShopToolbarProps = {
  query: ShopQuery;
  /** Products on this page. */
  shown: number;
  /** Products matching the view, across every page. */
  count: number;
};

/** The result count, announced when it changes, and the sort order. */
export function ShopToolbar({ query, shown, count }: ShopToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <p role="status" className={styles.count}>
        {resultCount(query.page, shown, count)}
      </p>
      {count > 0 && <SortSelect query={query} />}
    </div>
  );
}

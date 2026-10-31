import Link from "next/link";

import { shopHref } from "../../lib/shop-href";
import { SHOP_PAGE_SIZE, toShopParams, type ShopQuery } from "../../lib/shop-params";
import { pageItems } from "./page-items";
import styles from "../../component-css/Pagination.module.css";

/** Numbered pages under the results. Hidden when everything fits on one. */
export function Pagination({ query, count }: { query: ShopQuery; count: number }) {
  const total = Math.ceil(count / SHOP_PAGE_SIZE);
  if (total <= 1) return null;

  const href = (page: number) => shopHref(toShopParams({ ...query, page }));
  const hasPrevious = query.page > 1;
  const hasNext = query.page < total;

  return (
    <nav aria-label="Pagination" className={styles.nav}>
      <ul className={`pagination ${styles.list}`}>
        <li className={hasPrevious ? undefined : "disabled"}>
          {hasPrevious ? (
            <Link href={href(query.page - 1)} rel="prev">
              <span aria-hidden="true">‹</span> <span className={styles.step}>Previous</span>
            </Link>
          ) : (
            <span aria-disabled="true">
              <span aria-hidden="true">‹</span> <span className={styles.step}>Previous</span>
            </span>
          )}
        </li>
        {pageItems(query.page, total).map((item, i) =>
          item === "gap" ? (
            <li key={`gap-${i}`} className={styles.gap} aria-hidden="true">
              <span>…</span>
            </li>
          ) : (
            <li key={item} className={item === query.page ? "active" : undefined}>
              <Link
                href={href(item)}
                aria-label={`Page ${item}`}
                aria-current={item === query.page ? "page" : undefined}
              >
                {item}
              </Link>
            </li>
          ),
        )}
        <li className={hasNext ? undefined : "disabled"}>
          {hasNext ? (
            <Link href={href(query.page + 1)} rel="next">
              <span className={styles.step}>Next</span> <span aria-hidden="true">›</span>
            </Link>
          ) : (
            <span aria-disabled="true">
              <span className={styles.step}>Next</span> <span aria-hidden="true">›</span>
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}

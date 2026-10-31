"use client";

import { useRouter } from "next/navigation";
import { useId, useOptimistic, useTransition } from "react";

import { SORTS, type ShopSort } from "../../lib/catalog";
import { shopHref } from "../../lib/shop-href";
import { toShopParams, type ShopQuery } from "../../lib/shop-params";
import { HiddenParams } from "./HiddenParams";
import styles from "../../component-css/ShopToolbar.module.css";

/**
 * The sort `<select>`. Choosing an order goes back to page 1. Without
 * JavaScript it's a GET form with a Sort button.
 */
export function SortSelect({ query }: { query: ShopQuery }) {
  const router = useRouter();
  const id = useId();
  const [sort, setSort] = useOptimistic(query.sort);
  const [, startTransition] = useTransition();

  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as ShopSort;
    startTransition(() => {
      setSort(next);
      router.push(shopHref(toShopParams({ ...query, sort: next, page: 1 })), { scroll: false });
    });
  };

  return (
    <form action="/shop" className={styles.sort}>
      <HiddenParams params={{ ...toShopParams(query), sort: undefined, page: undefined }} />
      <label htmlFor={id}>Sort by</label>
      <select id={id} name="sort" value={sort} onChange={onChange} className={styles.select}>
        {SORTS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="btn btn-outline">
          Sort
        </button>
      </noscript>
    </form>
  );
}

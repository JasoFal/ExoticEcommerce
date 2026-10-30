import { useId } from "react";

import { DEPARTMENTS } from "../lib/catalog";
import { Icon } from "./Icon";
import styles from "./SearchForm.module.css";

/**
 * The header search. A plain GET form to /shop, so it works without
 * JavaScript; the Department select adds `department` to the keyword `q`
 * (docs/site-map.md §3).
 */
export function SearchForm() {
  const id = useId();

  return (
    <form role="search" action="/shop" className={styles.form}>
      {/* Labels sit outside .input-groups: ply styles its children by position. */}
      <label htmlFor={`${id}-department`} className="sr-only">
        Search in
      </label>
      <label htmlFor={`${id}-q`} className="sr-only">
        Search products
      </label>
      <div className={`input-groups ${styles.group}`}>
        <select id={`${id}-department`} name="department" className={styles.department}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map((department) => (
            <option key={department.value} value={department.value}>
              {department.label}
            </option>
          ))}
        </select>
        <input
          id={`${id}-q`}
          type="search"
          name="q"
          placeholder="Search animals and supplies, like “crested gecko”"
          className={styles.query}
        />
        <span className="btn-append">
          <button type="submit" className={`btn btn-primary ${styles.button}`}>
            <Icon name="search" />
            <span className={styles.buttonText}>Search</span>
          </button>
        </span>
      </div>
    </form>
  );
}

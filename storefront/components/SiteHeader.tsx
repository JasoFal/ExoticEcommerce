import Link from "next/link";

import { DEPARTMENTS } from "../lib/catalog";
import type { AnimalTypeNode } from "../lib/data/animal-types";
import { shopHref } from "../lib/shop-href";
import { CatalogNav } from "./CatalogNav";
import { Icon } from "./Icon";
import { SearchForm } from "./SearchForm";
import styles from "../component-css/SiteHeader.module.css";

type SiteHeaderProps = {
  tree: AnimalTypeNode[];
  /** Units in the guest's Medusa cart. */
  cartCount: number;
};

function cartLabel(count: number) {
  if (count === 0) return undefined;
  return `Cart, ${count} ${count === 1 ? "item" : "items"}`;
}

/**
 * The global header (design-plan §4): a utility bar, the logo + search +
 * Care Guides + cart row, and the brand bar with the catalogue menu and the
 * Departments. Not sticky.
 */
export function SiteHeader({ tree, cartCount }: SiteHeaderProps) {
  return (
    <header className={styles.header}>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <div className={`hide-on-mobile ${styles.utility}`}>
        <div className={`units-container ${styles.utilityRow}`}>
          <p className={styles.notice}>
            [PLACEHOLDER: Live Animal shipping message — needs human decision]
          </p>
          <ul className={styles.utilityLinks}>
            <li>
              <Link href="/care-guides">Care Guides</Link>
            </li>
            <li>
              <Link href="/care-guides">New to reptiles? Start here</Link>
            </li>
          </ul>
        </div>
      </div>

      <div>
        <div className={`units-container ${styles.mainRow}`}>
          <div className={`hide-on-desktop ${styles.menu}`}>
            <CatalogNav tree={tree} variant="mobile" />
          </div>

          <Link href="/" className={styles.logo}>
            <span className={styles.logoMark}>
              <Icon name="lizard" />
            </span>
            <span>
              <span className={styles.logoName}>Reptile Store</span>
              <span className={styles.logoTagline}>
                Reptiles · Amphibians · Invertebrates
              </span>
            </span>
          </Link>

          <div className={styles.search}>
            <SearchForm />
          </div>

          <ul className={styles.iconLinks}>
            <li>
              <Link href="/care-guides" className={styles.iconLink}>
                <Icon name="book" />
                <span className={styles.iconLabel}>Care Guides</span>
              </Link>
            </li>
            <li>
              <Link href="/cart" className={styles.iconLink} aria-label={cartLabel(cartCount)}>
                <span className={styles.cartIcon}>
                  <Icon name="cart" />
                  {cartCount > 0 && (
                    <span className={`badge ${styles.count}`}>{cartCount}</span>
                  )}
                </span>
                <span className={styles.iconLabel}>Cart</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <nav aria-label="Catalogue" className={styles.bar}>
        <div className={`units-container ${styles.barRow}`}>
          <div className="hide-on-mobile">
            <CatalogNav tree={tree} variant="desktop" />
          </div>
          <ul className={styles.barLinks}>
            <li>
              <Link href={shopHref()} className={styles.browseAll}>
                Browse all products
              </Link>
            </li>
            {DEPARTMENTS.map((department, index) => (
              <li key={department.value} className={index === 0 ? styles.divided : undefined}>
                <Link href={shopHref({ department: department.value })}>{department.label}</Link>
              </li>
            ))}
            <li className={styles.divided}>
              <Link href={shopHref({ care_level: "beginner-friendly" })}>Beginner-friendly</Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}

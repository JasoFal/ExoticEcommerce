import Link from "next/link";

import { DEPARTMENTS } from "../lib/catalog";
import { shopHref } from "../lib/shop-href";
import styles from "./SiteFooter.module.css";

/**
 * The global footer (design-plan §4): store information plus links to the
 * Departments and the Care pages. No newsletter or social links.
 */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className="units-container">
        <div className="units-row">
          <div className="unit-40 tablet-unit-100">
            <p className={styles.name}>Reptile Store</p>
            <p className={styles.about}>
              Live reptiles, amphibians, and invertebrates, plus the supplies to keep them.
            </p>
            <p className={styles.about}>
              [PLACEHOLDER: store address, hours, and contact details — needs human decision]
            </p>
          </div>

          <nav aria-labelledby="footer-departments" className="unit-30 tablet-unit-50">
            <h2 id="footer-departments" className={styles.heading}>
              Departments
            </h2>
            <ul className={styles.links}>
              {DEPARTMENTS.map((department) => (
                <li key={department.value}>
                  <Link href={shopHref({ department: department.value })}>{department.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-care" className="unit-30 tablet-unit-50">
            <h2 id="footer-care" className={styles.heading}>
              Care
            </h2>
            <ul className={styles.links}>
              <li>
                <Link href="/care-guides">Care Guides</Link>
              </li>
              <li>
                <Link href={shopHref({ care_level: "beginner-friendly" })}>
                  Beginner-friendly animals
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <p className={styles.legal}>© {new Date().getFullYear()} Reptile Store</p>
      </div>
    </footer>
  );
}

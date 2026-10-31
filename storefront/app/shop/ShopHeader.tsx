import Link from "next/link";

import type { AnimalTypeNode } from "../../lib/data/animal-types";
import { shopHref } from "../../lib/shop-href";
import { toShopParams, type ShopQuery } from "../../lib/shop-params";
import { shopHeading } from "./shop-copy";
import styles from "../../component-css/ShopHeader.module.css";

type ShopHeaderProps = {
  query: ShopQuery;
  /** From the top-level Animal Type down to the chosen one. */
  path: AnimalTypeNode[];
};

/**
 * Says what the view is. With an Animal Type chosen it adds a breadcrumb,
 * the Animal Type's intro from Admin, and chips to narrow to its children.
 * Those links swap the Animal Type and keep the other filters.
 */
export function ShopHeader({ query, path }: ShopHeaderProps) {
  const animalType = path.at(-1);
  const withAnimalType = (handle: string | null) =>
    shopHref(toShopParams({ ...query, animalType: handle, page: 1 }));

  return (
    <header className={styles.header}>
      {animalType && (
        <nav aria-label="Breadcrumb" className={`breadcrumbs ${styles.crumbs}`}>
          <ul>
            <li>
              <Link href={withAnimalType(null)}>Shop</Link>
            </li>
            {path.slice(0, -1).map((node) => (
              <li key={node.handle}>
                <Link href={withAnimalType(node.handle)}>{node.name}</Link>
              </li>
            ))}
            <li>
              <span aria-current="page">{animalType.name}</span>
            </li>
          </ul>
        </nav>
      )}

      <h1 className={styles.heading}>{shopHeading(query, path)}</h1>
      {animalType?.description && <p className={styles.intro}>{animalType.description}</p>}

      {animalType && animalType.children.length > 0 && (
        <nav aria-labelledby="narrow-heading" className={styles.narrow}>
          <h2 id="narrow-heading" className={styles.narrowHeading}>
            Narrow to
          </h2>
          <ul className={styles.chips} role="list">
            {animalType.children.map((child) => (
              <li key={child.handle}>
                <Link href={withAnimalType(child.handle)} className={styles.chip}>
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

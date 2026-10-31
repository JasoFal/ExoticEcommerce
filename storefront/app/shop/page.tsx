import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "../../components/EmptyState";
import { ProductGrid } from "../../components/ProductGrid";
import { findAnimalTypePath, getAnimalTypeTree } from "../../lib/data/animal-types";
import { listProducts } from "../../lib/data/products";
import { shopHref } from "../../lib/shop-href";
import {
  activeFilterCount,
  parseShopParams,
  toShopParams,
  type ShopQuery,
} from "../../lib/shop-params";
import { ActiveFilters } from "./ActiveFilters";
import { FilterPanel } from "./FilterPanel";
import { Pagination } from "./Pagination";
import { ShopHeader } from "./ShopHeader";
import { ShopToolbar } from "./ShopToolbar";
import { shopHeading } from "./shop-copy";
import styles from "./page.module.css";

/** The view in the URL, and the Animal Type path it names. */
async function readView(searchParams: PageProps<"/shop">["searchParams"]) {
  const query = parseShopParams(await searchParams);
  const tree = await getAnimalTypeTree();
  const path = query.animalType ? findAnimalTypePath(tree, query.animalType) : [];
  return { query, tree, path };
}

export async function generateMetadata({ searchParams }: PageProps<"/shop">): Promise<Metadata> {
  const { query, path } = await readView(searchParams);
  return { title: `${shopHeading(query, path)} | Reptile Store` };
}

/**
 * The one listing page for browsing and search (docs/site-map.md §3).
 * Everything it shows comes from the URL, so every view can be linked.
 */
export default async function Shop({ searchParams }: PageProps<"/shop">) {
  const { query, tree, path } = await readView(searchParams);
  const { products, count } = await listProducts(query);

  return (
    <div className="units-container">
      <ShopHeader query={query} path={path} />

      <div className={`units-row ${styles.layout}`}>
        <div className="unit-25 tablet-unit-100">
          <FilterPanel query={query} tree={tree} count={count} />
        </div>

        <section className="unit-75 tablet-unit-100" aria-labelledby="results-heading">
          <h2 id="results-heading" className="sr-only">
            Products
          </h2>
          <ActiveFilters query={query} path={path} />
          <ShopToolbar query={query} shown={products.length} count={count} />
          {products.length > 0 ? (
            <>
              <ProductGrid products={products} />
              <Pagination query={query} count={count} />
            </>
          ) : (
            <NoResults query={query} count={count} />
          )}
        </section>
      </div>
    </div>
  );
}

/** Why the grid is empty, and a way out. */
function NoResults({ query, count }: { query: ShopQuery; count: number }) {
  const sort = toShopParams(query).sort;

  // A page number past the end, from an old link or a hand-edited URL.
  if (count > 0) {
    return (
      <EmptyState
        headingLevel={3}
        title="There are no products on this page"
        message="The results have fewer pages than this link expects."
        actions={
          <Link href={shopHref(toShopParams({ ...query, page: 1 }))} className="btn btn-primary">
            Go to page 1
          </Link>
        }
      />
    );
  }

  if (activeFilterCount(query) > 0) {
    return (
      <EmptyState
        headingLevel={3}
        title="No products match these filters"
        message="Try removing a filter above, or clear them all to start over."
        actions={
          <>
            <Link href={shopHref({ q: query.q ?? undefined, sort })} className="btn btn-primary">
              Clear filters
            </Link>
            {query.q && (
              <Link href={shopHref()} className="btn btn-outline">
                Browse all products
              </Link>
            )}
          </>
        }
      />
    );
  }

  if (query.q) {
    return (
      <EmptyState
        headingLevel={3}
        title={`No products match “${query.q}”`}
        message="Check the spelling, or try a broader word like “gecko” or “substrate”."
        actions={
          <Link href={shopHref()} className="btn btn-primary">
            Browse all products
          </Link>
        }
      />
    );
  }

  return (
    <EmptyState
      headingLevel={3}
      title="No products yet"
      message="Nothing is listed right now, so please check back later."
    />
  );
}

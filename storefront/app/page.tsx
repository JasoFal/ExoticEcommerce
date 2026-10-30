import Link from "next/link";

import { CareLevelGuide } from "../components/CareLevelGuide";
import { ProductGrid } from "../components/ProductGrid";
import { TileGrid } from "../components/TileGrid";
import { listBeginnerPicks } from "../lib/data/products";
import { shopHref } from "../lib/shop-href";
import { homeTiles } from "./home-tiles";
import styles from "./page.module.css";

export default async function Home() {
  const picks = await listBeginnerPicks();

  return (
    <div className="units-container">
      <section className={`units-row ${styles.intro}`} aria-labelledby="home-heading">
        <div className="unit-60 tablet-unit-100">
          <h1 id="home-heading" className={styles.heading}>
            Reptiles, amphibians, and invertebrates, with the feeders, enclosures, and gear to keep
            them.
          </h1>
          <p className={styles.lead}>
            Every Live Animal is listed with its Care Level and a care sheet, so you can check it
            suits you before you buy.
          </p>
        </div>
        <div className="unit-35 tablet-unit-100">
          <CareLevelGuide />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="shop-heading">
        <h2 id="shop-heading">Shop animals and supplies</h2>
        <TileGrid tiles={homeTiles()} />
      </section>

      {/* Hidden, heading and all, when no beginner-friendly animal is in stock. */}
      {picks.length > 0 && (
        <section className={styles.section} aria-labelledby="picks-heading">
          <div className={styles.sectionHeader}>
            <h2 id="picks-heading">Beginner-friendly picks</h2>
            <Link href={shopHref({ care_level: "beginner-friendly" })}>
              See all beginner-friendly animals
            </Link>
          </div>
          <ProductGrid products={picks} />
        </section>
      )}
    </div>
  );
}

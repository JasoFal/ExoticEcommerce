import Link from "next/link";

import { Icon, type IconName } from "./Icon";
import { ProductImage } from "./ProductImage";
import styles from "./ShopTile.module.css";

export type ShopTileProps = {
  title: string;
  subtitle: string;
  href: string;
  /** A decorative photo, or null to show the icon on a flat panel. */
  image: string | null;
  icon: IconName;
};

/** A linked tile into a filtered Shop view: photo, title, one-line subtitle. */
export function ShopTile({ title, subtitle, href, image, icon }: ShopTileProps) {
  return (
    <Link href={href} className={styles.tile}>
      <ProductImage
        src={image}
        alt=""
        fallbackIcon={icon}
        ratio="3:2"
        sizes="(max-width: 767px) 50vw, 300px"
      />
      <span className={styles.body}>
        <span>
          <span className={styles.title}>{title}</span>
          <span className={styles.subtitle}>{subtitle}</span>
        </span>
        <Icon name="arrow-right" className={styles.arrow} />
      </span>
    </Link>
  );
}

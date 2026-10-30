"use client";

import Image from "next/image";
import { useState } from "react";

import { Icon, type IconName } from "./Icon";
import styles from "../component-css/ProductImage.module.css";

type ProductImageProps = {
  src: string | null;
  /** The product title, or "" when the image is decorative (Home tiles). */
  alt: string;
  /** The silhouette shown when there's no image or it fails to load. */
  fallbackIcon: IconName;
  fallbackLabel?: string;
  ratio?: "4:3" | "3:2";
  /** Rendered sizes, so the browser picks a sensible download. */
  sizes?: string;
};

/**
 * A product image at a fixed ratio, falling back to a flat panel with a
 * silhouette (design-plan §6.6). Client-side only so it can catch a failed
 * load, such as an image staff removed in Medusa Admin.
 */
export function ProductImage({
  src,
  alt,
  fallbackIcon,
  fallbackLabel,
  ratio = "4:3",
  sizes = "(max-width: 767px) 50vw, 25vw",
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const ratioClass = ratio === "3:2" ? styles.ratio32 : styles.ratio43;

  return (
    <div className={`${styles.frame} ${ratioClass}`}>
      {src && !failed ? (
        // Served through the optimizer, so the browser never calls Medusa
        // directly. Allowed hosts are in next.config.ts.
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={styles.image}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={styles.fallback}>
          <Icon name={fallbackIcon} className={styles.fallbackIcon} />
          {fallbackLabel && <span className={styles.fallbackLabel}>{fallbackLabel}</span>}
        </div>
      )}
    </div>
  );
}

import { CARE_LEVELS, type CareLevel } from "../lib/catalog";
import styles from "./CareLevelBadge.module.css";

type CareLevelBadgeProps = {
  level: CareLevel;
  /** "lg" on the product page and Care Guides, where it's shown prominently. */
  size?: "md" | "lg";
};

/** A Live Animal's Care Level, named in words plus a pip marker. */
export function CareLevelBadge({ level, size = "md" }: CareLevelBadgeProps) {
  const { label, pips } = CARE_LEVELS.find((c) => c.value === level)!;
  const classes = [styles.badge, styles[level], size === "lg" && styles.lg]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      <span className={styles.pips} aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={styles.pip} data-pip={n <= pips ? "filled" : "empty"} />
        ))}
      </span>
      {label}
    </span>
  );
}

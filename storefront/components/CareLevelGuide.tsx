import { CARE_LEVELS } from "../lib/catalog";
import { CareLevelBadge } from "./CareLevelBadge";
import styles from "./CareLevelGuide.module.css";

/** "Care Levels, at a glance": each Care Level's badge and what it means. */
export function CareLevelGuide({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const Heading = `h${headingLevel}` as const;

  return (
    <section className={styles.guide} aria-labelledby="care-level-guide">
      <Heading id="care-level-guide" className={styles.heading}>
        Care Levels, at a glance
      </Heading>
      <ul className={styles.list}>
        {CARE_LEVELS.map((level) => (
          <li key={level.value}>
            <CareLevelBadge level={level.value} />
            <span className={styles.description}>{level.description}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

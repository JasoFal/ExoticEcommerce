import type { ReactNode } from "react";

import { Icon } from "./Icon";
import styles from "../component-css/EmptyState.module.css";

type EmptyStateProps = {
  title: string;
  message: string;
  /** Matches the heading outline of the page around it. */
  headingLevel?: 2 | 3;
  /** Links that get the customer moving again. */
  actions?: ReactNode;
};

/** What a list shows when it has nothing in it (design-plan §5). */
export function EmptyState({ title, message, headingLevel = 2, actions }: EmptyStateProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <div className={styles.empty}>
      <span className={styles.icon}>
        <Icon name="search" />
      </span>
      <Heading className={styles.title}>{title}</Heading>
      <p className={styles.message}>{message}</p>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

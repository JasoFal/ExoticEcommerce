"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { DEPARTMENTS } from "../lib/catalog";
import type { AnimalTypeNode } from "../lib/data/animal-types";
import { shopHref } from "../lib/shop-href";
import { Icon } from "./Icon";
import styles from "./CatalogNav.module.css";

type CatalogNavProps = {
  tree: AnimalTypeNode[];
  /**
   * "desktop": the "All Animal Types" button in the nav bar, opening a panel
   * with the Animal Type tree. "mobile": the menu button, opening an
   * accordion with the Departments, the tree, and Care Guides.
   */
  variant: "desktop" | "mobile";
};

/** "All geckos". Every name in the tree pluralises with a trailing "s". */
const allOf = (node: AnimalTypeNode) => `All ${node.name.toLowerCase()}s`;

/**
 * The catalogue menu (design-plan §6.1). Opens on click, Enter, or Space,
 * never on hover. Escape, a click outside, focus leaving, or following a
 * link closes it.
 */
export function CatalogNav({ tree, variant }: CatalogNavProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const onBlur = (event: React.FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (next && !rootRef.current?.contains(next)) setOpen(false);
  };

  // Links close the menu: the header stays mounted across navigations.
  const onClick = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  };

  const mobile = variant === "mobile";

  return (
    <div ref={rootRef} className={styles.root} onBlur={onBlur}>
      <button
        ref={toggleRef}
        type="button"
        className={mobile ? styles.menuButton : styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={mobile ? "Menu" : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={mobile && open ? "close" : "menu"} />
        {!mobile && (
          <>
            All Animal Types
            <Icon name="chevron" className={open ? styles.chevronOpen : styles.chevron} />
          </>
        )}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className={mobile ? styles.accordion : styles.panel}
        onClick={onClick}
      >
        {mobile ? <MobileTree tree={tree} /> : <DesktopTree tree={tree} />}
      </div>
    </div>
  );
}

function DesktopTree({ tree }: { tree: AnimalTypeNode[] }) {
  return (
    <div className={`units-container ${styles.columns}`}>
      {tree.map((root) => (
        <div key={root.handle} className={styles.column}>
          <Link href={shopHref({ animal_type: root.handle })} className={styles.columnHeading}>
            {root.name}
          </Link>
          <NestedLinks nodes={root.children} />
        </div>
      ))}
    </div>
  );
}

function NestedLinks({ nodes }: { nodes: AnimalTypeNode[] }) {
  if (nodes.length === 0) return null;
  return (
    <ul className={styles.links}>
      {nodes.map((node) => (
        <li key={node.handle}>
          <Link href={shopHref({ animal_type: node.handle })}>{node.name}</Link>
          <NestedLinks nodes={node.children} />
        </li>
      ))}
    </ul>
  );
}

function MobileTree({ tree }: { tree: AnimalTypeNode[] }) {
  return (
    <ul className={styles.accordionList}>
      <li>
        <details>
          <summary>Departments</summary>
          <ul className={styles.accordionList}>
            {DEPARTMENTS.map((department) => (
              <li key={department.value}>
                <Link href={shopHref({ department: department.value })}>{department.label}</Link>
              </li>
            ))}
            <li>
              <Link href={shopHref()}>Shop all</Link>
            </li>
          </ul>
        </details>
      </li>
      {tree.map((root) => (
        <li key={root.handle}>
          <Branch node={root} />
        </li>
      ))}
      <li>
        <Link href="/care-guides">Care Guides</Link>
      </li>
    </ul>
  );
}

/** One level of the accordion: an "All …" link, then each child. */
function Branch({ node }: { node: AnimalTypeNode }) {
  return (
    <details>
      <summary>{node.name}</summary>
      <ul className={styles.accordionList}>
        <li>
          <Link href={shopHref({ animal_type: node.handle })}>{allOf(node)}</Link>
        </li>
        {node.children.map((child) => (
          <li key={child.handle}>
            {child.children.length > 0 ? (
              <Branch node={child} />
            ) : (
              <Link href={shopHref({ animal_type: child.handle })}>{child.name}</Link>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

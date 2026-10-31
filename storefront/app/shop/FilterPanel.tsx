"use client";

import { useRouter } from "next/navigation";
import { useId, useOptimistic, useRef, useState, useTransition, type ReactNode } from "react";

import { CareLevelBadge } from "../../components/CareLevelBadge";
import { Icon } from "../../components/Icon";
import { CARE_LEVELS, DEPARTMENTS, FILTER_TAGS } from "../../lib/catalog";
import type { AnimalTypeNode } from "../../lib/data/animal-types";
import { shopHref } from "../../lib/shop-href";
import { activeFilterCount, toShopParams, type ShopQuery } from "../../lib/shop-params";
import { HiddenParams } from "./HiddenParams";
import styles from "../../component-css/FilterPanel.module.css";

type FilterPanelProps = {
  query: ShopQuery;
  tree: AnimalTypeNode[];
  /** Products matching the current view, for the phone "Show" button. */
  count: number;
};

const toggle = <T extends string>(list: readonly T[], value: T): T[] =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

/** True when the node is the chosen Animal Type or one of its ancestors. */
const contains = (node: AnimalTypeNode, handle: string | null): boolean =>
  node.handle === handle || node.children.some((child) => contains(child, handle));

/**
 * The Shop filters (design-plan §5). Each change updates the URL and goes
 * back to page 1; the inputs show the change straight away while the new
 * results load. At ≤ 767px the panel folds behind a button. Without
 * JavaScript it's a GET form with an Apply button.
 */
export function FilterPanel({ query, tree, count }: FilterPanelProps) {
  const router = useRouter();
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(query);

  const update = (change: Partial<ShopQuery>) => {
    const next = { ...shown, ...change, page: 1 };
    startTransition(() => {
      setShown(next);
      router.push(shopHref(toShopParams(next)), { scroll: false });
    });
  };

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  const active = activeFilterCount(shown);
  // Tags from the URL that aren't in the list still show, so they can be
  // unticked.
  const tags = [
    ...FILTER_TAGS,
    ...shown.tags
      .filter((value) => !FILTER_TAGS.some((tag) => tag.value === value))
      .map((value) => ({ value, label: value })),
  ];

  return (
    <div>
      <button
        ref={toggleRef}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.toggleLabel}>
          <Icon name="filter" />
          {active > 0 ? `Filters (${active} active)` : "Filters"}
        </span>
        <Icon name="chevron" className={open ? styles.chevronOpen : styles.chevron} />
      </button>

      <form
        id={panelId}
        action="/shop"
        aria-label="Filters"
        className={`form ${styles.panel}`}
        data-open={open}
      >
        <HiddenParams params={{ q: shown.q ?? undefined, sort: toShopParams(shown).sort }} />

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Department</legend>
          <ul className={styles.options}>
            {DEPARTMENTS.map((department) => (
              <li key={department.value}>
                <Choice
                  type="checkbox"
                  name="department"
                  value={department.value}
                  checked={shown.departments.includes(department.value)}
                  onChange={() =>
                    update({ departments: toggle(shown.departments, department.value) })
                  }
                >
                  {department.label}
                </Choice>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Animal Type</legend>
          <ul className={styles.options}>
            <li>
              <Choice
                type="radio"
                name="animal_type"
                value=""
                checked={shown.animalType === null}
                onChange={() => update({ animalType: null })}
              >
                All animal types
              </Choice>
            </li>
          </ul>
          <AnimalTypeOptions
            nodes={tree}
            selected={shown.animalType}
            onSelect={(handle) => update({ animalType: handle })}
          />
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Care Level</legend>
          <ul className={styles.options}>
            <li>
              <Choice
                type="radio"
                name="care_level"
                value=""
                checked={shown.careLevel === null}
                onChange={() => update({ careLevel: null })}
              >
                Any
              </Choice>
            </li>
            {CARE_LEVELS.map((level) => (
              <li key={level.value}>
                <Choice
                  type="radio"
                  name="care_level"
                  value={level.value}
                  checked={shown.careLevel === level.value}
                  onChange={() => update({ careLevel: level.value })}
                >
                  <CareLevelBadge level={level.value} />
                </Choice>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Tags</legend>
          <ul className={styles.options}>
            {tags.map((tag) => (
              <li key={tag.value}>
                <Choice
                  type="checkbox"
                  name="tag"
                  value={tag.value}
                  checked={shown.tags.includes(tag.value)}
                  onChange={() => update({ tags: toggle(shown.tags, tag.value) })}
                >
                  {tag.label}
                </Choice>
              </li>
            ))}
          </ul>
        </fieldset>

        <button type="button" className={`btn btn-primary ${styles.done}`} onClick={close}>
          {isPending
            ? "Updating results…"
            : `Show ${count} ${count === 1 ? "product" : "products"}`}
        </button>
        <noscript>
          <button type="submit" className="btn btn-primary">
            Apply filters
          </button>
        </noscript>
      </form>
    </div>
  );
}

type AnimalTypeOptionsProps = {
  nodes: AnimalTypeNode[];
  selected: string | null;
  onSelect: (handle: string) => void;
};

/**
 * The Animal Type tree as radios. Only the branch holding the chosen
 * Animal Type is open, so the list stays short.
 */
function AnimalTypeOptions({ nodes, selected, onSelect }: AnimalTypeOptionsProps) {
  return (
    <ul className={`${styles.options} ${styles.tree}`}>
      {nodes.map((node) => (
        <li key={node.handle}>
          <Choice
            type="radio"
            name="animal_type"
            value={node.handle}
            checked={node.handle === selected}
            onChange={() => onSelect(node.handle)}
          >
            {node.name}
          </Choice>
          {node.children.length > 0 && contains(node, selected) && (
            <AnimalTypeOptions nodes={node.children} selected={selected} onSelect={onSelect} />
          )}
        </li>
      ))}
    </ul>
  );
}

type ChoiceProps = {
  type: "checkbox" | "radio";
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
};

function Choice({ type, name, value, checked, onChange, children }: ChoiceProps) {
  return (
    <label className={styles.choice}>
      <input type={type} name={name} value={value} checked={checked} onChange={onChange} />
      {children}
    </label>
  );
}

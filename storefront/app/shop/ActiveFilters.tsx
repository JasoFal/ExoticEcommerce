import Link from "next/link";

import type { AnimalTypeNode } from "../../lib/data/animal-types";
import { shopHref } from "../../lib/shop-href";
import { toShopParams, type ShopQuery } from "../../lib/shop-params";
import { Icon } from "../../components/Icon";
import { careLevelLabel, departmentLabel, tagLabel } from "./shop-copy";
import styles from "../../component-css/ActiveFilters.module.css";

type ActiveFiltersProps = {
  query: ShopQuery;
  path: AnimalTypeNode[];
};

type Chip = { kind: string; label: string; without: Partial<ShopQuery> };

/** The search and each filter as a chip that removes it, plus "Clear all". */
export function ActiveFilters({ query, path }: ActiveFiltersProps) {
  const chips: Chip[] = [
    ...(query.q ? [{ kind: "Search", label: `Search: ${query.q}`, without: { q: null } }] : []),
    ...query.departments.map((value) => ({
      kind: "Department",
      label: departmentLabel(value),
      without: { departments: query.departments.filter((v) => v !== value) },
    })),
    ...(query.animalType
      ? [
          {
            kind: "Animal Type",
            label: path.at(-1)?.name ?? query.animalType,
            without: { animalType: null },
          },
        ]
      : []),
    ...(query.careLevel
      ? [
          {
            kind: "Care Level",
            label: careLevelLabel(query.careLevel),
            without: { careLevel: null },
          },
        ]
      : []),
    ...query.tags.map((value) => ({
      kind: "Tag",
      label: tagLabel(value),
      without: { tags: query.tags.filter((v) => v !== value) },
    })),
  ];

  if (chips.length === 0) return null;

  return (
    <div className={styles.row}>
      <span className={styles.label}>Active filters</span>
      <ul className={styles.chips} role="list">
        {chips.map((chip) => (
          <li key={`${chip.kind}:${chip.label}`}>
            <Link
              href={shopHref(toShopParams({ ...query, ...chip.without, page: 1 }))}
              aria-label={`Remove filter: ${chip.kind} ${chip.label}`}
              className={styles.chip}
            >
              {chip.label}
              <Icon name="close" className={styles.remove} />
            </Link>
          </li>
        ))}
      </ul>
      <Link href={shopHref({ sort: toShopParams(query).sort })} className={styles.clear}>
        Clear all
      </Link>
    </div>
  );
}

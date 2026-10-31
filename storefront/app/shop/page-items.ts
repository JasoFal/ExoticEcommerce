/** A page number, or a gap shown as "…". */
export type PageItem = number | "gap";

/**
 * The page links to show: the first and last pages, and the pages either
 * side of the current one. A gap of one page shows that page instead of
 * "…", since the "…" would take the same room.
 */
export function pageItems(current: number, total: number): PageItem[] {
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const items: PageItem[] = [];
  pages.forEach((page, i) => {
    const previous = pages[i - 1];
    if (previous !== undefined && page - previous === 2) items.push(previous + 1);
    if (previous !== undefined && page - previous > 2) items.push("gap");
    items.push(page);
  });
  return items;
}

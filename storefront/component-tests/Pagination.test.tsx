import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Pagination } from "../app/shop/Pagination";
import type { ShopQuery } from "../lib/shop-params";

const QUERY: ShopQuery = {
  q: null,
  departments: [],
  animalType: "gecko",
  careLevel: null,
  tags: [],
  sort: "name",
  page: 1,
};

describe("Pagination", () => {
  it("is hidden when every product fits on one page", () => {
    const { container } = render(<Pagination query={QUERY} count={24} />);

    expect(container.innerHTML).toBe("");
  });

  it("links each page with the same filters and marks the current one", () => {
    render(<Pagination query={{ ...QUERY, page: 2 }} count={60} />);

    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Page 1" }).getAttribute("href")).toBe(
      "/shop?animal_type=gecko&sort=name",
    );
    expect(screen.getByRole("link", { name: "Page 2" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(screen.getByRole("link", { name: "Page 3" }).getAttribute("href")).toBe(
      "/shop?animal_type=gecko&sort=name&page=3",
    );
  });

  it("links Previous and Next to the pages either side", () => {
    render(<Pagination query={{ ...QUERY, page: 2 }} count={60} />);

    expect(screen.getByRole("link", { name: /Previous/ }).getAttribute("href")).toBe(
      "/shop?animal_type=gecko&sort=name",
    );
    expect(screen.getByRole("link", { name: /Next/ }).getAttribute("href")).toBe(
      "/shop?animal_type=gecko&sort=name&page=3",
    );
  });

  it("turns off Previous on the first page and Next on the last", () => {
    const { rerender } = render(<Pagination query={QUERY} count={60} />);
    expect(screen.queryByRole("link", { name: /Previous/ })).toBeNull();
    expect(screen.getByText("Previous").closest("[aria-disabled]")).toBeTruthy();

    rerender(<Pagination query={{ ...QUERY, page: 3 }} count={60} />);
    expect(screen.queryByRole("link", { name: /Next/ })).toBeNull();
  });
});

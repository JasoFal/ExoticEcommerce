import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SearchForm } from "./SearchForm";

describe("SearchForm", () => {
  it("submits a GET to /shop, so it works without JavaScript", () => {
    render(<SearchForm />);

    const form = screen.getByRole("search");
    expect(form.getAttribute("action")).toBe("/shop");
    expect(form.getAttribute("method") ?? "get").toBe("get");
  });

  it("has a labelled keyword box named q", () => {
    render(<SearchForm />);

    const input = screen.getByRole("searchbox", { name: "Search products" });
    expect(input.getAttribute("name")).toBe("q");
  });

  it("scopes the search to a Department, with All Departments sending no filter", () => {
    render(<SearchForm />);

    const select = screen.getByRole("combobox", { name: "Search in" });
    expect(select.getAttribute("name")).toBe("department");
    const options = within(select).getAllByRole("option");
    expect(options.map((o) => [o.textContent, o.getAttribute("value")])).toEqual([
      ["All Departments", ""],
      ["Live Animals", "live-animals"],
      ["Feeders", "feeders"],
      ["Enclosures", "enclosures"],
      ["Accessories", "accessories"],
    ]);
  });

  it("has a Search button", () => {
    render(<SearchForm />);
    expect(screen.getByRole("button", { name: "Search" })).toBeTruthy();
  });
});

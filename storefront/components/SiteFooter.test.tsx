import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("links the four Departments", () => {
    render(<SiteFooter />);

    const departments = screen.getByRole("navigation", { name: "Departments" });
    expect(
      within(departments).getAllByRole("link").map((a) => [a.textContent, a.getAttribute("href")]),
    ).toEqual([
      ["Live Animals", "/shop?department=live-animals"],
      ["Feeders", "/shop?department=feeders"],
      ["Enclosures", "/shop?department=enclosures"],
      ["Accessories", "/shop?department=accessories"],
    ]);
  });

  it("links the Care pages", () => {
    render(<SiteFooter />);

    const care = screen.getByRole("navigation", { name: "Care" });
    expect(within(care).getByRole("link", { name: "Care Guides" }).getAttribute("href")).toBe(
      "/care-guides",
    );
    expect(
      within(care).getByRole("link", { name: "Beginner-friendly animals" }).getAttribute("href"),
    ).toBe("/shop?care_level=beginner-friendly");
  });

  it("marks the store details as undecided", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/\[PLACEHOLDER: store address, hours, and contact details/)).toBeTruthy();
  });
});

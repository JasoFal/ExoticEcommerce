import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "../components/SiteHeader";

const tree = [{ name: "Lizard", handle: "lizard", children: [] }];

describe("SiteHeader", () => {
  it("starts with a skip link to the main content", () => {
    render(<SiteHeader tree={tree} cartCount={0} />);

    const skip = screen.getByRole("link", { name: "Skip to main content" });
    expect(skip.getAttribute("href")).toBe("#main");
  });

  it("links the logo home", () => {
    render(<SiteHeader tree={tree} cartCount={0} />);

    expect(screen.getByRole("link", { name: /^Reptile Store/ }).getAttribute("href")).toBe("/");
  });

  it("names the cart link with its item count and shows a badge", () => {
    render(<SiteHeader tree={tree} cartCount={2} />);

    const cart = screen.getByRole("link", { name: "Cart, 2 items" });
    expect(cart.getAttribute("href")).toBe("/cart");
    expect(within(cart).getByText("2")).toBeTruthy();
  });

  it("uses the singular for one item", () => {
    render(<SiteHeader tree={tree} cartCount={1} />);
    expect(screen.getByRole("link", { name: "Cart, 1 item" })).toBeTruthy();
  });

  it("shows no badge for an empty cart", () => {
    render(<SiteHeader tree={tree} cartCount={0} />);

    const cart = screen.getByRole("link", { name: "Cart" });
    expect(cart.textContent).toBe("Cart");
  });

  it("puts every Department and the beginner shortcut in the catalogue bar", () => {
    render(<SiteHeader tree={tree} cartCount={0} />);

    const bar = screen.getByRole("navigation", { name: "Catalogue" });
    const href = (name: string) => within(bar).getByRole("link", { name }).getAttribute("href");
    expect(href("Browse all products")).toBe("/shop");
    expect(href("Live Animals")).toBe("/shop?department=live-animals");
    expect(href("Accessories")).toBe("/shop?department=accessories");
    expect(href("Beginner-friendly")).toBe("/shop?care_level=beginner-friendly");
  });

  it("sends newcomers to the Care Guides for now", () => {
    render(<SiteHeader tree={tree} cartCount={0} />);

    expect(
      screen.getByRole("link", { name: "New to reptiles? Start here" }).getAttribute("href"),
    ).toBe("/care-guides");
  });

  it("includes the search form", () => {
    render(<SiteHeader tree={tree} cartCount={0} />);
    expect(screen.getByRole("search")).toBeTruthy();
  });
});

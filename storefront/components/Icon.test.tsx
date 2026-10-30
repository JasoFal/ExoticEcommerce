import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Icon } from "./Icon";

describe("Icon", () => {
  it("is hidden from assistive tech by default", () => {
    const { container } = render(<Icon name="search" />);

    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("is a labelled image when it's the only label", () => {
    render(<Icon name="cart" label="Cart" />);

    expect(screen.getByRole("img", { name: "Cart" })).toBeTruthy();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StockBadge } from "./StockBadge";

describe("StockBadge", () => {
  it("says Sold out in words", () => {
    render(<StockBadge soldOut />);
    expect(screen.getByText("Sold out")).toBeTruthy();
  });

  it("shows nothing for an in-stock product unless asked", () => {
    const { container } = render(<StockBadge soldOut={false} />);
    expect(container.textContent).toBe("");
  });

  it("says In stock when asked", () => {
    render(<StockBadge soldOut={false} showInStock />);
    expect(screen.getByText("In stock")).toBeTruthy();
  });
});

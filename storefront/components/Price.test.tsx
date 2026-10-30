import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Price } from "./Price";

describe("Price", () => {
  it("shows the amount Medusa returns, formatted", () => {
    render(<Price amount={59.99} currencyCode="usd" />);
    expect(screen.getByText("$59.99")).toBeTruthy();
  });
});

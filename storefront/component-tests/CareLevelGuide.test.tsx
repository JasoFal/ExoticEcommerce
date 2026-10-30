import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CareLevelGuide } from "../components/CareLevelGuide";

describe("CareLevelGuide", () => {
  it("explains each Care Level next to its badge", () => {
    render(<CareLevelGuide />);

    expect(screen.getByRole("heading", { name: "Care Levels, at a glance" })).toBeTruthy();
    expect(screen.getByText("Beginner-friendly")).toBeTruthy();
    expect(screen.getByText("Hardy and forgiving. A good first animal.")).toBeTruthy();
    expect(screen.getByText("Intermediate")).toBeTruthy();
    expect(screen.getByText("Advanced")).toBeTruthy();
  });
});

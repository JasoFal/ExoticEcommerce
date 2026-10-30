import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CareLevelBadge } from "../components/CareLevelBadge";

describe("CareLevelBadge", () => {
  it.each([
    ["beginner-friendly", "Beginner-friendly", 1],
    ["intermediate", "Intermediate", 2],
    ["advanced", "Advanced", 3],
  ] as const)("names %s in words, with %s filled pips", (level, words, filled) => {
    const { container } = render(<CareLevelBadge level={level} />);

    expect(screen.getByText(words)).toBeTruthy();
    expect(container.querySelectorAll("[data-pip]")).toHaveLength(3);
    expect(container.querySelectorAll('[data-pip="filled"]')).toHaveLength(filled);
  });
});

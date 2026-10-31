import { describe, expect, it } from "vitest";

import { pageItems } from "./page-items";

describe("pageItems", () => {
  it("lists every page when there are only a few", () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(1, 3)).toEqual([1, 2, 3]);
    expect(pageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("puts a gap between the ends and the pages around the current one", () => {
    expect(pageItems(1, 10)).toEqual([1, 2, "gap", 10]);
    expect(pageItems(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
    expect(pageItems(10, 10)).toEqual([1, "gap", 9, 10]);
  });

  it("shows a single missing page instead of a gap", () => {
    expect(pageItems(4, 10)).toEqual([1, 2, 3, 4, 5, "gap", 10]);
  });
});

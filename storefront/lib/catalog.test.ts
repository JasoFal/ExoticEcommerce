import { describe, expect, it } from "vitest";

import { CARE_LEVELS, DEPARTMENTS, careLevelOf } from "./catalog";

describe("careLevelOf", () => {
  it("finds the Care Level among a product's Tags", () => {
    expect(careLevelOf(["nocturnal", "beginner-friendly", "arboreal"])).toBe(
      "beginner-friendly",
    );
    expect(careLevelOf(["advanced"])).toBe("advanced");
  });

  it("returns null for a Supply, which has no Care Level", () => {
    expect(careLevelOf(["substrate", "tropical"])).toBeNull();
    expect(careLevelOf([])).toBeNull();
  });
});

describe("catalogue constants", () => {
  it("lists the four Departments by their Medusa ProductType value", () => {
    expect(DEPARTMENTS.map((d) => d.value)).toEqual([
      "live-animals",
      "feeders",
      "enclosures",
      "accessories",
    ]);
  });

  it("orders Care Levels from one pip to three", () => {
    expect(CARE_LEVELS.map((c) => [c.value, c.pips])).toEqual([
      ["beginner-friendly", 1],
      ["intermediate", 2],
      ["advanced", 3],
    ]);
  });
});

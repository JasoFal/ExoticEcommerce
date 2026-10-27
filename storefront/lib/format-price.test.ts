import { describe, expect, it } from "vitest";

import { formatPrice } from "./format-price";

describe("formatPrice", () => {
  it("formats a whole-dollar amount", () => {
    expect(formatPrice(20, "usd")).toBe("$20.00");
  });

  it("keeps cents as given", () => {
    expect(formatPrice(149.99, "usd")).toBe("$149.99");
  });

  it("accepts upper-case currency codes", () => {
    expect(formatPrice(5, "USD")).toBe("$5.00");
  });

  it("formats zero", () => {
    expect(formatPrice(0, "usd")).toBe("$0.00");
  });

  it("uses the currency's own decimal places", () => {
    expect(formatPrice(1500, "jpy")).toBe("¥1,500");
  });
});

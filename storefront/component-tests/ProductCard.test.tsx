import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ProductSummary } from "../lib/data/products";
import { ProductCard } from "../components/ProductCard";

const gecko: ProductSummary = {
  id: "prod_1",
  handle: "crested-gecko",
  title: "Crested Gecko",
  thumbnail: "https://img.test/gecko.jpg",
  price: { amount: 59.99, currencyCode: "usd" },
  careLevel: "beginner-friendly",
  soldOut: false,
  silhouette: "lizard",
};

describe("ProductCard", () => {
  it("is one link to the product page", () => {
    render(<ProductCard product={gecko} />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/products/crested-gecko");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the title, price, and Care Level", () => {
    render(<ProductCard product={gecko} />);

    expect(screen.getByRole("heading", { name: "Crested Gecko" })).toBeTruthy();
    expect(screen.getByText("$59.99")).toBeTruthy();
    expect(screen.getByText("Beginner-friendly")).toBeTruthy();
    expect(screen.queryByText("Sold out")).toBeNull();
  });

  it("has no Care Level for a Supply, and says Sold out when it is", () => {
    render(
      <ProductCard product={{ ...gecko, careLevel: null, soldOut: true, silhouette: "supply" }} />,
    );

    expect(screen.queryByText("Beginner-friendly")).toBeNull();
    expect(screen.getByText("Sold out")).toBeTruthy();
  });
});

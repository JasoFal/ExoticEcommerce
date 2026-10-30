import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductImage } from "../components/ProductImage";

describe("ProductImage", () => {
  it("shows the image with the product title as alt text", () => {
    render(<ProductImage src="https://img.test/gecko.jpg" alt="Crested Gecko" fallbackIcon="lizard" />);

    expect(screen.getByRole("img", { name: "Crested Gecko" })).toBeTruthy();
  });

  it("shows a flat fallback with the silhouette and title when there's no image", () => {
    const { container } = render(
      <ProductImage src={null} alt="Crested Gecko" fallbackIcon="lizard" fallbackLabel="Crested Gecko" />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.getByText("Crested Gecko")).toBeTruthy();
  });

  it("switches to the fallback when the image fails to load", () => {
    const { container } = render(
      <ProductImage src="https://img.test/broken.jpg" alt="Corn Snake" fallbackIcon="snake" fallbackLabel="Corn Snake" />,
    );

    fireEvent.error(container.querySelector("img")!);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Corn Snake")).toBeTruthy();
  });
});

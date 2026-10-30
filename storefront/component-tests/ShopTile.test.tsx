import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShopTile } from "../components/ShopTile";

describe("ShopTile", () => {
  it("is one link named by its title, with the subtitle as text", () => {
    render(
      <ShopTile
        title="Lizards"
        subtitle="Geckos, skinks, and tegus"
        href="/shop?department=live-animals&animal_type=lizard"
        image="https://img.test/skink.jpg"
        icon="lizard"
      />,
    );

    const link = screen.getByRole("link", { name: /Lizards/ });
    expect(link.getAttribute("href")).toBe("/shop?department=live-animals&animal_type=lizard");
    expect(screen.getByText("Geckos, skinks, and tegus")).toBeTruthy();
  });

  it("treats the photo as decorative", () => {
    const { container } = render(
      <ShopTile title="Snakes" subtitle="Pythons and colubrids" href="/shop" image="https://img.test/python.jpg" icon="snake" />,
    );

    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
  });

  it("shows the icon when there's no photo", () => {
    const { container } = render(
      <ShopTile title="Feeders" subtitle="Insects, rodents, and diets" href="/shop" image={null} icon="feeder" />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
  });
});

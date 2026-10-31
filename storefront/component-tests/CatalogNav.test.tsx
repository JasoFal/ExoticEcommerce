import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AnimalTypeNode } from "../lib/data/animal-types";
import { CatalogNav } from "../components/CatalogNav";
import { animalType } from "../test/animal-type-fixture";

const tree: AnimalTypeNode[] = [
  animalType("Lizard", "lizard", [
    animalType("Gecko", "gecko", [animalType("Crested Gecko", "crested-gecko")]),
  ]),
  animalType("Snake", "snake"),
];

function renderDesktop() {
  render(
    <>
      <CatalogNav tree={tree} variant="desktop" />
      <button type="button">Elsewhere</button>
    </>,
  );
  return screen.getByRole("button", { name: "All Animal Types" });
}

describe("CatalogNav", () => {
  it("starts closed", () => {
    const toggle = renderDesktop();

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("link", { name: "Crested Gecko" })).toBeNull();
  });

  it("opens on click and controls its panel", () => {
    const toggle = renderDesktop();

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const panel = document.getElementById(toggle.getAttribute("aria-controls")!);
    expect(panel?.hidden).toBe(false);
  });

  it("links every Animal Type to the Shop page filtered by it", () => {
    fireEvent.click(renderDesktop());

    expect(screen.getByRole("link", { name: "Lizard" }).getAttribute("href")).toBe(
      "/shop?animal_type=lizard",
    );
    expect(screen.getByRole("link", { name: "Crested Gecko" }).getAttribute("href")).toBe(
      "/shop?animal_type=crested-gecko",
    );
  });

  it("closes on Escape and returns focus to its button", () => {
    const toggle = renderDesktop();
    fireEvent.click(toggle);
    screen.getByRole("link", { name: "Gecko" }).focus();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
  });

  it("closes on a click outside", () => {
    const toggle = renderDesktop();
    fireEvent.click(toggle);

    fireEvent.pointerDown(screen.getByRole("button", { name: "Elsewhere" }));

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes when focus moves out of the menu", () => {
    const toggle = renderDesktop();
    fireEvent.click(toggle);

    fireEvent.blur(screen.getByRole("link", { name: "Snake" }), {
      relatedTarget: screen.getByRole("button", { name: "Elsewhere" }),
    });

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes after a link is followed, since the header stays mounted", () => {
    const toggle = renderDesktop();
    fireEvent.click(toggle);

    fireEvent.click(screen.getByRole("link", { name: "Snake" }));

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  describe("mobile", () => {
    function renderMobile() {
      render(<CatalogNav tree={tree} variant="mobile" />);
      const toggle = screen.getByRole("button", { name: "Menu" });
      fireEvent.click(toggle);
      return toggle;
    }

    it("lists the Departments, the Animal Type tree, and Care Guides", () => {
      renderMobile();

      expect(screen.getByRole("link", { name: "Feeders" }).getAttribute("href")).toBe(
        "/shop?department=feeders",
      );
      expect(screen.getByRole("link", { name: "Shop all" }).getAttribute("href")).toBe("/shop");
      expect(screen.getByRole("link", { name: "All lizards" }).getAttribute("href")).toBe(
        "/shop?animal_type=lizard",
      );
      expect(screen.getByRole("link", { name: "All geckos" }).getAttribute("href")).toBe(
        "/shop?animal_type=gecko",
      );
      expect(screen.getByRole("link", { name: "Care Guides" }).getAttribute("href")).toBe(
        "/care-guides",
      );
    });

    it("folds each branch into its own disclosure", () => {
      renderMobile();

      const summaries = [...document.querySelectorAll("summary")].map((s) => s.textContent);
      expect(summaries).toEqual(["Departments", "Lizard", "Gecko", "Snake"]);
    });
  });
});

import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FilterPanel } from "../app/shop/FilterPanel";
import type { ShopQuery } from "../lib/shop-params";
import { animalType } from "../test/animal-type-fixture";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const tree = [
  animalType("Lizard", "lizard", [
    animalType("Gecko", "gecko", [animalType("Crested Gecko", "crested-gecko")]),
    animalType("Skink", "skink"),
  ]),
  animalType("Snake", "snake", [animalType("Python", "python")]),
];

const EMPTY: ShopQuery = {
  q: null,
  departments: [],
  animalType: null,
  careLevel: null,
  tags: [],
  sort: "newest",
  page: 1,
};

function renderPanel(query: Partial<ShopQuery> = {}, count = 31) {
  render(<FilterPanel query={{ ...EMPTY, ...query }} tree={tree} count={count} />);
  return screen.getByRole("form", { name: "Filters" });
}

const pushedHref = () => push.mock.lastCall?.[0];

describe("FilterPanel", () => {
  beforeEach(() => push.mockClear());

  it("adds a Department to the URL and goes back to page 1", () => {
    renderPanel({ animalType: "gecko", page: 3 });

    fireEvent.click(screen.getByRole("checkbox", { name: "Feeders" }));

    expect(push).toHaveBeenCalledWith("/shop?department=feeders&animal_type=gecko", {
      scroll: false,
    });
  });

  it("keeps the keyword and sort when a filter changes", () => {
    renderPanel({ q: "uvb", sort: "name" });

    fireEvent.click(screen.getByRole("checkbox", { name: "Nocturnal" }));

    expect(pushedHref()).toBe("/shop?q=uvb&tag=nocturnal&sort=name");
  });

  it("removes a ticked Tag", () => {
    renderPanel({ tags: ["arboreal", "large"] });

    fireEvent.click(screen.getByRole("checkbox", { name: "Arboreal" }));

    expect(pushedHref()).toBe("/shop?tag=large");
  });

  it("lists a Tag from the URL that the filter list doesn't have, so it can be unticked", () => {
    renderPanel({ tags: ["colourful"] });

    const tag = screen.getByRole("checkbox", { name: "colourful" }) as HTMLInputElement;
    expect(tag.checked).toBe(true);
  });

  it("picks one Care Level, with Any clearing it", () => {
    renderPanel({ careLevel: "advanced" });
    const careLevel = within(screen.getByRole("group", { name: "Care Level" }));

    fireEvent.click(careLevel.getByRole("radio", { name: "Beginner-friendly" }));
    expect(pushedHref()).toBe("/shop?care_level=beginner-friendly");

    fireEvent.click(careLevel.getByRole("radio", { name: "Any" }));
    expect(pushedHref()).toBe("/shop");
  });

  describe("Animal Type tree", () => {
    const options = () =>
      within(screen.getByRole("group", { name: "Animal Type" }))
        .getAllByRole("radio")
        .map((radio) => radio.parentElement?.textContent);

    it("shows only the top level when no Animal Type is chosen", () => {
      renderPanel();

      expect(options()).toEqual(["All animal types", "Lizard", "Snake"]);
    });

    it("opens the branch holding the chosen Animal Type and nothing else", () => {
      renderPanel({ animalType: "gecko" });

      expect(options()).toEqual([
        "All animal types",
        "Lizard",
        "Gecko",
        "Crested Gecko",
        "Skink",
        "Snake",
      ]);
      expect((screen.getByRole("radio", { name: "Gecko" }) as HTMLInputElement).checked).toBe(
        true,
      );
    });

    it("swaps the Animal Type in the URL", () => {
      renderPanel({ animalType: "gecko", departments: ["live-animals"] });

      fireEvent.click(screen.getByRole("radio", { name: "Snake" }));
      expect(pushedHref()).toBe("/shop?department=live-animals&animal_type=snake");

      fireEvent.click(screen.getByRole("radio", { name: "All animal types" }));
      expect(pushedHref()).toBe("/shop?department=live-animals");
    });
  });

  describe("phone fold", () => {
    it("names how many filters are on and starts folded", () => {
      const form = renderPanel({ animalType: "gecko", tags: ["large"] });

      const toggle = screen.getByRole("button", { name: "Filters (2 active)" });
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      expect(toggle.getAttribute("aria-controls")).toBe(form.id);
      expect(form.dataset.open).toBe("false");
    });

    it("opens, then closes from the Show button and returns focus to the toggle", () => {
      const form = renderPanel({}, 31);
      const toggle = screen.getByRole("button", { name: "Filters" });

      fireEvent.click(toggle);
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
      expect(form.dataset.open).toBe("true");

      fireEvent.click(screen.getByRole("button", { name: "Show 31 products" }));
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      expect(document.activeElement).toBe(toggle);
    });
  });

  it("is a GET form to /shop with named inputs, so it works without JavaScript", () => {
    const form = renderPanel({ q: "uvb" });

    expect(form.getAttribute("action")).toBe("/shop");
    expect(screen.getByRole("checkbox", { name: "Feeders" }).getAttribute("name")).toBe(
      "department",
    );
    const q = form.querySelector<HTMLInputElement>('input[type="hidden"][name="q"]');
    expect(q?.value).toBe("uvb");
  });
});

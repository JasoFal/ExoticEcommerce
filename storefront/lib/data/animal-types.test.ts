import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { BACKEND_URL, server } from "../../test/msw-server";
import {
  animalTypeRoots,
  descendantIds,
  findAnimalTypePath,
  getAnimalTypeTree,
} from "./animal-types";

// Shaped like GET /store/product-categories?include_descendants_tree=true:
// every category comes back at the top level, each with its own subtree.
const gecko = {
  id: "pcat_gecko",
  name: "Gecko",
  handle: "gecko",
  description: "Small lizards, most with sticky toe pads.",
  rank: 1,
  parent_category_id: "pcat_lizard",
  category_children: [
    {
      id: "pcat_crested",
      name: "Crested Gecko",
      handle: "crested-gecko",
      rank: 0,
      parent_category_id: "pcat_gecko",
      category_children: [],
    },
  ],
};
const skink = {
  id: "pcat_skink",
  name: "Skink",
  handle: "skink",
  rank: 0,
  parent_category_id: "pcat_lizard",
  category_children: [],
};
const lizard = {
  id: "pcat_lizard",
  name: "Lizard",
  handle: "lizard",
  rank: 0,
  parent_category_id: null,
  category_children: [gecko, skink],
};
const snake = {
  id: "pcat_snake",
  name: "Snake",
  handle: "snake",
  rank: 1,
  parent_category_id: null,
  category_children: [],
};

function serveCategories(categories: unknown[]) {
  const requests: URL[] = [];
  server.use(
    http.get(`${BACKEND_URL}/store/product-categories`, ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json({
        product_categories: categories,
        count: categories.length,
        offset: 0,
        limit: 1000,
      });
    }),
  );
  return requests;
}

describe("getAnimalTypeTree", () => {
  it("returns the top-level Animal Types with their descendants, in rank order", async () => {
    const requests = serveCategories([snake, gecko, lizard, skink]);

    const tree = await getAnimalTypeTree();

    expect(tree).toEqual([
      {
        id: "pcat_lizard",
        name: "Lizard",
        handle: "lizard",
        description: "",
        children: [
          { id: "pcat_skink", name: "Skink", handle: "skink", description: "", children: [] },
          {
            id: "pcat_gecko",
            name: "Gecko",
            handle: "gecko",
            description: "Small lizards, most with sticky toe pads.",
            children: [
              {
                id: "pcat_crested",
                name: "Crested Gecko",
                handle: "crested-gecko",
                description: "",
                children: [],
              },
            ],
          },
        ],
      },
      { id: "pcat_snake", name: "Snake", handle: "snake", description: "", children: [] },
    ]);
    expect(requests[0].searchParams.get("include_descendants_tree")).toBe("true");
  });
});

describe("animalTypeRoots", () => {
  it("maps every Animal Type handle to its top-level Animal Type", async () => {
    serveCategories([lizard, snake]);

    const roots = animalTypeRoots(await getAnimalTypeTree());

    expect(roots.get("crested-gecko")).toBe("lizard");
    expect(roots.get("gecko")).toBe("lizard");
    expect(roots.get("lizard")).toBe("lizard");
    expect(roots.get("snake")).toBe("snake");
    expect(roots.get("tarantula")).toBeUndefined();
  });
});

describe("findAnimalTypePath", () => {
  it("runs from the top-level Animal Type down to the one asked for", async () => {
    serveCategories([lizard, snake]);
    const tree = await getAnimalTypeTree();

    expect(findAnimalTypePath(tree, "crested-gecko").map((node) => node.handle)).toEqual([
      "lizard",
      "gecko",
      "crested-gecko",
    ]);
    expect(findAnimalTypePath(tree, "snake").map((node) => node.handle)).toEqual(["snake"]);
  });

  it("is empty for a handle that isn't in the tree", async () => {
    serveCategories([lizard, snake]);

    expect(findAnimalTypePath(await getAnimalTypeTree(), "tarantula")).toEqual([]);
  });
});

describe("descendantIds", () => {
  it("lists an Animal Type and everything under it", async () => {
    serveCategories([lizard, snake]);
    const [lizardNode, snakeNode] = await getAnimalTypeTree();

    expect(descendantIds(lizardNode)).toEqual([
      "pcat_lizard",
      "pcat_skink",
      "pcat_gecko",
      "pcat_crested",
    ]);
    expect(descendantIds(snakeNode)).toEqual(["pcat_snake"]);
  });
});

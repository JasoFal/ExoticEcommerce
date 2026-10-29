import { expect, test } from "@playwright/test";

// Smoke tests: the seeded stack is up and wired together. The happy-path
// checkout test comes with the cart and checkout pages
// (docs/ci-cd-plan.md Phase 4).

const backendUrl = process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const publishableKey = process.env.MEDUSA_PUBLISHABLE_KEY ?? "";

// A seeded Supply (f-001 in ProductData.json).
const SUPPLY_HANDLE = "small-dubia-roaches-14-50-count";

// Every route in docs/site-map.md §1. Dynamic segments use a placeholder.
const ROUTES = [
  "/",
  "/shop",
  "/shop?q=gecko",
  "/products/example",
  "/care-guides",
  "/cart",
  "/checkout",
  "/order/example/confirmed",
];

for (const route of ROUTES) {
  test(`the storefront serves ${route}`, async ({ page }) => {
    // Status only: the page's content and design aren't settled yet.
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
  });
}

test("an unknown route returns 404", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
});

test("the seeded catalogue is available with the seeded publishable key", async ({
  request,
}) => {
  const response = await request.get(`${backendUrl}/store/products`, {
    params: { handle: SUPPLY_HANDLE },
    headers: { "x-publishable-api-key": publishableKey },
  });

  expect(response.status()).toBe(200);
  const { products } = await response.json();
  expect(products).toHaveLength(1);
});

import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BACKEND_URL, server } from "../../test/msw-server";
import { CART_COOKIE, getCartItemCount } from "./cart";

const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
  }),
}));

let cartRequests: string[];

function serveCart(status: number, items: { quantity: number }[] = []) {
  cartRequests = [];
  server.use(
    http.get(`${BACKEND_URL}/store/carts/:id`, ({ params }) => {
      cartRequests.push(String(params.id));
      return status === 200
        ? HttpResponse.json({ cart: { id: params.id, items } })
        : HttpResponse.json({ message: "error" }, { status });
    }),
  );
}

describe("getCartItemCount", () => {
  beforeEach(() => cookieJar.clear());

  it("is 0, without calling Medusa, when there's no cart yet", async () => {
    serveCart(200);

    expect(await getCartItemCount()).toBe(0);
    expect(cartRequests).toHaveLength(0);
  });

  it("counts the units across the cart's Line Items", async () => {
    cookieJar.set(CART_COOKIE, "cart_123");
    serveCart(200, [{ quantity: 1 }, { quantity: 2 }]);

    expect(await getCartItemCount()).toBe(3);
    expect(cartRequests).toEqual(["cart_123"]);
  });

  it("is 0 when the cookie points at a cart Medusa no longer has", async () => {
    cookieJar.set(CART_COOKIE, "cart_gone");
    serveCart(404);

    expect(await getCartItemCount()).toBe(0);
  });

  it("lets other Medusa errors through", async () => {
    cookieJar.set(CART_COOKIE, "cart_123");
    serveCart(500);

    await expect(getCartItemCount()).rejects.toThrow();
  });
});

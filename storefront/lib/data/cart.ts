import { FetchError } from "@medusajs/js-sdk";
import { cookies } from "next/headers";

import { sdk } from "./client";

/** Holds the guest's Medusa cart id. Set by the Add-to-Cart flow (not built yet). */
export const CART_COOKIE = "_medusa_cart_id";

/**
 * How many units are in the guest's cart, for the header's cart link. Reads
 * the cart only; it never creates one.
 */
export async function getCartItemCount(): Promise<number> {
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return 0;

  try {
    const { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: "id,items.quantity",
    });
    return (cart.items ?? []).reduce((count, item) => count + item.quantity, 0);
  } catch (error) {
    // A stale cookie: the cart was completed or deleted.
    if (error instanceof FetchError && error.status === 404) return 0;
    throw error;
  }
}

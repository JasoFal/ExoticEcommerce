import type { ShopParams } from "../../lib/shop-href";

/**
 * Carries the rest of the view along when a Shop form is submitted the
 * plain way, without JavaScript.
 */
export function HiddenParams({ params }: { params: ShopParams }) {
  return Object.entries(params).flatMap(([name, value]) =>
    [value ?? []]
      .flat()
      .filter((v) => v !== "")
      .map((v) => <input key={`${name}=${v}`} type="hidden" name={name} value={String(v)} />),
  );
}

import { formatPrice } from "../lib/format-price";

type PriceProps = {
  /** As Medusa returns it, in the currency's main unit. */
  amount: number;
  currencyCode: string;
  className?: string;
};

/** A price from Medusa, formatted. It does no math. */
export function Price({ amount, currencyCode, className }: PriceProps) {
  return (
    <span className={["font-semibold", className].filter(Boolean).join(" ")}>
      {formatPrice(amount, currencyCode)}
    </span>
  );
}

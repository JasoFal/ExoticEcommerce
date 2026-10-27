/**
 * Formats an amount returned by Medusa for display.
 *
 * Medusa v2 returns amounts in the currency's main unit (20 means $20.00),
 * so this only formats. It never calculates prices or totals; those always
 * come from Medusa.
 */
export function formatPrice(
  amount: number,
  currencyCode: string,
  locale = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(amount);
}

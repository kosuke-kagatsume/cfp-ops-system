/**
 * Calculate tax amount and total with tax.
 * @param amount  Tax-exclusive amount
 * @param rate    Tax rate (default 10%)
 */
export function calculateTax(
  amount: number,
  rate: number = 0.10
): { taxAmount: number; totalWithTax: number } {
  const taxAmount = roundTax(amount * rate);
  return { taxAmount, totalWithTax: amount + taxAmount };
}

/**
 * Round tax amount using truncation (切り捨て).
 */
export function roundTax(amount: number): number {
  return Math.floor(amount);
}

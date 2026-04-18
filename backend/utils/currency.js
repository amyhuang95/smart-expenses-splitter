/**
 * Returns true when a numeric amount can be represented exactly with cents.
 * This guards API inputs so values like 12.345 are rejected before persistence.
 */
export function hasAtMostTwoDecimals(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return false;
  }

  return Math.abs(Math.round(value * 100) - value * 100) < 1e-6;
}

/**
 * Normalizes a numeric amount to a standard currency shape with two decimals.
 * This is used at persistence and serialization boundaries to keep API values
 * consistent even if upstream code passes whole numbers such as 12.
 */
export function normalizeCurrencyAmount(value) {
  return Number(Number(value).toFixed(2));
}

export function estimate_delivery(input: {
  zip_code: string;
  shipping_cost: number;
}): { estimated_days: number } {
  // Flat rate $1 = standard (5-7 days), $15 = expedited (2-3 days)
  return { estimated_days: input.shipping_cost <= 1 ? 7 : 3 };
}

export function calculate_alcohol_tax(input: {
  discounted_total: number;
  tax_rate: number;
}): { tax_amount: number } {
  const tax_amount =
    Math.round(input.discounted_total * input.tax_rate * 100) / 100;
  return { tax_amount };
}

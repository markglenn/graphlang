export function format_currency(input: {
  amount: number;
  currency: string;
}): { formatted: string } {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: input.currency,
  }).format(input.amount);
  return { formatted };
}

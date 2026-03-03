export function calculate_order_total(input: {
  items: Array<{ unit_price: number; quantity: number }>;
}): { total: number } {
  const total = input.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );
  return { total: Math.round(total * 100) / 100 };
}

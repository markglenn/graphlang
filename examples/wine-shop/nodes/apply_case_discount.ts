import type { Cart } from "../entities/cart";

export function apply_case_discount(input: {
  cart: Cart;
  subtotal: number;
}): { discount_amount: number; discounted_total: number } {
  const total_bottles = input.cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  let discount_pct = 0;
  if (total_bottles >= 12) {
    discount_pct = 0.1; // Full case: 10% off
  } else if (total_bottles >= 6) {
    discount_pct = 0.05; // Half case: 5% off
  }

  const discount_amount = Math.round(input.subtotal * discount_pct * 100) / 100;
  return {
    discount_amount,
    discounted_total: Math.round((input.subtotal - discount_amount) * 100) / 100,
  };
}

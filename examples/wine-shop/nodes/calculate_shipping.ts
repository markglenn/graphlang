import type { Cart } from "../entities/cart";

export function calculate_shipping(input: {
  cart: Cart;
}): { shipping_cost: number } {
  const total_bottles = input.cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  return { shipping_cost: total_bottles >= 6 ? 1.0 : 15.0 };
}

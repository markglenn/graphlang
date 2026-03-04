import type { Cart } from "../entities/cart";

export function calculate_cart_total(input: {
  cart: Cart;
}): { subtotal: number } {
  const subtotal = input.cart.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );
  return { subtotal: Math.round(subtotal * 100) / 100 };
}

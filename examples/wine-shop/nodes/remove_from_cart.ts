import type { Cart } from "../entities/cart";

export function remove_from_cart(input: {
  cart: Cart;
  product_id: string;
}): { cart: Cart } {
  const items = input.cart.items.filter(
    (i) => i.product_id !== input.product_id,
  );
  return {
    cart: { ...input.cart, items, updated_at: new Date().toISOString() },
  };
}

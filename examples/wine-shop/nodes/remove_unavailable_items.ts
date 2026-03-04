import type { Cart } from "../entities/cart";

export async function remove_unavailable_items(input: {
  cart: Cart;
  product_id: string;
}): Promise<{ cart: Cart }> {
  const items = input.cart.items.filter(
    (i) => i.product_id !== input.product_id,
  );
  return {
    cart: { ...input.cart, items, updated_at: new Date().toISOString() },
  };
}

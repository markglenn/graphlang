import type { Cart } from "../entities/cart";
import type { Wine } from "../entities/wine";

export function add_bottle_to_cart(input: {
  cart: Cart;
  product: Wine;
  quantity: number;
}): { cart: Cart } {
  const existing = input.cart.items.find(
    (i) => i.product_id === input.product.id,
  );

  const items = existing
    ? input.cart.items.map((i) =>
        i.product_id === input.product.id
          ? { ...i, quantity: i.quantity + input.quantity }
          : i,
      )
    : [
        ...input.cart.items,
        {
          product_id: input.product.id,
          product_type: "single_bottle" as const,
          quantity: input.quantity,
          unit_price: input.product.price,
        },
      ];

  return {
    cart: { ...input.cart, items, updated_at: new Date().toISOString() },
  };
}

import type { Cart } from "../entities/cart";
import type { WinePack } from "../entities/wine_pack";

export function add_pack_to_cart(input: {
  cart: Cart;
  pack: WinePack;
  quantity: number;
}): { cart: Cart } {
  const existing = input.cart.items.find(
    (i) => i.product_id === input.pack.id,
  );

  const items = existing
    ? input.cart.items.map((i) =>
        i.product_id === input.pack.id
          ? { ...i, quantity: i.quantity + input.quantity }
          : i,
      )
    : [
        ...input.cart.items,
        {
          product_id: input.pack.id,
          product_type: "wine_pack" as const,
          quantity: input.quantity,
          unit_price: input.pack.price,
        },
      ];

  return {
    cart: { ...input.cart, items, updated_at: new Date().toISOString() },
  };
}

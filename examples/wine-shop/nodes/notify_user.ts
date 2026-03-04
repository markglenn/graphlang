import type { Cart } from "../entities/cart";

export async function notify_user(input: {
  cart: Cart;
  product_id: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  // Would notify the cart owner that an item was removed
  throw new Error("not implemented — requires notification service");
}

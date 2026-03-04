import type { Cart } from "../entities/cart";

export async function reserve_stock(input: {
  cart: Cart;
}): Promise<
  | { ok: true; reservation_id: string }
  | { ok: false; error: string }
> {
  // Would decrement inventory for each item in the cart
  throw new Error("not implemented — requires inventory store");
}

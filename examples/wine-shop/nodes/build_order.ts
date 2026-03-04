import type { Cart } from "../entities/cart";
import type { Order } from "../entities/order";

export function build_order(input: {
  cart: Cart;
  subtotal: number;
  discount_amount: number;
  member_discount: number;
  tax_amount: number;
  shipping_cost: number;
  total: number;
  order_number: string;
  charge_id: string;
}): { order: Order } {
  return {
    order: {
      id: crypto.randomUUID(),
      order_number: input.order_number,
      user_id: input.cart.user_id,
      items: input.cart.items,
      subtotal: input.subtotal,
      discount_amount: input.discount_amount + input.member_discount,
      tax_amount: input.tax_amount,
      shipping_cost: input.shipping_cost,
      total: input.total,
      status: "confirmed",
      created_at: new Date().toISOString(),
    },
  };
}

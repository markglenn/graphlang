import type { Cart } from "../entities/cart";
import type { Order } from "../entities/order";
import type { User } from "../entities/user";

// add_to_cart
export type AddToCartInput = {
  cart: Cart;
  product_id: string;
  quantity: number;
};

export type AddToCartOutput = {
  cart: Cart;
  subtotal: number;
  discount_amount: number;
  discounted_total: number;
  shipping_cost: number;
};

// checkout
export type CheckoutInput = {
  user: User;
  cart: Cart;
  payment_token: string;
};

export type CheckoutOutput = {
  order: Order;
};

// checkout_success (sub-flow)
export type CheckoutSuccessInput = {
  cart: Cart;
  subtotal: number;
  discount_amount: number;
  member_discount: number;
  tax_amount: number;
  shipping_cost: number;
  total: number;
  order_number: string;
  charge_id: string;
};

export type CheckoutSuccessOutput = {
  order: Order;
};

// checkout_payment_failed (sub-flow)
export type CheckoutPaymentFailedInput = {
  reservation_id: string;
};

export type CheckoutPaymentFailedOutput = {
  ok: boolean;
};

// cart_updated
export type CartUpdatedInput = {
  cart: Cart;
  zip_code: string;
};

export type CartUpdatedOutput = {
  subtotal: number;
  discount_amount: number;
  discounted_total: number;
  shipping_cost: number;
  estimated_days: number;
};

// stock_changed
export type StockChangedInput = {
  product_id: string;
};

export type StockChangedOutput = {
  carts: Cart[];
};

// update_cart (sub-flow for fan_out)
export type UpdateCartInput = {
  cart: Cart;
  product_id: string;
};

export type UpdateCartOutput = {
  cart: Cart;
  subtotal: number;
  shipping_cost: number;
};

import type { CartItem } from "./cart";

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  items: CartItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_cost: number;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  created_at: string;
}

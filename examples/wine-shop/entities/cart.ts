export interface CartItem {
  product_id: string;
  product_type: "single_bottle" | "wine_pack";
  quantity: number;
  unit_price: number;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

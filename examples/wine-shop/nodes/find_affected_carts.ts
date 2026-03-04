import type { Cart } from "../entities/cart";

export async function find_affected_carts(input: {
  product_id: string;
}): Promise<{ carts: Cart[] }> {
  // Would query cart store for carts containing this product
  throw new Error("not implemented — requires cart store");
}

export async function check_stock(input: {
  product_id: string;
  quantity: number;
}): Promise<
  | { ok: true; product_id: string; quantity: number }
  | { ok: false; error: string }
> {
  // Would query inventory store
  throw new Error("not implemented — requires inventory store");
}

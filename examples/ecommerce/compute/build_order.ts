export function build_order(input: {
  items: Array<{
    product_id: string;
    title: string;
    unit_price: number;
    quantity: number;
  }>;
  total: number;
}): {
  order: { status: { variant: "Pending" }; total: number };
  items: Array<{ product_id: string; quantity: number; unit_price: number }>;
  inventory_updates: Array<{ product_id: string; decrement_by: number }>;
} {
  return {
    order: {
      status: { variant: "Pending" },
      total: input.total,
    },
    items: input.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
    inventory_updates: input.items.map((item) => ({
      product_id: item.product_id,
      decrement_by: item.quantity,
    })),
  };
}

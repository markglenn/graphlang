export async function generate_order_number(): Promise<{
  order_number: string;
}> {
  // Would hit a sequence generator or counter store
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return { order_number: `WS-${timestamp}-${random}` };
}

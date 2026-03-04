export async function release_stock(input: {
  reservation_id: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  // Would restore inventory from a reservation
  throw new Error("not implemented — requires inventory store");
}

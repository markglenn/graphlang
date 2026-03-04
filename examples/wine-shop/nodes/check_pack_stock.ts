import type { Wine } from "../entities/wine";

export async function check_pack_stock(input: {
  bottles: Wine[];
  quantity: number;
}): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  // Would check stock for every bottle in the pack
  throw new Error("not implemented — requires inventory store");
}

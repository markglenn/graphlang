import type { Wine } from "../entities/wine";
import type { WinePack } from "../entities/wine_pack";

export async function classify_product(input: {
  product_id: string;
}): Promise<
  | { type: "single_bottle"; product: Wine }
  | { type: "wine_pack"; pack: WinePack; bottles: Wine[] }
> {
  // Would query product store to determine type and load data
  throw new Error("not implemented — requires product store");
}

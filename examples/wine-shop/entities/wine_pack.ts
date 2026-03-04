import type { Wine } from "./wine";

export interface WinePack {
  id: string;
  name: string;
  description: string;
  wines: Wine[];
  price: number;
  discount_percentage: number;
}

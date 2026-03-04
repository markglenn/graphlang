export interface Wine {
  id: string;
  name: string;
  winery: string;
  vintage: number;
  varietal: string;
  region: string;
  price: number;
  bottle_size_ml: number;
  weight_oz: number;
  inventory_count: number;
  active: boolean;
}

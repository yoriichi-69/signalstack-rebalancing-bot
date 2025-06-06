export interface Asset {
  symbol: string;
  weight: number;
  currentPrice: number;
  quantity: number;
}

export interface Portfolio {
  _id: string;
  name: string;
  assets: Asset[];
  totalValue: number;
  lastRebalanced: string;
  createdAt: string;
  updatedAt: string;
} 
export interface Asset {
  name: string;
  symbol: string;
  allocation: number;
  value: number;
  change: number;
}

export interface Strategy {
  id: number;
  name: string;
  description: string;
  performance: number;
  winRate: number;
  trades: number;
  status: 'active' | 'paused';
  chartData: Array<{ time: string; value: number }>;
}

export interface Settings {
  portfolioName: string;
  baseCurrency: string;
  emailNotifications: boolean;
  telegramNotifications: boolean;
  maxPositionSize: number;
  rebalancingThreshold: number;
  rebalancingFrequency: 'daily' | 'weekly' | 'monthly';
  stopLoss: boolean;
  maxDrawdown: number;
  dailyTradingLimit: number;
  circuitBreaker: boolean;
  ethereumRpcUrl: string;
  walletAddress: string;
}

export interface Trade {
  id: number;
  date: string;
  asset: string;
  type: 'Buy' | 'Sell';
  amount: number;
  price: number;
  value: number;
  strategy: string;
} 
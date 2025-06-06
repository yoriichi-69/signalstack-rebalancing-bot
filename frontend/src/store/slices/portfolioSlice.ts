import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Asset {
  name: string;
  symbol: string;
  allocation: number;
  value: number;
  change: number;
}

interface PortfolioState {
  assets: Asset[];
  totalValue: number;
  performance: number;
  lastRebalance: string;
  nextRebalance: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: PortfolioState = {
  assets: [],
  totalValue: 0,
  performance: 0,
  lastRebalance: '',
  nextRebalance: '',
  isLoading: false,
  error: null,
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    setAssets: (state, action: PayloadAction<Asset[]>) => {
      state.assets = action.payload;
      state.totalValue = action.payload.reduce((sum, asset) => sum + asset.value, 0);
    },
    setPerformance: (state, action: PayloadAction<number>) => {
      state.performance = action.payload;
    },
    setRebalanceDates: (state, action: PayloadAction<{ last: string; next: string }>) => {
      state.lastRebalance = action.payload.last;
      state.nextRebalance = action.payload.next;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setAssets,
  setPerformance,
  setRebalanceDates,
  setLoading,
  setError,
} = portfolioSlice.actions;

export default portfolioSlice.reducer; 
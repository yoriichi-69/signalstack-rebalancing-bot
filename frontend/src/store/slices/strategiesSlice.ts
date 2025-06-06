import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Strategy {
  id: number;
  name: string;
  description: string;
  performance: number;
  winRate: number;
  trades: number;
  status: 'active' | 'paused';
  chartData: Array<{ time: string; value: number }>;
}

interface StrategiesState {
  strategies: Strategy[];
  isLoading: boolean;
  error: string | null;
}

const initialState: StrategiesState = {
  strategies: [],
  isLoading: false,
  error: null,
};

const strategiesSlice = createSlice({
  name: 'strategies',
  initialState,
  reducers: {
    setStrategies: (state, action: PayloadAction<Strategy[]>) => {
      state.strategies = action.payload;
    },
    updateStrategyStatus: (state, action: PayloadAction<{ id: number; status: 'active' | 'paused' }>) => {
      const strategy = state.strategies.find(s => s.id === action.payload.id);
      if (strategy) {
        strategy.status = action.payload.status;
      }
    },
    updateStrategyPerformance: (state, action: PayloadAction<{ id: number; performance: number }>) => {
      const strategy = state.strategies.find(s => s.id === action.payload.id);
      if (strategy) {
        strategy.performance = action.payload.performance;
      }
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
  setStrategies,
  updateStrategyStatus,
  updateStrategyPerformance,
  setLoading,
  setError,
} = strategiesSlice.actions;

export default strategiesSlice.reducer; 
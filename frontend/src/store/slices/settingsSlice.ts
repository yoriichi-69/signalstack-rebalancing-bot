import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Settings {
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

interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: {
    portfolioName: 'My Portfolio',
    baseCurrency: 'usd',
    emailNotifications: true,
    telegramNotifications: true,
    maxPositionSize: 20,
    rebalancingThreshold: 5,
    rebalancingFrequency: 'weekly',
    stopLoss: true,
    maxDrawdown: 15,
    dailyTradingLimit: 1000,
    circuitBreaker: true,
    ethereumRpcUrl: '',
    walletAddress: '',
  },
  isLoading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<Settings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    resetSettings: (state) => {
      state.settings = initialState.settings;
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
  updateSettings,
  resetSettings,
  setLoading,
  setError,
} = settingsSlice.actions;

export default settingsSlice.reducer; 
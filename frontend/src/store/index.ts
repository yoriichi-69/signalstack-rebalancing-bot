import { configureStore } from '@reduxjs/toolkit';
import portfolioReducer from './slices/portfolioSlice';
import strategiesReducer from './slices/strategiesSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    portfolio: portfolioReducer,
    strategies: strategiesReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
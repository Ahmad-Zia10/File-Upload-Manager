import { configureStore } from '@reduxjs/toolkit';
import filesReducer from './features/files/filesSlice';
import settingsReducer from './features/settings/settingsSlice';

export function makeStore() {
  return configureStore({
    reducer: {
      files: filesReducer,
      settings: settingsReducer,
    },
  });
}

export const store = makeStore();

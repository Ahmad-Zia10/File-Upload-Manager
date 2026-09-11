import { createSlice } from '@reduxjs/toolkit';

/*
  Dev-panel knobs. Not upload state — these shape the *simulated network* so a
  reviewer can trigger the retry and cancel paths on demand rather than waiting
  for a random failure. The uploader reads these live via setConditionsSource.

  `speed` is a 1–10x multiplier (higher = faster); the entry point maps it to a
  per-chunk millisecond delay so the uploader keeps its simple ms model.
*/

const initialState = {
  failureRate: 0.1, // probability a given chunk fails
  speed: 3, // 1..10x, higher is faster
  forceFailNext: false, // force the next chunk to fail, then auto-reset
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setFailureRate(state, action) {
      state.failureRate = action.payload;
    },
    setSpeed(state, action) {
      state.speed = action.payload;
    },
    setForceFailNext(state, action) {
      state.forceFailNext = action.payload;
    },
  },
});

export const { setFailureRate, setSpeed, setForceFailNext } = settingsSlice.actions;
export default settingsSlice.reducer;

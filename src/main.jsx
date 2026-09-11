import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import { setConditionsSource } from './features/files/uploader';
import { setForceFailNext } from './features/settings/settingsSlice';
import App from './App';
import './index.css';

// Point the simulated uploader at the live dev-panel settings. "Force fail next"
// is armed once and consumed the moment a chunk reads it, so it fails exactly
// one chunk and then behaves normally.
setConditionsSource(() => {
  const s = store.getState().settings;
  const forceFailNext = s.forceFailNext;
  if (forceFailNext) store.dispatch(setForceFailNext(false));
  return {
    failureRate: s.failureRate,
    forceFailNext,
    speedMs: Math.round(700 / s.speed), // 1x -> 700ms, 10x -> 70ms
  };
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

/*
  The only place that "talks to the network". Everything else depends on this
  one function signature:

      uploadChunk(fileId, chunkIndex, { signal, speed }) -> Promise<void>

  Swapping the simulation for a real backend is a one-file change: replace the
  body with a fetch() of the byte range for `chunkIndex`, pass `signal` straight
  through, and the scheduler, progress, retry and cancel logic all keep working.

  The simulation reads live "network conditions" from a getter the app wires to
  the dev-panel settings, so a reviewer can force failures on demand instead of
  waiting for a random one.
*/

// Injected by the app so the simulator can read the dev-panel settings without
// importing the store (keeps this module free of app wiring). Tests override it.
let conditions = () => ({ failureRate: 0.15, forceFailNext: false, speedMs: 260 });

export function setConditionsSource(fn) {
  conditions = fn;
}

class AbortError extends Error {
  constructor() {
    super('aborted');
    this.name = 'AbortError';
  }
}

export function isAbortError(err) {
  return err && err.name === 'AbortError';
}

export function uploadChunk(fileId, chunkIndex, { signal, speed } = {}) {
  const { failureRate, forceFailNext, speedMs } = conditions();
  const delay = (speed ?? speedMs) * (0.6 + Math.random() * 0.8);

  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new AbortError());

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      const shouldFail = forceFailNext || Math.random() < failureRate;
      if (shouldFail) reject(new Error('Network error while uploading chunk'));
      else resolve();
    }, delay);

    function onAbort() {
      clearTimeout(timer);
      reject(new AbortError());
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

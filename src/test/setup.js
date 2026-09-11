// matchMedia isn't implemented in jsdom; stub it so any incidental use is safe.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });
}

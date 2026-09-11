// The concurrency ceiling. The scheduler guarantees no more than this many
// files are in the `uploading` state at once.
export const MAX_CONCURRENT = 3;

// Each file is simulated as this many equal chunks. Chunking is the load-bearing
// choice: it gives granular progress, a resume point on retry (start from the
// first unfinished chunk), and a natural throttle on dispatches.
export const CHUNKS_PER_FILE = 20;

// Progress can advance faster than a screen refresh. Coalesce chunk-progress
// dispatches to at most one per file per this interval; terminal events
// (complete/fail) always flush the true value.
export const PROGRESS_THROTTLE_MS = 120;

export const STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

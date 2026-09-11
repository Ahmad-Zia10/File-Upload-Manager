import { createSlice } from '@reduxjs/toolkit';
import { STATUS } from './constants';

/*
  Stores only metadata that genuinely can't be recomputed:
    id, name, size, status, chunksTotal, chunksDone, error

  Deliberately NOT stored:
    - progress %  -> derived from chunksDone / chunksTotal (selectProgress)
    - active count -> derived by counting status === 'uploading'
    - the File object / AbortController -> live in uploadRegistry (non-serializable)

  Normalized as byId + allIds so a row can subscribe to exactly one file by id
  and re-render only when that file changes.
*/

const initialState = {
  byId: {},
  allIds: [],
};

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    filesAdded(state, action) {
      for (const meta of action.payload) {
        if (state.byId[meta.id]) continue;
        state.byId[meta.id] = {
          id: meta.id,
          name: meta.name,
          size: meta.size,
          chunksTotal: meta.chunksTotal,
          chunksDone: 0,
          status: STATUS.PENDING,
          error: null,
        };
        state.allIds.push(meta.id);
      }
    },

    startUpload(state, action) {
      const f = state.byId[action.payload];
      // Idempotency guard: only a pending file may be promoted. This is what
      // lets the scheduler's pump() run after every event without ever
      // double-starting a file that's already uploading.
      if (f && f.status === STATUS.PENDING) {
        f.status = STATUS.UPLOADING;
        f.error = null;
      }
    },

    chunkProgress(state, action) {
      const { id, chunksDone } = action.payload;
      const f = state.byId[id];
      if (f && f.status === STATUS.UPLOADING) f.chunksDone = chunksDone;
    },

    fileCompleted(state, action) {
      const f = state.byId[action.payload];
      if (f) {
        f.status = STATUS.COMPLETED;
        f.chunksDone = f.chunksTotal;
        f.error = null;
      }
    },

    fileFailed(state, action) {
      const { id, chunksDone, error } = action.payload;
      const f = state.byId[id];
      if (f) {
        f.status = STATUS.FAILED;
        // Keep the progress reached so retry resumes from here, not from zero.
        if (typeof chunksDone === 'number') f.chunksDone = chunksDone;
        f.error = error || 'Upload failed';
      }
    },

    retryReset(state, action) {
      const f = state.byId[action.payload];
      // failed -> pending, chunksDone untouched (the resume point).
      if (f && f.status === STATUS.FAILED) {
        f.status = STATUS.PENDING;
        f.error = null;
      }
    },

    fileRemoved(state, action) {
      const id = action.payload;
      if (state.byId[id]) {
        delete state.byId[id];
        state.allIds = state.allIds.filter((x) => x !== id);
      }
    },
  },
});

export const {
  filesAdded,
  startUpload,
  chunkProgress,
  fileCompleted,
  fileFailed,
  retryReset,
  fileRemoved,
} = filesSlice.actions;

export default filesSlice.reducer;

/* ---- selectors (derive, don't store) ---- */

export const selectAllIds = (state) => state.files.allIds;
export const selectFileById = (id) => (state) => state.files.byId[id];

export const selectProgress = (file) =>
  file && file.chunksTotal ? Math.round((file.chunksDone / file.chunksTotal) * 100) : 0;

export const selectActiveCount = (state) => {
  let n = 0;
  for (const id of state.files.allIds) {
    if (state.files.byId[id].status === STATUS.UPLOADING) n++;
  }
  return n;
};

export const selectCounts = (state) => {
  const counts = { pending: 0, uploading: 0, completed: 0, failed: 0, total: 0 };
  for (const id of state.files.allIds) {
    counts[state.files.byId[id].status]++;
    counts.total++;
  }
  return counts;
};

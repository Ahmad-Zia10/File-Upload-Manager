import { nanoid } from '@reduxjs/toolkit';
import { MAX_CONCURRENT, CHUNKS_PER_FILE, PROGRESS_THROTTLE_MS, STATUS } from './constants';
import { uploadChunk, isAbortError } from './uploader';
import { register, remove, abort, renewController, getSignal } from './uploadRegistry';
import {
  filesAdded,
  startUpload,
  chunkProgress,
  fileCompleted,
  fileFailed,
  retryReset,
  fileRemoved,
  selectActiveCount,
} from './filesSlice';

/*
  Orchestration is the actual hard part of this app. State-wise a file is just a
  status; the interesting question is "what should start next when something
  finishes, fails, or is cancelled?" The answer is one idempotent function,
  pump(), called after every event — not a bespoke queue object.

  pump() reads the world, tops up the uploading set to the concurrency limit,
  and stops. Because startUpload() only promotes a *pending* file, pump can be
  called any number of times, from anywhere, without ever double-starting a
  file. Every event handler ends by calling pump(); nothing else schedules.
*/

// Fill empty slots up to MAX_CONCURRENT with pending files, in insertion order.
export const pump = () => (dispatch, getState) => {
  const state = getState();
  let active = selectActiveCount(state);

  for (const id of state.files.allIds) {
    if (active >= MAX_CONCURRENT) break;
    if (state.files.byId[id].status === STATUS.PENDING) {
      dispatch(startUpload(id)); // synchronous: pending -> uploading
      dispatch(runUpload(id)); // async: fire and forget
      active++;
    }
  }
};

// The per-file upload loop. Walks chunks from the current resume point to the
// end, honouring cancellation and reporting progress (throttled). On failure it
// records the reached chunk so retry can resume; either way it re-pumps so the
// freed slot is filled.
export const runUpload = (id) => async (dispatch, getState) => {
  const file = getState().files.byId[id];
  if (!file) return;

  const total = file.chunksTotal;
  let done = file.chunksDone; // resume point (0 on first run, k after a retry)
  let lastDispatch = 0;

  for (let i = done; i < total; i++) {
    try {
      await uploadChunk(id, i, { signal: getSignal(id) });
    } catch (err) {
      if (isAbortError(err)) return; // cancelled — file already removed elsewhere
      dispatch(fileFailed({ id, chunksDone: done, error: err.message }));
      dispatch(pump());
      return;
    }

    done = i + 1;

    // Throttle progress dispatches: at most one per file per interval. The final
    // value is flushed by fileCompleted below, so skipping the tail is safe.
    const now = Date.now();
    if (done < total && now - lastDispatch >= PROGRESS_THROTTLE_MS) {
      lastDispatch = now;
      dispatch(chunkProgress({ id, chunksDone: done }));
    }
  }

  dispatch(fileCompleted(id));
  dispatch(pump());
};

// Intake: stash the File + a controller in the registry, add metadata, pump.
export const addFiles = (fileList) => (dispatch) => {
  const metas = [];
  for (const file of fileList) {
    const id = nanoid();
    register(id, file);
    metas.push({ id, name: file.name, size: file.size, chunksTotal: CHUNKS_PER_FILE });
  }
  if (metas.length) {
    dispatch(filesAdded(metas));
    dispatch(pump());
  }
};

// Cancel works on a queued OR an uploading file. Aborting rejects the in-flight
// chunk (runUpload returns without marking failure); removing it frees any slot;
// pump promotes the next pending file.
export const cancelUpload = (id) => (dispatch) => {
  abort(id);
  remove(id);
  dispatch(fileRemoved(id));
  dispatch(pump());
};

// Retry a failed file. A used AbortController stays aborted, so mint a fresh
// one; reset failed -> pending while keeping chunksDone (the resume point); pump.
export const retryUpload = (id) => (dispatch) => {
  renewController(id);
  dispatch(retryReset(id));
  dispatch(pump());
};

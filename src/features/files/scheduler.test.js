import { describe, it, expect, beforeEach, vi } from 'vitest';

// Replace the simulated uploader with a controllable stub. By default a chunk
// upload never settles, so runUpload suspends at its first `await` — every file
// promoted by pump() stays in `uploading`, letting us assert the scheduler's
// synchronous promotion logic without real timers.
const uploadChunk = vi.fn(() => new Promise(() => {}));
vi.mock('./uploader', () => ({
  uploadChunk: (...args) => uploadChunk(...args),
  isAbortError: (e) => e && e.name === 'AbortError',
  setConditionsSource: () => {},
}));

import { makeStore } from '../../store';
import { addFiles, cancelUpload, retryUpload, pump } from './scheduler';
import { fileCompleted, fileFailed, selectActiveCount, selectCounts } from './filesSlice';
import { STATUS, MAX_CONCURRENT } from './constants';
import { _clear as clearRegistry } from './uploadRegistry';

const fakeFiles = (n) =>
  Array.from({ length: n }, (_, i) => ({ name: `file-${i}.bin`, size: 1024 * (i + 1) }));

const idsWithStatus = (store, status) =>
  store.getState().files.allIds.filter((id) => store.getState().files.byId[id].status === status);

let store;
beforeEach(() => {
  clearRegistry();
  uploadChunk.mockClear();
  uploadChunk.mockImplementation(() => new Promise(() => {}));
  store = makeStore();
});

describe('scheduler', () => {
  it('never runs more than MAX_CONCURRENT uploads at once', () => {
    store.dispatch(addFiles(fakeFiles(5)));

    expect(selectActiveCount(store.getState())).toBe(MAX_CONCURRENT);
    expect(selectCounts(store.getState()).pending).toBe(5 - MAX_CONCURRENT);
  });

  it('promotes exactly one queued file when an active one completes', () => {
    store.dispatch(addFiles(fakeFiles(4))); // 3 uploading, 1 queued
    const [active] = idsWithStatus(store, STATUS.UPLOADING);

    store.dispatch(fileCompleted(active));
    store.dispatch(pump());

    expect(store.getState().files.byId[active].status).toBe(STATUS.COMPLETED);
    expect(selectActiveCount(store.getState())).toBe(MAX_CONCURRENT); // slot refilled
    expect(selectCounts(store.getState()).pending).toBe(0); // the one queued got promoted
  });

  it('frees a slot when an active upload is cancelled', () => {
    store.dispatch(addFiles(fakeFiles(4))); // 3 uploading, 1 queued
    const active = idsWithStatus(store, STATUS.UPLOADING);
    const queued = idsWithStatus(store, STATUS.PENDING)[0];

    store.dispatch(cancelUpload(active[0]));

    expect(store.getState().files.byId[active[0]]).toBeUndefined(); // removed
    expect(store.getState().files.byId[queued].status).toBe(STATUS.UPLOADING); // promoted
    expect(selectActiveCount(store.getState())).toBe(MAX_CONCURRENT);
  });

  it('resumes a retried upload from the last completed chunk, not from zero', () => {
    store.dispatch(addFiles(fakeFiles(1))); // 1 uploading
    const [id] = idsWithStatus(store, STATUS.UPLOADING);

    // Pretend it failed after 7 chunks.
    store.dispatch(fileFailed({ id, chunksDone: 7, error: 'boom' }));
    expect(store.getState().files.byId[id].status).toBe(STATUS.FAILED);

    uploadChunk.mockClear();
    store.dispatch(retryUpload(id));

    // runUpload calls uploadChunk synchronously before its first await, so the
    // very first chunk requested must be index 7 — the resume point.
    expect(uploadChunk).toHaveBeenCalledTimes(1);
    expect(uploadChunk.mock.calls[0][1]).toBe(7);
  });

  it('cancelling a queued file does not disturb the active ones', () => {
    store.dispatch(addFiles(fakeFiles(5))); // 3 uploading, 2 queued
    const activeBefore = idsWithStatus(store, STATUS.UPLOADING);
    const queued = idsWithStatus(store, STATUS.PENDING);

    store.dispatch(cancelUpload(queued[0]));

    const activeAfter = idsWithStatus(store, STATUS.UPLOADING);
    expect(activeAfter).toEqual(activeBefore); // same three, same order
    expect(selectActiveCount(store.getState())).toBe(MAX_CONCURRENT);
    expect(selectCounts(store.getState()).pending).toBe(1); // one queued left, not promoted
  });
});

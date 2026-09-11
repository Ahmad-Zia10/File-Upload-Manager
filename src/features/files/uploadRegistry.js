/*
  Redux state must stay serializable, but a File object and its AbortController
  are not. So they live here, in a plain module-level Map keyed by the same id
  used in the store. The store holds metadata (name, size, status, chunks); this
  holds the two live handles the uploader needs. One id, two homes.
*/

const registry = new Map();

export function register(id, file) {
  registry.set(id, { file, controller: new AbortController() });
}

export function getFile(id) {
  return registry.get(id)?.file;
}

export function getSignal(id) {
  return registry.get(id)?.controller.signal;
}

// Cancel aborts the in-flight chunk; retry needs a fresh controller because a
// used AbortController stays aborted forever.
export function abort(id) {
  registry.get(id)?.controller.abort();
}

export function renewController(id) {
  const entry = registry.get(id);
  if (entry) entry.controller = new AbortController();
}

export function remove(id) {
  registry.delete(id);
}

// Test-only: wipe state between cases.
export function _clear() {
  registry.clear();
}

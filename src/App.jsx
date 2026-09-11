import { useSelector, useDispatch } from 'react-redux';
import { selectAllIds, selectCounts } from './features/files/filesSlice';
import { STATUS } from './features/files/constants';
import { cancelUpload } from './features/files/scheduler';
import { store } from './store';
import { dotStyle } from './components/statusVisuals';
import DropZone from './components/DropZone';
import FileList from './components/FileList';
import DevPanel from './components/DevPanel';
import ThemeToggle from './components/ThemeToggle';

const TALLIES = [
  { status: STATUS.UPLOADING, key: 'uploading', label: 'uploading' },
  { status: STATUS.PENDING, key: 'pending', label: 'queued' },
  { status: STATUS.COMPLETED, key: 'completed', label: 'done' },
  { status: STATUS.FAILED, key: 'failed', label: 'failed' },
];

function Tallies() {
  const counts = useSelector(selectCounts);
  return (
    <div className="flex flex-wrap gap-[18px] px-0.5 pb-1.5 pt-[18px]">
      {TALLIES.map((t) => (
        <div key={t.key} className="flex items-center gap-[7px]">
          <span style={dotStyle(t.status, 9)} />
          <span className="tabular font-mono text-[13px] font-medium">{counts[t.key]}</span>
          <span className="text-[13px] text-muted">{t.label}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-1.5 px-5 pb-[34px] pt-11 text-center">
      <div className="mb-2 h-12 w-12 rounded-[10px] border-[1.5px] border-dashed border-line-strong" />
      <span className="text-[16px] font-medium">No files yet</span>
      <span className="max-w-[280px] text-[13.5px] text-muted">
        Drop files above or click to browse. You'll see each one's progress and can retry or cancel
        any single file.
      </span>
    </div>
  );
}

// Visually hidden, polite live region: screen readers hear the tally change.
function LiveStatus() {
  const c = useSelector(selectCounts);
  const message =
    c.total === 0
      ? ''
      : `${c.uploading} uploading, ${c.pending} queued, ${c.completed} completed, ${c.failed} failed.`;
  return (
    <p aria-live="polite" className="sr-only">
      {message}
    </p>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const ids = useSelector(selectAllIds);
  const counts = useSelector(selectCounts);
  const hasFiles = ids.length > 0;

  function clearCompleted() {
    for (const id of selectAllIds(store.getState())) {
      if (store.getState().files.byId[id].status === STATUS.COMPLETED) dispatch(cancelUpload(id));
    }
  }

  return (
    <div className="flex min-h-full w-full justify-start px-4" style={{ padding: 'clamp(16px,5vw,56px) 16px' }}>
      <main
        className="mx-auto w-full max-w-[600px] overflow-hidden rounded-2xl border border-line bg-surface"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,.04), 0 12px 32px -12px var(--shadow)' }}
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-[22px] py-5">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[21px] font-semibold tracking-[-0.2px]">Upload</h1>
            <span className="text-[13px] text-muted">
              Files transfer in 20 chunks — watch each one land.
            </span>
          </div>
          <ThemeToggle />
        </header>

        <div className="px-[22px] pb-[22px] pt-[18px]">
          <DropZone />

          {hasFiles ? (
            <>
              <Tallies />
              <FileList />
              {counts.completed > 0 && (
                <div className="flex justify-end pt-3.5">
                  <button
                    type="button"
                    onClick={clearCompleted}
                    className="rounded-lg border border-line-strong bg-transparent px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:border-muted hover:text-[color:var(--text)]"
                  >
                    Clear completed
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState />
          )}

          <DevPanel />
        </div>
      </main>
      <LiveStatus />
    </div>
  );
}

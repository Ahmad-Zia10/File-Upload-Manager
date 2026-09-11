import { useSelector, useDispatch } from 'react-redux';
import { selectFileById, selectProgress } from '../features/files/filesSlice';
import { STATUS } from '../features/files/constants';
import { cancelUpload, retryUpload } from '../features/files/scheduler';
import { formatBytes } from '../utils/formatBytes';
import { dotStyle } from './statusVisuals';
import SegmentedBar from './SegmentedBar';

const STATUS_LABEL = {
  [STATUS.PENDING]: 'Queued',
  [STATUS.UPLOADING]: 'Uploading',
  [STATUS.COMPLETED]: 'Completed',
  [STATUS.FAILED]: 'Failed',
};

const STATUS_COLOR = {
  [STATUS.PENDING]: 'var(--queued)',
  [STATUS.UPLOADING]: 'var(--accent)',
  [STATUS.COMPLETED]: 'var(--done)',
  [STATUS.FAILED]: 'var(--failed)',
};

function Btn({ variant = 'ghost', onClick, label, children }) {
  const styles =
    variant === 'accent'
      ? 'border-accent text-accent hover:bg-accent-wash'
      : 'border-line-strong text-muted hover:text-[color:var(--text)] hover:border-muted';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={'rounded-lg border bg-transparent px-3 py-[5px] text-[13px] font-medium transition-colors ' + styles}
    >
      {children}
    </button>
  );
}

export default function FileRow({ id }) {
  const dispatch = useDispatch();
  // One subscription per row: this row re-renders only when THIS file changes.
  const file = useSelector(selectFileById(id));
  if (!file) return null;

  const { status, name, size, error, chunksDone, chunksTotal } = file;
  const progress = selectProgress(file);
  const canCancel = status === STATUS.UPLOADING || status === STATUS.PENDING;

  return (
    <li className="border-b border-line py-4 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[15px] font-medium" title={name}>
          {name}
        </span>
        <span className="tabular flex-none font-mono text-[12.5px] text-muted">
          {formatBytes(size)}
        </span>
      </div>

      <SegmentedBar status={status} chunksDone={chunksDone} chunksTotal={chunksTotal} />

      {status === STATUS.FAILED && error && (
        <div className="mt-[9px] text-[12.5px] text-failed">{error}</div>
      )}

      <div className="mt-[11px] flex items-center justify-between gap-3">
        <span
          className="inline-flex items-center gap-2 text-[13px] font-medium"
          style={{ color: STATUS_COLOR[status] }}
        >
          <span style={dotStyle(status, 11)} />
          {STATUS_LABEL[status]}
        </span>

        <div className="flex items-center gap-3">
          <span className="tabular min-w-[42px] text-right font-mono text-[13.5px] font-medium">
            {progress}%
          </span>
          <div className="flex gap-[6px]">
            {status === STATUS.FAILED && (
              <Btn variant="accent" label={`Retry ${name}`} onClick={() => dispatch(retryUpload(id))}>
                Retry
              </Btn>
            )}
            {canCancel && (
              <Btn label={`Cancel ${name}`} onClick={() => dispatch(cancelUpload(id))}>
                Cancel
              </Btn>
            )}
            {(status === STATUS.COMPLETED || status === STATUS.FAILED) && (
              <Btn label={`Remove ${name}`} onClick={() => dispatch(cancelUpload(id))}>
                Remove
              </Btn>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

import { STATUS } from '../features/files/constants';

/*
  One cell per chunk. Filled cells = chunksDone, so this isn't a decorative bar —
  it's a direct readout of real work. A pending file reads as all-outlined; an
  uploading file fills solid with the lead (in-flight) cell pulsing; a completed
  file is all green; a failed file shows the chunks it managed (dimmed) with a
  hatched cell marking where it stopped — which is exactly the resume point.
*/

const CELL = { flex: 1, height: '14px', borderRadius: '2px', boxSizing: 'border-box' };
const EMPTY = { ...CELL, border: '1px solid var(--line-strong)' };

function cellStyle(status, i, filled) {
  if (status === STATUS.COMPLETED) return { ...CELL, background: 'var(--done)' };
  if (status === STATUS.PENDING) return EMPTY;

  if (status === STATUS.UPLOADING) {
    if (i < filled - 1) return { ...CELL, background: 'var(--accent)' };
    if (i === filled - 1)
      return { ...CELL, background: 'var(--accent)', animation: 'leadPulse 1.3s ease-in-out infinite' };
    return EMPTY;
  }

  // failed
  if (i < filled) return { ...CELL, background: 'var(--muted)', opacity: 0.4 };
  if (i === filled)
    return {
      ...CELL,
      background: 'repeating-linear-gradient(45deg,var(--failed) 0 3px,transparent 3px 6px)',
      border: '1px solid var(--failed)',
    };
  return EMPTY;
}

export default function SegmentedBar({ status, chunksDone, chunksTotal }) {
  const filled = Math.max(0, Math.min(chunksTotal, chunksDone));
  const pct = Math.round((filled / chunksTotal) * 100);
  return (
    <div
      className="mt-3 flex w-full gap-[2px]"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: chunksTotal }, (_, i) => (
        <i key={i} style={cellStyle(status, i, filled)} />
      ))}
    </div>
  );
}

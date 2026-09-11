import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setFailureRate, setSpeed, setForceFailNext } from '../features/settings/settingsSlice';

function Row({ label, children, value }) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-24 flex-none text-[13px] text-muted">{label}</label>
      {children}
      <span className="tabular min-w-[44px] text-right font-mono text-[13px] font-medium">
        {value}
      </span>
    </div>
  );
}

export default function DevPanel() {
  const dispatch = useDispatch();
  const { failureRate, speed } = useSelector((s) => s.settings);
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 overflow-hidden rounded-[10px] border border-line bg-surface-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2.5 bg-transparent px-3.5 py-3 text-left text-muted"
      >
        <span className="text-[13.5px] font-medium">Simulator controls</span>
        <span
          className="font-mono text-[12px] transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-4 px-3.5 pb-4 pt-1">
          <Row label="Failure rate" value={`${Math.round(failureRate * 100)}%`}>
            <input
              type="range"
              min={0}
              max={0.9}
              step={0.05}
              value={failureRate}
              onChange={(e) => dispatch(setFailureRate(Number(e.target.value)))}
              className="flex-1"
              style={{ accentColor: 'var(--accent)' }}
              aria-label="Failure rate"
            />
          </Row>

          <Row label="Chunk speed" value={`${speed}×`}>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={speed}
              onChange={(e) => dispatch(setSpeed(Number(e.target.value)))}
              className="flex-1"
              style={{ accentColor: 'var(--accent)' }}
              aria-label="Chunk speed"
            />
          </Row>

          <button
            type="button"
            onClick={() => dispatch(setForceFailNext(true))}
            className="self-start rounded-lg border border-line-strong bg-surface px-3 py-[7px] text-[13px] font-medium transition-colors hover:border-failed hover:text-failed"
          >
            Force-fail next chunk
          </button>
        </div>
      )}
    </div>
  );
}

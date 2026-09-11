import { STATUS } from '../features/files/constants';

/*
  The status shapes, in one place so a row dot and a tally dot can't drift apart.
  Circle for queued (outlined) / uploading / completed; a rotated square
  (diamond) for failed — so status reads without relying on colour alone.
  `size` is the circle diameter in px; the diamond is one px smaller.
*/
export function dotStyle(status, size = 11) {
  const base = { flex: 'none' };
  if (status === STATUS.FAILED) {
    const s = size - 1;
    return {
      ...base,
      width: `${s}px`,
      height: `${s}px`,
      background: 'var(--failed)',
      transform: 'rotate(45deg)',
      borderRadius: '2px',
    };
  }
  const circle = { ...base, width: `${size}px`, height: `${size}px`, borderRadius: '50%' };
  if (status === STATUS.PENDING) {
    return { ...circle, background: 'transparent', border: '1.5px solid var(--queued)' };
  }
  if (status === STATUS.COMPLETED) return { ...circle, background: 'var(--done)' };
  return { ...circle, background: 'var(--accent)' }; // uploading
}

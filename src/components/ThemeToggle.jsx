import { useState } from 'react';

function apply(dark) {
  document.documentElement.classList.toggle('dark', dark);
  try {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  } catch (e) {}
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  function set(next) {
    apply(next);
    setDark(next);
  }

  const seg = (active) =>
    'rounded-md px-3 py-[5px] text-[13px] font-medium transition-colors ' +
    (active ? 'bg-surface text-[color:var(--text)] shadow-sm' : 'text-muted');

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex gap-[3px] rounded-[9px] border border-line bg-surface-2 p-[3px]"
    >
      <button type="button" onClick={() => set(false)} aria-pressed={!dark} className={seg(!dark)}>
        Light
      </button>
      <button type="button" onClick={() => set(true)} aria-pressed={dark} className={seg(dark)}>
        Dark
      </button>
    </div>
  );
}

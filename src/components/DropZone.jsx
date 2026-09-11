import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addFiles } from '../features/files/scheduler';

export default function DropZone() {
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function onFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length) dispatch(addFiles(files));
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Add files. Drop files here, or activate to browse."
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onFiles(e.dataTransfer.files);
      }}
      className={
        'flex cursor-pointer flex-col items-center gap-1 rounded-xl border-[1.5px] border-dashed px-5 py-[26px] text-center transition-colors ' +
        (dragging ? 'border-accent bg-accent-wash' : 'border-line-strong hover:border-accent hover:bg-accent-wash')
      }
    >
      <span className="text-[16px] font-medium">Drop files to upload</span>
      <span className="text-[13.5px] text-muted">or click to browse</span>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

import { useSelector } from 'react-redux';
import { selectAllIds } from '../features/files/filesSlice';
import FileRow from './FileRow';

export default function FileList() {
  const ids = useSelector(selectAllIds);
  return (
    <ul className="mt-[10px] border-t border-line">
      {ids.map((id) => (
        <FileRow key={id} id={id} />
      ))}
    </ul>
  );
}

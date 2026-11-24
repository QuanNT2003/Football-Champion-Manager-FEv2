import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { SquadSort, SquadSortKey } from '../../utils/squadSorting';
import './SquadSortHeader.css';

interface Props {
  sortKey: SquadSortKey;
  sort: SquadSort;
  onSort: (key: SquadSortKey) => void;
  children: ReactNode;
}

export function SquadSortHeader({ sortKey, sort, onSort, children }: Props) {
  const active = sort.key === sortKey;
  const Icon = active ? (sort.direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return <th scope="col" aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
    <button type="button" className={`squad-sort-header${active ? ' is-active' : ''}`} onClick={() => onSort(sortKey)}>
      {children}<Icon size={13} aria-hidden="true" />
    </button>
  </th>;
}

import { type Table } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';

import { TableHeadRow } from './TableHeadRow';

export type DataTableHeadProps = {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  table: Table<any>;
  virtualPaddingLeft?: number;
  virtualPaddingRight?: number;
  isSticky?: boolean;
  onHeightChange?: (px: number) => void;
  /** Whether to virtualize center columns rendering */
  virtualizeColumns?: boolean;
};

export const DataTableHead = ({
  columnVirtualizer,
  table,
  virtualPaddingLeft,
  virtualPaddingRight,
  isSticky,
  onHeightChange,
  virtualizeColumns,
}: DataTableHeadProps) => {
  return (
    <thead
      ref={(node) => {
        if (node && onHeightChange) onHeightChange(node.getBoundingClientRect().height);
      }}
      style={{
        display: 'grid',
        position: isSticky ? 'sticky' : 'relative',
        top: isSticky ? 0 : undefined,
        zIndex: isSticky ? 3 : 1,
        background: isSticky ? 'white' : undefined,
      }}
    >
      {table.getHeaderGroups().map((headerGroup) => (
        <TableHeadRow
          key={headerGroup.id}
          columnVirtualizer={columnVirtualizer}
          headerGroup={headerGroup}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
          virtualizeColumns={virtualizeColumns}
        />
      ))}
    </thead>
  );
};

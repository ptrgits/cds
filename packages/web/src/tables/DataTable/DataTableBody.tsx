import { useLayoutEffect } from 'react';
import { type Row, type Table } from '@tanstack/react-table';
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';

import { defaultVirtualRowsOverscan } from './DataTable';
import { DataTableBodyRow } from './DataTableBodyRow';

export type DataTableBodyProps = {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  table: Table<any>;
  tableContainerRef: React.RefObject<HTMLDivElement>;
  virtualPaddingLeft: number | undefined;
  virtualPaddingRight: number | undefined;
  headerOffsetTop?: number;
  /** Whether to virtualize center columns rendering */
  virtualizeColumns?: boolean;
  /** Whether to virtualize center rows rendering */
  virtualizeRows?: boolean;
};

export const DataTableBody = ({
  columnVirtualizer,
  table,
  tableContainerRef,
  virtualPaddingLeft,
  virtualPaddingRight,
  headerOffsetTop = 0,
  virtualizeColumns,
  virtualizeRows,
}: DataTableBodyProps) => {
  const { rows } = table.getRowModel();
  const topRows = rows.filter((r) => r.getIsPinned?.() === 'top');
  const bottomRows = rows.filter((r) => r.getIsPinned?.() === 'bottom');
  const centerRows = rows.filter((r) => !r.getIsPinned?.());

  //dynamic row height virtualization - alternatively you could use a simpler fixed row height strategy without the need for `measureElement`
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: centerRows.length,
    estimateSize: () => 33, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: defaultVirtualRowsOverscan,
  });

  useLayoutEffect(() => {
    if (!virtualizeRows) return;
    rowVirtualizer.measure();
  }, [rowVirtualizer, virtualizeRows, rows]);

  // `useVirtualizer` keeps the same instance reference while mutating internal state on scroll.
  // Memoizing these values would freeze them after the first render, so call the getters directly.
  const virtualRowsItems = virtualizeRows ? rowVirtualizer.getVirtualItems() : [];
  const virtualRowsTotalSize = virtualizeRows ? rowVirtualizer.getTotalSize() : 0;

  return (
    <>
      {/* Top pinned rows */}
      {topRows.length > 0 && (
        <tbody
          style={{
            background: 'white',
            display: 'grid',
            position: 'sticky',
            top: headerOffsetTop,
            zIndex: 3,
          }}
        >
          {topRows.map((row, i) => (
            <DataTableBodyRow
              key={row.id}
              staticPosition
              columnVirtualizer={columnVirtualizer}
              row={row}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
              virtualizeColumns={virtualizeColumns}
            />
          ))}
        </tbody>
      )}

      {/* Center rows */}
      {virtualizeRows ? (
        <tbody
          style={{
            display: 'grid',
            height: `${virtualRowsTotalSize}px`,
            position: 'relative',
          }}
        >
          {virtualRowsItems.map((virtualRow) => {
            const row = centerRows[virtualRow.index] as Row<any>;
            return (
              <DataTableBodyRow
                key={row.id}
                columnVirtualizer={columnVirtualizer}
                row={row}
                rowVirtualizer={rowVirtualizer}
                virtualPaddingLeft={virtualPaddingLeft}
                virtualPaddingRight={virtualPaddingRight}
                virtualRow={virtualRow}
                virtualizeColumns={virtualizeColumns}
              />
            );
          })}
        </tbody>
      ) : (
        <tbody
          style={{
            display: 'grid',
          }}
        >
          {centerRows.map((row) => (
            <DataTableBodyRow
              key={row.id}
              staticPosition
              columnVirtualizer={columnVirtualizer}
              row={row}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
              virtualizeColumns={virtualizeColumns}
            />
          ))}
        </tbody>
      )}

      {/* Bottom pinned rows */}
      {bottomRows.length > 0 && (
        <tbody
          style={{
            background: 'white',
            display: 'grid',
            position: 'sticky',
            bottom: 0,
            zIndex: 3,
          }}
        >
          {bottomRows.map((row, i) => (
            <DataTableBodyRow
              key={row.id}
              staticPosition
              columnVirtualizer={columnVirtualizer}
              row={row}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
              virtualizeColumns={virtualizeColumns}
            />
          ))}
        </tbody>
      )}
    </>
  );
};

import { type Row, type Table } from '@tanstack/react-table';
import { useVirtualizer, type VirtualItem, type Virtualizer } from '@tanstack/react-virtual';

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
    overscan: 10,
  });

  const virtualRowsItems = rowVirtualizer.getVirtualItems();
  let virtualPaddingTop: number | undefined;
  let virtualPaddingBottom: number | undefined;

  if (virtualizeRows && rowVirtualizer && virtualRowsItems?.length) {
    virtualPaddingTop = virtualRowsItems[0]?.start ?? 0;
    virtualPaddingBottom =
      rowVirtualizer.getTotalSize() - (virtualRowsItems[virtualRowsItems.length - 1]?.end ?? 0);
  }

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
              rowVirtualizer={virtualizeRows ? rowVirtualizer : undefined}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
              virtualRow={
                virtualizeRows
                  ? ({ index: i, key: i, start: 0, size: 0 } as unknown as VirtualItem)
                  : undefined
              }
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
          }}
        >
          {virtualPaddingTop ? (
            //fake empty row at the top for virtualization scroll padding
            <tr style={{ display: 'flex', width: '100%', height: virtualPaddingTop }}>
              <td style={{ display: 'flex', height: virtualPaddingTop, width: '100%' }} />
            </tr>
          ) : null}
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
          {virtualPaddingBottom ? (
            //fake empty row at the bottom for virtualization scroll padding
            <tr style={{ display: 'flex', width: '100%', height: virtualPaddingBottom }}>
              <td style={{ display: 'flex', height: virtualPaddingBottom, width: '100%' }} />
            </tr>
          ) : null}
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
              rowVirtualizer={virtualizeRows ? rowVirtualizer : undefined}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
              virtualRow={
                virtualizeRows
                  ? ({ index: i, key: i, start: 0, size: 0 } as unknown as VirtualItem)
                  : undefined
              }
              virtualizeColumns={virtualizeColumns}
            />
          ))}
        </tbody>
      )}
    </>
  );
};

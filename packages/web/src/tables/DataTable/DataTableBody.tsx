import type { HTMLAttributes } from 'react';
import { type Cell, flexRender, type Row, type Table } from '@tanstack/react-table';
import { useVirtualizer, type VirtualItem, type Virtualizer } from '@tanstack/react-virtual';

import { actionsColumnWidth, getColumnPinningStyles } from './getColumnPinningStyles';

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

export type DataTableBodyRowProps = {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  row: Row<any>;
  rowVirtualizer?: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
  virtualPaddingLeft: number | undefined;
  virtualPaddingRight: number | undefined;
  virtualRow?: VirtualItem;
  staticPosition?: boolean;
  virtualizeColumns?: boolean;
};

export type DataTableBodyCellProps = HTMLAttributes<HTMLTableCellElement> & {
  cell: Cell<any, unknown>;
  leftOffset?: number;
};

export const DataTableBodyCell = ({ cell, leftOffset, ...props }: DataTableBodyCellProps) => {
  return (
    <td
      key={cell.id}
      {...props}
      style={{
        display: 'flex',
        width: cell.column.getSize(),
        backgroundColor: 'white',
        ...getColumnPinningStyles(cell.column, leftOffset),
      }}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );
};

export const DataTableBodyRow = ({
  columnVirtualizer,
  row,
  rowVirtualizer,
  virtualPaddingLeft,
  virtualPaddingRight,
  virtualRow,
  staticPosition = false,
  virtualizeColumns,
}: DataTableBodyRowProps) => {
  const visibleCells = row.getVisibleCells();
  const leftCells = visibleCells.filter((c) => c.column.getIsPinned() === 'left');
  const centerCells = visibleCells.filter((c) => !c.column.getIsPinned());
  const rightCells = visibleCells.filter((c) => c.column.getIsPinned() === 'right');
  return (
    <tr
      key={row.id}
      ref={
        staticPosition || !rowVirtualizer
          ? undefined
          : (node) => rowVirtualizer.measureElement(node)
      } //measure dynamic row height
      data-index={staticPosition || !virtualRow ? undefined : virtualRow.index} //needed for dynamic row height measurement
      style={{
        display: 'flex',
        width: '100%',
      }}
    >
      {/* Row actions sticky column */}
      <td
        style={{
          backgroundColor: 'white',
          display: 'flex',
          gap: 4,
          left: 0,
          position: 'sticky',
          width: actionsColumnWidth,
          zIndex: 2,
        }}
      >
        {row.getIsPinned?.() !== 'top' ? (
          <button
            onClick={() => row.pin('top')}
            style={{ border: '1px solid', borderRadius: 4, paddingInline: 8 }}
          >
            Top
          </button>
        ) : null}
        {row.getIsPinned?.() ? (
          <button
            onClick={() => row.pin(false)}
            style={{ border: '1px solid', borderRadius: 4, paddingInline: 8 }}
          >
            Unpin
          </button>
        ) : null}
        {row.getIsPinned?.() !== 'bottom' ? (
          <button
            onClick={() => row.pin('bottom')}
            style={{ border: '1px solid', borderRadius: 4, paddingInline: 8 }}
          >
            Bottom
          </button>
        ) : null}
      </td>
      {/* Left pinned */}
      {leftCells.map((cell) => (
        <DataTableBodyCell key={cell.id} cell={cell} leftOffset={actionsColumnWidth} />
      ))}
      {virtualizeColumns && virtualPaddingLeft ? (
        //fake empty column to the left for virtualization scroll padding
        <td style={{ display: 'flex', width: virtualPaddingLeft }} />
      ) : null}
      {virtualizeColumns
        ? columnVirtualizer.getVirtualItems().map((virtualColumn) => {
            const cell = centerCells[virtualColumn.index];
            if (!cell) return null;
            return <DataTableBodyCell key={cell.id} cell={cell} />;
          })
        : centerCells.map((cell) => <DataTableBodyCell key={cell.id} cell={cell} />)}
      {virtualizeColumns && virtualPaddingRight ? (
        //fake empty column to the right for virtualization scroll padding
        <td style={{ display: 'flex', width: virtualPaddingRight }} />
      ) : null}
      {/* Right pinned */}
      {rightCells.map((cell) => (
        <DataTableBodyCell key={cell.id} cell={cell} />
      ))}
    </tr>
  );
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

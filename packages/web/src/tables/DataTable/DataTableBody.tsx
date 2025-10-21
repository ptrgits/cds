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
};

export type DataTableBodyRowProps = {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  row: Row<any>;
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
  virtualPaddingLeft: number | undefined;
  virtualPaddingRight: number | undefined;
  virtualRow: VirtualItem;
  staticPosition?: boolean;
};

export type DataTableBodyCellProps = {
  cell: Cell<any, unknown>;
  leftOffset?: number;
};

export const DataTableBodyCell = ({ cell, leftOffset }: DataTableBodyCellProps) => {
  return (
    <td
      key={cell.id}
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
}: DataTableBodyRowProps) => {
  const visibleCells = row.getVisibleCells();
  const virtualColumns = columnVirtualizer.getVirtualItems();
  const leftCells = visibleCells.filter((c) => c.column.getIsPinned() === 'left');
  const centerCells = visibleCells.filter((c) => !c.column.getIsPinned());
  const rightCells = visibleCells.filter((c) => c.column.getIsPinned() === 'right');
  return (
    <tr
      key={row.id}
      ref={staticPosition ? undefined : (node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
      data-index={staticPosition ? undefined : virtualRow.index} //needed for dynamic row height measurement
      style={{
        display: 'flex',
        position: staticPosition ? 'relative' : 'absolute',
        transform: staticPosition ? undefined : `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
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
      {virtualPaddingLeft ? (
        //fake empty column to the left for virtualization scroll padding
        <td style={{ display: 'flex', width: virtualPaddingLeft }} />
      ) : null}
      {virtualColumns.map((virtualColumn) => {
        const cell = centerCells[virtualColumn.index];
        if (!cell) return null;
        return <DataTableBodyCell key={cell.id} cell={cell} />;
      })}
      {virtualPaddingRight ? (
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
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

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
            zIndex: 1,
          }}
        >
          {topRows.map((row, i) => (
            <DataTableBodyRow
              key={row.id}
              staticPosition
              columnVirtualizer={columnVirtualizer}
              row={row}
              rowVirtualizer={rowVirtualizer}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
              virtualRow={{ index: i, key: i, start: 0, size: 0 } as unknown as VirtualItem}
            />
          ))}
        </tbody>
      )}

      {/* Center virtualized rows */}
      <tbody
        style={{
          display: 'grid',
          height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
          position: 'relative', //needed for absolute positioning of rows
        }}
      >
        {virtualRows.map((virtualRow) => {
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
            />
          );
        })}
      </tbody>

      {/* Bottom pinned rows */}
      {bottomRows.length > 0 && (
        <tbody
          style={{
            background: 'white',
            display: 'grid',
            position: 'sticky',
            bottom: 0,
            zIndex: 1,
          }}
        >
          {bottomRows.map((row, i) => (
            <DataTableBodyRow
              key={row.id}
              staticPosition
              columnVirtualizer={columnVirtualizer}
              row={row}
              rowVirtualizer={rowVirtualizer}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
              virtualRow={{ index: i, key: i, start: 0, size: 0 } as unknown as VirtualItem}
            />
          ))}
        </tbody>
      )}
    </>
  );
};

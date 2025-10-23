import type { HTMLAttributes } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Cell, flexRender, type Row, type Table } from '@tanstack/react-table';
import { useVirtualizer, type VirtualItem, type Virtualizer } from '@tanstack/react-virtual';

import { actionsColumnWidth, getColumnPinningStyles } from './getColumnPinningStyles';

export type DataTableBodyProps = {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  dragActiveColId?: string;
  dragOverColId?: string;
  table: Table<any>;
  tableContainerRef: React.RefObject<HTMLDivElement>;
  virtualPaddingLeft: number | undefined;
  virtualPaddingRight: number | undefined;
  headerOffsetTop?: number;
};

export type DataTableBodyRowProps = {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  dragActiveColId?: string;
  dragOverColId?: string;
  row: Row<any>;
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
  virtualPaddingLeft: number | undefined;
  virtualPaddingRight: number | undefined;
  virtualRow: VirtualItem;
  staticPosition?: boolean;
};

export type DataTableBodyCellProps = HTMLAttributes<HTMLTableCellElement> & {
  cell: Cell<any, unknown>;
  leftOffset?: number;
  isActiveCol?: boolean;
  isOverCol?: boolean;
};

export const DataTableBodyCell = ({
  cell,
  leftOffset,
  isActiveCol,
  isOverCol,
  ...props
}: DataTableBodyCellProps) => {
  return (
    <td
      key={cell.id}
      {...props}
      style={{
        display: 'flex',
        width: cell.column.getSize(),
        backgroundColor: isActiveCol ? 'rgba(0,0,0,0.06)' : 'white',
        borderInlineStart: isOverCol ? '1px dashed gray' : undefined,
        ...getColumnPinningStyles(cell.column, leftOffset),
      }}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );
};

export const DataTableBodyRow = ({
  columnVirtualizer,
  dragActiveColId,
  dragOverColId,
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
        <DataTableBodyCell
          key={cell.id}
          cell={cell}
          isActiveCol={cell.column.id === dragActiveColId}
          isOverCol={cell.column.id === dragOverColId}
          leftOffset={actionsColumnWidth}
        />
      ))}
      {virtualPaddingLeft ? (
        //fake empty column to the left for virtualization scroll padding
        <td style={{ display: 'flex', width: virtualPaddingLeft }} />
      ) : null}
      {virtualColumns.map((virtualColumn) => {
        const cell = centerCells[virtualColumn.index];
        if (!cell) return null;
        return (
          <DataTableBodyCell
            key={cell.id}
            cell={cell}
            isActiveCol={cell.column.id === dragActiveColId}
            isOverCol={cell.column.id === dragOverColId}
          />
        );
      })}
      {virtualPaddingRight ? (
        //fake empty column to the right for virtualization scroll padding
        <td style={{ display: 'flex', width: virtualPaddingRight }} />
      ) : null}
      {/* Right pinned */}
      {rightCells.map((cell) => (
        <DataTableBodyCell
          key={cell.id}
          cell={cell}
          isActiveCol={cell.column.id === dragActiveColId}
          isOverCol={cell.column.id === dragOverColId}
        />
      ))}
    </tr>
  );
};

type DraggableRowProps = Omit<DataTableBodyRowProps, 'staticPosition'>;

const DraggableDataTableBodyRow = ({
  columnVirtualizer,
  row,
  rowVirtualizer,
  virtualPaddingLeft,
  virtualPaddingRight,
  dragActiveColId,
  dragOverColId,
  virtualRow,
}: DraggableRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `row:${row.id}`,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 2 : 0,
    position: 'relative' as const,
  };

  const visibleCells = row.getVisibleCells();
  const virtualColumns = columnVirtualizer.getVirtualItems();
  const leftCells = visibleCells.filter((c) => c.column.getIsPinned() === 'left');
  const centerCells = visibleCells.filter((c) => !c.column.getIsPinned());
  const rightCells = visibleCells.filter((c) => c.column.getIsPinned() === 'right');

  return (
    <tr
      key={row.id}
      ref={(node) => {
        setNodeRef(node);
        rowVirtualizer.measureElement(node);
      }}
      data-index={virtualRow.index}
      style={{ display: 'flex', width: '100%', ...style }}
    >
      {/* Row actions sticky column with drag handle */}
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
        <button
          {...attributes}
          {...listeners}
          style={{ border: '1px solid', borderRadius: 4, paddingInline: 8 }}
        >
          🟰
        </button>
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
        <DataTableBodyCell
          key={cell.id}
          cell={cell}
          isActiveCol={cell.column.id === dragActiveColId}
          isOverCol={cell.column.id === dragOverColId}
          leftOffset={actionsColumnWidth}
        />
      ))}
      {virtualPaddingLeft ? (
        //fake empty column to the left for virtualization scroll padding
        <td style={{ display: 'flex', width: virtualPaddingLeft }} />
      ) : null}
      {virtualColumns.map((virtualColumn) => {
        const cell = centerCells[virtualColumn.index];
        if (!cell) return null;
        return (
          <DataTableBodyCell
            key={cell.id}
            cell={cell}
            isActiveCol={cell.column.id === dragActiveColId}
            isOverCol={cell.column.id === dragOverColId}
          />
        );
      })}
      {virtualPaddingRight ? (
        //fake empty column to the right for virtualization scroll padding
        <td style={{ display: 'flex', width: virtualPaddingRight }} />
      ) : null}
      {/* Right pinned */}
      {rightCells.map((cell) => (
        <DataTableBodyCell
          key={cell.id}
          cell={cell}
          isActiveCol={cell.column.id === dragActiveColId}
          isOverCol={cell.column.id === dragOverColId}
        />
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
  dragActiveColId,
  dragOverColId,
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
  let virtualPaddingTop: number | undefined;
  let virtualPaddingBottom: number | undefined;

  if (rowVirtualizer && virtualRows?.length) {
    virtualPaddingTop = virtualRows[0]?.start ?? 0;
    virtualPaddingBottom =
      rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end ?? 0);
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
              dragActiveColId={dragActiveColId}
              dragOverColId={dragOverColId}
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
        }}
      >
        {virtualPaddingTop ? (
          //fake empty row at the top for virtualization scroll padding
          <tr style={{ display: 'flex', width: '100%', height: virtualPaddingTop }}>
            <td style={{ display: 'flex', height: virtualPaddingTop, width: '100%' }} />
          </tr>
        ) : null}
        <SortableContext
          items={centerRows.map((r) => `row:${r.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {virtualRows.map((virtualRow) => {
            const row = centerRows[virtualRow.index] as Row<any>;
            return (
              <DraggableDataTableBodyRow
                key={row.id}
                columnVirtualizer={columnVirtualizer}
                dragActiveColId={dragActiveColId}
                dragOverColId={dragOverColId}
                row={row}
                rowVirtualizer={rowVirtualizer}
                virtualPaddingLeft={virtualPaddingLeft}
                virtualPaddingRight={virtualPaddingRight}
                virtualRow={virtualRow}
              />
            );
          })}
        </SortableContext>
        {virtualPaddingBottom ? (
          //fake empty row at the bottom for virtualization scroll padding
          <tr style={{ display: 'flex', width: '100%', height: virtualPaddingBottom }}>
            <td style={{ display: 'flex', height: virtualPaddingBottom, width: '100%' }} />
          </tr>
        ) : null}
      </tbody>

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
              dragActiveColId={dragActiveColId}
              dragOverColId={dragOverColId}
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

import type { HTMLAttributes } from 'react';
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, type Header, type HeaderGroup, type Table } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';

import { Box } from '../../layout';

import { actionsColumnWidth, getColumnPinningStyles } from './getColumnPinningStyles';

export type DataTableHeadProps = {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  dragActiveColId?: string;
  dragOverColId?: string;
  table: Table<any>;
  virtualPaddingLeft?: number;
  virtualPaddingRight?: number;
  isSticky?: boolean;
  onHeightChange?: (px: number) => void;
};

export type TableHeadRowProps = {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  dragActiveColId?: string;
  dragOverColId?: string;
  headerGroup: HeaderGroup<any>;
  virtualPaddingLeft?: number;
  virtualPaddingRight?: number;
};

export type TableHeadCellProps = HTMLAttributes<HTMLTableCellElement> & {
  header: Header<any, unknown>;
  leftOffset?: number;
  dragActiveColId?: string;
  dragOverColId?: string;
};

export const TableHeadCell = ({
  header,
  leftOffset = 0,
  dragActiveColId,
  dragOverColId,
  style: styleProp,
  ...props
}: TableHeadCellProps) => {
  const isPinned = header.column.getIsPinned();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `col:${header.column.id}`,
    disabled: Boolean(isPinned),
  });
  const style = {
    transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 3 : 1,
  };
  const isActive = dragActiveColId && dragActiveColId === header.column.id;
  const isOver = dragOverColId && dragOverColId === header.column.id && !isActive;
  if (isActive || isOver) {
    console.log('isActive', isActive);
    console.log('isOver', isOver);
  }
  return (
    <th
      key={header.id}
      {...props}
      ref={setNodeRef}
      style={{
        display: 'flex',
        width: header.getSize(),
        backgroundColor: 'white',
        ...getColumnPinningStyles(header.column, leftOffset),
        ...style,
        ...styleProp,
        ...(isActive ? { backgroundColor: 'rgba(0,0,0,0.1)' } : {}),
        ...(isOver ? { borderInlineStart: '1px dashed gray' } : {}),
      }}
    >
      <Box
        className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
        onClick={header.column.getToggleSortingHandler()}
      >
        {flexRender(header.column.columnDef.header, header.getContext())}
        {{
          asc: ' 🔼',
          desc: ' 🔽',
        }[header.column.getIsSorted() as string] ?? null}
      </Box>
      {!isPinned ? (
        <button
          {...attributes}
          {...listeners}
          style={{ border: '1px solid', marginInlineStart: 8, paddingInline: 8, borderRadius: 4 }}
        >
          =
        </button>
      ) : null}
      {!header.isPlaceholder && header.column.getCanPin() && (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginInlineStart: 8 }}>
          {header.column.getIsPinned() !== 'left' ? (
            <button
              onClick={() => {
                header.column.pin('left');
              }}
              style={{ border: '1px solid', borderRadius: 4, paddingInline: 8 }}
            >
              {'<='}
            </button>
          ) : null}
          {header.column.getIsPinned() ? (
            <button
              onClick={() => {
                header.column.pin(false);
              }}
              style={{ border: '1px solid', borderRadius: 4, paddingInline: 8 }}
            >
              X
            </button>
          ) : null}
          {header.column.getIsPinned() !== 'right' ? (
            <button
              onClick={() => {
                header.column.pin('right');
              }}
              style={{ border: '1px solid', borderRadius: 4, paddingInline: 8 }}
            >
              {'=>'}
            </button>
          ) : null}
        </div>
      )}
    </th>
  );
};

export const TableHeadRow = ({
  columnVirtualizer,
  dragActiveColId,
  dragOverColId,
  headerGroup,
  virtualPaddingLeft,
  virtualPaddingRight,
}: TableHeadRowProps) => {
  const virtualColumns = columnVirtualizer.getVirtualItems();
  const leftHeaders = headerGroup.headers.filter((h) => h.column.getIsPinned() === 'left');
  const centerHeaders = headerGroup.headers.filter((h) => !h.column.getIsPinned());
  const rightHeaders = headerGroup.headers.filter((h) => h.column.getIsPinned() === 'right');
  return (
    <tr key={headerGroup.id} style={{ display: 'flex', width: '100%' }}>
      {/* Row actions sticky column header */}
      <th
        style={{
          backgroundColor: 'white',
          display: 'flex',
          left: 0,
          position: 'sticky',
          width: actionsColumnWidth,
          zIndex: 3,
        }}
      >
        Row
      </th>
      {/* Left pinned */}
      {leftHeaders.map((header) => (
        <TableHeadCell
          key={header.id}
          dragActiveColId={dragActiveColId}
          dragOverColId={dragOverColId}
          header={header}
          leftOffset={actionsColumnWidth}
          style={{ zIndex: 3 }}
        />
      ))}
      {virtualPaddingLeft ? (
        //fake empty column to the left for virtualization scroll padding
        <th style={{ display: 'flex', width: virtualPaddingLeft }} />
      ) : null}
      <SortableContext
        items={centerHeaders.map((h) => `col:${h.column.id}`)}
        strategy={horizontalListSortingStrategy}
      >
        {virtualColumns.map((virtualColumn) => {
          const header = centerHeaders[virtualColumn.index];
          if (!header) return null;
          return (
            <TableHeadCell
              key={header.id}
              dragActiveColId={dragActiveColId}
              dragOverColId={dragOverColId}
              header={header}
            />
          );
        })}
      </SortableContext>
      {virtualPaddingRight ? (
        //fake empty column to the right for virtualization scroll padding
        <th style={{ display: 'flex', width: virtualPaddingRight }} />
      ) : null}
      {/* Right pinned */}
      {rightHeaders.map((header) => (
        <TableHeadCell
          key={header.id}
          dragActiveColId={dragActiveColId}
          dragOverColId={dragOverColId}
          header={header}
        />
      ))}
    </tr>
  );
};

export const DataTableHead = ({
  columnVirtualizer,
  table,
  virtualPaddingLeft,
  virtualPaddingRight,
  isSticky,
  onHeightChange,
  dragActiveColId,
  dragOverColId,
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
          dragActiveColId={dragActiveColId}
          dragOverColId={dragOverColId}
          headerGroup={headerGroup}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
        />
      ))}
    </thead>
  );
};

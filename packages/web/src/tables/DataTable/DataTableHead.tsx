import { flexRender, type Header, type HeaderGroup, type Table } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';

import { Box } from '../../layout';

import { getCommonPinningStyles } from './getCommonPinningStyles';

export type DataTableHeadProps = {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  table: Table<any>;
  virtualPaddingLeft?: number;
  virtualPaddingRight?: number;
};

export type TableHeadRowProps = {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  headerGroup: HeaderGroup<any>;
  virtualPaddingLeft?: number;
  virtualPaddingRight?: number;
};

export type TableHeadCellProps = {
  header: Header<any, unknown>;
};

export const TableHeadCell = ({ header }: TableHeadCellProps) => {
  return (
    <th
      key={header.id}
      style={{
        display: 'flex',
        width: header.getSize(),
        backgroundColor: 'white',
        ...getCommonPinningStyles(header.column),
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
      {/* Left pinned */}
      {leftHeaders.map((header) => (
        <TableHeadCell key={header.id} header={header} />
      ))}
      {virtualPaddingLeft ? (
        //fake empty column to the left for virtualization scroll padding
        <th style={{ display: 'flex', width: virtualPaddingLeft }} />
      ) : null}
      {virtualColumns.map((virtualColumn) => {
        const header = centerHeaders[virtualColumn.index];
        if (!header) return null;
        return <TableHeadCell key={header.id} header={header} />;
      })}
      {virtualPaddingRight ? (
        //fake empty column to the right for virtualization scroll padding
        <th style={{ display: 'flex', width: virtualPaddingRight }} />
      ) : null}
      {/* Right pinned */}
      {rightHeaders.map((header) => (
        <TableHeadCell key={header.id} header={header} />
      ))}
    </tr>
  );
};

export const DataTableHead = ({
  columnVirtualizer,
  table,
  virtualPaddingLeft,
  virtualPaddingRight,
}: DataTableHeadProps) => {
  return (
    <thead
      style={{
        display: 'grid',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}
    >
      {table.getHeaderGroups().map((headerGroup) => (
        <TableHeadRow
          key={headerGroup.id}
          columnVirtualizer={columnVirtualizer}
          headerGroup={headerGroup}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
        />
      ))}
    </thead>
  );
};

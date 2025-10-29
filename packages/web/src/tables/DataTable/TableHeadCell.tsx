import type { HTMLAttributes } from 'react';
import { flexRender, type Header } from '@tanstack/react-table';

import { Box } from '../../layout';

import { getColumnPinningStyles } from './getColumnPinningStyles';

export type TableHeadCellProps = HTMLAttributes<HTMLTableCellElement> & {
  header: Header<any, unknown>;
  leftOffset?: number;
};

export const TableHeadCell = ({
  header,
  leftOffset = 0,
  style: styleProp,
  ...props
}: TableHeadCellProps) => {
  const isPinned = header.column.getIsPinned();

  return (
    <th
      key={header.id}
      {...props}
      style={{
        display: 'flex',
        width: header.getSize(),
        backgroundColor: 'white',
        ...getColumnPinningStyles(header.column, leftOffset),
        ...styleProp,
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
          {isPinned !== 'left' ? (
            <button
              onClick={() => {
                header.column.pin('left');
              }}
              style={{ border: '1px solid', borderRadius: 4, paddingInline: 8 }}
            >
              {'<='}
            </button>
          ) : null}
          {isPinned ? (
            <button
              onClick={() => {
                header.column.pin(false);
              }}
              style={{ border: '1px solid', borderRadius: 4, paddingInline: 8 }}
            >
              X
            </button>
          ) : null}
          {isPinned !== 'right' ? (
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


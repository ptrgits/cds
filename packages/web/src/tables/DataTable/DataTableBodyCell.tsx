import type { HTMLAttributes } from 'react';
import { type Cell, flexRender } from '@tanstack/react-table';

import { getColumnPinningStyles } from './getColumnPinningStyles';

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


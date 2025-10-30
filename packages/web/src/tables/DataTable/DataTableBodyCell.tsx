import type { HTMLAttributes } from 'react';
import { css } from '@linaria/core';
import { type Cell, flexRender } from '@tanstack/react-table';

import { getColumnPinningStyles } from './getColumnPinningStyles';

const bodyCellCss = css`
  align-items: center;
  background-color: var(--color-bg);
  display: flex;
`;

export type DataTableBodyCellProps = HTMLAttributes<HTMLTableCellElement> & {
  cell: Cell<any, unknown>;
  leftOffset?: number;
};

export const DataTableBodyCell = ({ cell, leftOffset, ...props }: DataTableBodyCellProps) => {
  return (
    <td
      key={cell.id}
      {...props}
      className={bodyCellCss}
      style={{
        width: cell.column.getSize(),
        ...getColumnPinningStyles(cell.column, leftOffset),
      }}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );
};

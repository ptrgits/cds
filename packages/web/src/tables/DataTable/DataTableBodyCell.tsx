import type { HTMLAttributes } from 'react';
import { css } from '@linaria/core';
import { type Cell, flexRender } from '@tanstack/react-table';

import { getColumnPinningStyles } from './getColumnPinningStyles';

const subRowIndentPx = 7;

const bodyCellCss = css`
  align-items: center;
  background-color: var(--color-bg);
  display: flex;
`;

export type DataTableBodyCellProps = HTMLAttributes<HTMLTableCellElement> & {
  cell: Cell<any, unknown>;
  hasLeftOverflow?: boolean;
  hasRightOverflow?: boolean;
  isFirstCenterCell?: boolean;
  rowDepth?: number;
  selected?: boolean;
  leftOffset?: number;
};

export const DataTableBodyCell = ({
  cell,
  hasLeftOverflow,
  hasRightOverflow,
  isFirstCenterCell,
  rowDepth = 0,
  selected,
  leftOffset,
  ...props
}: DataTableBodyCellProps) => {
  return (
    <td
      key={cell.id}
      {...props}
      className={bodyCellCss}
      style={{
        backgroundColor: selected ? 'var(--color-bgAlternate)' : undefined,
        paddingInlineStart:
          isFirstCenterCell && rowDepth > 0 ? `var(--space-${subRowIndentPx})` : undefined,
        width: cell.column.getSize(),
        ...getColumnPinningStyles(cell.column, leftOffset, {
          hasLeftOverflow,
          hasRightOverflow,
        }),
      }}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );
};

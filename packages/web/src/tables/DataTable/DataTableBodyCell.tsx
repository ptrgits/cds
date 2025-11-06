import { type HTMLAttributes, useMemo } from 'react';
import { css } from '@linaria/core';
import { type Cell, flexRender } from '@tanstack/react-table';

import { cx } from '../../cx';

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
  className,
  style,
  ...props
}: DataTableBodyCellProps) => {
  const pinningStyles = useMemo(
    () =>
      getColumnPinningStyles(cell.column, leftOffset, {
        hasLeftOverflow,
        hasRightOverflow,
      }),
    [cell.column, hasLeftOverflow, hasRightOverflow, leftOffset],
  );

  return (
    <td
      key={cell.id}
      {...props}
      className={cx(bodyCellCss, className)}
      style={{
        backgroundColor: selected ? 'var(--color-bgAlternate)' : undefined,
        paddingInlineStart:
          isFirstCenterCell && rowDepth > 0 ? `var(--space-${subRowIndentPx})` : undefined,
        width: cell.column.getSize(),
        ...pinningStyles,
        ...style,
      }}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );
};

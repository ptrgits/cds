import { type HTMLAttributes } from 'react';
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

const defaultPaddingCss = css`
  padding: var(--space-2) var(--space-2);
`;

const compactPaddingCss = css`
  padding: var(--space-1) var(--space-1_5);
`;

export type DataTableBodyCellProps = HTMLAttributes<HTMLTableCellElement> & {
  cell: Cell<any, unknown>;
  hasLeftOverflow?: boolean;
  hasRightOverflow?: boolean;
  isFirstCenterCell?: boolean;
  rowDepth?: number;
  selected?: boolean;
  leftOffset?: number;
  compact?: boolean;
};

export const DataTableBodyCell = ({
  cell,
  compact,
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
  // note we don't memoize this because cell.column does not change when it is pinned/unpinned, so the pinningStyles will not update properly
  const pinningStyles = getColumnPinningStyles(cell.column, leftOffset, {
    hasLeftOverflow,
    hasRightOverflow,
  });

  return (
    <td
      key={cell.id}
      {...props}
      className={cx(bodyCellCss, className, compact ? compactPaddingCss : defaultPaddingCss)}
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

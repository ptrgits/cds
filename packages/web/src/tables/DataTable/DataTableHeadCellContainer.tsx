import type { HTMLAttributes } from 'react';
import { css } from '@linaria/core';
import { flexRender, type Header, type SortDirection } from '@tanstack/react-table';

import { cx } from '../../cx';

import { getColumnPinningStyles } from './getColumnPinningStyles';

const tableHeadCellCss = css`
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

export type TableHeadCellProps = HTMLAttributes<HTMLTableCellElement> & {
  hasLeftOverflow?: boolean;
  hasRightOverflow?: boolean;
  header: Header<any, unknown>;
  leftOffset?: number;
  compact?: boolean;
};

export const DataTableHeadCellContainer = ({
  compact,
  hasLeftOverflow,
  hasRightOverflow,
  header,
  leftOffset = 0,
  style: styleProp,
  ...props
}: TableHeadCellProps) => {
  // note we don't memoize this because cell.column does not change when it is pinned/unpinned, so the pinningStyles will not update properly
  const pinningStyles = getColumnPinningStyles(header.column, leftOffset, {
    hasLeftOverflow,
    hasRightOverflow,
  });

  return (
    <th
      key={header.id}
      {...props}
      className={cx(tableHeadCellCss, compact ? compactPaddingCss : defaultPaddingCss)}
      style={{
        width: header.getSize(),
        ...pinningStyles,
        ...styleProp,
      }}
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
    </th>
  );
};

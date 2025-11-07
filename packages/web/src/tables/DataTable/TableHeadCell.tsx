import type { HTMLAttributes } from 'react';
import { css } from '@linaria/core';
import { flexRender, type Header } from '@tanstack/react-table';

import { IconButton } from '../../buttons';
import { cx } from '../../cx';
import { Box } from '../../layout';

import { getColumnPinningStyles } from './getColumnPinningStyles';

const tableHeadCellCss = css`
  align-items: center;
  background-color: var(--color-bg);
  display: flex;
`;

const sortableHeadCellCss = css`
  cursor: pointer;
  user-select: none;
`;

const pinControlsCss = css`
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-inline-start: 8px;
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

export const TableHeadCell = ({
  compact,
  hasLeftOverflow,
  hasRightOverflow,
  header,
  leftOffset = 0,
  style: styleProp,
  ...props
}: TableHeadCellProps) => {
  const isPinned = header.column.getIsPinned();
  // note we don't memoize this because cell.column does not change when it is pinned/unpinned, so the pinningStyles will not update properly
  const pinningStyles = getColumnPinningStyles(header.column, leftOffset, {
    hasLeftOverflow,
    hasRightOverflow,
  });

  return (
    <th
      key={header.id}
      {...props}
      className={cx(
        tableHeadCellCss,
        header.column.getCanSort() && sortableHeadCellCss,
        compact ? compactPaddingCss : defaultPaddingCss,
      )}
      onClick={header.column.getToggleSortingHandler()}
      style={{
        width: header.getSize(),
        ...pinningStyles,
        ...styleProp,
      }}
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      {{
        asc: ' 🔼',
        desc: ' 🔽',
      }[header.column.getIsSorted() as string] ?? null}
      {!header.isPlaceholder && header.column.getCanPin() && (
        <Box className={pinControlsCss}>
          {isPinned !== 'left' ? (
            <IconButton
              name="arrowLeft"
              onClick={(e) => {
                e.stopPropagation();
                header.column.pin('left');
              }}
              variant="secondary"
            />
          ) : null}
          {isPinned ? (
            <IconButton
              compact
              name="close"
              onClick={(e) => {
                e.stopPropagation();
                header.column.pin(false);
              }}
              variant="secondary"
            />
          ) : null}
          {isPinned !== 'right' ? (
            <IconButton
              compact
              name="arrowRight"
              onClick={(e) => {
                e.stopPropagation();
                header.column.pin('right');
              }}
            />
          ) : null}
        </Box>
      )}
    </th>
  );
};

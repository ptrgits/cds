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

const headCellContentCss = css`
  align-items: center;
  display: inline-flex;
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
      className={tableHeadCellCss}
      style={{
        width: header.getSize(),
        ...getColumnPinningStyles(header.column, leftOffset),
        ...styleProp,
      }}
    >
      <Box
        className={cx(headCellContentCss, header.column.getCanSort() && sortableHeadCellCss)}
        onClick={header.column.getToggleSortingHandler()}
      >
        {flexRender(header.column.columnDef.header, header.getContext())}
      </Box>
      {{
        asc: ' 🔼',
        desc: ' 🔽',
      }[header.column.getIsSorted() as string] ?? null}
      {!header.isPlaceholder && header.column.getCanPin() && (
        <Box className={pinControlsCss}>
          {isPinned !== 'left' ? (
            <IconButton
              name="arrowLeft"
              onClick={() => {
                header.column.pin('left');
              }}
              variant="secondary"
            />
          ) : null}
          {isPinned ? (
            <IconButton
              compact
              name="close"
              onClick={() => {
                header.column.pin(false);
              }}
              variant="secondary"
            />
          ) : null}
          {isPinned !== 'right' ? (
            <IconButton
              compact
              name="arrowRight"
              onClick={() => {
                header.column.pin('right');
              }}
            />
          ) : null}
        </Box>
      )}
    </th>
  );
};

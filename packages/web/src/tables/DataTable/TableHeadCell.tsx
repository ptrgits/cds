import type { HTMLAttributes } from 'react';
import { css } from '@linaria/core';
import { flexRender, type Header } from '@tanstack/react-table';

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

const pinButtonCss = css`
  background: none;
  border: 1px solid var(--color-borderSubtle);
  border-radius: 4px;
  padding-inline: 8px;
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
        {{
          asc: ' 🔼',
          desc: ' 🔽',
        }[header.column.getIsSorted() as string] ?? null}
      </Box>
      {!header.isPlaceholder && header.column.getCanPin() && (
        <Box className={pinControlsCss}>
          {isPinned !== 'left' ? (
            <button
              className={pinButtonCss}
              onClick={() => {
                header.column.pin('left');
              }}
              type="button"
            >
              {'<='}
            </button>
          ) : null}
          {isPinned ? (
            <button
              className={pinButtonCss}
              onClick={() => {
                header.column.pin(false);
              }}
              type="button"
            >
              X
            </button>
          ) : null}
          {isPinned !== 'right' ? (
            <button
              className={pinButtonCss}
              onClick={() => {
                header.column.pin('right');
              }}
              type="button"
            >
              {'=>'}
            </button>
          ) : null}
        </Box>
      )}
    </th>
  );
};

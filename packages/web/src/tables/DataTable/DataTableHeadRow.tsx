import { css } from '@linaria/core';
import type { HeaderGroup } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';

import { cx } from '../../cx';
import { TableRow } from '../TableRow';

import { DataTableHeadCellContainer } from './DataTableHeadCellContainer';

export type TableHeadRowProps = {
  hasLeftOverflow: boolean;
  hasRightOverflow: boolean;
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  headerGroup: HeaderGroup<any>;
  virtualPaddingLeft?: number;
  virtualPaddingRight?: number;
  virtualizeColumns?: boolean;
  compact?: boolean;
};

const rowCss = css`
  display: flex;
  width: 100%;
`;

const spacerCellCss = css`
  display: flex;
`;

const pinnedHeaderCellCss = css`
  z-index: 3;
`;

export const DataTableHeadRow = ({
  hasLeftOverflow,
  hasRightOverflow,
  columnVirtualizer,
  headerGroup,
  virtualPaddingLeft,
  virtualPaddingRight,
  virtualizeColumns,
  compact,
}: TableHeadRowProps) => {
  const leftHeaders = headerGroup.headers.filter((h) => h.column.getIsPinned() === 'left');
  const centerHeaders = headerGroup.headers.filter((h) => !h.column.getIsPinned());
  const rightHeaders = headerGroup.headers.filter((h) => h.column.getIsPinned() === 'right');

  return (
    <TableRow key={headerGroup.id} className={rowCss}>
      {/* Left pinned */}
      {leftHeaders.map((header) => (
        <DataTableHeadCellContainer
          key={header.id}
          className={cx(spacerCellCss, pinnedHeaderCellCss)}
          compact={compact}
          hasLeftOverflow={hasLeftOverflow}
          hasRightOverflow={hasRightOverflow}
          header={header}
        />
      ))}
      {virtualizeColumns && virtualPaddingLeft ? (
        <th className={spacerCellCss} style={{ width: virtualPaddingLeft }} />
      ) : null}
      {virtualizeColumns
        ? columnVirtualizer.getVirtualItems().map((virtualColumn) => {
            const header = centerHeaders[virtualColumn.index];
            if (!header) return null;
            return (
              <DataTableHeadCellContainer
                key={header.id}
                compact={compact}
                hasLeftOverflow={hasLeftOverflow}
                hasRightOverflow={hasRightOverflow}
                header={header}
              />
            );
          })
        : centerHeaders.map((header) => (
            <DataTableHeadCellContainer
              key={header.id}
              compact={compact}
              hasLeftOverflow={hasLeftOverflow}
              hasRightOverflow={hasRightOverflow}
              header={header}
            />
          ))}
      {virtualizeColumns && virtualPaddingRight ? (
        <th className={spacerCellCss} style={{ width: virtualPaddingRight }} />
      ) : null}
      {/* Right pinned */}
      {rightHeaders.map((header) => (
        <DataTableHeadCellContainer
          key={header.id}
          compact={compact}
          hasLeftOverflow={hasLeftOverflow}
          hasRightOverflow={hasRightOverflow}
          header={header}
        />
      ))}
    </TableRow>
  );
};

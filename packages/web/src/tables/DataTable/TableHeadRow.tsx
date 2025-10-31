import { css } from '@linaria/core';
import { type HeaderGroup, type Table } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';

import { cx } from '../../cx';

import type { ActionColumnHeadComponent } from './ActionColumnComponents';
import { TableHeadCell } from './TableHeadCell';

export type TableHeadRowProps = {
  ActionColumnHeadComponent: ActionColumnHeadComponent<any>;
  actionsColumnWidth: number;
  enableRowSelection: boolean;
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  headerGroup: HeaderGroup<any>;
  table: Table<any>;
  virtualPaddingLeft?: number;
  virtualPaddingRight?: number;
  virtualizeColumns?: boolean;
};

const rowCss = css`
  display: flex;
  width: 100%;
`;

const actionsHeaderCellCss = css`
  left: 0;
  position: sticky;
  z-index: 3;
`;

const spacerCellCss = css`
  display: flex;
`;

const pinnedHeaderCellCss = css`
  z-index: 3;
`;

export const TableHeadRow = ({
  ActionColumnHeadComponent,
  actionsColumnWidth,
  enableRowSelection,
  columnVirtualizer,
  headerGroup,
  table,
  virtualPaddingLeft,
  virtualPaddingRight,
  virtualizeColumns,
}: TableHeadRowProps) => {
  const leftHeaders = headerGroup.headers.filter((h) => h.column.getIsPinned() === 'left');
  const centerHeaders = headerGroup.headers.filter((h) => !h.column.getIsPinned());
  const rightHeaders = headerGroup.headers.filter((h) => h.column.getIsPinned() === 'right');
  const pinnedLeftOffset = actionsColumnWidth;

  return (
    <tr key={headerGroup.id} className={rowCss}>
      {/* Row actions sticky column header */}
      <th className={actionsHeaderCellCss} style={{ width: actionsColumnWidth }}>
        <ActionColumnHeadComponent enableRowSelection={enableRowSelection} table={table} />
      </th>
      {/* Left pinned */}
      {leftHeaders.map((header) => (
        <TableHeadCell
          key={header.id}
          className={cx(spacerCellCss, pinnedHeaderCellCss)}
          header={header}
          leftOffset={pinnedLeftOffset}
        />
      ))}
      {virtualizeColumns && virtualPaddingLeft ? (
        // fake empty column to the left for virtualization scroll padding
        <th className={spacerCellCss} style={{ width: virtualPaddingLeft }} />
      ) : null}
      {virtualizeColumns
        ? columnVirtualizer.getVirtualItems().map((virtualColumn) => {
            const header = centerHeaders[virtualColumn.index];
            if (!header) return null;
            return <TableHeadCell key={header.id} header={header} />;
          })
        : centerHeaders.map((header) => <TableHeadCell key={header.id} header={header} />)}
      {virtualizeColumns && virtualPaddingRight ? (
        // fake empty column to the right for virtualization scroll padding
        <th className={spacerCellCss} style={{ width: virtualPaddingRight }} />
      ) : null}
      {/* Right pinned */}
      {rightHeaders.map((header) => (
        <TableHeadCell key={header.id} header={header} />
      ))}
    </tr>
  );
};

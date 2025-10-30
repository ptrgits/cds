import { css } from '@linaria/core';
import { type Row } from '@tanstack/react-table';
import { type VirtualItem, type Virtualizer } from '@tanstack/react-virtual';

import { cx } from '../../cx';

import { DataTableBodyCell } from './DataTableBodyCell';
import { actionsColumnWidth } from './getColumnPinningStyles';

const bodyRowCss = css`
  display: flex;
  width: 100%;
`;

const virtualizedRowCss = css`
  left: 0;
  position: absolute;
  top: 0;
`;

const rowActionsCellCss = css`
  background-color: var(--color-bg);
  display: flex;
  gap: 4px;
  left: 0;
  position: sticky;
  z-index: 2;
`;

const spacerCellCss = css`
  display: flex;
`;

const pinButtonCss = css`
  background: none;
  border: 1px solid var(--color-borderSubtle);
  border-radius: 4px;
  padding-inline: 8px;
`;

export type DataTableBodyRowProps = {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  row: Row<any>;
  rowVirtualizer?: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
  virtualPaddingLeft: number | undefined;
  virtualPaddingRight: number | undefined;
  virtualRow?: VirtualItem;
  staticPosition?: boolean;
  virtualizeColumns?: boolean;
};

export const DataTableBodyRow = ({
  columnVirtualizer,
  row,
  rowVirtualizer,
  virtualPaddingLeft,
  virtualPaddingRight,
  virtualRow,
  staticPosition = false,
  virtualizeColumns,
}: DataTableBodyRowProps) => {
  const visibleCells = row.getVisibleCells();
  const leftCells = visibleCells.filter((c) => c.column.getIsPinned() === 'left');
  const centerCells = visibleCells.filter((c) => !c.column.getIsPinned());
  const rightCells = visibleCells.filter((c) => c.column.getIsPinned() === 'right');

  return (
    <tr
      key={row.id}
      ref={
        staticPosition || !rowVirtualizer || !virtualRow
          ? undefined
          : (node) => rowVirtualizer.measureElement(node)
      }
      className={cx(bodyRowCss, !staticPosition && virtualRow && virtualizedRowCss)}
      data-index={staticPosition || !virtualRow ? undefined : virtualRow.index}
      style={
        staticPosition || !virtualRow
          ? undefined
          : {
              transform: `translateY(${virtualRow.start}px)`,
            }
      }
    >
      {/* Row actions sticky column */}
      <td className={rowActionsCellCss} style={{ width: actionsColumnWidth }}>
        {row.getIsPinned?.() !== 'top' ? (
          <button className={pinButtonCss} onClick={() => row.pin('top')} type="button">
            Top
          </button>
        ) : null}
        {row.getIsPinned?.() ? (
          <button className={pinButtonCss} onClick={() => row.pin(false)} type="button">
            Unpin
          </button>
        ) : null}
        {row.getIsPinned?.() !== 'bottom' ? (
          <button className={pinButtonCss} onClick={() => row.pin('bottom')} type="button">
            Bottom
          </button>
        ) : null}
      </td>
      {/* Left pinned */}
      {leftCells.map((cell) => (
        <DataTableBodyCell key={cell.id} cell={cell} leftOffset={actionsColumnWidth} />
      ))}
      {virtualizeColumns && virtualPaddingLeft ? (
        // fake empty column to the left for virtualization scroll padding
        <td className={spacerCellCss} style={{ width: virtualPaddingLeft }} />
      ) : null}
      {virtualizeColumns
        ? columnVirtualizer.getVirtualItems().map((virtualColumn) => {
            const cell = centerCells[virtualColumn.index];
            if (!cell) return null;
            return <DataTableBodyCell key={cell.id} cell={cell} />;
          })
        : centerCells.map((cell) => <DataTableBodyCell key={cell.id} cell={cell} />)}
      {virtualizeColumns && virtualPaddingRight ? (
        // fake empty column to the right for virtualization scroll padding
        <td className={spacerCellCss} style={{ width: virtualPaddingRight }} />
      ) : null}
      {/* Right pinned */}
      {rightCells.map((cell) => (
        <DataTableBodyCell key={cell.id} cell={cell} />
      ))}
    </tr>
  );
};

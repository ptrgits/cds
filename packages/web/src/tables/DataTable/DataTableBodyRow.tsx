import { css } from '@linaria/core';
import { type Row } from '@tanstack/react-table';
import { type VirtualItem, type Virtualizer } from '@tanstack/react-virtual';

import { cx } from '../../cx';

import { DataTableBodyCell } from './DataTableBodyCell';

const bodyRowCss = css`
  display: flex;
  width: 100%;
`;

const virtualizedRowCss = css`
  left: 0;
  position: absolute;
  top: 0;
`;

const spacerCellCss = css`
  display: flex;
`;

export type DataTableBodyRowProps = {
  hasLeftOverflow: boolean;
  hasRightOverflow: boolean;
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
  hasLeftOverflow,
  hasRightOverflow,
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
  const isSelected = !!row.getIsSelected?.();
  const rowDepth = row.depth ?? 0;
  const firstCenterCellId = centerCells[0]?.id;

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
      style={{
        transform: !staticPosition && virtualRow ? `translateY(${virtualRow.start}px)` : undefined,
        backgroundColor: isSelected ? 'var(--color-bgAlternate)' : undefined,
      }}
    >
      {/* Left pinned */}
      {leftCells.map((cell) => (
        <DataTableBodyCell
          key={cell.id}
          cell={cell}
          hasLeftOverflow={hasLeftOverflow}
          hasRightOverflow={hasRightOverflow}
          rowDepth={rowDepth}
          selected={isSelected}
        />
      ))}
      {virtualizeColumns && virtualPaddingLeft ? (
        <td className={spacerCellCss} style={{ width: virtualPaddingLeft }} />
      ) : null}
      {virtualizeColumns
        ? columnVirtualizer.getVirtualItems().map((virtualColumn) => {
            const cell = centerCells[virtualColumn.index];
            if (!cell) return null;
            return (
              <DataTableBodyCell
                key={cell.id}
                cell={cell}
                hasLeftOverflow={hasLeftOverflow}
                hasRightOverflow={hasRightOverflow}
                isFirstCenterCell={cell.id === firstCenterCellId}
                rowDepth={rowDepth}
                selected={isSelected}
              />
            );
          })
        : centerCells.map((cell) => (
            <DataTableBodyCell
              key={cell.id}
              cell={cell}
              hasLeftOverflow={hasLeftOverflow}
              hasRightOverflow={hasRightOverflow}
              isFirstCenterCell={cell.id === firstCenterCellId}
              rowDepth={rowDepth}
              selected={isSelected}
            />
          ))}
      {virtualizeColumns && virtualPaddingRight ? (
        <td className={spacerCellCss} style={{ width: virtualPaddingRight }} />
      ) : null}
      {/* Right pinned */}
      {rightCells.map((cell) => (
        <DataTableBodyCell
          key={cell.id}
          cell={cell}
          hasLeftOverflow={hasLeftOverflow}
          hasRightOverflow={hasRightOverflow}
          rowDepth={rowDepth}
          selected={isSelected}
        />
      ))}
    </tr>
  );
};

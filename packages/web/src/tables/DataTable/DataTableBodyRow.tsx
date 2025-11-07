import { css } from '@linaria/core';
import type { Row } from '@tanstack/react-table';
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual';

import { cx } from '../../cx';
import { TableRow } from '../TableRow';

import { DataTableBodyCellContainer } from './DataTableBodyCellContainer';

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
  compact?: boolean;
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
  compact,
}: DataTableBodyRowProps) => {
  const visibleCells = row.getVisibleCells();
  const leftCells = visibleCells.filter((c) => c.column.getIsPinned() === 'left');
  const centerCells = visibleCells.filter((c) => !c.column.getIsPinned());
  const rightCells = visibleCells.filter((c) => c.column.getIsPinned() === 'right');
  const isSelected = !!row.getIsSelected?.();
  // Memoized cell containers will otherwise never see the expanded state update.
  const isExpanded = !!row.getIsExpanded?.();
  const rowDepth = row.depth ?? 0;
  const firstCenterCellId = centerCells[0]?.id;

  return (
    <TableRow
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
        <DataTableBodyCellContainer
          key={cell.id}
          cell={cell}
          compact={compact}
          expanded={isExpanded}
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
              <DataTableBodyCellContainer
                key={cell.id}
                cell={cell}
                compact={compact}
                expanded={isExpanded}
                hasLeftOverflow={hasLeftOverflow}
                hasRightOverflow={hasRightOverflow}
                isFirstCenterCell={cell.id === firstCenterCellId}
                rowDepth={rowDepth}
                selected={isSelected}
              />
            );
          })
        : centerCells.map((cell) => (
            <DataTableBodyCellContainer
              key={cell.id}
              cell={cell}
              compact={compact}
              expanded={isExpanded}
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
        <DataTableBodyCellContainer
          key={cell.id}
          cell={cell}
          compact={compact}
          expanded={isExpanded}
          hasLeftOverflow={hasLeftOverflow}
          hasRightOverflow={hasRightOverflow}
          rowDepth={rowDepth}
          selected={isSelected}
        />
      ))}
    </TableRow>
  );
};

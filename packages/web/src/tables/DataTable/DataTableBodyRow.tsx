import { type Row } from '@tanstack/react-table';
import { type VirtualItem, type Virtualizer } from '@tanstack/react-virtual';

import { actionsColumnWidth } from './getColumnPinningStyles';
import { DataTableBodyCell } from './DataTableBodyCell';

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
        staticPosition || !rowVirtualizer
          ? undefined
          : (node) => rowVirtualizer.measureElement(node)
      }
      data-index={staticPosition || !virtualRow ? undefined : virtualRow.index}
      style={{
        display: 'flex',
        width: '100%',
      }}
    >
      {/* Row actions sticky column */}
      <td
        style={{
          backgroundColor: 'white',
          display: 'flex',
          gap: 4,
          left: 0,
          position: 'sticky',
          width: actionsColumnWidth,
          zIndex: 2,
        }}
      >
        {row.getIsPinned?.() !== 'top' ? (
          <button
            onClick={() => row.pin('top')}
            style={{ border: '1px solid', borderRadius: 4, paddingInline: 8 }}
          >
            Top
          </button>
        ) : null}
        {row.getIsPinned?.() ? (
          <button
            onClick={() => row.pin(false)}
            style={{ border: '1px solid', borderRadius: 4, paddingInline: 8 }}
          >
            Unpin
          </button>
        ) : null}
        {row.getIsPinned?.() !== 'bottom' ? (
          <button
            onClick={() => row.pin('bottom')}
            style={{ border: '1px solid', borderRadius: 4, paddingInline: 8 }}
          >
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
        <td style={{ display: 'flex', width: virtualPaddingLeft }} />
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
        <td style={{ display: 'flex', width: virtualPaddingRight }} />
      ) : null}
      {/* Right pinned */}
      {rightCells.map((cell) => (
        <DataTableBodyCell key={cell.id} cell={cell} />
      ))}
    </tr>
  );
};


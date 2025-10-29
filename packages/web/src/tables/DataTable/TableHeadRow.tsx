import { type HeaderGroup } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';

import { actionsColumnWidth } from './getColumnPinningStyles';
import { TableHeadCell } from './TableHeadCell';

export type TableHeadRowProps = {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  headerGroup: HeaderGroup<any>;
  virtualPaddingLeft?: number;
  virtualPaddingRight?: number;
  virtualizeColumns?: boolean;
};

export const TableHeadRow = ({
  columnVirtualizer,
  headerGroup,
  virtualPaddingLeft,
  virtualPaddingRight,
  virtualizeColumns,
}: TableHeadRowProps) => {
  const leftHeaders = headerGroup.headers.filter((h) => h.column.getIsPinned() === 'left');
  const centerHeaders = headerGroup.headers.filter((h) => !h.column.getIsPinned());
  const rightHeaders = headerGroup.headers.filter((h) => h.column.getIsPinned() === 'right');

  return (
    <tr key={headerGroup.id} style={{ display: 'flex', width: '100%' }}>
      {/* Row actions sticky column header */}
      <th
        style={{
          backgroundColor: 'white',
          display: 'flex',
          left: 0,
          position: 'sticky',
          width: actionsColumnWidth,
          zIndex: 3,
        }}
      >
        Row
      </th>
      {/* Left pinned */}
      {leftHeaders.map((header) => (
        <TableHeadCell
          key={header.id}
          header={header}
          leftOffset={actionsColumnWidth}
          style={{ zIndex: 3 }}
        />
      ))}
      {virtualizeColumns && virtualPaddingLeft ? (
        // fake empty column to the left for virtualization scroll padding
        <th style={{ display: 'flex', width: virtualPaddingLeft }} />
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
        <th style={{ display: 'flex', width: virtualPaddingRight }} />
      ) : null}
      {/* Right pinned */}
      {rightHeaders.map((header) => (
        <TableHeadCell key={header.id} header={header} />
      ))}
    </tr>
  );
};


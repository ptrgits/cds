import { css } from '@linaria/core';
import { type Row, type Table } from '@tanstack/react-table';
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';

import { cx } from '../../cx';

import { defaultVirtualRowsOverscan } from './DataTable';
import { DataTableBodyRow } from './DataTableBodyRow';

const pinnedSectionCss = css`
  background: var(--color-bg);
  display: grid;
  z-index: 3;
  position: sticky;
`;

const stickyBottomSectionCss = css`
  bottom: 0;
`;

const virtualizedCenterSectionCss = css`
  display: grid;
  position: relative;
`;

const staticCenterSectionCss = css`
  display: grid;
`;

export type DataTableBodyProps = {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  table: Table<any>;
  tableContainerRef: React.RefObject<HTMLDivElement>;
  virtualPaddingLeft: number | undefined;
  virtualPaddingRight: number | undefined;
  headerOffsetTop?: number;
  /** Whether to virtualize center columns rendering */
  virtualizeColumns?: boolean;
  /** Whether to virtualize center rows rendering */
  virtualizeRows?: boolean;
  /**
   * Estimate the height of a virtual row.
   * @default () => 33
   */
  estimateVirtualRowHeight?: (index: number) => number;
};

export const DataTableBody = ({
  columnVirtualizer,
  estimateVirtualRowHeight,
  table,
  tableContainerRef,
  virtualPaddingLeft,
  virtualPaddingRight,
  headerOffsetTop = 0,
  virtualizeColumns,
  virtualizeRows,
}: DataTableBodyProps) => {
  const { rows } = table.getRowModel();
  const topRows = rows.filter((r) => r.getIsPinned?.() === 'top');
  const bottomRows = rows.filter((r) => r.getIsPinned?.() === 'bottom');
  const centerRows = rows.filter((r) => !r.getIsPinned?.());

  //dynamic row height virtualization - alternatively you could use a simpler fixed row height strategy without the need for `measureElement`
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: centerRows.length,
    enabled: virtualizeRows,
    estimateSize: estimateVirtualRowHeight ?? (() => 33), //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: defaultVirtualRowsOverscan,
  });

  // `useVirtualizer` keeps the same instance reference while mutating internal state on scroll.
  // Memoizing these values would freeze them after the first render, so call the getters directly.
  const virtualRowsItems = virtualizeRows ? rowVirtualizer.getVirtualItems() : [];
  const virtualRowsTotalSize = virtualizeRows ? rowVirtualizer.getTotalSize() : 0;

  return (
    <>
      {/* Top pinned rows */}
      {topRows.length > 0 && (
        <tbody className={cx(pinnedSectionCss)} style={{ top: headerOffsetTop }}>
          {topRows.map((row, i) => (
            <DataTableBodyRow
              key={row.id}
              staticPosition
              columnVirtualizer={columnVirtualizer}
              row={row}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
              virtualizeColumns={virtualizeColumns}
            />
          ))}
        </tbody>
      )}

      {/* Center rows */}
      {virtualizeRows ? (
        <tbody
          className={virtualizedCenterSectionCss}
          style={{ height: `${virtualRowsTotalSize}px` }}
        >
          {virtualRowsItems.map((virtualRow) => {
            const row = centerRows[virtualRow.index] as Row<any>;
            return (
              <DataTableBodyRow
                key={row.id}
                columnVirtualizer={columnVirtualizer}
                row={row}
                rowVirtualizer={rowVirtualizer}
                virtualPaddingLeft={virtualPaddingLeft}
                virtualPaddingRight={virtualPaddingRight}
                virtualRow={virtualRow}
                virtualizeColumns={virtualizeColumns}
              />
            );
          })}
        </tbody>
      ) : (
        <tbody className={staticCenterSectionCss}>
          {centerRows.map((row) => (
            <DataTableBodyRow
              key={row.id}
              staticPosition
              columnVirtualizer={columnVirtualizer}
              row={row}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
              virtualizeColumns={virtualizeColumns}
            />
          ))}
        </tbody>
      )}

      {/* Bottom pinned rows */}
      {bottomRows.length > 0 && (
        <tbody className={cx(pinnedSectionCss, stickyBottomSectionCss)}>
          {bottomRows.map((row, i) => (
            <DataTableBodyRow
              key={row.id}
              staticPosition
              columnVirtualizer={columnVirtualizer}
              row={row}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
              virtualizeColumns={virtualizeColumns}
            />
          ))}
        </tbody>
      )}
    </>
  );
};

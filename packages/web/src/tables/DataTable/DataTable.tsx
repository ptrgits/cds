import React, { forwardRef } from 'react';
import {
  getCoreRowModel,
  getSortedRowModel,
  type TableOptions,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

import { DataTableBody } from './DataTableBody';
import { DataTableHead } from './DataTableHead';

type OptionalBuiltins<TData> = Omit<TableOptions<TData>, 'getCoreRowModel' | 'getSortedRowModel'> &
  Partial<Pick<TableOptions<TData>, 'getCoreRowModel' | 'getSortedRowModel'>>;

export type DataTableOptions<TData> = OptionalBuiltins<TData>;

export type DataTableProps<TData> = React.HTMLAttributes<HTMLTableElement> & {
  /**
   * Options passed directly to TanStack's useReactTable to construct the table instance.
   * This gives consumers full control over data, columns, state and all table behaviors.
   */
  tableOptions: DataTableOptions<TData>;
  /**
   * Called when a row reorder is completed via drag and drop. Consumers should update
   * their underlying data to reflect the new order so the table re-renders accordingly.
   * Provide both the move details and the full new ids order for convenience.
   */
  onRowChange?: (args: {
    activeId: string;
    overId: string;
    oldIndex: number;
    newIndex: number;
    ids: string[];
  }) => void;
  /**
   * Called when a center column reorder is completed via drag and drop. Consumers should
   * update their table column order (e.g., TanStack's columnOrder) accordingly.
   */
  onColumnChange?: (args: {
    activeId: string;
    overId: string;
    oldIndex: number;
    newIndex: number;
    ids: string[];
  }) => void;
  /**
   * Enable/disable column virtualization for the center (unpinned) columns.
   * Defaults to true to preserve existing behavior.
   */
  virtualizeColumns?: boolean;
  /**
   * Enable/disable row virtualization for center (unpinned) rows.
   * Defaults to true to preserve existing behavior.
   */
  virtualizeRows?: boolean;
};

const DataTableInner = <TData,>(
  {
    tableOptions,
    onRowChange,
    onColumnChange,
    virtualizeColumns,
    virtualizeRows,
    ...props
  }: DataTableProps<TData>,
  ref: React.Ref<HTMLTableElement>,
) => {
  const table = useReactTable({
    getCoreRowModel: tableOptions.getCoreRowModel ?? getCoreRowModel(),
    getSortedRowModel: tableOptions.getSortedRowModel ?? getSortedRowModel(),
    ...tableOptions,
  });
  // Only virtualize the center (unpinned) columns. Left/Right pinned columns
  // are rendered outside of the virtualized range to support sticky pinning.
  const centerColumns = table.getVisibleLeafColumns().filter((col) => !col.getIsPinned());

  //The virtualizers need to know the scrollable container element
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  //we are using a slightly different virtualization strategy for columns (compared to virtual rows) in order to support dynamic row heights
  const columnVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableCellElement>({
    count: centerColumns.length,
    estimateSize: (index) => centerColumns[index].getSize(), //estimate width of each center column for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    horizontal: true,
    overscan: 3, //how many columns to render on each side off screen each way (adjust this for performance)
  });

  const virtualColumns = columnVirtualizer.getVirtualItems();

  //different virtualization strategy for columns - instead of absolute and translateY, we add empty columns to the left and right
  let virtualPaddingLeft: number | undefined;
  let virtualPaddingRight: number | undefined;

  if (virtualizeColumns && columnVirtualizer && virtualColumns?.length) {
    virtualPaddingLeft = virtualizeColumns ? (virtualColumns[0]?.start ?? 0) : undefined;
    virtualPaddingRight = virtualizeColumns
      ? columnVirtualizer.getTotalSize() - (virtualColumns[virtualColumns.length - 1]?.end ?? 0)
      : undefined;
  }

  // determine if there are top pinned rows to layer header above them
  const hasTopPinnedRows = table.getRowModel().rows.some((r) => r.getIsPinned?.() === 'top');
  const [headerHeight, setHeaderHeight] = React.useState(0);

  // Current center row ids from table rows (source of truth is external data)
  const allRows = table.getRowModel().rows;
  const centerRowIds = React.useMemo(
    () => allRows.filter((r) => !r.getIsPinned?.()).map((r) => r.id),
    [allRows],
  );

  return (
    <div
      ref={tableContainerRef}
      style={{
        overflow: 'auto', //our scrollable table container
        position: 'relative', //needed for sticky header
        height: '500px', //should be a fixed height
      }}
    >
      {/* Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights */}
      <table ref={ref} style={{ display: 'grid' }} {...props}>
        <DataTableHead
          columnVirtualizer={columnVirtualizer}
          isSticky={hasTopPinnedRows}
          onHeightChange={setHeaderHeight}
          table={table}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
          virtualizeColumns={virtualizeColumns}
        />
        <DataTableBody
          columnVirtualizer={columnVirtualizer}
          headerOffsetTop={hasTopPinnedRows ? headerHeight : 0}
          table={table}
          tableContainerRef={tableContainerRef}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
          virtualizeColumns={virtualizeColumns}
          virtualizeRows={virtualizeRows}
        />
      </table>
    </div>
  );
};

export const DataTable = forwardRef(DataTableInner) as <TData>(
  props: DataTableProps<TData> & { ref?: React.Ref<HTMLTableElement> },
) => React.ReactElement;

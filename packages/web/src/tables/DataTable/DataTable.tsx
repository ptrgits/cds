import { forwardRef, memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { css } from '@linaria/core';
import {
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  type TableOptions,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

import { cx } from '../../cx';
import { Table, type TableProps } from '../Table';

import { DataTableBody } from './DataTableBody';
import { DataTableHead } from './DataTableHead';

export const defaultVirtualColumnsOverscan = 5;
export const defaultVirtualRowsOverscan = 10;

export type DataTableOptions<TData> = Omit<
  TableOptions<TData>,
  // these are imported internally so we don't need users to pass in
  'getCoreRowModel' | 'getSortedRowModel'
>;

export type DataTableProps<TData> = React.HTMLAttributes<HTMLTableElement> &
  Omit<TableProps, 'children'> & {
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
     * When you set this to true, please set a fixed height to the table container through the `style` prop, otherwise it will still render all rows.
     */
    virtualizeRows?: boolean;
    /**
     * Estimate the size of a virtual column.
     * @default (index) => centerColumns[index].getSize()
     */
    estimateVirtualColumnWidth?: (index: number) => number;
    /**
     * Estimate the height of a virtual row.
     * @default () => 33
     */
    estimateVirtualRowHeight?: (index: number) => number;
    /**
     * Enable/disable sticky header for the table.
     * Defaults to true to preserve existing behavior.
     */
    stickyHeader?: boolean;
    /**
     * Style the table container.
     */
    style?: React.CSSProperties;
  };

const tableContainerCss = css`
  overflow: auto;
  position: relative;
`;

// height needs to be fit-content for the sticky header to work correctly
const dataTableCss = css`
  display: grid;
  height: fit-content;
`;

// our CDS table component set thead border as a inset box-shadow, which is conflicting with the pinned columns shadow, so we override it here.
const headerBorderOverrideCss = css`
  table {
    & > thead > tr > th {
      border-bottom: 1px solid var(--color-bgLine);
      box-shadow: none;
    }
  }
`;

const DataTableBase = <TData,>(
  {
    tableOptions,
    onRowChange,
    onColumnChange,
    virtualizeColumns,
    virtualizeRows,
    stickyHeader = true,
    estimateVirtualColumnWidth,
    estimateVirtualRowHeight,
    style,
    variant,
    compact,
    ...props
  }: DataTableProps<TData>,
  ref: React.Ref<HTMLTableElement>,
) => {
  // Build the TanStack table instance once so every downstream call goes through
  // the same memoized APIs (sorting, pinning, sizing, etc.).
  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...tableOptions,
  });
  // Only virtualize the center (unpinned) columns. Left/Right pinned columns
  // are rendered outside of the virtualized range to support sticky pinning.
  const centerColumns = table.getVisibleLeafColumns().filter((col) => !col.getIsPinned());

  //The virtualizers need to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null);

  //we are using a slightly different virtualization strategy for columns (compared to virtual rows) in order to support dynamic row heights
  // The column virtualizer is only active for center columns; pinned columns are rendered explicitly.
  const columnVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableCellElement>({
    count: centerColumns.length,
    enabled: virtualizeColumns ?? true,
    estimateSize: estimateVirtualColumnWidth ?? ((index) => centerColumns[index].getSize()), //estimate width of each center column for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    horizontal: true,
    overscan: defaultVirtualColumnsOverscan, //how many columns to render on each side off screen each way (adjust this for performance)
  });

  const virtualColumns = virtualizeColumns ? columnVirtualizer.getVirtualItems() : [];

  //different virtualization strategy for columns - instead of absolute and translateY, we add empty columns to the left and right
  let virtualPaddingLeft: number | undefined;
  let virtualPaddingRight: number | undefined;

  if (virtualizeColumns && columnVirtualizer && virtualColumns?.length) {
    virtualPaddingLeft = virtualColumns[0]?.start ?? 0;
    virtualPaddingRight =
      columnVirtualizer.getTotalSize() - (virtualColumns[virtualColumns.length - 1]?.end ?? 0);
  }

  // Presence of overflow is exposed so pinned headers/cells can show a divider shadow.
  const [hasLeftOverflow, setHasLeftOverflow] = useState(false);
  const [hasRightOverflow, setHasRightOverflow] = useState(false);

  // Detect whether the scroll container reveals additional content to the left/right.
  const updateOverflowIndicators = useCallback(() => {
    const node = tableContainerRef.current;
    if (!node) return;
    const { scrollLeft, scrollWidth, clientWidth } = node;
    const maxScrollLeft = Math.max(scrollWidth - clientWidth, 0);
    const nextHasLeftOverflow = scrollLeft > 0;
    const overflowThreshold = 1;
    const nextHasRightOverflow = scrollLeft < maxScrollLeft - overflowThreshold;

    setHasLeftOverflow((prev) => (prev === nextHasLeftOverflow ? prev : nextHasLeftOverflow));
    setHasRightOverflow((prev) => (prev === nextHasRightOverflow ? prev : nextHasRightOverflow));
  }, []);

  const headerRef = useRef<HTMLTableSectionElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Track the rendered header height so pinned sections can position themselves without overlaps.
  useLayoutEffect(() => {
    // Disable offset bookkeeping entirely when the sticky header feature is turned off.
    if (!stickyHeader) {
      setHeaderHeight(0);
      return;
    }

    // Bail out during SSR; measurements require a browser environment.
    if (typeof window === 'undefined') return;

    const node = headerRef.current;
    if (!node) return;

    // Measure once immediately in case the header already has content-driven height.
    const measure = () => {
      const nextHeight = node.getBoundingClientRect().height;
      setHeaderHeight((prev) => (prev !== nextHeight ? nextHeight : prev));
    };

    measure();

    // React to future size changes (filters, column configuration, responsive wraps, etc.).
    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [stickyHeader]);

  // Keep the overflow indicators in sync with scroll position and container resizes.
  useLayoutEffect(() => {
    const node = tableContainerRef.current;
    if (!node) return;

    const handleScroll = () => {
      updateOverflowIndicators();
    };

    handleScroll();

    node.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      node.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [updateOverflowIndicators]);

  return (
    <Table
      ref={ref}
      className={dataTableCss}
      classNames={{
        root: cx(
          tableContainerCss,
          (variant === 'ruled' || variant === 'graph') && headerBorderOverrideCss,
        ),
      }}
      containerRef={tableContainerRef}
      styles={{ root: style }}
      variant={variant}
      {...props}
    >
      {/* Head renders pinned + center columns and needs overflow state to decide when to draw borders */}
      <DataTableHead
        columnVirtualizer={columnVirtualizer}
        compact={compact}
        hasLeftOverflow={hasLeftOverflow}
        hasRightOverflow={hasRightOverflow}
        sectionRef={headerRef}
        sticky={stickyHeader}
        table={table}
        virtualPaddingLeft={virtualPaddingLeft}
        virtualPaddingRight={virtualPaddingRight}
        virtualizeColumns={virtualizeColumns}
      />
      {/* Body mirrors the head setup, forwarding virtualization + overflow metadata down to rows */}
      <DataTableBody
        columnVirtualizer={columnVirtualizer}
        compact={compact}
        estimateVirtualRowHeight={estimateVirtualRowHeight}
        hasLeftOverflow={hasLeftOverflow}
        hasRightOverflow={hasRightOverflow}
        headerOffsetTop={stickyHeader ? headerHeight : 0}
        table={table}
        tableContainerRef={tableContainerRef}
        virtualPaddingLeft={virtualPaddingLeft}
        virtualPaddingRight={virtualPaddingRight}
        virtualizeColumns={virtualizeColumns}
        virtualizeRows={virtualizeRows}
      />
    </Table>
  );
};

// TODO: discuss memoization. It's tricky to memoize internal components since tanstack's table states are stable references.
export const DataTable = memo(forwardRef(DataTableBase)) as <TData>(
  props: DataTableProps<TData> & { ref?: React.Ref<HTMLTableElement> },
) => React.ReactElement;

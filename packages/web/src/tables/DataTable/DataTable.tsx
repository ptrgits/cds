import React, { forwardRef } from 'react';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Table } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

import { DataTableBody } from './DataTableBody';
import { DataTableHead } from './DataTableHead';

export type DataTableProps = React.HTMLAttributes<HTMLTableElement> & {
  table: Table<any>;
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
};

export const DataTable = forwardRef<HTMLTableElement, DataTableProps>(
  ({ table, onRowChange, onColumnChange, ...props }, ref) => {
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

    if (columnVirtualizer && virtualColumns?.length) {
      virtualPaddingLeft = virtualColumns[0]?.start ?? 0;
      virtualPaddingRight =
        columnVirtualizer.getTotalSize() - (virtualColumns[virtualColumns.length - 1]?.end ?? 0);
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

    const sensors = useSensors(
      useSensor(MouseSensor, {}),
      useSensor(TouchSensor, {}),
      useSensor(KeyboardSensor, {}),
    );

    const [dragColActive, setDragColActive] = React.useState<string | null>(null);
    const [dragColOver, setDragColOver] = React.useState<string | null>(null);

    const handleDragEnd = React.useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event;
        if (!active || !over || active.id === over.id) return;
        const activeId = String(active.id);
        const overId = String(over.id);

        // Row reorder (center rows only)
        if (activeId.startsWith('row:') && overId.startsWith('row:')) {
          const current = centerRowIds.map((id) => `row:${id}`);
          const oldIndex = current.indexOf(activeId);
          const newIndex = current.indexOf(overId);
          if (oldIndex === -1 || newIndex === -1) return;
          const next = arrayMove(current, oldIndex, newIndex);
          const ids = next.map((rid) => rid.replace(/^row:/, ''));
          onRowChange?.({
            activeId: activeId.replace(/^row:/, ''),
            overId: overId.replace(/^row:/, ''),
            oldIndex,
            newIndex,
            ids,
          });
          return;
        }

        // Column reorder (center columns only)
        if (activeId.startsWith('col:') && overId.startsWith('col:')) {
          const centerColumnIds = centerColumns.map((c) => c.id);
          const current = centerColumnIds.map((id) => `col:${id}`);
          const oldIndex = current.indexOf(activeId);
          const newIndex = current.indexOf(overId);
          if (oldIndex === -1 || newIndex === -1) return;
          const next = arrayMove(current, oldIndex, newIndex);
          const ids = next.map((cid) => cid.replace(/^col:/, ''));
          onColumnChange?.({
            activeId: activeId.replace(/^col:/, ''),
            overId: overId.replace(/^col:/, ''),
            oldIndex,
            newIndex,
            ids,
          });
          setDragColActive(null);
          setDragColOver(null);
          return;
        }
      },
      [centerRowIds, centerColumns, onRowChange, onColumnChange],
    );

    const handleDragOver = React.useCallback((event: DragOverEvent) => {
      const { active, over } = event;
      const a = active ? String(active.id) : null;
      const o = over ? String(over.id) : null;
      if (a && a.startsWith('col:')) {
        setDragColActive(a.replace(/^col:/, ''));
        setDragColOver(o && o.startsWith('col:') ? o.replace(/^col:/, '') : null);
      }
    }, []);

    return (
      <div
        ref={tableContainerRef}
        style={{
          overflow: 'auto', //our scrollable table container
          position: 'relative', //needed for sticky header
          height: '500px', //should be a fixed height
        }}
      >
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          sensors={sensors}
        >
          {/* Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights */}
          <table ref={ref} style={{ display: 'grid' }} {...props}>
            <DataTableHead
              columnVirtualizer={columnVirtualizer}
              dragActiveColId={dragColActive ?? undefined}
              dragOverColId={dragColOver ?? undefined}
              isSticky={hasTopPinnedRows}
              onHeightChange={setHeaderHeight}
              table={table}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
            />
            <DataTableBody
              columnVirtualizer={columnVirtualizer}
              dragActiveColId={dragColActive ?? undefined}
              dragOverColId={dragColOver ?? undefined}
              headerOffsetTop={hasTopPinnedRows ? headerHeight : 0}
              table={table}
              tableContainerRef={tableContainerRef}
              virtualPaddingLeft={virtualPaddingLeft}
              virtualPaddingRight={virtualPaddingRight}
            />
          </table>
          <DragOverlay>
            {dragColActive ? (
              <th
                style={{
                  backgroundColor: 'gray',
                  color: 'white',
                  opacity: 0.9,
                  padding: 8,
                }}
              >
                {dragColActive}
              </th>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    );
  },
);

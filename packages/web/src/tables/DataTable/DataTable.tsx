import React, { forwardRef } from 'react';
import type { Table } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

import { DataTableBody } from './DataTableBody';
import { DataTableHead } from './DataTableHead';

export type DataTableProps = React.HTMLAttributes<HTMLTableElement> & {
  table: Table<any>;
};

export const DataTable = forwardRef<HTMLTableElement, DataTableProps>(
  ({ table, ...props }, ref) => {
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

    return (
      <div
        ref={tableContainerRef}
        style={{
          overflow: 'auto', //our scrollable table container
          position: 'relative', //needed for sticky header
          height: '800px', //should be a fixed height
        }}
      >
        {/* Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights */}
        <table ref={ref} style={{ display: 'grid' }} {...props}>
          <DataTableHead
            columnVirtualizer={columnVirtualizer}
            table={table}
            virtualPaddingLeft={virtualPaddingLeft}
            virtualPaddingRight={virtualPaddingRight}
          />
          <DataTableBody
            columnVirtualizer={columnVirtualizer}
            table={table}
            tableContainerRef={tableContainerRef}
            virtualPaddingLeft={virtualPaddingLeft}
            virtualPaddingRight={virtualPaddingRight}
          />
        </table>
      </div>
    );
  },
);

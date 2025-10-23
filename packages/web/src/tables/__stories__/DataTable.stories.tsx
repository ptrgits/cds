import React from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Meta } from '@storybook/react';
import {
  type ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';

import { DataTable } from '../DataTable/DataTable';

export default {
  title: 'Components/Table/DataTable',
} as Meta;

type RowData = { rowId: string } & Record<`col${number}`, number>;

export const DataTableExample = () => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const columns = React.useMemo<ColumnDef<RowData>[]>(() => {
    const cols: ColumnDef<RowData>[] = [];
    for (let c = 0; c < 1000; c += 1) {
      const key = `col${c}`;
      cols.push({
        accessorKey: key,
        header: `Col ${c}`,
        cell: (info) => info.getValue<number>(),
      });
    }
    return cols;
  }, []);

  const [data, setData] = React.useState<RowData[]>(() => {
    const rows: RowData[] = [];
    for (let r = 0; r < 1000; r += 1) {
      const row: RowData = { rowId: String(r) };
      for (let c = 0; c < 1000; c += 1) {
        row[`col${c}`] = r * 1000 + c;
      }
      rows.push(row);
    }
    return rows;
  });

  const dataIds = React.useMemo<UniqueIdentifier[]>(() => data?.map(({ rowId }) => rowId), [data]);

  const table = useReactTable<RowData>({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.rowId,
  });

  return (
    <DataTable
      onColumnChange={({ ids }) => {
        // With TanStack, users would call table.setColumnOrder(ids)
        table.setColumnOrder(ids);
      }}
      onRowChange={({ activeId, overId }) => {
        // Reorder data to match the new ids order
        // ids correspond to row.rowId values
        setData((data: RowData[]) => {
          const oldIndex = dataIds.indexOf(activeId);
          const newIndex = dataIds.indexOf(overId);
          return arrayMove(data, oldIndex, newIndex); //this is just a splice util
        });
      }}
      table={table}
    />
  );
};

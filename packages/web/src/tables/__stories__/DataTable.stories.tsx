import React from 'react';
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

type RowData = Record<string, number>;

export const DataTableExample = () => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const columns = React.useMemo<ColumnDef<RowData>[]>(() => {
    const cols: ColumnDef<RowData>[] = [];
    for (let c = 0; c < 1000; c += 1) {
      const key = `col${c}`;
      cols.push({
        accessorKey: key,
        header: `Col ${c}`,
        size: 120,
        cell: (info) => info.getValue<number>(),
      });
    }
    return cols;
  }, []);

  const data = React.useMemo<RowData[]>(() => {
    const rows: RowData[] = [];
    for (let r = 0; r < 1000; r += 1) {
      const row: RowData = {};
      for (let c = 0; c < 1000; c += 1) {
        row[`col${c}`] = r * 1000 + c;
      }
      rows.push(row);
    }
    return rows;
  }, []);

  const table = useReactTable<RowData>({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return <DataTable table={table} />;
};

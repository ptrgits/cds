import React from 'react';
import type { Meta } from '@storybook/react';

import type { ColumnDef, SortingState } from '../DataTable';
import { DataTable } from '../DataTable/DataTable';

export default {
  title: 'Components/Table/DataTable',
} as Meta;

type RowData = { rowId: string } & Record<`col${number}`, number>;

export const DataTableExample = () => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [virtualizeRows, setVirtualizeRows] = React.useState(true);
  const [virtualizeColumns, setVirtualizeColumns] = React.useState(true);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            checked={virtualizeRows}
            onChange={(e) => setVirtualizeRows(e.target.checked)}
            type="checkbox"
          />
          Virtualize Rows
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            checked={virtualizeColumns}
            onChange={(e) => setVirtualizeColumns(e.target.checked)}
            type="checkbox"
          />
          Virtualize Columns
        </label>
      </div>
      <DataTable
        onColumnChange={({ ids }) => {
          setColumnOrder(ids);
        }}
        tableOptions={{
          data,
          columns,
          state: { sorting, columnOrder },
          onSortingChange: setSorting,
          onColumnOrderChange: setColumnOrder,
          getRowId: (row) => row.rowId,
        }}
        virtualizeColumns={virtualizeColumns}
        virtualizeRows={virtualizeRows}
      />
    </div>
  );
};

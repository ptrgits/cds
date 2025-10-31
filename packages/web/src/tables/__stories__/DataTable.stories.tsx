import React from 'react';
import { css } from '@linaria/core';
import type { Meta } from '@storybook/react';
import type { ColumnPinningState } from '@tanstack/react-table';

import { IconButton } from '../../buttons/IconButton';
import { Checkbox } from '../../controls';
import { Box, HStack, VStack } from '../../layout';
import { Text } from '../../typography/Text';
import type { ColumnDef, SortingState } from '../DataTable';
import { ActionColumnIds, checkColumnConfig, DataTable } from '../DataTable';

export default {
  title: 'Components/Table/DataTable',
} as Meta;

const actionCellCss = css`
  padding: var(--space-2);
`;

type RowData = { rowId: string } & Record<`col${number}`, number>;

export const DataTableExample = () => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [virtualizeRows, setVirtualizeRows] = React.useState(true);
  const [virtualizeColumns, setVirtualizeColumns] = React.useState(true);
  const [stickyHeader, setStickyHeader] = React.useState(true);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({
    left: [ActionColumnIds.select, 'pinTop', 'pinBottom'],
    right: [],
  });
  const actionColumns = React.useMemo<ColumnDef<RowData>[]>(
    () => [
      checkColumnConfig,
      {
        id: 'pinTop',
        cell: ({ row }) => (
          <Box className={actionCellCss}>
            <IconButton
              compact
              name={row.getIsPinned?.() === 'top' ? 'close' : 'arrowUp'}
              onClick={() => {
                row.pin(row.getIsPinned?.() === 'top' ? false : 'top');
              }}
            />
          </Box>
        ),
        enableSorting: false,
        enablePinning: false,
        size: 72,
      },
      {
        id: 'pinBottom',
        cell: ({ row }) => (
          <Box className={actionCellCss}>
            <IconButton
              compact
              name={row.getIsPinned?.() === 'bottom' ? 'close' : 'arrowDown'}
              onClick={() => {
                row.pin(row.getIsPinned?.() === 'bottom' ? false : 'bottom');
              }}
            />
          </Box>
        ),
        enableSorting: false,
        enablePinning: false,
        size: 72,
      },
    ],
    [],
  );

  const dataColumns = React.useMemo<ColumnDef<RowData>[]>(() => {
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

  const columns = React.useMemo<ColumnDef<RowData>[]>(
    () => [...actionColumns, ...dataColumns],
    [actionColumns, dataColumns],
  );

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
    <VStack gap={3}>
      <HStack alignItems="center" gap={4}>
        <Checkbox checked={virtualizeRows} onChange={() => setVirtualizeRows((value) => !value)}>
          Virtualize Rows
        </Checkbox>
        <Checkbox
          checked={virtualizeColumns}
          onChange={() => setVirtualizeColumns((value) => !value)}
        >
          Virtualize Columns
        </Checkbox>
        <Checkbox checked={stickyHeader} onChange={() => setStickyHeader((value) => !value)}>
          Sticky Header
        </Checkbox>
      </HStack>
      <DataTable
        onColumnChange={({ ids }) => {
          setColumnOrder(ids);
        }}
        stickyHeader={stickyHeader}
        style={{ height: '400px' }}
        tableOptions={{
          data,
          columns,
          enableRowSelection: (row) => Number(row.original.rowId) % 2 === 0,
          onRowSelectionChange: setRowSelection,
          onColumnPinningChange: setColumnPinning,
          state: { sorting, columnOrder, rowSelection, columnPinning },
          onSortingChange: setSorting,
          onColumnOrderChange: setColumnOrder,
          getRowId: (row) => row.rowId,
        }}
        virtualizeColumns={virtualizeColumns}
        virtualizeRows={virtualizeRows}
      />
      <Text>{`${Object.keys(rowSelection).length} rows selected`}</Text>
    </VStack>
  );
};

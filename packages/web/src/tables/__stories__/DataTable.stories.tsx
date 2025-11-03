import { useMemo, useState } from 'react';
import { css } from '@linaria/core';
import type { Meta } from '@storybook/react';
import type { ColumnPinningState, ExpandedState } from '@tanstack/react-table';

import { IconButton } from '../../buttons/IconButton';
import { Checkbox } from '../../controls';
import { Box, HStack, VStack } from '../../layout';
import { Text } from '../../typography/Text';
import type { ColumnDef, SortingState } from '../DataTable';
import { ActionColumnIds, checkColumnConfig, DataTable, expandColumnConfig } from '../DataTable';

export default {
  title: 'Components/Table/DataTable',
} as Meta;

const actionCellCss = css`
  padding: var(--space-2);
`;

type RowData = { rowId: string; children?: RowData[] } & Record<`col${number}`, number>;

export const DataTableExample = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [virtualizeRows, setVirtualizeRows] = useState(true);
  const [virtualizeColumns, setVirtualizeColumns] = useState(true);
  const [stickyHeader, setStickyHeader] = useState(true);
  const [rowSelection, setRowSelection] = useState({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [ActionColumnIds.select, 'pinTop', 'pinBottom', ActionColumnIds.expand],
    right: [],
  });
  const actionColumns = useMemo<ColumnDef<RowData>[]>(
    () => [
      expandColumnConfig,
      checkColumnConfig,
      {
        id: 'pinTop',
        cell: ({ row }) => (
          <Box className={actionCellCss}>
            <IconButton
              compact
              aria-label={row.getIsPinned?.() === 'top' ? 'Unpin row from top' : 'Pin row to top'}
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
              aria-label={
                row.getIsPinned?.() === 'bottom' ? 'Unpin row from bottom' : 'Pin row to bottom'
              }
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

  const dataColumns = useMemo<ColumnDef<RowData>[]>(() => {
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

  const columns = useMemo<ColumnDef<RowData>[]>(
    () => [...actionColumns, ...dataColumns],
    [actionColumns, dataColumns],
  );

  const data = useMemo<RowData[]>(() => {
    const buildRow = (rowId: string, depth: number): RowData => {
      const row: RowData = { rowId };
      for (let c = 0; c < 1000; c += 1) {
        row[`col${c}`] = depth * 1000 + Number(rowId.replace(/-/g, '')) + c;
      }

      if (depth < 2) {
        row.children = new Array(3)
          .fill(null)
          .map((_, index) => buildRow(`${rowId}-${index}`, depth + 1));
      }

      return row;
    };

    return new Array(1000).fill(null).map((_, index) => buildRow(String(index), 0));
  }, []);

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
          enableRowSelection: (row) => Number(row.original.rowId.split('-')[0]) % 2 === 0,
          enableExpanding: true,
          getSubRows: (row) => row.children,
          onExpandedChange: setExpanded,
          onRowSelectionChange: setRowSelection,
          onColumnPinningChange: setColumnPinning,
          state: { sorting, columnOrder, rowSelection, columnPinning, expanded },
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

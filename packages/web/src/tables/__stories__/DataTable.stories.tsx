import { useMemo, useState } from 'react';
import { css } from '@linaria/core';
import type { Meta } from '@storybook/react';
import type {
  Column,
  ColumnDef,
  ColumnPinningState,
  ExpandedState,
  SortingState,
  Table as TableInstance,
} from '@tanstack/react-table';

import { IconButton } from '../../buttons/IconButton';
import { Checkbox, Select, SelectOption } from '../../controls';
import { Dropdown } from '../../dropdown/Dropdown';
import { Icon } from '../../icons/Icon';
import { Box, HStack, VStack } from '../../layout';
import { Pressable } from '../../system/Pressable';
import { Text } from '../../typography/Text';
import {
  ActionColumnIds,
  checkColumnConfig,
  DataTable,
  dragColumnConfig,
  expandColumnConfig,
} from '../DataTable';
import { HeaderCell } from '../DataTable/HeaderCell';
import type { TableVariant } from '../Table';

const getColumnOrderSnapshot = (table: TableInstance<any>) => {
  const currentOrder = table.getState().columnOrder;
  if (currentOrder && currentOrder.length) {
    return [...currentOrder];
  }
  return table.getAllLeafColumns().map((leaf) => leaf.id);
};

const moveColumn = (table: TableInstance<any>, columnId: string, direction: 'left' | 'right') => {
  const order = getColumnOrderSnapshot(table);
  const currentIndex = order.indexOf(columnId);
  if (currentIndex === -1) return;
  const targetIndex =
    direction === 'left'
      ? Math.max(0, currentIndex - 1)
      : Math.min(order.length - 1, currentIndex + 1);
  if (targetIndex === currentIndex) return;
  const nextOrder = [...order];
  nextOrder.splice(currentIndex, 1);
  nextOrder.splice(targetIndex, 0, columnId);
  table.setColumnOrder(nextOrder);
};

const togglePinColumn = (column: Column<any, unknown>) => {
  if (column.getCanPin?.() === false) {
    return;
  }
  const nextState = column.getIsPinned?.() ? false : 'left';
  column.pin(nextState);
};

const ColumnHeaderMenu = ({
  column,
  table,
}: {
  column: Column<any, unknown>;
  table: TableInstance<any>;
}) => {
  const order = getColumnOrderSnapshot(table);
  const columnIndex = order.indexOf(column.id);
  const moveLeftDisabled = columnIndex <= 0;
  const moveRightDisabled = columnIndex === order.length - 1;
  const pinDisabled = column.getCanPin?.() === false;
  const pinLabel = column.getIsPinned?.() ? 'Unpin column' : 'Pin column';

  const hasMenuOptions = !(moveLeftDisabled && moveRightDisabled && pinDisabled);

  if (!hasMenuOptions) {
    return <Icon name="caretDown" size="s" />;
  }

  return (
    <Dropdown
      content={
        <>
          <SelectOption
            disabled={moveLeftDisabled}
            media={<Icon active color="fg" name="arrowLeft" size="s" />}
            onClick={() => moveColumn(table, column.id, 'left')}
            title="Move left"
            value="move-left"
          />
          <SelectOption
            disabled={moveRightDisabled}
            media={<Icon active color="fg" name="arrowRight" size="s" />}
            onClick={() => moveColumn(table, column.id, 'right')}
            title="Move right"
            value="move-right"
          />
          <SelectOption
            disabled={pinDisabled}
            media={<Icon active color="fg" name="pin" size="s" />}
            onClick={() => togglePinColumn(column)}
            title={pinLabel}
            value="pin"
          />
        </>
      }
      contentPosition={{ placement: 'bottom-end', gap: 1 }}
      width="auto"
    >
      <Pressable aria-label="Open column menu">
        <Icon color="fg" name="caretDown" size="s" />
      </Pressable>
    </Dropdown>
  );
};

export default {
  title: 'Components/Table/DataTable',
} as Meta;

const actionCellCss = css`
  padding: var(--space-2);
`;

type RowData = { rowId: string; children?: RowData[] } & Record<`col${number}`, number>;

export const DefautlDataTableDesign = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [virtualizeRows, setVirtualizeRows] = useState(true);
  const [virtualizeColumns, setVirtualizeColumns] = useState(true);
  const [stickyHeader, setStickyHeader] = useState(true);
  const [bordered, setBordered] = useState(true);
  const [variant, setVariant] = useState<TableVariant>('ruled');
  const [rowSelection, setRowSelection] = useState({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [ActionColumnIds.drag, ActionColumnIds.select, ActionColumnIds.expand],
    right: [],
  });
  const [compact, setCompact] = useState(false);
  const actionColumns = useMemo<ColumnDef<RowData>[]>(
    () => [dragColumnConfig, expandColumnConfig, checkColumnConfig],
    [],
  );

  const dataColumns = useMemo<ColumnDef<RowData>[]>(() => {
    const cols: ColumnDef<RowData>[] = [];
    for (let c = 0; c < 1000; c += 1) {
      const key = `col${c}`;
      cols.push({
        accessorKey: key,
        header: ({ column, table }) => {
          return (
            <HeaderCell
              column={column}
              end={<ColumnHeaderMenu column={column} table={table} />}
              start={<Text>{`Col ${c}`}</Text>}
            />
          );
        },
        cell: (info) => info.getValue<number>(),
        size: 260,
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
    <VStack gap={3} padding={3}>
      <HStack alignItems="center" gap={4}>
        <Select
          compact
          label="Variant"
          onChange={(next: string | undefined) => {
            if (next) {
              setVariant(next as TableVariant);
            }
          }}
          placeholder="Select variant"
          value={variant}
          width="200px"
        >
          {['default', 'graph', 'ruled'].map((option) => (
            <SelectOption key={option} title={option} value={option} />
          ))}
        </Select>
        <Checkbox checked={bordered} onChange={() => setBordered((value) => !value)}>
          Bordered
        </Checkbox>
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
        <Checkbox checked={compact} onChange={() => setCompact((value) => !value)}>
          Compact
        </Checkbox>
      </HStack>
      <DataTable
        bordered={bordered}
        compact={compact}
        onColumnChange={({ ids }) => {
          setColumnOrder(ids);
        }}
        stickyHeader={stickyHeader}
        style={{ height: '400px' }}
        tableOptions={{
          data,
          columns,
          enableRowSelection: true,
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
        variant={variant}
        virtualizeColumns={virtualizeColumns}
        virtualizeRows={virtualizeRows}
      />
      <Text>{`${Object.keys(rowSelection).length} rows selected`}</Text>
    </VStack>
  );
};

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
        header: ({ column, table }) => {
          return (
            <HeaderCell
              column={column}
              end={<ColumnHeaderMenu column={column} table={table} />}
              start={<Text>{`Col ${c}`}</Text>}
            />
          );
        },
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

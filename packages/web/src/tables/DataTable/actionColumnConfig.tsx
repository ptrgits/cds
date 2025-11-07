import { css } from '@linaria/core';
import type { ColumnDef } from '@tanstack/react-table';

import { Checkbox } from '../../controls';
import { Icon } from '../../icons/Icon';
import { Box } from '../../layout';
import { Pressable } from '../../system';

export const ActionColumnIds = {
  expand: 'cds-column-action-expand',
  select: 'cds-column-action-select',
  drag: 'cds-column-action-drag',
} as const;

const actionCellCss = css`
  align-items: center;
  display: flex;
  justify-content: center;
  width: 100%;
`;

const iconPaddingCss = css`
  padding: 0 var(--space-1) var(--space-1) 0;
`;

export const dragColumnConfig = {
  id: ActionColumnIds.drag,
  header: () => null,
  cell: () => {
    return (
      <Pressable aria-label="Drag row" className={actionCellCss}>
        <Icon className={iconPaddingCss} color="fg" name="drag" size="s" />
      </Pressable>
    );
  },
  enablePinning: false,
  enableSorting: false,
  size: 60,
} satisfies ColumnDef<any>;

export const expandColumnConfig = {
  id: ActionColumnIds.expand,
  header: () => null,
  cell: ({ row }) => {
    if (!row.getCanExpand()) {
      return <Box className={actionCellCss} />;
    }

    return (
      <Pressable
        aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
        className={actionCellCss}
        onClick={() => {
          row.toggleExpanded();
        }}
      >
        <Icon
          className={iconPaddingCss}
          color="fg"
          name={row.getIsExpanded() ? 'caretDown' : 'caretRight'}
          size="s"
        />
      </Pressable>
    );
  },
  enablePinning: false,
  enableSorting: false,
  size: 60,
} satisfies ColumnDef<any>;

export const checkColumnConfig = {
  id: ActionColumnIds.select,
  header: ({ table }) => {
    const toggleAllRowsSelected = table.getToggleAllRowsSelectedHandler();
    return (
      <Box className={actionCellCss}>
        <Checkbox
          accessibilityLabel="Select all rows"
          checked={table.getIsAllRowsSelected?.() ?? false}
          indeterminate={table.getIsSomeRowsSelected?.() ?? false}
          onChange={(event) => toggleAllRowsSelected?.(event)}
        />
      </Box>
    );
  },
  cell: ({ row }) => {
    const toggleRowSelected = row.getToggleSelectedHandler?.();
    return (
      <Box className={actionCellCss}>
        <Checkbox
          accessibilityLabel="Select row"
          checked={row.getIsSelected?.() ?? false}
          disabled={!row.getCanSelect?.()}
          indeterminate={row.getIsSomeSelected?.() ?? false}
          onChange={(event) => toggleRowSelected?.(event)}
        />
      </Box>
    );
  },
  enablePinning: false,
  enableSorting: false,
  size: 56,
} satisfies ColumnDef<any>;

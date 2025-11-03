import { css } from '@linaria/core';
import type { ColumnDef } from '@tanstack/react-table';

import { IconButton } from '../../buttons/IconButton';
import { Checkbox } from '../../controls';
import { Box } from '../../layout';

export const ActionColumnIds = {
  expand: 'cds-column-action-expand',
  select: 'cds-column-action-select',
} as const;

const actionCellCss = css`
  align-items: center;
  display: flex;
  justify-content: center;
  padding: var(--space-2);
`;

export const expandColumnConfig = {
  id: ActionColumnIds.expand,
  header: () => null,
  cell: ({ row }) => {
    const canExpand = row.getCanExpand?.();

    if (!canExpand) {
      return <Box className={actionCellCss} />;
    }

    return (
      <Box className={actionCellCss}>
        <IconButton
          compact
          aria-label={row.getIsExpanded?.() ? 'Collapse row' : 'Expand row'}
          name={row.getIsExpanded?.() ? 'caretDown' : 'caretRight'}
          onClick={() => {
            row.toggleExpanded?.();
          }}
        />
      </Box>
    );
  },
  enablePinning: false,
  enableSorting: false,
  size: 72,
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

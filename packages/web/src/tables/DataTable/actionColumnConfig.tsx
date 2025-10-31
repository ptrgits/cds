import { css } from '@linaria/core';
import type { ColumnDef } from '@tanstack/react-table';

import { Checkbox } from '../../controls';
import { Box } from '../../layout';

export const ActionColumnIds = {
  select: 'cds-column-action-select',
} as const;

const actionCellCss = css`
  padding: var(--space-2);
`;

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

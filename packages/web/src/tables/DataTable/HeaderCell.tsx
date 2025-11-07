import { css } from '@linaria/core';
import type { Column, SortDirection } from '@tanstack/react-table';

import { Box, HStack, type HStackBaseProps, type HStackProps } from '../../layout';
import { Pressable } from '../../system/Pressable';
import { TableCellSortIcon } from '../TableCellSortIcon';

const endCss = css`
  justify-self: flex-end;
`;

export type HeaderCellProps = HStackBaseProps & {
  start?: React.ReactNode;
  end?: React.ReactNode;
  column: Column<any, unknown>;
};

export const getAriaSortDirection = (
  tanstackDirection: SortDirection | false,
): React.TdHTMLAttributes<HTMLTableCellElement>['aria-sort'] => {
  switch (tanstackDirection) {
    case 'asc':
      return 'ascending';
    case 'desc':
      return 'descending';
    default:
      return 'none';
  }
};

/**
 * Helper component for customer to render a header cell.
 */
export const HeaderCell = ({
  start,
  column,
  end,
  justifyContent = 'flex-start',
  alignItems = 'center',
}: HeaderCellProps) => {
  return (
    <HStack alignItems={alignItems} gap={2} justifyContent={justifyContent}>
      {start && <Box>{start}</Box>}

      {column.getCanSort() ? (
        <Pressable onClick={column.getToggleSortingHandler()}>
          <TableCellSortIcon direction={getAriaSortDirection(column.getIsSorted())} />
        </Pressable>
      ) : null}

      {end && <Box className={endCss}>{end}</Box>}
    </HStack>
  );
};

import { forwardRef, memo } from 'react';

import { DataTable, type DataTableProps } from './DataTable';
import { TableContainer, type TableContainerProps } from './TableContainer';

export type TableProps = TableContainerProps | DataTableProps;

export const Table = memo(
  forwardRef<HTMLTableElement, TableProps>((props: TableProps, ref) => {
    if ('children' in props) {
      return <TableContainer {...props} ref={ref} />;
    }
    return <DataTable {...props} ref={ref} />;
  }),
);

Table.displayName = 'Table';

import { forwardRef } from 'react';
import type { SharedProps } from '@coinbase/cds-common/types/SharedProps';

import { Table, type TableProps } from './Table';
import { TableBody } from './TableBody';
import { TableCell } from './TableCell';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';

export type ColumnType = {
  title: string;
  key: string;
};
export type DataType = Record<string, any>;

export type DataTableProps = Omit<TableProps, 'children'> & {
  /**
   * The data to display in the table.
   */
  data: DataType[];
  columns: ColumnType[];
  onRowOrderChange?: (newRows: DataType[]) => void;
  onColumnOrderChange?: (newColumns: ColumnType[]) => void;
};

export const DataTable = forwardRef<HTMLTableElement, DataTableProps>(
  ({ data, columns, ...props }, ref) => {
    return (
      <Table ref={ref} {...props}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key}>{column.title}</TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              {columns.map((column) => (
                <TableCell key={column.key}>{row[column.key]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
);

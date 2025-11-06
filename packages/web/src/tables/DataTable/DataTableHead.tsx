import type { Ref } from 'react';
import { css } from '@linaria/core';
import type { Table } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';

import { TableHeader } from '../TableHeader';

import { TableHeadRow } from './TableHeadRow';

export type DataTableHeadProps = {
  hasLeftOverflow: boolean;
  hasRightOverflow: boolean;
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  table: Table<any>;
  virtualPaddingLeft?: number;
  virtualPaddingRight?: number;
  sticky?: boolean;
  /** Whether to virtualize center columns rendering */
  virtualizeColumns?: boolean;
  sectionRef?: Ref<HTMLTableSectionElement>;
};

const tableHeadBaseCss = css`
  display: grid;
`;

export const DataTableHead = ({
  hasLeftOverflow,
  hasRightOverflow,
  columnVirtualizer,
  table,
  virtualPaddingLeft,
  virtualPaddingRight,
  sticky,
  virtualizeColumns,
  sectionRef,
}: DataTableHeadProps) => {
  return (
    <TableHeader ref={sectionRef} className={tableHeadBaseCss} sticky={sticky}>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableHeadRow
          key={headerGroup.id}
          columnVirtualizer={columnVirtualizer}
          hasLeftOverflow={hasLeftOverflow}
          hasRightOverflow={hasRightOverflow}
          headerGroup={headerGroup}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
          virtualizeColumns={virtualizeColumns}
        />
      ))}
    </TableHeader>
  );
};

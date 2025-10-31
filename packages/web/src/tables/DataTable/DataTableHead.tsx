import type { Ref } from 'react';
import { css } from '@linaria/core';
import { type Table } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';

import { cx } from '../../cx';

import { type ActionColumnHeadComponent, DefaultActionColumnHead } from './ActionColumnComponents';
import { TableHeadRow } from './TableHeadRow';

export type DataTableHeadProps = {
  ActionColumnHeadComponent?: ActionColumnHeadComponent<any>;
  actionsColumnWidth: number;
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  enableRowSelection: boolean;
  table: Table<any>;
  virtualPaddingLeft?: number;
  virtualPaddingRight?: number;
  isSticky?: boolean;
  /** Whether to virtualize center columns rendering */
  virtualizeColumns?: boolean;
  sectionRef?: Ref<HTMLTableSectionElement>;
};

const tableHeadBaseCss = css`
  display: grid;
`;

const stickyHeadCss = css`
  background: var(--color-bg);
  position: sticky;
  top: 0;
  z-index: 3;
`;

const nonStickyHeadCss = css`
  position: relative;
`;

export const DataTableHead = ({
  ActionColumnHeadComponent = DefaultActionColumnHead,
  actionsColumnWidth,
  columnVirtualizer,
  enableRowSelection,
  table,
  virtualPaddingLeft,
  virtualPaddingRight,
  isSticky,
  virtualizeColumns,
  sectionRef,
}: DataTableHeadProps) => {
  return (
    <thead
      ref={sectionRef}
      className={cx(tableHeadBaseCss, isSticky ? stickyHeadCss : nonStickyHeadCss)}
    >
      {table.getHeaderGroups().map((headerGroup) => (
        <TableHeadRow
          key={headerGroup.id}
          ActionColumnHeadComponent={ActionColumnHeadComponent}
          actionsColumnWidth={actionsColumnWidth}
          columnVirtualizer={columnVirtualizer}
          enableRowSelection={enableRowSelection}
          headerGroup={headerGroup}
          table={table}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
          virtualizeColumns={virtualizeColumns}
        />
      ))}
    </thead>
  );
};

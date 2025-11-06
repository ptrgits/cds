import React, { forwardRef, memo } from 'react';
import { zIndex } from '@coinbase/cds-common/tokens/zIndex';
import { css } from '@linaria/core';

import { cx } from '../cx';

import { TableSection, type TableSectionProps } from './TableSection';

export type TableHeaderProps = TableSectionProps & {
  /**
   * Use to make a header stick to the top of the table when scrolled
   * This will require setting a height or maxHeight on the Table or its parent
   * @default false
   */
  sticky?: boolean;
};

export const tableHeaderStaticClassName = 'cds-table-header';

const tableStickyCss = css`
  position: sticky;
  top: 0;
  z-index: ${zIndex.interactable};
`;

export const TableHeader = memo(
  forwardRef<HTMLTableSectionElement, TableHeaderProps>(function TableHeader(
    { children, sticky, testID, className, ...props },
    ref,
  ) {
    return (
      <TableSection
        ref={ref}
        as="thead"
        className={cx(tableHeaderStaticClassName, sticky && tableStickyCss, className)}
        data-testid={testID}
        {...props}
      >
        {children}
      </TableSection>
    );
  }),
);

TableHeader.displayName = 'TableHeader';

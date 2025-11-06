import React, { Children, forwardRef, memo, useCallback, useMemo } from 'react';
import type { SharedProps } from '@coinbase/cds-common';

import { TableSectionContext, type TableSectionContextValue } from './context/TableSectionContext';

export type TableSectionTag = 'thead' | 'tbody' | 'tfoot' | 'div';

export type TableSectionProps = SharedProps & {
  children?: React.ReactNode;
  /**
   * Internal only
   * @default undefined
   */
  as?: TableSectionTag;
  className?: string;
  style?: React.CSSProperties;
};

type TableSectionElement = HTMLTableSectionElement | HTMLDivElement;

export const TableSection = memo(
  forwardRef<TableSectionElement, TableSectionProps>(function TableSection(
    { as = 'tbody', children, testID, className, style, ...props },
    forwardedRef,
  ) {
    const value: TableSectionContextValue = useMemo(() => ({ as }), [as]);
    const TableSectionComponent = as;

    const setRef = useCallback(
      (node: TableSectionElement | null) => {
        if (!forwardedRef) return;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else {
          (forwardedRef as React.MutableRefObject<TableSectionElement | null>).current = node;
        }
      },
      [forwardedRef],
    );

    // Provide the section type to child components (specifically TableCell) so that they can
    // be smart about how to render their content.
    return (
      <TableSectionContext.Provider value={value}>
        <TableSectionComponent
          ref={setRef}
          className={className}
          data-testid={testID}
          style={style}
          {...props}
        >
          {Children.map(children, (child: React.ReactNode) => {
            // extra whitespace in table sections causes DOM validation errors
            // so we need to filter out empty children
            return child ?? null;
          })}
        </TableSectionComponent>
      </TableSectionContext.Provider>
    );
  }),
);

TableSection.displayName = 'TableSection';

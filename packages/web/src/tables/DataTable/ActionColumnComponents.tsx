import type { ReactNode } from 'react';
import { css } from '@linaria/core';
import type { Row, Table } from '@tanstack/react-table';

import { Button } from '../../buttons';
import { Checkbox } from '../../controls';
import { HStack } from '../../layout/HStack';
import { Text } from '../../typography/Text';

export const defaultActionsColumnWidth = 240;

export type ActionColumnHeadComponentProps<TData = any> = {
  enableRowSelection: boolean;
  table: Table<TData>;
};

export type ActionColumnHeadComponent<TData = any> = (
  props: ActionColumnHeadComponentProps<TData>,
) => ReactNode;

export type ActionColumnBodyComponentProps<TData = any> = {
  enableRowSelection: boolean;
  row: Row<TData>;
};

export type ActionColumnBodyComponent<TData = any> = (
  props: ActionColumnBodyComponentProps<TData>,
) => ReactNode;

const defaultHeadContentCss = css`
  background-color: var(--color-bg);
  height: 100%;
  width: ${defaultActionsColumnWidth}px;
`;

const defaultBodyContentCss = css`
  background-color: var(--color-bg);
  width: ${defaultActionsColumnWidth}px;
`;

export const DefaultActionColumnHead = <TData,>({
  enableRowSelection,
  table,
}: ActionColumnHeadComponentProps<TData>) => {
  const toggleAllRowsSelected = table.getToggleAllRowsSelectedHandler?.();

  return (
    <HStack alignItems="center" className={defaultHeadContentCss} padding={1}>
      {enableRowSelection ? (
        <Checkbox
          accessibilityLabel="Select all rows"
          checked={table.getIsAllRowsSelected?.() ?? false}
          indeterminate={table.getIsSomeRowsSelected?.() ?? false}
          onChange={(event) => toggleAllRowsSelected?.(event)}
        />
      ) : null}
      <Text as="span" font="label2">
        Row Actions
      </Text>
    </HStack>
  );
};

export const DefaultActionColumnBody = <TData,>({
  enableRowSelection,
  row,
}: ActionColumnBodyComponentProps<TData>) => {
  return (
    <HStack
      alignItems="center"
      className={defaultBodyContentCss}
      padding={1}
      style={{ backgroundColor: row.getIsSelected() ? 'var(--color-bgAlternate)' : undefined }}
    >
      {enableRowSelection ? (
        <Checkbox
          accessibilityLabel="Select row"
          checked={row.getIsSelected?.() ?? false}
          disabled={!row.getCanSelect?.()}
          indeterminate={row.getIsSomeSelected?.() ?? false}
          onChange={(event) => row.getToggleSelectedHandler?.()?.(event)}
        />
      ) : null}
      {row.getIsPinned?.() !== 'top' ? (
        <Button compact onClick={() => row.pin('top')}>
          Top
        </Button>
      ) : null}
      {row.getIsPinned?.() ? (
        <Button compact onClick={() => row.pin(false)}>
          Unpin
        </Button>
      ) : null}
      {row.getIsPinned?.() !== 'bottom' ? (
        <Button compact onClick={() => row.pin('bottom')}>
          Bottom
        </Button>
      ) : null}
    </HStack>
  );
};

import React, { memo } from 'react';
import { cx } from '@coinbase/cds-web';
import { Box, type BoxProps, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { css } from '@linaria/core';

import { ChartOverlay } from '../ChartOverlay';
import { useCartesianChartContext } from '../ChartProvider';

import { LegendMedia } from './LegendMedia';

const legendItemCss = css`
  gap: var(--space-0_5);
  align-items: center;
`;

export type LegendProps = Omit<BoxProps<'div'>, 'position'> & {
  /**
   * The position of the legend relative to the chart.
   * @default 'top'
   */
  position?: 'top' | 'bottom' | 'left' | 'right';
};

export const Legend = memo(function Legend({
  position = 'top',
  flexDirection = position === 'top' || position === 'bottom' ? 'row' : 'column',
  justifyContent = 'center',
  alignItems = position === 'top' || position === 'bottom' ? 'center' : 'flex-start',
  flexWrap = 'wrap',
  gap = 1,
  ...props
}: LegendProps) {
  const { series, slotRefs } = useCartesianChartContext();

  if (!series || series.length === 0) return;

  const slotRef =
    position === 'top'
      ? slotRefs?.topRef
      : position === 'bottom'
        ? slotRefs?.bottomRef
        : position === 'left'
          ? slotRefs?.leftRef
          : slotRefs?.rightRef;

  return (
    <ChartOverlay slotRef={slotRef}>
      <Box
        alignItems={alignItems}
        flexDirection={flexDirection}
        flexWrap={flexWrap}
        gap={gap}
        justifyContent={justifyContent}
        {...props}
      >
        {series.map((s) => (
          <HStack key={s.id} className={legendItemCss}>
            <LegendMedia color={s.color} shape={s.legendShape} />
            <Text font="label2">{s.label ?? s.id}</Text>
          </HStack>
        ))}
      </Box>
    </ChartOverlay>
  );
});

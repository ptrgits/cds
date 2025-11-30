import React, { memo, useMemo } from 'react';
import { cx } from '@coinbase/cds-web';
import { Box, type BoxProps } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import { css } from '@linaria/core';

import { useCartesianChartContext } from '../ChartProvider';
import type { Series } from '../utils';

import { LegendMedia, type LegendShape } from './LegendMedia';

const legendContainerCss = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-16);
`;

const legendItemCss = css`
  display: flex;
  align-items: center;
  gap: var(--space-8);
`;

export type LegendProps = BoxProps<'div'> & {
  /**
   * Custom renderer for legend items.
   */
  renderItem?: (series: Series, index: number) => React.ReactNode;
  /**
   * Map of series IDs to legend media shapes.
   */
  shapes?: Record<string, LegendShape>;
};

export const Legend = memo(({ className, renderItem, shapes, ...props }: LegendProps) => {
  const { series } = useCartesianChartContext();

  const content = useMemo(() => {
    if (!series) return null;
    return series.map((s, i) => {
      if (renderItem) {
        return <React.Fragment key={s.id}>{renderItem(s, i)}</React.Fragment>;
      }
      const shape = shapes?.[s.id] ?? 'squircle';
      return (
        <Box key={s.id} className={legendItemCss}>
          <LegendMedia color={s.color ?? 'var(--color-foreground)'} shape={shape} />
          <Text color="fgMuted" font="label2">
            {s.label ?? s.id}
          </Text>
        </Box>
      );
    });
  }, [series, renderItem, shapes]);

  return (
    <Box className={cx(legendContainerCss, className)} {...props}>
      {content}
    </Box>
  );
});

Legend.displayName = 'Legend';
// Add static property for identification
(Legend as any).cdsRole = 'legend';

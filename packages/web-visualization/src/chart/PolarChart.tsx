import React, { forwardRef, memo, useCallback, useMemo, useRef } from 'react';
import type { Rect } from '@coinbase/cds-common/types';
import { cx } from '@coinbase/cds-web';
import { useDimensions } from '@coinbase/cds-web/hooks/useDimensions';
import { Box, type BoxBaseProps, type BoxProps } from '@coinbase/cds-web/layout';
import { css } from '@linaria/core';

import type { PolarChartContextValue, PolarSeries } from './polar/utils';
import { PolarChartProvider } from './PolarChartProvider';

const focusStylesCss = css`
  &:focus {
    outline: none;
  }
  &:focus-visible {
    outline: 2px solid var(--color-bgPrimary);
    outline-offset: 2px;
  }
`;

export type PolarChartBaseProps = BoxBaseProps & {
  /**
   * Configuration object that defines the data to visualize.
   */
  series?: PolarSeries[];
  /**
   * Whether to animate the chart.
   * @default true
   */
  animate?: boolean;
  /**
   * Inner radius as a ratio of the outer radius (0-1).
   * 0 = pie chart, >0 = donut chart.
   * @default 0
   */
  innerRadiusRatio?: number;
  /**
   * Padding angle between slices in radians.
   * @default 0
   */
  padAngle?: number;
  /**
   * Start angle in radians.
   * @default 0
   */
  startAngle?: number;
  /**
   * End angle in radians.
   * @default 2 * Math.PI
   */
  endAngle?: number;
  /**
   * Outer radius as a ratio of the maximum available radius (0-1).
   * @default 1
   */
  outerRadiusRatio?: number;
  /**
   * Minimum padding around the chart in pixels.
   * @default 0
   */
  padding?: number;
};

export type PolarChartProps = BoxProps<'svg'> & PolarChartBaseProps;

/**
 * Base component for polar coordinate charts (pie, donut).
 * Provides context and layout for polar chart child components.
 */
export const PolarChart = memo(
  forwardRef<SVGSVGElement, PolarChartProps>(
    (
      {
        series = [],
        children,
        animate = true,
        innerRadiusRatio = 0,
        padAngle = 0,
        startAngle = 0,
        endAngle = 2 * Math.PI,
        outerRadiusRatio = 1,
        padding = 0,
        width = '100%',
        height = '100%',
        className,
        style,
        ...props
      },
      ref,
    ) => {
      const { observe, width: chartWidth, height: chartHeight } = useDimensions();
      const internalSvgRef = useRef<SVGSVGElement>(null);

      // Calculate center and radius
      const { centerX, centerY, maxRadius } = useMemo(() => {
        const w = chartWidth - padding * 2;
        const h = chartHeight - padding * 2;
        const cx = chartWidth / 2;
        const cy = chartHeight / 2;
        const r = Math.min(w, h) / 2;

        return {
          centerX: cx,
          centerY: cy,
          maxRadius: Math.max(0, r),
        };
      }, [chartWidth, chartHeight, padding]);

      const outerRadius = useMemo(() => {
        return maxRadius * Math.max(0, Math.min(1, outerRadiusRatio));
      }, [maxRadius, outerRadiusRatio]);

      const innerRadius = useMemo(() => {
        return outerRadius * Math.max(0, Math.min(1, innerRadiusRatio));
      }, [outerRadius, innerRadiusRatio]);

      const getSeries = useCallback(
        (seriesId?: string) => series.find((s) => s.id === seriesId),
        [series],
      );

      const contextValue: PolarChartContextValue = useMemo(
        () => ({
          series,
          getSeries,
          animate,
          width: chartWidth,
          height: chartHeight,
          centerX,
          centerY,
          maxRadius,
          innerRadius,
          outerRadius,
          padAngle,
          startAngle,
          endAngle,
        }),
        [
          series,
          getSeries,
          animate,
          chartWidth,
          chartHeight,
          centerX,
          centerY,
          maxRadius,
          innerRadius,
          outerRadius,
          padAngle,
          startAngle,
          endAngle,
        ],
      );

      return (
        <Box
          ref={(node) => {
            // Handle the observe ref, internal ref, and forwarded ref
            observe(node as unknown as HTMLElement);
            if (internalSvgRef.current !== node) {
              (internalSvgRef as React.MutableRefObject<SVGSVGElement | null>).current =
                node as unknown as SVGSVGElement;
            }
            if (ref) {
              if (typeof ref === 'function') {
                ref(node as unknown as SVGSVGElement);
              } else {
                ref.current = node as unknown as SVGSVGElement;
              }
            }
          }}
          aria-live="polite"
          as="svg"
          className={cx(focusStylesCss, className)}
          height={height}
          role="figure"
          style={style}
          width={width}
          {...props}
        >
          <PolarChartProvider value={contextValue}>{children}</PolarChartProvider>
        </Box>
      );
    },
  ),
);

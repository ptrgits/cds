import React, { forwardRef, memo, useCallback, useMemo, useRef } from 'react';
import { cx } from '@coinbase/cds-web';
import { useDimensions } from '@coinbase/cds-web/hooks/useDimensions';
import { Box, type BoxProps } from '@coinbase/cds-web/layout';
import { css } from '@linaria/core';

import { PolarChartProvider } from './polar/PolarChartProvider';
import type { PolarChartContextValue, PolarSeries } from './polar/utils';
import {
  type AngularAxisConfig,
  getAngularAxisRadians,
  getRadialAxisPixels,
  type RadialAxisConfig,
} from './polar/utils/axis';

const focusStylesCss = css`
  &:focus {
    outline: none;
  }
  &:focus-visible {
    outline: 2px solid var(--color-bgPrimary);
    outline-offset: 2px;
  }
`;

export type PolarChartBaseProps = {
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
   * Configuration for the angular axis (controls start/end angles).
   * Default range: { min: 0, max: 360 } (full circle)
   *
   * @example
   * ```tsx
   * // Semicircle
   * <PolarChart angularAxis={{ range: { min: 0, max: 180 } }} />
   *
   * // Leave 45 degrees on each side
   * <PolarChart angularAxis={{ range: ({ min, max }) => ({ min: min + 45, max: max - 45 }) }} />
   *
   * // Add padding between slices
   * <PolarChart angularAxis={{ paddingAngle: 2 }} />
   * ```
   */
  angularAxis?: AngularAxisConfig;
  /**
   * Configuration for the radial axis (controls inner/outer radii).
   * Default range: { min: 0, max: [radius in pixels] } (pie chart using full radius)
   *
   * @example
   * ```tsx
   * // Donut chart with 50% inner radius
   * <PolarChart radialAxis={{ range: ({ max }) => ({ min: max * 0.5, max }) }} />
   *
   * // Ring in the middle (30% to 60% of radius)
   * <PolarChart radialAxis={{ range: ({ max }) => ({ min: max * 0.3, max: max * 0.6 }) }} />
   *
   * // Absolute pixel values (50px to 150px)
   * <PolarChart radialAxis={{ range: { min: 50, max: 150 } }} />
   *
   * // Leave 10px space around the edge
   * <PolarChart radialAxis={{ range: ({ min, max }) => ({ min, max: max - 10 }) }} />
   * ```
   */
  radialAxis?: RadialAxisConfig;
  /**
   * Minimum padding around the chart in pixels.
   * @default 0
   */
  padding?: number;
};

export type PolarChartProps = Pick<
  BoxProps<'svg'>,
  'width' | 'height' | 'className' | 'style' | 'children' | 'overflow'
> &
  PolarChartBaseProps & {};

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
        angularAxis,
        radialAxis,
        padding = 0,
        width = '100%',
        height = '100%',
        className,
        style,
        overflow,
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

      // Calculate angular axis (angles in radians)
      const { startAngle, endAngle, padAngle } = useMemo(() => {
        return getAngularAxisRadians(angularAxis);
      }, [angularAxis]);

      // Calculate radial axis (radii in pixels)
      const { innerRadius, outerRadius } = useMemo(() => {
        return getRadialAxisPixels(maxRadius, radialAxis);
      }, [maxRadius, radialAxis]);

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
          angularAxis,
          radialAxis,
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
          angularAxis,
          radialAxis,
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
          overflow={overflow}
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

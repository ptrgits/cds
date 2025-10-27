import React, { forwardRef, memo, useCallback, useMemo, useRef } from 'react';
import type { Rect } from '@coinbase/cds-common/types';
import { cx } from '@coinbase/cds-web';
import { useDimensions } from '@coinbase/cds-web/hooks/useDimensions';
import { Box, type BoxProps } from '@coinbase/cds-web/layout';
import { css } from '@linaria/core';

import { PolarChartProvider } from './polar/PolarChartProvider';
import type { PolarSeries } from './polar/utils';
import {
  type AngularAxisConfig,
  defaultPolarAxisId,
  type RadialAxisConfig,
} from './polar/utils/axis';
import type { PolarChartContextValue } from './utils/context';
import { type ChartInset, defaultChartInset, getChartInset } from './utils';

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
   * Configuration for angular axis/axes (controls start/end angles).
   * Can be a single axis config or an array of axis configs for multiple angular ranges.
   * Default range: { min: 0, max: 360 } (full circle)
   *
   * @example
   * Single axis (default):
   * ```tsx
   * // Semicircle
   * <PolarChart angularAxis={{ range: { min: 0, max: 180 } }} />
   *
   * // Add padding between slices
   * <PolarChart angularAxis={{ paddingAngle: 2 }} />
   * ```
   *
   * @example
   * Multiple axes:
   * ```tsx
   * <PolarChart
   *   angularAxis={[
   *     { id: 'top', range: { min: 0, max: 180 } },
   *     { id: 'bottom', range: { min: 180, max: 360 } },
   *   ]}
   *   series={[
   *     { id: 'topData', data: [...], angularAxisId: 'top' },
   *     { id: 'bottomData', data: [...], angularAxisId: 'bottom' },
   *   ]}
   * />
   * ```
   */
  angularAxis?: AngularAxisConfig | AngularAxisConfig[];
  /**
   * Configuration for radial axis/axes (controls inner/outer radii).
   * Can be a single axis config or an array of axis configs for multiple radial ranges.
   * Default range: { min: 0, max: [radius in pixels] } (pie chart using full radius)
   *
   * @example
   * Single axis (default):
   * ```tsx
   * // Donut chart with 50% inner radius
   * <PolarChart radialAxis={{ range: ({ max }) => ({ min: max * 0.5, max }) }} />
   * ```
   *
   * @example
   * Multiple axes (nested rings):
   * ```tsx
   * <PolarChart
   *   radialAxis={[
   *     { id: 'inner', range: ({ max }) => ({ min: 0, max: max * 0.4 }) },
   *     { id: 'outer', range: ({ max }) => ({ min: max * 0.6, max }) },
   *   ]}
   *   series={[
   *     { id: 'innerData', data: [...], radialAxisId: 'inner' },
   *     { id: 'outerData', data: [...], radialAxisId: 'outer' },
   *   ]}
   * />
   * ```
   */
  radialAxis?: RadialAxisConfig | RadialAxisConfig[];
  /**
   * Inset around the entire chart (outside the drawing area).
   */
  inset?: number | Partial<ChartInset>;
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
        inset: insetInput,
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

      const inset = useMemo(() => {
        return getChartInset(insetInput, defaultChartInset);
      }, [insetInput]);

      // Calculate drawing area - always square for polar charts
      const drawingArea: Rect = useMemo(() => {
        if (chartWidth <= 0 || chartHeight <= 0) return { x: 0, y: 0, width: 0, height: 0 };

        const availableWidth = chartWidth - inset.left - inset.right;
        const availableHeight = chartHeight - inset.top - inset.bottom;

        // Use the smaller dimension to create a square drawing area
        const size = Math.min(
          availableWidth > 0 ? availableWidth : 0,
          availableHeight > 0 ? availableHeight : 0,
        );

        // Center the square drawing area within the available space
        const offsetX = (availableWidth - size) / 2;
        const offsetY = (availableHeight - size) / 2;

        return {
          x: inset.left + offsetX,
          y: inset.top + offsetY,
          width: size,
          height: size,
        };
      }, [chartWidth, chartHeight, inset]);

      const getSeries = useCallback(
        (seriesId?: string) => series.find((s) => s.id === seriesId),
        [series],
      );

      // Build angular axis map
      const angularAxes = useMemo(() => {
        const axesMap = new Map<string, AngularAxisConfig>();

        if (Array.isArray(angularAxis)) {
          angularAxis.forEach((axis) => {
            const id = axis.id ?? defaultPolarAxisId;
            axesMap.set(id, axis);
          });
        } else if (angularAxis) {
          const id = angularAxis.id ?? defaultPolarAxisId;
          axesMap.set(id, angularAxis);
        } else {
          // Default axis
          axesMap.set(defaultPolarAxisId, {});
        }

        return axesMap;
      }, [angularAxis]);

      // Build radial axis map
      const radialAxes = useMemo(() => {
        const axesMap = new Map<string, RadialAxisConfig>();

        if (Array.isArray(radialAxis)) {
          radialAxis.forEach((axis) => {
            const id = axis.id ?? defaultPolarAxisId;
            axesMap.set(id, axis);
          });
        } else if (radialAxis) {
          const id = radialAxis.id ?? defaultPolarAxisId;
          axesMap.set(id, radialAxis);
        } else {
          // Default axis
          axesMap.set(defaultPolarAxisId, {});
        }

        return axesMap;
      }, [radialAxis]);

      const getAngularAxis = useCallback(
        (id?: string) => angularAxes.get(id ?? defaultPolarAxisId),
        [angularAxes],
      );

      const getRadialAxis = useCallback(
        (id?: string) => radialAxes.get(id ?? defaultPolarAxisId),
        [radialAxes],
      );

      const contextValue: PolarChartContextValue = useMemo(
        () => ({
          series,
          getSeries,
          animate,
          width: chartWidth,
          height: chartHeight,
          drawingArea,
          angularAxes,
          radialAxes,
          getAngularAxis,
          getRadialAxis,
        }),
        [
          series,
          getSeries,
          animate,
          chartWidth,
          chartHeight,
          drawingArea,
          angularAxes,
          radialAxes,
          getAngularAxis,
          getRadialAxis,
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

import { forwardRef, memo, useMemo } from 'react';

import type { PolarSeries } from '../polar/utils/polar';
import { PolarChart, type PolarChartProps } from '../PolarChart';

import { type PieSeries } from './PieChart';
import { PiePlot, type PiePlotProps } from './PiePlot';

/**
 * Series type for DonutChart - same as PieSeries (enforces single number data values).
 */
export type DonutSeries = PieSeries;

export type DonutChartBaseProps = Omit<PolarChartProps, 'series'> &
  Pick<
    PiePlotProps,
    | 'ArcComponent'
    | 'fillOpacity'
    | 'stroke'
    | 'strokeWidth'
    | 'cornerRadius'
    | 'onArcClick'
    | 'onArcMouseEnter'
    | 'onArcMouseLeave'
  > & {
    /**
     * Array of series, where each series represents one slice.
     * Each series must have a single numeric value.
     */
    series?: DonutSeries[];
    /**
     * Inner radius as a ratio of the outer radius (0-1).
     * This sets the default radial axis to: `range: ({ max }) => ({ min: max * innerRadiusRatio, max })`
     *
     * **Note**: If you provide a custom `radialAxis` prop, this will be ignored.
     * @default 0.5
     */
    innerRadiusRatio?: number;
  };

export type DonutChartProps = DonutChartBaseProps;

/**
 * A donut chart component for visualizing proportional data with a hollow center.
 * Each series represents one slice, with its value as a proportion of the total.
 * The hollow center can be used for displaying additional information.
 *
 * @example
 * ```tsx
 * <DonutChart
 *   series={[
 *     { id: 'a', data: 30, label: 'Category A', color: '#5B8DEF' },
 *     { id: 'b', data: 50, label: 'Category B', color: '#4CAF93' },
 *     { id: 'c', data: 20, label: 'Category C', color: '#E67C5C' },
 *   ]}
 *   innerRadiusRatio={0.6}
 *   width={200}
 *   height={200}
 * />
 * ```
 */
export const DonutChart = memo(
  forwardRef<SVGSVGElement, DonutChartProps>(
    (
      {
        series = [],
        children,
        innerRadiusRatio = 0.5,
        ArcComponent,
        fillOpacity,
        stroke,
        strokeWidth,
        cornerRadius,
        onArcClick,
        onArcMouseEnter,
        onArcMouseLeave,
        ...chartProps
      },
      ref,
    ) => {
      // Set default radial axis for donut chart
      const defaultRadialAxis = useMemo(
        () => ({
          range: ({ min, max }: { min: number; max: number }) => ({
            min: max * innerRadiusRatio,
            max,
          }),
        }),
        [innerRadiusRatio],
      );

      return (
        <PolarChart
          ref={ref}
          {...chartProps}
          radialAxis={chartProps.radialAxis || defaultRadialAxis}
          series={series as PolarSeries[]}
        >
          <PiePlot
            ArcComponent={ArcComponent}
            cornerRadius={cornerRadius}
            fillOpacity={fillOpacity}
            onArcClick={onArcClick}
            onArcMouseEnter={onArcMouseEnter}
            onArcMouseLeave={onArcMouseLeave}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          {children}
        </PolarChart>
      );
    },
  ),
);

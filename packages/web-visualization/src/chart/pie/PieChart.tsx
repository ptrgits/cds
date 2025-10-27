import { forwardRef, memo } from 'react';

import type { PolarSeries } from '../polar/utils/polar';
import { PolarChart, type PolarChartProps } from '../PolarChart';

import { PiePlot, type PiePlotProps } from './PiePlot';

/**
 * Series type for PieChart - enforces single number data values.
 */
export type PieSeries = Omit<PolarSeries, 'data'> & {
  /**
   * Single numeric value for this slice.
   */
  data: number;
};

export type PieChartBaseProps = Omit<PolarChartProps, 'series'> &
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
    series?: PieSeries[];
  };

export type PieChartProps = PieChartBaseProps;

/**
 * A pie chart component for visualizing proportional data.
 * Each series represents one slice, with its value as a proportion of the total.
 *
 * By default, uses the full radius (radialAxis: { range: { min: 0, max: [radius in pixels] } }).
 *
 * @example
 * ```tsx
 * <PieChart
 *   series={[
 *     { id: 'a', data: 30, label: 'Category A', color: '#5B8DEF' },
 *     { id: 'b', data: 50, label: 'Category B', color: '#4CAF93' },
 *     { id: 'c', data: 20, label: 'Category C', color: '#E67C5C' },
 *   ]}
 *   width={200}
 *   height={200}
 * />
 * ```
 */
export const PieChart = memo(
  forwardRef<SVGSVGElement, PieChartProps>(
    (
      {
        series = [],
        children,
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
      // PiePlot will automatically aggregate all series on the default radial axis
      return (
        <PolarChart ref={ref} {...chartProps} series={series as PolarSeries[]}>
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

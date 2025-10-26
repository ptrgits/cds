import { forwardRef, memo, useMemo } from 'react';

import type { PolarDataPoint, PolarSeries } from '../polar/utils/polar';
import { PolarChart, type PolarChartProps } from '../PolarChart';

import { PiePlot, type PiePlotProps } from './PiePlot';

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
     * Data points for the pie chart.
     */
    data?: PolarDataPoint[];
    /**
     * Optional label for the pie chart.
     */
    label?: string;
  };

export type PieChartProps = PieChartBaseProps;

/**
 * A pie chart component for visualizing proportional data.
 * Each slice represents a data point's value as a proportion of the total.
 *
 * By default, uses the full radius (radialAxis: { range: { min: 0, max: [radius in pixels] } }).
 */
export const PieChart = memo(
  forwardRef<SVGSVGElement, PieChartProps>(
    (
      {
        data = [],
        label,
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
      const series: PolarSeries[] = useMemo(() => {
        if (!data.length) return [];
        return [
          {
            id: 'pie-series',
            data,
            label,
          },
        ];
      }, [data, label]);

      // For pie chart, use the default radial axis (full radius: min: 0, max: maxRadius in pixels)
      // Only override if user explicitly provides radialAxis
      return (
        <PolarChart ref={ref} {...chartProps} radialAxis={chartProps.radialAxis} series={series}>
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

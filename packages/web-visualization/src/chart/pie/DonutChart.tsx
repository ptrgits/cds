import { forwardRef, memo, useMemo } from 'react';

import { PolarChart, type PolarChartProps } from './PolarChart';
import { PiePlot, type PiePlotProps } from './PiePlot';
import type { PolarDataPoint, PolarSeries } from './utils/polar';

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
     * Data points for the donut chart.
     */
    data?: PolarDataPoint[];
    /**
     * Optional label for the donut chart.
     */
    label?: string;
  };

export type DonutChartProps = DonutChartBaseProps;

/**
 * A donut chart component for visualizing proportional data with a hollow center.
 * Each slice represents a data point's value as a proportion of the total.
 * The hollow center can be used for displaying additional information.
 */
export const DonutChart = memo(
  forwardRef<SVGSVGElement, DonutChartProps>(
    (
      {
        data = [],
        label,
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
      const series: PolarSeries[] = useMemo(() => {
        if (!data.length) return [];
        return [
          {
            id: 'donut-series',
            data,
            label,
          },
        ];
      }, [data, label]);

      return (
        <PolarChart {...chartProps} ref={ref} innerRadiusRatio={innerRadiusRatio} series={series}>
          <PiePlot
            ArcComponent={ArcComponent}
            cornerRadius={cornerRadius}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth={strokeWidth}
            onArcClick={onArcClick}
            onArcMouseEnter={onArcMouseEnter}
            onArcMouseLeave={onArcMouseLeave}
          />
          {children}
        </PolarChart>
      );
    },
  ),
);

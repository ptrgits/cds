import { forwardRef, memo, useMemo } from 'react';

import { PolarChart, type PolarChartProps } from './PolarChart';
import { PiePlot, type PiePlotProps } from './PiePlot';
import type { PolarDataPoint, PolarSeries } from './utils/polar';

export type PieChartBaseProps = Omit<PolarChartProps, 'series' | 'innerRadiusRatio'> &
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

      return (
        <PolarChart {...chartProps} ref={ref} innerRadiusRatio={0} series={series}>
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

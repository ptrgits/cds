import { forwardRef, memo, useMemo } from 'react';

import type { PolarDataPoint, PolarSeries } from '../polar/utils/polar';
import { PolarChart, type PolarChartProps } from '../PolarChart';

import { PiePlot, type PiePlotProps } from './PiePlot';

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
          series={series}
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

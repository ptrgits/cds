import React, { memo, useMemo } from 'react';

import { usePolarChartContext } from './PolarChartProvider';
import { Arc, type ArcProps } from './Arc';
import { calculateArcData, getPolarColor, type ArcData, type PolarDataPoint } from './utils/polar';

export type PiePlotBaseProps = {
  /**
   * ID of the series to render. If not provided, renders the first series.
   */
  seriesId?: string;
  /**
   * Custom Arc component to use for rendering slices.
   */
  ArcComponent?: React.ComponentType<ArcProps>;
  /**
   * Fill opacity for all arcs.
   * @default 1
   */
  fillOpacity?: number;
  /**
   * Stroke color for all arcs.
   */
  stroke?: string;
  /**
   * Stroke width in pixels.
   * @default 0
   */
  strokeWidth?: number;
  /**
   * Corner radius in pixels.
   * @default 0
   */
  cornerRadius?: number;
  /**
   * Callback fired when an arc is clicked.
   */
  onArcClick?: (
    data: PolarDataPoint,
    index: number,
    event: React.MouseEvent<SVGPathElement>,
  ) => void;
  /**
   * Callback fired when the mouse enters an arc.
   */
  onArcMouseEnter?: (
    data: PolarDataPoint,
    index: number,
    event: React.MouseEvent<SVGPathElement>,
  ) => void;
  /**
   * Callback fired when the mouse leaves an arc.
   */
  onArcMouseLeave?: (
    data: PolarDataPoint,
    index: number,
    event: React.MouseEvent<SVGPathElement>,
  ) => void;
};

export type PiePlotProps = PiePlotBaseProps;

/**
 * Renders all arcs (slices) for a polar chart.
 * Used internally by PieChart and DonutChart.
 */
export const PiePlot = memo<PiePlotProps>(
  ({
    seriesId,
    ArcComponent = Arc,
    fillOpacity,
    stroke,
    strokeWidth,
    cornerRadius,
    onArcClick,
    onArcMouseEnter,
    onArcMouseLeave,
  }) => {
    const { series, getSeries, innerRadius, outerRadius, padAngle, startAngle, endAngle } =
      usePolarChartContext();

    const targetSeries = useMemo(() => {
      if (seriesId) {
        return getSeries(seriesId);
      }
      return series[0];
    }, [seriesId, getSeries, series]);

    const arcs = useMemo(() => {
      if (!targetSeries || !targetSeries.data.length) {
        return [];
      }

      return calculateArcData(
        targetSeries.data,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        padAngle,
      );
    }, [targetSeries, innerRadius, outerRadius, startAngle, endAngle, padAngle]);

    if (!arcs.length) {
      return null;
    }

    return (
      <>
        {arcs.map((arcData: ArcData, index: number) => {
          const fill = getPolarColor(index, arcData.data.color);

          return (
            <ArcComponent
              key={arcData.data.id ?? index}
              arcData={arcData}
              cornerRadius={cornerRadius}
              fill={fill}
              fillOpacity={fillOpacity}
              stroke={stroke}
              strokeWidth={strokeWidth}
              onClick={
                onArcClick ? (data, event) => onArcClick(data.data, data.index, event) : undefined
              }
              onMouseEnter={
                onArcMouseEnter
                  ? (data, event) => onArcMouseEnter(data.data, data.index, event)
                  : undefined
              }
              onMouseLeave={
                onArcMouseLeave
                  ? (data, event) => onArcMouseLeave(data.data, data.index, event)
                  : undefined
              }
            />
          );
        })}
      </>
    );
  },
);

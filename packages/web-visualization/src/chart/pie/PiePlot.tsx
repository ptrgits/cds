import React, { memo, useMemo } from 'react';

import { usePolarChartContext } from '../polar';
import {
  type ArcData,
  calculateArcData,
  defaultPolarAxisId,
  getAngularAxisRadians,
  getPolarColor,
  getRadialAxisPixels,
  type PolarDataPoint,
} from '../polar/utils';
import { getArcPath } from '../utils/path';

import { Arc, type ArcProps } from './Arc';

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
   * Whether to animate this plot. Overrides the chart-level animate setting.
   */
  animate?: boolean;
  /**
   * ID of another series to use as a clipping mask. The current series will only be visible
   * where it overlaps with the specified series.
   */
  clipToSeriesId?: string;
  /**
   * Custom clip path ID to apply to all arcs. Takes precedence over clipToSeriesId.
   * Use with getArcPath() to create custom clipping shapes.
   */
  clipPathId?: string;
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
    animate: animateOverride,
    clipToSeriesId,
    clipPathId: customClipPathId,
    fillOpacity,
    stroke = 'var(--color-bg)',
    strokeWidth = 1,
    cornerRadius,
    onArcClick,
    onArcMouseEnter,
    onArcMouseLeave,
  }) => {
    const {
      series,
      getSeries,
      animate: contextAnimate,
      drawingArea,
      getAngularAxis,
      getRadialAxis,
    } = usePolarChartContext();

    // Calculate center and max radius from drawing area
    const { centerX, centerY, maxRadius } = useMemo(() => {
      const cx = drawingArea.x + drawingArea.width / 2;
      const cy = drawingArea.y + drawingArea.height / 2;
      const r = Math.min(drawingArea.width, drawingArea.height) / 2;
      return {
        centerX: cx,
        centerY: cy,
        maxRadius: Math.max(0, r),
      };
    }, [drawingArea]);

    // Use overrides if provided, otherwise use context values
    const shouldAnimate = animateOverride !== undefined ? animateOverride : contextAnimate;

    const targetSeries = useMemo(() => {
      if (seriesId) {
        return getSeries(seriesId);
      }
      return series[0];
    }, [seriesId, getSeries, series]);

    // Get the angular axis for this series
    const angularAxisConfig = useMemo(() => {
      const axisId = targetSeries?.angularAxisId ?? defaultPolarAxisId;
      return getAngularAxis(axisId);
    }, [targetSeries, getAngularAxis]);

    // Get the radial axis for this series
    const radialAxisConfig = useMemo(() => {
      const axisId = targetSeries?.radialAxisId ?? defaultPolarAxisId;
      return getRadialAxis(axisId);
    }, [targetSeries, getRadialAxis]);

    // Calculate angular axis values
    const {
      startAngle: startAngleRadians,
      endAngle: endAngleRadians,
      padAngle,
    } = useMemo(() => {
      return getAngularAxisRadians(angularAxisConfig);
    }, [angularAxisConfig]);

    // Calculate radial axis values
    const { innerRadius, outerRadius } = useMemo(() => {
      return getRadialAxisPixels(maxRadius, radialAxisConfig);
    }, [maxRadius, radialAxisConfig]);

    const arcs = useMemo(() => {
      if (!targetSeries || !targetSeries.data.length) {
        return [];
      }

      return calculateArcData(
        targetSeries.data,
        innerRadius,
        outerRadius,
        startAngleRadians,
        endAngleRadians,
        padAngle,
      );
    }, [targetSeries, innerRadius, outerRadius, startAngleRadians, endAngleRadians, padAngle]);

    // Calculate clip path arcs if clipToSeriesId is provided
    const clipArcs = useMemo(() => {
      if (!clipToSeriesId) return null;

      const clipSeries = getSeries(clipToSeriesId);
      if (!clipSeries || !clipSeries.data.length) return null;

      // Use the same geometry as the arcs we're rendering
      return calculateArcData(
        clipSeries.data,
        innerRadius,
        outerRadius,
        startAngleRadians,
        endAngleRadians,
        padAngle,
      );
    }, [
      clipToSeriesId,
      getSeries,
      innerRadius,
      outerRadius,
      startAngleRadians,
      endAngleRadians,
      padAngle,
    ]);

    if (!arcs.length) {
      return null;
    }

    // Use custom clip path ID if provided, otherwise generate from clipToSeriesId
    const clipPathId =
      customClipPathId || (clipToSeriesId ? `clip-${seriesId}-to-${clipToSeriesId}` : undefined);

    return (
      <>
        {/* Define clip path from series if clipToSeriesId is used - paths are centered at 0,0 */}
        {!customClipPathId && clipArcs && clipPathId && (
          <defs>
            <clipPath id={clipPathId}>
              {clipArcs.map((clipArcData: ArcData, index: number) => {
                const clipPath = getArcPath({
                  startAngle: clipArcData.startAngle,
                  endAngle: clipArcData.endAngle,
                  innerRadius: clipArcData.innerRadius,
                  outerRadius: clipArcData.outerRadius,
                  cornerRadius,
                  padAngle: clipArcData.padAngle,
                });
                return <path key={`clip-${index}`} d={clipPath} />;
              })}
            </clipPath>
          </defs>
        )}

        {/* Render arcs - clipPath will be applied by Arc component after transform */}
        {arcs.map((arcData: ArcData, index: number) => {
          const fill = getPolarColor(index, arcData.data.color);

          return (
            <ArcComponent
              key={arcData.data.id ?? index}
              arcData={arcData}
              baselineAngle={startAngleRadians}
              clipPathId={clipPathId}
              cornerRadius={cornerRadius}
              fill={fill}
              fillOpacity={fillOpacity}
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
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          );
        })}
      </>
    );
  },
);

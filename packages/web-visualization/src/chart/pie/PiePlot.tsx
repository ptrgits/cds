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
   * ID of the series to render.
   * - If provided: Only renders that specific series
   * - If not provided: Aggregates all series sharing the same radialAxisId and angularAxisId
   */
  seriesId?: string;
  /**
   * ID of the radial axis to filter series by when seriesId is not provided.
   * Defaults to the default radial axis.
   */
  radialAxisId?: string;
  /**
   * ID of the angular axis to filter series by when seriesId is not provided.
   * Defaults to the default angular axis.
   */
  angularAxisId?: string;
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
    radialAxisId: radialAxisIdProp,
    angularAxisId: angularAxisIdProp,
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

    // Convert series data to PolarDataPoint[]
    const convertSeriesToDataPoints = useMemo(() => {
      return (targetSeries: typeof series) => {
        const dataPoints: PolarDataPoint[] = [];

        targetSeries.forEach((s) => {
          // Get the first value from data (single number or first element of array)
          const value = typeof s.data === 'number' ? s.data : s.data[0];

          if (value !== null && value !== undefined) {
            dataPoints.push({
              value,
              label: s.label,
              color: s.color,
              id: s.id,
            });
          }
        });

        return dataPoints;
      };
    }, []);

    // Get target series and axis config
    const { targetSeriesArray, targetRadialAxisId, targetAngularAxisId } = useMemo(() => {
      if (seriesId) {
        // Single series mode
        const singleSeries = getSeries(seriesId);
        return {
          targetSeriesArray: singleSeries ? [singleSeries] : [],
          targetRadialAxisId: singleSeries?.radialAxisId ?? defaultPolarAxisId,
          targetAngularAxisId: singleSeries?.angularAxisId ?? defaultPolarAxisId,
        };
      } else {
        // Aggregate mode: get all series with matching radialAxisId AND angularAxisId
        const filterRadialAxisId = radialAxisIdProp ?? defaultPolarAxisId;
        const filterAngularAxisId = angularAxisIdProp ?? defaultPolarAxisId;

        const matchingSeries = series.filter(
          (s) =>
            (s.radialAxisId ?? defaultPolarAxisId) === filterRadialAxisId &&
            (s.angularAxisId ?? defaultPolarAxisId) === filterAngularAxisId,
        );

        return {
          targetSeriesArray: matchingSeries,
          targetRadialAxisId: filterRadialAxisId,
          targetAngularAxisId: filterAngularAxisId,
        };
      }
    }, [seriesId, radialAxisIdProp, angularAxisIdProp, getSeries, series]);

    // Get the angular axis config
    const angularAxisConfig = useMemo(() => {
      return getAngularAxis(targetAngularAxisId);
    }, [targetAngularAxisId, getAngularAxis]);

    // Get the radial axis config
    const radialAxisConfig = useMemo(() => {
      return getRadialAxis(targetRadialAxisId);
    }, [targetRadialAxisId, getRadialAxis]);

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

    // Convert series to data points and calculate arcs
    const arcs = useMemo(() => {
      if (!targetSeriesArray.length) {
        return [];
      }

      const dataPoints = convertSeriesToDataPoints(targetSeriesArray);

      if (!dataPoints.length) {
        return [];
      }

      return calculateArcData(
        dataPoints,
        innerRadius,
        outerRadius,
        startAngleRadians,
        endAngleRadians,
        padAngle,
      );
    }, [
      targetSeriesArray,
      convertSeriesToDataPoints,
      innerRadius,
      outerRadius,
      startAngleRadians,
      endAngleRadians,
      padAngle,
    ]);

    // Calculate clip path arcs if clipToSeriesId is provided
    const clipArcs = useMemo(() => {
      if (!clipToSeriesId) return null;

      const clipSeries = getSeries(clipToSeriesId);
      if (!clipSeries) return null;

      const clipDataPoints = convertSeriesToDataPoints([clipSeries]);
      if (!clipDataPoints.length) return null;

      // Use the same geometry as the arcs we're rendering
      return calculateArcData(
        clipDataPoints,
        innerRadius,
        outerRadius,
        startAngleRadians,
        endAngleRadians,
        padAngle,
      );
    }, [
      clipToSeriesId,
      getSeries,
      convertSeriesToDataPoints,
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

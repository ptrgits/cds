import React, { memo, useMemo } from 'react';

import { PolarChartProvider, usePolarChartContext } from '../polar';
import {
  type AngularAxisConfig,
  type ArcData,
  calculateArcData,
  getAngularAxisRadians,
  getPolarColor,
  getRadialAxisPixels,
  type PolarChartContextValue,
  type PolarDataPoint,
  type RadialAxisConfig,
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
   * Angular axis configuration. Overrides the chart-level angularAxis.
   *
   * @example
   * ```tsx
   * <PiePlot angularAxis={{ range: { min: 0, max: 180 } }} />
   * ```
   */
  angularAxis?: AngularAxisConfig;
  /**
   * Radial axis configuration. Overrides the chart-level radialAxis.
   *
   * @example
   * ```tsx
   * <PiePlot radialAxis={{ range: { min: 0.5, max: 1 } }} />
   * ```
   */
  radialAxis?: RadialAxisConfig;
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
    angularAxis: angularAxisOverride,
    radialAxis: radialAxisOverride,
    clipToSeriesId,
    clipPathId: customClipPathId,
    fillOpacity,
    stroke,
    strokeWidth,
    cornerRadius,
    onArcClick,
    onArcMouseEnter,
    onArcMouseLeave,
  }) => {
    const {
      series,
      getSeries,
      innerRadius: contextInnerRadius,
      outerRadius: contextOuterRadius,
      padAngle: contextPadAngle,
      startAngle: contextStartAngle,
      endAngle: contextEndAngle,
      animate: contextAnimate,
      centerX,
      centerY,
      width,
      height,
      maxRadius,
      angularAxis: contextAngularAxis,
      radialAxis: contextRadialAxis,
    } = usePolarChartContext();

    // Use overrides if provided, otherwise use context values
    const shouldAnimate = animateOverride !== undefined ? animateOverride : contextAnimate;

    // Calculate angular axis with overrides
    const {
      startAngle: startAngleRadians,
      endAngle: endAngleRadians,
      padAngle,
    } = useMemo(() => {
      if (angularAxisOverride) {
        return getAngularAxisRadians(angularAxisOverride);
      }
      return {
        startAngle: contextStartAngle,
        endAngle: contextEndAngle,
        padAngle: contextPadAngle,
      };
    }, [angularAxisOverride, contextStartAngle, contextEndAngle, contextPadAngle]);

    // Calculate radial axis with overrides
    const { innerRadius, outerRadius } = useMemo(() => {
      if (radialAxisOverride) {
        return getRadialAxisPixels(maxRadius, radialAxisOverride);
      }
      return {
        innerRadius: contextInnerRadius,
        outerRadius: contextOuterRadius,
      };
    }, [maxRadius, radialAxisOverride, contextInnerRadius, contextOuterRadius]);

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

    const content = (
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

    // If any values are overridden, wrap in a new context provider
    const hasOverrides =
      animateOverride !== undefined ||
      angularAxisOverride !== undefined ||
      radialAxisOverride !== undefined;

    if (hasOverrides) {
      const overriddenContext: PolarChartContextValue = {
        series,
        getSeries,
        animate: shouldAnimate,
        width,
        height,
        centerX,
        centerY,
        maxRadius,
        innerRadius,
        outerRadius,
        padAngle,
        startAngle: startAngleRadians,
        endAngle: endAngleRadians,
        angularAxis: angularAxisOverride || contextAngularAxis,
        radialAxis: radialAxisOverride || contextRadialAxis,
      };

      return <PolarChartProvider value={overriddenContext}>{content}</PolarChartProvider>;
    }

    return content;
  },
);

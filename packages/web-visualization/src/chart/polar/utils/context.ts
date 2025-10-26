import type { AngularAxisConfig, RadialAxisConfig } from './axis';
import type { PolarSeries } from './polar';

/**
 * Context value for polar coordinate charts (pie, donut, etc.).
 */
export type PolarChartContextValue = {
  /**
   * The series data for the chart.
   */
  series: PolarSeries[];
  /**
   * Returns the series which matches the seriesId or undefined.
   * @param seriesId - A series' id
   */
  getSeries: (seriesId?: string) => PolarSeries | undefined;
  /**
   * Whether to animate the chart.
   */
  animate: boolean;
  /**
   * Width of the chart SVG.
   */
  width: number;
  /**
   * Height of the chart SVG.
   */
  height: number;
  /**
   * Center X coordinate of the chart.
   */
  centerX: number;
  /**
   * Center Y coordinate of the chart.
   */
  centerY: number;
  /**
   * Maximum radius available for the chart.
   */
  maxRadius: number;
  /**
   * Inner radius for donut charts (0 for pie charts).
   */
  innerRadius: number;
  /**
   * Outer radius for the chart.
   */
  outerRadius: number;
  /**
   * Padding angle between slices in radians.
   */
  padAngle: number;
  /**
   * Start angle in radians.
   */
  startAngle: number;
  /**
   * End angle in radians.
   */
  endAngle: number;
  /**
   * Angular axis configuration.
   */
  angularAxis?: AngularAxisConfig;
  /**
   * Radial axis configuration.
   */
  radialAxis?: RadialAxisConfig;
};

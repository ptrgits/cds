/**
 * Utilities for polar chart calculations (pie, donut, etc.)
 */

import { pie as d3Pie } from 'd3-shape';

export type PolarDataPoint = {
  /**
   * The value of this data point.
   */
  value: number;
  /**
   * Optional label for this data point.
   */
  label?: string;
  /**
   * Optional color for this data point.
   */
  color?: string;
  /**
   * Unique identifier for this data point.
   */
  id?: string;
};

export type PolarSeries = {
  /**
   * Unique identifier for the series.
   */
  id: string;
  /**
   * Data points for the series.
   */
  data: PolarDataPoint[];
  /**
   * Optional label for the series.
   */
  label?: string;
  /**
   * ID of the angular axis this series should use.
   * If not specified, uses the default angular axis.
   */
  angularAxisId?: string;
  /**
   * ID of the radial axis this series should use.
   * If not specified, uses the default radial axis.
   */
  radialAxisId?: string;
};

export type ArcData = {
  /**
   * Start angle in radians.
   */
  startAngle: number;
  /**
   * End angle in radians.
   */
  endAngle: number;
  /**
   * Padding angle in radians (from D3 pie layout).
   */
  padAngle: number;
  /**
   * The value of this arc.
   */
  value: number;
  /**
   * Inner radius in pixels.
   */
  innerRadius: number;
  /**
   * Outer radius in pixels.
   */
  outerRadius: number;
  /**
   * Index in the data array.
   */
  index: number;
  /**
   * Original data point.
   */
  data: PolarDataPoint;
};

/**
 * Calculates arc data from polar data points.
 * Uses D3's pie layout for proper padding distribution, matching MUI X Charts behavior.
 */
export function calculateArcData(
  data: PolarDataPoint[],
  innerRadius: number,
  outerRadius: number,
  startAngle = 0,
  endAngle = 2 * Math.PI,
  padAngle = 0,
): ArcData[] {
  if (data.length === 0) {
    return [];
  }

  // Use D3's pie layout with padAngle for consistent padding behavior
  // This matches MUI X Charts' implementation and provides better visual results
  const pieGenerator = d3Pie<PolarDataPoint>()
    .value((d) => Math.abs(d.value))
    .startAngle(startAngle)
    .endAngle(endAngle)
    .padAngle(padAngle)
    .sort(null); // Preserve data order

  const pieData = pieGenerator(data);

  return pieData.map((d, index) => ({
    startAngle: d.startAngle,
    endAngle: d.endAngle,
    padAngle: d.padAngle,
    value: d.data.value,
    innerRadius,
    outerRadius,
    index,
    data: d.data,
  }));
}

/**
 * Calculates the centroid of an arc for label positioning.
 */
export function getArcCentroid(
  startAngle: number,
  endAngle: number,
  innerRadius: number,
  outerRadius: number,
): { x: number; y: number } {
  const midAngle = (startAngle + endAngle) / 2;
  const midRadius = (innerRadius + outerRadius) / 2;

  return {
    x: Math.cos(midAngle) * midRadius,
    y: Math.sin(midAngle) * midRadius,
  };
}

/**
 * Default color palette for polar charts.
 */
export const defaultPolarColors = [
  'var(--color-primary)',
  'var(--color-positive)',
  'var(--color-attention)',
  'var(--color-negative)',
  'var(--color-info)',
  'var(--color-accent)',
];

/**
 * Gets color for a data point based on index.
 */
export function getPolarColor(index: number, customColor?: string): string {
  if (customColor) return customColor;
  return defaultPolarColors[index % defaultPolarColors.length];
}

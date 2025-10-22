/**
 * Utilities for polar chart calculations (pie, donut, etc.)
 */

import { arc as d3Arc } from 'd3-shape';

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
 */
export function calculateArcData(
  data: PolarDataPoint[],
  innerRadius: number,
  outerRadius: number,
  startAngle = 0,
  endAngle = 2 * Math.PI,
  padAngle = 0,
): ArcData[] {
  const total = data.reduce((sum, d) => sum + Math.abs(d.value), 0);

  if (total === 0) {
    return [];
  }

  const angleRange = endAngle - startAngle;
  let currentAngle = startAngle;

  return data.map((d, index) => {
    const proportion = Math.abs(d.value) / total;
    const arcAngle = angleRange * proportion;
    const arcStartAngle = currentAngle;
    const arcEndAngle = currentAngle + arcAngle;

    // Apply padding
    const paddedStartAngle = arcStartAngle + padAngle / 2;
    const paddedEndAngle = arcEndAngle - padAngle / 2;

    currentAngle = arcEndAngle;

    return {
      startAngle: paddedStartAngle,
      endAngle: paddedEndAngle,
      value: d.value,
      innerRadius,
      outerRadius,
      index,
      data: d,
    };
  });
}

/**
 * Creates an SVG path for an arc using d3-shape's arc generator.
 * This matches MUI X Charts' implementation for consistent rounded corners.
 */
export function createArcPath(
  startAngle: number,
  endAngle: number,
  innerRadius: number,
  outerRadius: number,
  cornerRadius = 0,
): string {
  // Handle degenerate cases
  if (outerRadius <= 0) return '';
  if (startAngle === endAngle) return '';

  // Use d3's arc generator with cornerRadius support
  // This provides the same high-quality rounded corners as MUI X Charts
  const path = d3Arc().cornerRadius(cornerRadius)({
    innerRadius: Math.max(0, innerRadius),
    outerRadius: Math.max(0, outerRadius),
    startAngle,
    endAngle,
  });

  return path ?? '';
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

/**
 * Utilities for polar chart calculations (pie, donut, etc.)
 */

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
 * Creates an SVG path for an arc.
 */
export function createArcPath(
  startAngle: number,
  endAngle: number,
  innerRadius: number,
  outerRadius: number,
  cornerRadius = 0,
): string {
  const clampedInnerRadius = Math.max(0, innerRadius);
  const clampedOuterRadius = Math.max(0, outerRadius);

  if (clampedOuterRadius <= 0) return '';
  if (startAngle === endAngle) return '';

  // Ensure angles are in the correct range
  const normalizedStartAngle = startAngle % (2 * Math.PI);
  const normalizedEndAngle = endAngle % (2 * Math.PI);

  const angleDiff = endAngle - startAngle;
  const isFullCircle = Math.abs(angleDiff) >= 2 * Math.PI - 0.0001;

  // Start and end points for outer arc
  const x1 = Math.cos(startAngle) * clampedOuterRadius;
  const y1 = Math.sin(startAngle) * clampedOuterRadius;
  const x2 = Math.cos(endAngle) * clampedOuterRadius;
  const y2 = Math.sin(endAngle) * clampedOuterRadius;

  // Large arc flag
  const largeArcFlag = angleDiff > Math.PI ? 1 : 0;

  if (clampedInnerRadius === 0) {
    // Pie slice (no inner radius)
    if (isFullCircle) {
      return `
        M 0,0
        L ${x1},${y1}
        A ${clampedOuterRadius},${clampedOuterRadius} 0 1,1 ${-x1},${-y1}
        A ${clampedOuterRadius},${clampedOuterRadius} 0 1,1 ${x1},${y1}
        Z
      `.trim();
    }

    return `
      M 0,0
      L ${x1},${y1}
      A ${clampedOuterRadius},${clampedOuterRadius} 0 ${largeArcFlag},1 ${x2},${y2}
      Z
    `.trim();
  }

  // Start and end points for inner arc
  const x3 = Math.cos(endAngle) * clampedInnerRadius;
  const y3 = Math.sin(endAngle) * clampedInnerRadius;
  const x4 = Math.cos(startAngle) * clampedInnerRadius;
  const y4 = Math.sin(startAngle) * clampedInnerRadius;

  if (isFullCircle) {
    return `
      M ${x1},${y1}
      A ${clampedOuterRadius},${clampedOuterRadius} 0 1,1 ${-x1},${-y1}
      A ${clampedOuterRadius},${clampedOuterRadius} 0 1,1 ${x1},${y1}
      M ${x4},${y4}
      A ${clampedInnerRadius},${clampedInnerRadius} 0 1,0 ${-x4},${-y4}
      A ${clampedInnerRadius},${clampedInnerRadius} 0 1,0 ${x4},${y4}
      Z
    `.trim();
  }

  // Donut slice
  return `
    M ${x1},${y1}
    A ${clampedOuterRadius},${clampedOuterRadius} 0 ${largeArcFlag},1 ${x2},${y2}
    L ${x3},${y3}
    A ${clampedInnerRadius},${clampedInnerRadius} 0 ${largeArcFlag},0 ${x4},${y4}
    Z
  `.trim();
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

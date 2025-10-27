/**
 * Utilities for polar chart axis configuration (angular and radial)
 */

export type PolarAxisBounds = {
  min: number;
  max: number;
};

/**
 * Default axis ID used when no axis ID is specified.
 */
export const defaultPolarAxisId = 'default';

/**
 * Configuration for the angular axis (controls start/end angles).
 *
 * The angular axis defines the sweep of the chart in degrees.
 * - Default: { min: 0, max: 360 } (full circle)
 * - Example: { min: -90, max: 90 } (semicircle from bottom to top)
 */
export type AngularAxisConfig = {
  /**
   * Unique identifier for this axis.
   * If not specified, this is the default angular axis.
   */
  id?: string;
  /**
   * The angular range in degrees.
   * Can be a static bounds object or a function that transforms the default bounds.
   *
   * @example
   * Static bounds:
   * ```ts
   * range: { min: 0, max: 180 } // Semicircle
   * ```
   *
   * @example
   * Function-based transformation:
   * ```ts
   * range: ({ min, max }) => ({ min: min + 45, max: max - 45 })
   * ```
   */
  range?: Partial<PolarAxisBounds> | ((bounds: PolarAxisBounds) => Partial<PolarAxisBounds>);

  /**
   * Padding angle between slices in degrees.
   * @default 0
   */
  paddingAngle?: number;
};

/**
 * Configuration for the radial axis (controls inner/outer radii).
 *
 * The radial axis defines the radial extent from the center outward in pixels.
 * - Default: { min: 0, max: [radius in pixels] } (pie chart using full radius)
 * - Example: { min: 100, max: 200 } (ring from 100px to 200px)
 * - Example: { min: 0, max: 150 } (pie chart with 150px radius)
 */
export type RadialAxisConfig = {
  /**
   * Unique identifier for this axis.
   * If not specified, this is the default radial axis.
   */
  id?: string;
  /**
   * The radial range in pixels from the center.
   * Can be a static bounds object or a function that transforms the default bounds.
   *
   * @example
   * Static bounds (absolute pixels):
   * ```ts
   * range: { min: 50, max: 100 } // Ring from 50px to 100px
   * ```
   *
   * @example
   * Function-based transformation (e.g., donut chart with 50% inner radius):
   * ```ts
   * range: ({ min, max }) => ({ min: max * 0.5, max }) // Donut chart
   * ```
   *
   * @example
   * Function-based transformation (leave 10px space):
   * ```ts
   * range: ({ min, max }) => ({ min, max: max - 10 })
   * ```
   */
  range?: Partial<PolarAxisBounds> | ((bounds: PolarAxisBounds) => Partial<PolarAxisBounds>);
};

/**
 * Applies range configuration to calculate final axis bounds.
 * Similar to getAxisRange in CartesianChart.
 */
export function applyAxisRange(
  baseRange: PolarAxisBounds,
  rangeConfig?: Partial<PolarAxisBounds> | ((bounds: PolarAxisBounds) => Partial<PolarAxisBounds>),
): PolarAxisBounds {
  if (!rangeConfig) {
    return baseRange;
  }

  if (typeof rangeConfig === 'function') {
    // Apply the transform function to the base range
    const result = rangeConfig(baseRange);
    return {
      min: result.min ?? baseRange.min,
      max: result.max ?? baseRange.max,
    };
  } else {
    // Merge explicit range values with calculated range
    return {
      min: rangeConfig.min ?? baseRange.min,
      max: rangeConfig.max ?? baseRange.max,
    };
  }
}

/**
 * Converts degrees to radians.
 */
export const degreesToRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Converts radians to degrees.
 */
export const radiansToDegrees = (radians: number): number => {
  return (radians * 180) / Math.PI;
};

/**
 * Calculates the angular axis configuration in radians.
 */
export function getAngularAxisRadians(
  config?: AngularAxisConfig,
  baseRangeDegrees: PolarAxisBounds = { min: 0, max: 360 },
): { startAngle: number; endAngle: number; padAngle: number } {
  const rangeDegrees = applyAxisRange(baseRangeDegrees, config?.range);

  return {
    startAngle: degreesToRadians(rangeDegrees.min),
    endAngle: degreesToRadians(rangeDegrees.max),
    padAngle: config?.paddingAngle ? degreesToRadians(config.paddingAngle) : 0,
  };
}

/**
 * Calculates the radial axis configuration in pixels.
 * The default base range is { min: 0, max: maxRadius } in pixels.
 */
export function getRadialAxisPixels(
  maxRadius: number,
  config?: RadialAxisConfig,
): { innerRadius: number; outerRadius: number } {
  // Default base range is 0 to maxRadius in pixels
  const baseRangePixels: PolarAxisBounds = { min: 0, max: maxRadius };
  const rangePixels = applyAxisRange(baseRangePixels, config?.range);

  // Clamp to valid range [0, maxRadius]
  const clampedMin = Math.max(0, Math.min(maxRadius, rangePixels.min));
  const clampedMax = Math.max(0, Math.min(maxRadius, rangePixels.max));

  return {
    innerRadius: clampedMin,
    outerRadius: clampedMax,
  };
}

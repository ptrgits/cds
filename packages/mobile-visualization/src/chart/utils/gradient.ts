import { Skia } from '@shopify/react-native-skia';

import type { AxisBounds } from './chart';
import { type ChartScaleFunction, isCategoricalScale, isNumericScale } from './scale';

/**
 * Worklet-compatible scale function type.
 * Simple function that takes a value and returns a pixel position.
 */
export type ChartScaleWorkletFunction = (value: number | string) => number;

/**
 * Defines a color transition point in the gradient
 */
export type GradientStop = {
  /**
   * Position in data space.
   * Multiple stops at the same offset create hard color transitions.
   */
  offset: number;
  /**  Color at the stop (any valid Skia color) */
  color: string;
  /** Optional opacity (0-1). Defaults to 1. */
  opacity?: number;
};

/**
 * Defines a gradient.
 */
export type GradientDefinition = {
  /**
   * Axis that the gradient maps to.
   * @default 'y'
   */
  axis?: 'x' | 'y';
  /**
   * Gradient stops with colors and positions.
   * Can be an array of stop objects or a function that receives domain bounds.
   */
  stops: GradientStop[] | ((domain: AxisBounds) => GradientStop[]);
};

/**
 * Pre-resolved gradient configuration for worklet use.
 * Contains resolved stops and scale range information.
 */
export type ResolvedGradientConfig = {
  stops: GradientStop[];
  rangeMin: number;
  rangeMax: number;
  rangeSpan: number;
};

/**
 * Resolves gradient stops, handling both static arrays and function forms.
 * When stops is a function, calls it with the domain bounds.
 */
const getGradientStops = (
  stops: GradientStop[] | ((domain: AxisBounds) => GradientStop[]),
  domain: AxisBounds,
): GradientStop[] => {
  if (typeof stops === 'function') {
    return stops(domain);
  }
  return stops;
};

/**
 * Processes Gradient to gradient configuration for SVG linearGradient.
 * Colors are smoothly interpolated between stops by the browser.
 * Multiple stops at the same offset create hard color transitions.
 */
const processGradientStops = (
  stops: GradientStop[],
  scale: ChartScaleFunction,
): GradientStop[] | undefined => {
  if (stops.length === 0) {
    console.warn('Gradient has no stops - falling back to default');
    return;
  }

  // Check if stops are in ascending order
  const isOutOfOrder = stops.some((stop, i) => {
    return i > 0 && stop.offset < stops[i - 1].offset;
  });

  if (isOutOfOrder) {
    console.warn(`Gradient: stop offsets must be in ascending order`);
    return;
  }

  const [rangeMin, rangeMax] = scale.range();
  const rangeSpan = Math.abs(rangeMax - rangeMin);

  // Convert data value offsets to normalized positions (0-1) using scale
  const normalizedStops: GradientStop[] = stops.map((stop, index) => {
    const stopPosition = scale(stop.offset);
    const normalized =
      stopPosition === undefined
        ? 0
        : Math.max(0, Math.min(1, Math.abs(stopPosition - rangeMin) / rangeSpan));
    return {
      offset: normalized, // Now 0-1 normalized (not data space)
      color: stop.color,
      opacity: stop.opacity ?? 1,
    };
  });

  return normalizedStops;
};

/**
 * Determines the appropriate scale to use based on GradientDefinition axis configuration.
 * Gradients work with numeric scales (linear, log) and categorical scales (band).
 * Band scales use numerical indices [0, 1, 2, ...] which work for color mapping.
 *
 * @param gradient - The GradientDefinition configuration
 * @param xScale - The x-axis scale
 * @param yScale - The y-axis scale
 * @returns The scale to use for color mapping, or undefined if not supported
 */
export const getGradientScale = (
  gradient: GradientDefinition | undefined,
  xScale: ChartScaleFunction | undefined,
  yScale: ChartScaleFunction | undefined,
): ChartScaleFunction | undefined => {
  if (!gradient) {
    return yScale && isNumericScale(yScale) ? yScale : undefined;
  }

  const axis = gradient.axis ?? 'y';
  const targetScale = axis === 'x' ? xScale : yScale;

  if (!targetScale) {
    console.warn(`Gradient requires a scale on the ${axis}-axis`);
    return;
  }

  if (!isNumericScale(targetScale) && !isCategoricalScale(targetScale)) {
    console.warn(`Gradient requires a numeric or categorical scale on the ${axis}-axis`);
    return;
  }

  return targetScale;
};

/**
 * Resolves a gradient configuration for worklet use.
 * This should be called on the JS thread to resolve function-based stops
 * and extract scale range information.
 */
export const resolveGradientConfig = (
  gradient: GradientDefinition,
  scale: ChartScaleFunction,
): ResolvedGradientConfig | undefined => {
  // Extract domain from scale
  const scaleDomain = scale.domain();
  let domain: AxisBounds;

  if (isCategoricalScale(scale)) {
    const domainArray = scaleDomain as number[];
    domain = { min: domainArray[0], max: domainArray[domainArray.length - 1] };
  } else {
    const [min, max] = scaleDomain as [number, number];
    domain = { min, max };
  }

  // Resolve stops (this calls the function if needed)
  const stops = getGradientStops(gradient.stops, domain);
  if (stops.length === 0) return undefined;

  // Extract range information
  const scaleRange = scale.range();
  const [rangeMin, rangeMax] = Array.isArray(scaleRange)
    ? (scaleRange as [number, number])
    : [scaleRange, scaleRange]; // fallback for band scales

  const rangeSpan = Math.abs(rangeMax - rangeMin);

  return {
    stops,
    rangeMin,
    rangeMax,
    rangeSpan,
  };
};

/**
 * Interpolates between two colors using linear interpolation.
 * Returns an rgba string.
 */
const interpolateColor = (color1: string, color2: string, t: number): string => {
  const c1 = Skia.Color(color1);
  const c2 = Skia.Color(color2);

  const r = Math.round((c1[0] + (c2[0] - c1[0]) * t) * 255);
  const g = Math.round((c1[1] + (c2[1] - c1[1]) * t) * 255);
  const b = Math.round((c1[2] + (c2[2] - c1[2]) * t) * 255);
  const a = c1[3] + (c2[3] - c1[3]) * t;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/**
 * Evaluates the color at a specific data value based on pre-resolved gradient configuration.
 * This function is worklet-compatible and uses pre-resolved gradient stops and scale information.
 *
 * @param dataValue - The data value to evaluate
 * @param gradientConfig - Pre-resolved gradient configuration
 * @param scaleWorklet - Worklet-compatible scale function
 * @returns The color string at this data value, or undefined if invalid
 */
export const evaluateGradientAtValue = (
  dataValue: number,
  gradientConfig: ResolvedGradientConfig,
  scaleWorklet: ChartScaleWorkletFunction,
): string | undefined => {
  'worklet';

  const { stops, rangeMin, rangeMax, rangeSpan } = gradientConfig;

  if (stops.length === 0) return undefined;
  if (rangeSpan === 0) return stops[0].color;

  // Map dataValue through worklet scale to get position
  const dataPosition = scaleWorklet(dataValue);

  // Normalize to 0-1 based on range
  const normalizedValue = Math.max(0, Math.min(1, Math.abs(dataPosition - rangeMin) / rangeSpan));

  // Map stop offsets through worklet scale and normalize to 0-1
  const positions = stops.map((stop) => {
    const stopPosition = scaleWorklet(stop.offset);
    return Math.max(0, Math.min(1, Math.abs(stopPosition - rangeMin) / rangeSpan));
  });

  // Find which segment we're in
  if (normalizedValue < positions[0]) {
    return stops[0].color;
  }
  if (normalizedValue >= positions[positions.length - 1]) {
    return stops[stops.length - 1].color;
  }

  // Check if dataValue matches any stop offset exactly (for hard transitions)
  for (let i = 0; i < stops.length; i++) {
    if (dataValue === stops[i].offset) {
      // Found exact match - check if there are multiple stops at this offset (hard transition)
      // Use the LAST color at this offset for hard transitions
      let lastIndexAtOffset = i;
      while (
        lastIndexAtOffset + 1 < stops.length &&
        stops[lastIndexAtOffset + 1].offset === stops[i].offset
      ) {
        lastIndexAtOffset++;
      }
      return stops[lastIndexAtOffset].color;
    }
  }

  // Find the two colors to mix based on normalized positions
  for (let i = 0; i < positions.length - 1; i++) {
    const start = positions[i];
    const end = positions[i + 1];

    if (normalizedValue >= start && normalizedValue <= end) {
      // Handle hard transitions (multiple stops at same position)
      if (end === start) {
        return stops[i + 1].color;
      }

      // Calculate progress within this segment (0-1)
      const segmentProgress = (normalizedValue - start) / (end - start);

      // Use Skia color interpolation for smooth transitions
      return interpolateColor(stops[i].color, stops[i + 1].color, segmentProgress);
    }
  }

  return stops[stops.length - 1].color;
};

/**
 * Creates a gradient configuration for SVG components.
 * Processes a GradientDefinition into a renderable GradientConfig.
 * Supports both numeric scales (linear, log) and categorical scales (band).
 *
 * @param gradient - GradientDefinition configuration (required)
 * @param xScale - X-axis scale (required)
 * @param yScale - Y-axis scale (required)
 * @returns GradientConfig or null if gradient processing fails
 *
 * @example
 * const gradientConfig = useMemo(() => {
 *   if (!gradient || !xScale || !yScale) return;
 *   return getGradientConfig(gradient, xScale, yScale);
 * }, [gradient, xScale, yScale]);
 *
 * if (gradientConfig) {
 *   return (
 *     <defs>
 *       <Gradient
 *         config={gradientConfig}
 *         direction={gradient.axis === 'x' ? 'horizontal' : 'vertical'}
 *         id={gradientId}
 *       />
 *     </defs>
 *   );
 * }
 */
export const getGradientConfig = (
  gradient: GradientDefinition,
  xScale: ChartScaleFunction,
  yScale: ChartScaleFunction,
): GradientStop[] | undefined => {
  if (!gradient) return;

  // Get the scale based on axis
  const scale = getGradientScale(gradient, xScale, yScale);
  if (!scale) return;

  // Extract domain from scale
  const scaleDomain = scale.domain();
  let domain: AxisBounds;

  if (isCategoricalScale(scale)) {
    const domainArray = scaleDomain as number[];
    domain = { min: domainArray[0], max: domainArray[domainArray.length - 1] };
  } else {
    const [min, max] = scaleDomain as [number, number];
    domain = { min, max };
  }

  const resolvedStops = getGradientStops(gradient.stops, domain);
  return processGradientStops(resolvedStops, scale);
};

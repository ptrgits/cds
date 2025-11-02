import {
  type CategoricalScale,
  type ChartScaleFunction,
  isCategoricalScale,
  isNumericScale,
  type NumericScale,
} from './scale';

/**
 * A gradient stop defines a color transition point in the gradient
 */
export type GradientStop = {
  /**
   * Position in data space (will be normalized to 0-1 based on scale domain).
   * Multiple stops at the same offset create hard color transitions.
   */
  offset: number;

  /** Color value (CSS color string or variable like 'var(--color-fgPositive)') */
  color: string;

  /** Optional opacity (0-1). Defaults to 1. */
  opacity?: number;
};

/**
 * Unified gradient configuration for chart visualizations.
 */
export type GradientDefinition = {
  /**
   * Which axis to map colors against.
   * - 'y': Map colors based on y-values (high/low values) - most common
   * - 'x': Map colors based on x-position (left/right, or time progression)
   * @default 'y'
   */
  axis?: 'x' | 'y';

  /**
   * Gradient stops defining the color transitions.
   * Can be an array of stop objects or a function that receives domain bounds.
   *
   * **Static form:**
   * ```ts
   * stops: [
   *   { offset: 0, color: 'red' },
   *   { offset: 50, color: 'yellow' },
   *   { offset: 100, color: 'green' }
   * ]
   * ```
   *
   * **Function form (receives domain bounds):**
   * ```ts
   * stops: ({ min, max }) => [
   *   { offset: min, color: 'red' },
   *   { offset: 0, color: 'yellow' },
   *   { offset: max, color: 'green' }
   * ]
   * ```
   *
   * **Hard transitions (multiple stops at same offset):**
   * ```ts
   * stops: [
   *   { offset: 0, color: 'red' },
   *   { offset: 0, color: 'green' }  // Creates hard transition at 0
   * ]
   * ```
   */
  stops: GradientStop[] | ((domain: { min: number; max: number }) => GradientStop[]);
};

/**
 * Processed color information with normalized values
 */
export type ProcessedColor = {
  color: string;
  opacity: number;
};

/**
 * Configuration for rendering a gradient using SVG linearGradient
 */
export type GradientConfig = {
  colors: string[];
  positions: number[];
  /**
   * Optional array of opacities (0-1 range) corresponding to each color.
   * When provided, uses stop-opacity attribute instead of color-mix with transparent.
   */
  opacities?: number[];
};

/**
 * Resolves gradient stops, handling both static arrays and function forms.
 * When stops is a function, calls it with the domain bounds.
 */
export const resolveGradientStops = (
  stops: GradientStop[] | ((domain: { min: number; max: number }) => GradientStop[]),
  domain: { min: number; max: number },
): GradientStop[] => {
  if (typeof stops === 'function') {
    return stops(domain);
  }
  return stops;
};

/**
 * Normalizes a GradientStop to include default opacity if not specified.
 */
export const normalizeGradientStop = (gradientStop: GradientStop): ProcessedColor => {
  return {
    color: gradientStop.color,
    opacity: gradientStop.opacity ?? 1,
  };
};

/**
 * Applies an additional opacity multiplier to a color using CSS color-mix().
 * Works with any CSS color format including variables like var(--color-primary).
 */
export const applyOpacityToColor = (colorString: string, opacityMultiplier: number): string => {
  if (opacityMultiplier >= 1) return colorString;

  const transparentPercent = (1 - opacityMultiplier) * 100;
  return `color-mix(in srgb, ${colorString} ${100 - transparentPercent}%, transparent)`;
};

/**
 * Processes Gradient to gradient configuration for SVG linearGradient.
 * Colors are smoothly interpolated between stops by the browser.
 * Multiple stops at the same offset create hard color transitions.
 */
const processGradientStops = (
  stops: GradientStop[],
  domain: { min: number; max: number },
  scale: ChartScaleFunction,
): GradientConfig | null => {
  // Handle edge cases
  if (stops.length === 0) {
    console.warn('Gradient has no stops - falling back to default');
    return null;
  }

  const { min: minValue, max: maxValue } = domain;

  // If only 1 stop, create a 2-stop gradient from baseline to the stop
  let effectiveStops = stops;
  if (stops.length === 1) {
    const singleStop = stops[0];
    const { color, opacity } = normalizeGradientStop(singleStop);

    // Create a gradient from baseline (transparent) to the stop color
    // Determine baseline based on whether stop is positive or negative
    const baselineOffset = singleStop.offset >= 0 ? minValue : maxValue;

    effectiveStops = [{ offset: baselineOffset, color, opacity: 0 }, singleStop];
  }

  // Process stops and extract colors and opacities separately
  // For SVG gradients, we use stop-opacity attribute to avoid transparent-black mixing issues
  const processedColors: string[] = [];
  const opacities: number[] = [];
  const offsets: number[] = [];

  effectiveStops.forEach((stop) => {
    const { color, opacity } = normalizeGradientStop(stop);
    processedColors.push(color);
    opacities.push(opacity);
    offsets.push(stop.offset);
  });

  // Validate offsets are in ascending order (allow equal values for hard transitions)
  for (let i = 1; i < offsets.length; i++) {
    if (offsets[i] < offsets[i - 1]) {
      console.warn(`Gradient: stop offsets must be in ascending order`);
      return null;
    }
  }

  // Use scale to map values to positions (handles log scales correctly)
  const scaleRange = scale.range();
  const [rangeMin, rangeMax] = Array.isArray(scaleRange)
    ? (scaleRange as [number, number])
    : [scaleRange, scaleRange];

  const rangeSpan = Math.abs(rangeMax - rangeMin);
  if (rangeSpan === 0) {
    console.warn('Scale range has zero span');
    return null;
  }

  // Convert data value offsets to normalized positions (0-1) using scale
  const positions = offsets.map((offset) => {
    const stopPosition = scale(offset);
    if (stopPosition === undefined) return 0;
    const normalized = Math.abs(stopPosition - rangeMin) / rangeSpan;
    // Clamp to [0, 1] to handle offsets outside domain
    return Math.max(0, Math.min(1, normalized));
  });

  return {
    colors: processedColors,
    positions,
    opacities,
  };
};

/**
 * Processes a GradientDefinition configuration into a gradient configuration for SVG linearGradient.
 * Supports both numeric scales (linear, log) and categorical scales (band).
 *
 * @param gradient - The GradientDefinition configuration
 * @param scale - The d3 scale to use for domain extraction and value mapping
 * @returns Gradient configuration with colors and positions, or null if invalid
 */
export const processGradient = (
  gradient: GradientDefinition,
  scale: ChartScaleFunction,
): GradientConfig | null => {
  if (!gradient) return null;

  // Extract domain from scale
  const scaleDomain = scale.domain();
  let domain: { min: number; max: number };

  if (isCategoricalScale(scale)) {
    const domainArray = scaleDomain as number[];
    domain = { min: domainArray[0], max: domainArray[domainArray.length - 1] };
  } else {
    const [min, max] = scaleDomain as [number, number];
    domain = { min, max };
  }

  // Resolve stops (handle function form)
  const resolvedStops = resolveGradientStops(gradient.stops, domain);

  return processGradientStops(resolvedStops, domain, scale);
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

  // Gradient requires either a numeric scale or a categorical (band) scale
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
 * Evaluates the color at a specific data value based on the gradient configuration.
 * Uses CSS color-mix() function for color interpolation, which works natively with CSS variables.
 *
 * Note: Opacity from gradient stops is ignored when evaluating colors at specific points.
 * Opacity should only be used in the gradient rendering itself (SVG linearGradient).
 *
 * Returns a color-mix() expression that the browser evaluates.
 *
 * @param gradient - The GradientDefinition configuration
 * @param dataValue - The data value to evaluate (for band scales, this is the index)
 * @param scale - The scale to use for value mapping (handles log scales correctly)
 * @returns The color string at this data value (may be a color-mix() expression), or null if invalid
 */
export const evaluateGradientAtValue = (
  gradient: GradientDefinition,
  dataValue: number,
  scale: ChartScaleFunction,
): string | null => {
  // Extract domain from scale
  const scaleDomain = scale.domain();
  let domain: { min: number; max: number };

  if (isCategoricalScale(scale)) {
    const domainArray = scaleDomain as number[];
    domain = { min: domainArray[0], max: domainArray[domainArray.length - 1] };
  } else {
    const [min, max] = scaleDomain as [number, number];
    domain = { min, max };
  }

  // Resolve stops (handle function form)
  const resolvedStops = resolveGradientStops(gradient.stops, domain);

  if (resolvedStops.length === 0) return null;

  const { min: minValue, max: maxValue } = domain;

  // If only 1 stop, expand to 2-stop gradient from baseline
  let effectiveStops = resolvedStops;
  if (resolvedStops.length === 1) {
    const singleStop = resolvedStops[0];
    const { color } = normalizeGradientStop(singleStop);
    const baselineOffset = singleStop.offset >= 0 ? minValue : maxValue;

    effectiveStops = [{ offset: baselineOffset, color, opacity: 0 }, singleStop];
  }

  // Use srgb color space to match our linearGradient which uses srgb color space
  // https://www.w3.org/TR/SVG11/painting.html#ColorInterpolationProperty
  const colorSpace = 'srgb';

  // Process stops - always ignore opacity for point evaluation (opacity is handled in gradient rendering)
  const processedColors = effectiveStops.map((stop) => {
    const { color } = normalizeGradientStop(stop);
    return color;
  });

  const offsets = effectiveStops.map((stop) => stop.offset);

  // Use scale to map values to positions (handles log scales correctly)
  // For numeric scales: scale(value) returns pixel position
  // We normalize these positions to 0-1 based on the range
  const scaleRange = scale.range();
  const [rangeMin, rangeMax] = Array.isArray(scaleRange)
    ? (scaleRange as [number, number])
    : [scaleRange, scaleRange]; // fallback for band scales

  const rangeSpan = Math.abs(rangeMax - rangeMin);
  if (rangeSpan === 0) return processedColors[0];

  // Map dataValue through scale to get position
  const dataPosition = scale(dataValue);
  if (dataPosition === undefined) return processedColors[0];

  // Normalize to 0-1 based on range
  const normalizedValue = Math.max(0, Math.min(1, Math.abs(dataPosition - rangeMin) / rangeSpan));

  // Map stop offsets through scale and normalize to 0-1
  const positions = offsets.map((offset) => {
    const stopPosition = scale(offset);
    if (stopPosition === undefined) return 0;
    return Math.max(0, Math.min(1, Math.abs(stopPosition - rangeMin) / rangeSpan));
  });

  // Find which segment we're in
  if (normalizedValue < positions[0]) {
    return processedColors[0];
  }
  if (normalizedValue >= positions[positions.length - 1]) {
    return processedColors[processedColors.length - 1];
  }

  // Check if dataValue matches any stop offset exactly (for hard transitions)
  for (let i = 0; i < offsets.length; i++) {
    if (dataValue === offsets[i]) {
      // Found exact match - check if there are multiple stops at this offset (hard transition)
      // Use the LAST color at this offset for hard transitions
      let lastIndexAtOffset = i;
      while (
        lastIndexAtOffset + 1 < offsets.length &&
        offsets[lastIndexAtOffset + 1] === offsets[i]
      ) {
        lastIndexAtOffset++;
      }
      return processedColors[lastIndexAtOffset];
    }
  }

  // Find the two colors to mix based on normalized positions
  for (let i = 0; i < positions.length - 1; i++) {
    const start = positions[i];
    const end = positions[i + 1];

    if (normalizedValue >= start && normalizedValue <= end) {
      // Handle hard transitions (multiple stops at same position)
      if (end === start) {
        return processedColors[i + 1];
      }

      // Calculate progress within this segment (0-1)
      const segmentProgress = (normalizedValue - start) / (end - start);
      const percentage = segmentProgress * 100;

      // Use color-mix()! This works with CSS variables!
      return `color-mix(in ${colorSpace}, ${processedColors[i + 1]} ${percentage}%, ${processedColors[i]})`;
    }
  }

  return processedColors[processedColors.length - 1];
};

/**
 * Creates a gradient configuration for SVG components.
 * Convenience function that combines gradient scale retrieval and processing.
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
): GradientConfig | null => {
  const scale = getGradientScale(gradient, xScale, yScale);
  if (!scale) return null;

  return processGradient(gradient, scale);
};

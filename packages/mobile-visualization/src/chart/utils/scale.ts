import type { ScaleBand, ScaleLinear, ScaleLogarithmic } from 'd3-scale';
import { scaleBand, scaleLinear, scaleLog } from 'd3-scale';

import type { AxisBounds } from './chart';

// https://d3js.org/d3-scale - ideal next scale would be time
export type ChartAxisScaleType = 'linear' | 'log' | 'band';

export type NumericScale =
  | ScaleLinear<number, number, never>
  | ScaleLogarithmic<number, number, never>;

export type CategoricalScale = ScaleBand<number>;

export type ChartScaleFunction = NumericScale | CategoricalScale;

export const isCategoricalScale = (scale: ChartScaleFunction): scale is CategoricalScale => {
  return scale !== undefined && 'bandwidth' in scale && typeof scale.bandwidth === 'function';
};

export const isNumericScale = (scale: ChartScaleFunction): scale is NumericScale => {
  return scale !== undefined && !isCategoricalScale(scale);
};

/**
 * Type guard to check if a scale is logarithmic.
 */
export const isLogScale = (
  scale: ChartScaleFunction,
): scale is ScaleLogarithmic<number, number, never> => {
  return scale !== undefined && 'base' in scale && typeof (scale as any).base === 'function';
};

/**
 * Create a numeric scale (linear or logarithmic)
 * @returns A numeric scale function
 */
export const getNumericScale = ({
  scaleType,
  domain,
  range,
}: {
  scaleType: 'linear' | 'log';
  domain: AxisBounds;
  range: AxisBounds;
}): NumericScale => {
  const scale = scaleType === 'log' ? scaleLog() : scaleLinear();
  return scale.domain([domain.min, domain.max]).range([range.min, range.max]);
};

/**
 * Create a categorical scale (band)
 * @returns A categorical scale function
 */
export const getCategoricalScale = ({
  domain,
  range,
  padding = 0.1,
}: {
  domain: AxisBounds;
  range: AxisBounds;
  padding?: number;
}): CategoricalScale => {
  const domainArray = Array.from({ length: domain.max - domain.min + 1 }, (_, i) => i);
  const scale = scaleBand<number>()
    .domain(domainArray)
    .range([range.min, range.max])
    .padding(padding);
  return scale;
};

/**
 * Convert a D3 scale to a serializable scale configuration that can be used in worklets
 */
export function convertToSerializableScale(
  d3Scale: ChartScaleFunction,
): SerializableScale | undefined {
  if (!d3Scale) return undefined;

  const domain = d3Scale.domain();
  const range = d3Scale.range();

  // Handle band/categorical scales
  if (isCategoricalScale(d3Scale)) {
    const bandScale = d3Scale as ScaleBand<any>;
    const bandwidth = bandScale.bandwidth();

    return {
      type: 'band',
      domain: domain as (string | number)[],
      range: [range[0], range[range.length - 1]] as [number, number],
      bandwidth,
    };
  }

  // Handle log scales
  if (isLogScale(d3Scale)) {
    const logScale = d3Scale as ScaleLogarithmic<number, number>;
    // D3 log scales default to base 10
    const base = (logScale as any).base?.() ?? 10;

    return {
      type: 'log',
      domain: [domain[0], domain[domain.length - 1]] as [number, number],
      range: [range[0], range[range.length - 1]] as [number, number],
      base,
    };
  }

  // Handle linear scales (default)
  if (isNumericScale(d3Scale)) {
    return {
      type: 'linear',
      domain: [domain[0], domain[domain.length - 1]] as [number, number],
      range: [range[0], range[range.length - 1]] as [number, number],
    };
  }

  return undefined;
}

/**
 * Convert multiple D3 scales to serializable scales
 */
export function convertScalesToSerializableScales(
  xScale?: ChartScaleFunction,
  yScales?: Map<string, ChartScaleFunction>,
): {
  xScale?: SerializableScale;
  yScales: Record<string, SerializableScale>;
} {
  const result: {
    xScale?: SerializableScale;
    yScales: Record<string, SerializableScale>;
  } = {
    yScales: {},
  };

  // Convert X scale
  if (xScale) {
    result.xScale = convertToSerializableScale(xScale);
  }

  // Convert Y scales
  if (yScales) {
    yScales.forEach((scale, id) => {
      const serializableScale = convertToSerializableScale(scale);
      if (serializableScale) {
        result.yScales[id] = serializableScale;
      }
    });
  }

  return result;
}

/**
 * Serializable scale implementations based on D3 scale concepts.
 * These scales can be used directly on the UI thread in Reanimated worklets.
 */

export type SerializableLinearScale = {
  type: 'linear';
  domain: [number, number];
  range: [number, number];
};

export type SerializableLogScale = {
  type: 'log';
  domain: [number, number];
  range: [number, number];
  base?: number;
};

export type SerializableBandScale = {
  type: 'band';
  domain: (string | number)[];
  range: [number, number];
  bandwidth: number;
};

export type SerializableScale =
  | SerializableLinearScale
  | SerializableLogScale
  | SerializableBandScale;

/**
 * Serializable linear scale function
 */
export function applyLinearScale(value: number, scale: SerializableLinearScale): number {
  'worklet';

  const [d0, d1] = scale.domain;
  const [r0, r1] = scale.range;

  const t = (value - d0) / (d1 - d0); // normalize to [0, 1]
  return r0 + t * (r1 - r0); // interpolate in range
}

/**
 * Serializable log scale function
 */
export function applyLogScale(value: number, scale: SerializableLogScale): number {
  'worklet';

  const [d0, d1] = scale.domain;
  const [r0, r1] = scale.range;
  const base = scale.base ?? 10;

  const logBase =
    base === 10
      ? Math.log10
      : base === Math.E
        ? Math.log
        : (x: number) => Math.log(x) / Math.log(base);

  const t = (logBase(value) - logBase(d0)) / (logBase(d1) - logBase(d0));
  return r0 + t * (r1 - r0);
}

/**
 * Serializable band scale function
 */
export function applyBandScale(value: number, scale: SerializableBandScale): number {
  'worklet';

  const [r0, r1] = scale.range;
  const n = scale.domain.length;
  const step = (r1 - r0) / n;

  const index = scale.domain.indexOf(value);
  if (index === -1) return r0; // Default to start if not found

  return r0 + step * index;
}

/**
 * Universal serializable scale function that handles any scale type
 */
export function applySerializableScale(value: number, scale: SerializableScale): number {
  'worklet';

  switch (scale.type) {
    case 'linear':
      return applyLinearScale(value, scale);
    case 'log':
      return applyLogScale(value, scale);
    case 'band':
      return applyBandScale(value, scale);
    default:
      return 0;
  }
}

/**
 * Get bandwidth for band scales (returns 0 for other scale types)
 */
export function getScaleBandwidth(scale: SerializableBandScale): number {
  'worklet';

  if (scale.type === 'band') {
    return scale.bandwidth;
  }
  return 0;
}

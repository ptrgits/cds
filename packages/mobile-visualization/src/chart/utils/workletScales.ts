/**
 * Worklet-compatible scale implementations based on D3 scale concepts.
 * These scales can be used directly on the UI thread in Reanimated worklets.
 */

export type WorkletScaleType = 'linear' | 'log' | 'band';

export type WorkletLinearScale = {
  type: 'linear';
  domain: [number, number];
  range: [number, number];
};

export type WorkletLogScale = {
  type: 'log';
  domain: [number, number];
  range: [number, number];
  base?: number;
};

export type WorkletBandScale = {
  type: 'band';
  domain: (string | number)[];
  range: [number, number];
  bandwidth: number;
};

export type WorkletScale = WorkletLinearScale | WorkletLogScale | WorkletBandScale;

/**
 * Worklet-compatible linear scale function
 */
export function applyLinearScale(
  value: number,
  scale: WorkletLinearScale
): number {
  'worklet';
  
  const [d0, d1] = scale.domain;
  const [r0, r1] = scale.range;
  
  const t = (value - d0) / (d1 - d0); // normalize to [0, 1]
  return r0 + t * (r1 - r0); // interpolate in range
}

/**
 * Worklet-compatible log scale function
 */
export function applyLogScale(
  value: number,
  scale: WorkletLogScale
): number {
  'worklet';
  
  const [d0, d1] = scale.domain;
  const [r0, r1] = scale.range;
  const base = scale.base ?? 10;
  
  const logBase = base === 10 ? Math.log10 : 
                  base === Math.E ? Math.log : 
                  (x: number) => Math.log(x) / Math.log(base);
  
  const t = (logBase(value) - logBase(d0)) / (logBase(d1) - logBase(d0));
  return r0 + t * (r1 - r0);
}

/**
 * Worklet-compatible band scale function
 */
export function applyBandScale(
  value: string | number,
  scale: WorkletBandScale
): number {
  'worklet';
  
  const [r0, r1] = scale.range;
  const n = scale.domain.length;
  const step = (r1 - r0) / n;
  
  const index = scale.domain.indexOf(value);
  if (index === -1) return r0; // Default to start if not found
  
  return r0 + step * index;
}

/**
 * Universal worklet scale function that handles any scale type
 */
export function applyWorkletScale(
  value: number | string,
  scale: WorkletScale
): number {
  'worklet';
  
  switch (scale.type) {
    case 'linear':
      return applyLinearScale(value as number, scale);
    case 'log':
      return applyLogScale(value as number, scale);
    case 'band':
      return applyBandScale(value, scale);
    default:
      return 0;
  }
}

/**
 * Get bandwidth for band scales (returns 0 for other scale types)
 */
export function getScaleBandwidth(scale: WorkletScale): number {
  'worklet';
  
  if (scale.type === 'band') {
    return scale.bandwidth;
  }
  return 0;
}

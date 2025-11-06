/**
 * Inverse worklet scale functions for converting screen coordinates back to data values
 */

import type { WorkletScale } from './workletScales';

/**
 * Apply inverse linear scale transformation (screen -> data)
 */
export function applyInverseLinearScale(screenValue: number, scale: WorkletScale): number {
  'worklet';

  if (scale.type !== 'linear') return 0;

  const [d0, d1] = scale.domain;
  const [r0, r1] = scale.range;

  // Inverse linear interpolation
  const t = (screenValue - r0) / (r1 - r0); // normalize screen value to [0, 1]
  return d0 + t * (d1 - d0); // interpolate in domain
}

/**
 * Apply inverse log scale transformation (screen -> data)
 */
export function applyInverseLogScale(screenValue: number, scale: WorkletScale): number {
  'worklet';

  if (scale.type !== 'log') return 0;

  const [d0, d1] = scale.domain;
  const [r0, r1] = scale.range;
  const base = scale.base ?? 10;

  const logBase =
    base === 10
      ? Math.log10
      : base === Math.E
        ? Math.log
        : (x: number) => Math.log(x) / Math.log(base);

  // Inverse log interpolation
  const t = (screenValue - r0) / (r1 - r0);
  const logD0 = logBase(d0);
  const logD1 = logBase(d1);
  const logResult = logD0 + t * (logD1 - logD0);

  return Math.pow(base, logResult);
}

/**
 * Apply inverse band scale transformation (screen -> data index)
 */
export function applyInverseBandScale(screenValue: number, scale: WorkletScale): number {
  'worklet';

  if (scale.type !== 'band') return 0;

  const [r0, r1] = scale.range;
  const step = (r1 - r0) / scale.domain.length;
  const index = Math.round((screenValue - r0) / step);

  return Math.max(0, Math.min(scale.domain.length - 1, index));
}

/**
 * Universal inverse worklet scale function
 */
export function applyInverseWorkletScale(screenValue: number, scale: WorkletScale): number {
  'worklet';

  switch (scale.type) {
    case 'linear':
      return applyInverseLinearScale(screenValue, scale);
    case 'log':
      return applyInverseLogScale(screenValue, scale);
    case 'band':
      return applyInverseBandScale(screenValue, scale);
    default:
      return 0;
  }
}

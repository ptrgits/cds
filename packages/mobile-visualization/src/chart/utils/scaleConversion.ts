/**
 * Utilities to convert D3 scales to worklet-compatible scale configurations
 */

import type { ScaleBand, ScaleLinear, ScaleLogarithmic } from 'd3-scale';
import { isCategoricalScale, isLogScale, isNumericScale } from './scale';
import type { ChartScaleFunction } from './scale';
import type { WorkletScale } from './workletScales';

/**
 * Convert a D3 scale to a worklet-compatible scale configuration
 */
export function convertToWorkletScale(
  d3Scale: ChartScaleFunction,
  axisType: 'x' | 'y'
): WorkletScale | undefined {
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
 * Convert multiple D3 scales to worklet scales
 */
export function convertScalesToWorkletScales(
  xScale?: ChartScaleFunction,
  yScales?: Map<string, ChartScaleFunction>
): {
  xScale?: WorkletScale;
  yScales: Record<string, WorkletScale>;
} {
  const result: {
    xScale?: WorkletScale;
    yScales: Record<string, WorkletScale>;
  } = {
    yScales: {},
  };

  // Convert X scale
  if (xScale) {
    result.xScale = convertToWorkletScale(xScale, 'x');
  }

  // Convert Y scales
  if (yScales) {
    yScales.forEach((scale, id) => {
      const workletScale = convertToWorkletScale(scale, 'y');
      if (workletScale) {
        result.yScales[id] = workletScale;
      }
    });
  }

  return result;
}

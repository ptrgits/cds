import { area as d3Area } from 'd3-shape';

import type { Rect } from '../../types';

import { type ChartPathCurveType, getPathCurveFunction } from './getPathCurveFunction';
import { projectPoint } from './getPoints';
import { type ChartScaleFunction, isBandScale } from './scale';

/**
 * Generates an SVG area path string from data using chart scale functions.
 * Supports both single values (area from baseline to value) and tuples ([baseline, value]).
 *
 * @example
 * ```typescript
 * // Single values - area from baseline to value
 * const area = getAreaPath({
 *   data: [1, 2, 3],
 *   xScale,
 *   yScale,
 * });
 *
 * // Range values - area from low to high
 * const rangeArea = getAreaPath({
 *   data: [[0, 3], [2, 4], [1, 5]],
 *   xScale,
 *   yScale,
 *   curve: 'monotone'
 * });
 * ```
 */
export const getAreaPath = ({
  data,
  curve = 'linear',
  xScale,
  yScale,
  xData,
}: {
  data: (number | null)[] | Array<[number, number] | null>;
  xScale: ChartScaleFunction;
  yScale: ChartScaleFunction;
  curve: ChartPathCurveType;
  xData?: number[];
}): string => {
  if (data.length === 0) {
    return '';
  }

  const curveFunction = getPathCurveFunction(curve);

  const yDomain = yScale.domain();
  const yMin = Math.min(...yDomain);

  const normalizedData: Array<[number, number] | null> = data.map((item, index) => {
    if (item === null) {
      return null;
    }

    if (Array.isArray(item)) {
      if (item.length >= 2 && typeof item[0] === 'number' && typeof item[1] === 'number') {
        return [item[0], item[1]];
      }
      return null;
    }

    if (typeof item === 'number') {
      return [yMin, item];
    }

    return null;
  });

  const dataPoints = normalizedData.map((range, index) => {
    if (range === null) {
      return {
        x: 0,
        low: null,
        high: null,
        isValid: false,
      };
    }

    let xValue: number = index;
    if (!isBandScale(xScale) && xData && xData[index] !== undefined) {
      xValue = xData[index];
    }

    const xPoint = projectPoint({ x: xValue, y: 0, xScale, yScale });
    const lowPoint = projectPoint({
      x: xValue,
      y: range[0],
      xScale,
      yScale,
    });
    const highPoint = projectPoint({
      x: xValue,
      y: range[1],
      xScale,
      yScale,
    });

    return {
      x: xPoint.x,
      low: lowPoint.y,
      high: highPoint.y,
      isValid: true,
    };
  });

  const areaGenerator = d3Area<{
    x: number;
    low: number | null;
    high: number | null;
    isValid: boolean;
  }>()
    .x((d) => d.x)
    .y0((d) => d.low ?? 0) // Bottom boundary (low values), fallback to 0
    .y1((d) => d.high ?? 0) // Top boundary (high values), fallback to 0
    .curve(curveFunction)
    .defined((d) => d.isValid && d.low != null && d.high != null); // Only draw where both values exist

  const result = areaGenerator(dataPoints);
  return result ?? '';
};

/**
 * Worklet versions of coordinate functions for Reanimated.
 * These are identical to the regular functions but with 'worklet' directive.
 */

/**
 * Find closest data index from screen X coordinate.
 * @worklet
 */
export function findClosestXIndexWorklet(
  xOutputs: number[],
  screenX: number
): number {
  'worklet';
  
  if (xOutputs.length === 0) return -1;
  
  let closestIndex = 0;
  let minDistance = Math.abs(xOutputs[0] - screenX);
  
  for (let i = 1; i < xOutputs.length; i++) {
    const distance = Math.abs(xOutputs[i] - screenX);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }
  
  return closestIndex;
}

/**
 * Binary search version for large datasets (optional optimization).
 * @worklet
 */
export function findClosestXIndexBinaryWorklet(
  xOutputs: number[],
  screenX: number
): number {
  'worklet';
  
  if (xOutputs.length === 0) return -1;
  
  let left = 0;
  let right = xOutputs.length - 1;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (xOutputs[mid] < screenX) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  
  // Check if left-1 is closer
  if (left > 0 && Math.abs(xOutputs[left - 1] - screenX) < Math.abs(xOutputs[left] - screenX)) {
    return left - 1;
  }
  
  return left;
}

/**
 * Get screen X coordinate from data index.
 * @worklet
 */
export function getScreenXWorklet(
  xOutputs: number[],
  dataIndex: number
): number {
  'worklet';
  
  const clampedIndex = Math.max(0, Math.min(dataIndex, xOutputs.length - 1));
  return xOutputs[clampedIndex] ?? 0;
}

/**
 * Get screen Y coordinate for a series at data index.
 * @worklet
 */
export function getScreenYWorklet(
  yOutputs: number[],
  dataIndex: number
): number {
  'worklet';
  
  const clampedIndex = Math.max(0, Math.min(dataIndex, yOutputs.length - 1));
  return yOutputs[clampedIndex] ?? 0;
}

/**
 * Get data value for a series at data index.
 * @worklet
 */
export function getDataYWorklet(
  yInputs: Array<[number, number] | null>,
  dataIndex: number
): [number, number] | null {
  'worklet';
  
  const clampedIndex = Math.max(0, Math.min(dataIndex, yInputs.length - 1));
  return yInputs[clampedIndex] ?? null;
}

/**
 * Get coordinates for all series at a specific data index.
 * @worklet
 */
export function getAllSeriesCoordinatesAtIndexWorklet(
  xOutputs: number[],
  seriesCoordinates: Record<string, { yInputs: Array<[number, number] | null>; yOutputs: number[] }>,
  dataIndex: number
): Array<{
  seriesId: string;
  screenX: number;
  screenY: number;
  dataY: [number, number] | null;
}> {
  'worklet';
  
  const screenX = getScreenXWorklet(xOutputs, dataIndex);
  const results: Array<{
    seriesId: string;
    screenX: number;
    screenY: number;
    dataY: [number, number] | null;
  }> = [];
  
  Object.keys(seriesCoordinates).forEach((seriesId) => {
    const coords = seriesCoordinates[seriesId];
    if (coords) {
      results.push({
        seriesId,
        screenX,
        screenY: getScreenYWorklet(coords.yOutputs, dataIndex),
        dataY: getDataYWorklet(coords.yInputs, dataIndex),
      });
    }
  });
  
  return results;
}

/**
 * Get coordinates for specific series at a data index.
 * @worklet
 */
export function getSeriesCoordinateAtIndexWorklet(
  xOutputs: number[],
  seriesCoordinates: Record<string, { yInputs: Array<[number, number] | null>; yOutputs: number[] }>,
  seriesId: string,
  dataIndex: number
): {
  seriesId: string;
  screenX: number;
  screenY: number;
  dataY: [number, number] | null;
} | null {
  'worklet';
  
  const coords = seriesCoordinates[seriesId];
  if (!coords) return null;
  
  return {
    seriesId,
    screenX: getScreenXWorklet(xOutputs, dataIndex),
    screenY: getScreenYWorklet(coords.yOutputs, dataIndex),
    dataY: getDataYWorklet(coords.yInputs, dataIndex),
  };
}

/**
 * Check if coordinate arrays are valid and non-empty.
 * @worklet
 */
export function areCoordinateArraysValidWorklet(coordinateArrays: {
  xInputs: number[];
  xOutputs: number[];
  seriesCoordinates: Record<string, { yInputs: Array<[number, number] | null>; yOutputs: number[] }>;
}): boolean {
  'worklet';
  
  return (
    coordinateArrays.xInputs.length > 0 &&
    coordinateArrays.xOutputs.length > 0 &&
    coordinateArrays.xInputs.length === coordinateArrays.xOutputs.length
  );
}

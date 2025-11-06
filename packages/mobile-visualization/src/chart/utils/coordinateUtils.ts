/**
 * Simple coordinate utility functions that work on web and mobile.
 * Pass in the arrays when you need to use them.
 */

/**
 * Find closest data index from screen X coordinate.
 * Works on both web and mobile.
 */
export function findClosestXIndex(
  xOutputs: number[],
  screenX: number
): number {
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
 * Use this when you have > 1000 data points for better performance.
 */
export function findClosestXIndexBinary(
  xOutputs: number[],
  screenX: number
): number {
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
 */
export function getScreenX(
  xOutputs: number[],
  dataIndex: number
): number {
  const clampedIndex = Math.max(0, Math.min(dataIndex, xOutputs.length - 1));
  return xOutputs[clampedIndex] ?? 0;
}

/**
 * Get screen Y coordinate for a series at data index.
 */
export function getScreenY(
  yOutputs: number[],
  dataIndex: number
): number {
  const clampedIndex = Math.max(0, Math.min(dataIndex, yOutputs.length - 1));
  return yOutputs[clampedIndex] ?? 0;
}

/**
 * Get data value for a series at data index.
 */
export function getDataY(
  yInputs: Array<[number, number] | null>,
  dataIndex: number
): [number, number] | null {
  const clampedIndex = Math.max(0, Math.min(dataIndex, yInputs.length - 1));
  return yInputs[clampedIndex] ?? null;
}

/**
 * Get coordinates for all series at a specific data index.
 * Returns simple object that works on web and mobile.
 */
export function getAllSeriesCoordinatesAtIndex(
  xOutputs: number[],
  seriesCoordinates: Record<string, { yInputs: Array<[number, number] | null>; yOutputs: number[] }>,
  dataIndex: number
): Array<{
  seriesId: string;
  screenX: number;
  screenY: number;
  dataY: [number, number] | null;
}> {
  const screenX = getScreenX(xOutputs, dataIndex);
  
  return Object.entries(seriesCoordinates).map(([seriesId, coords]) => ({
    seriesId,
    screenX,
    screenY: getScreenY(coords.yOutputs, dataIndex),
    dataY: getDataY(coords.yInputs, dataIndex),
  }));
}

/**
 * Get coordinates for specific series at a data index.
 * Convenience function for single series lookups.
 */
export function getSeriesCoordinateAtIndex(
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
  const coords = seriesCoordinates[seriesId];
  if (!coords) return null;
  
  return {
    seriesId,
    screenX: getScreenX(xOutputs, dataIndex),
    screenY: getScreenY(coords.yOutputs, dataIndex),
    dataY: getDataY(coords.yInputs, dataIndex),
  };
}

/**
 * Check if coordinate arrays are valid and non-empty.
 */
export function areCoordinateArraysValid(coordinateArrays: {
  xInputs: number[];
  xOutputs: number[];
  seriesCoordinates: Record<string, { yInputs: Array<[number, number] | null>; yOutputs: number[] }>;
}): boolean {
  return (
    coordinateArrays.xInputs.length > 0 &&
    coordinateArrays.xOutputs.length > 0 &&
    coordinateArrays.xInputs.length === coordinateArrays.xOutputs.length
  );
}

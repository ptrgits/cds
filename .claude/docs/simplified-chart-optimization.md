# Simplified Chart Optimization - Web Compatible

## Overview

A simple, web-compatible approach to optimize chart performance by pre-calculating coordinates and providing utility functions for fast lookups.

## Core Concept

1. **Add one simple object** to the context with pre-calculated arrays
2. **Create utility functions** that work on both web and mobile
3. **Pass arrays to functions** when needed - no complex data structures

## Simple Data Structure

```typescript
// Add to CartesianChartContextValue
export type CartesianChartContextValue = {
  // ... existing properties ...
  
  /**
   * Pre-calculated coordinate arrays for fast lookups.
   * Simple arrays that work identically on web and mobile.
   */
  coordinateArrays: {
    // Global X coordinates (shared across all series)
    xInputs: number[];     // [0, 1, 2, 3, ...] or [timestamp1, timestamp2, ...]
    xOutputs: number[];    // [10, 20, 30, 40, ...] screen pixels
    
    // Per-series Y coordinates
    seriesCoordinates: Record<string, {
      yInputs: Array<[number, number] | null>;  // [[baseline, value], ...]
      yOutputs: number[];                       // [100, 80, 120, ...] screen pixels
    }>;
  };
};
```

## Utility Functions File

Create `packages/mobile-visualization/src/chart/utils/coordinateUtils.ts`:

```typescript
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
```

## Mobile-Specific Worklet File (Optional)

Create `packages/mobile-visualization/src/chart/utils/coordinateWorklets.ts`:

```typescript
/**
 * Worklet versions of coordinate functions for Reanimated.
 * These are identical to the regular functions but with 'worklet' directive.
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

export function getScreenXWorklet(
  xOutputs: number[],
  dataIndex: number
): number {
  'worklet';
  
  const clampedIndex = Math.max(0, Math.min(dataIndex, xOutputs.length - 1));
  return xOutputs[clampedIndex] ?? 0;
}

export function getScreenYWorklet(
  yOutputs: number[],
  dataIndex: number
): number {
  'worklet';
  
  const clampedIndex = Math.max(0, Math.min(dataIndex, yOutputs.length - 1));
  return yOutputs[clampedIndex] ?? 0;
}

// ... other worklet versions as needed
```

## Usage Examples

### In CartesianChart.tsx (Building the arrays)

```typescript
// Simple coordinate array building
const coordinateArrays = useMemo(() => {
  if (!xScale || !chartRect || chartRect.width <= 0) {
    return {
      xInputs: [],
      xOutputs: [],
      seriesCoordinates: {},
    };
  }

  // Build global X arrays
  const maxLength = Math.max(...(series?.map(s => s.data?.length ?? 0) ?? [0]));
  const xInputs: number[] = [];
  const xOutputs: number[] = [];
  
  for (let i = 0; i < maxLength; i++) {
    const xValue = xAxis?.data?.[i] ?? i;
    xInputs.push(xValue);
    xOutputs.push(getPointOnScale(xValue, xScale));
  }

  // Build per-series Y arrays
  const seriesCoordinates: Record<string, {
    yInputs: Array<[number, number] | null>;
    yOutputs: number[];
  }> = {};

  series?.forEach((s) => {
    const yScale = yScales.get(s.yAxisId ?? defaultAxisId);
    if (!yScale || !s.data) return;

    const stackedData = getStackedSeriesData(s.id) ?? [];
    const yInputs: Array<[number, number] | null> = [];
    const yOutputs: number[] = [];

    stackedData.forEach((dataPoint) => {
      yInputs.push(dataPoint);
      if (dataPoint) {
        yOutputs.push(getPointOnScale(dataPoint[1], yScale));
      } else {
        yOutputs.push(0);
      }
    });

    seriesCoordinates[s.id] = { yInputs, yOutputs };
  });

  return { xInputs, xOutputs, seriesCoordinates };
}, [series, xScale, yScales, xAxis, stackedDataMap, chartRect]);
```

### In ScrubberBeacon.tsx (Using the arrays)

```typescript
import { getScreenX, getScreenY } from '../utils/coordinateUtils';

// Simple usage - just pass the arrays
const pixelCoordinate = useDerivedValue(() => {
  if (scrubberPosition.value === undefined) return undefined;
  
  const { xOutputs, seriesCoordinates } = coordinateArrays;
  const seriesCoords = seriesCoordinates[seriesId];
  
  if (!seriesCoords) return undefined;
  
  return {
    x: getScreenX(xOutputs, scrubberPosition.value),
    y: getScreenY(seriesCoords.yOutputs, scrubberPosition.value),
  };
}, [coordinateArrays, scrubberPosition, seriesId]);
```

### In Scrubber.tsx (Gesture handling)

```typescript
import { findClosestXIndexWorklet } from '../utils/coordinateWorklets';

const gesture = Gesture.Pan()
  .onUpdate((e) => {
    'worklet';
    
    // Simple function call with arrays
    const dataIndex = findClosestXIndexWorklet(
      coordinateArrays.value.xOutputs,
      e.x
    );
    
    scrubberPosition.value = dataIndex;
  });
```

### Web Compatibility

On web, you'd use the exact same functions:

```typescript
// In web scrubber component
import { findClosestXIndex, getAllSeriesCoordinatesAtIndex } from '../utils/coordinateUtils';

const handleMouseMove = (e: MouseEvent) => {
  const dataIndex = findClosestXIndex(coordinateArrays.xOutputs, e.clientX);
  
  const allCoords = getAllSeriesCoordinatesAtIndex(
    coordinateArrays.xOutputs,
    coordinateArrays.seriesCoordinates,
    dataIndex
  );
  
  // Update tooltip, etc.
};
```

## Benefits of This Approach

1. **Simple**: Just arrays and functions - no complex data structures
2. **Web Compatible**: Same functions work on both platforms
3. **Flexible**: Pass arrays when needed, no tight coupling
4. **Performant**: Pre-calculated coordinates, fast array lookups
5. **Maintainable**: Easy to understand and debug
6. **Testable**: Pure functions are easy to test

## Migration Strategy

1. **Add `coordinateArrays`** to context
2. **Create `coordinateUtils.ts`** with basic functions
3. **Update one component at a time** to use the new arrays
4. **Add worklet versions** only where needed for mobile
5. **Gradually optimize** (binary search, etc.) as needed

This approach gives you all the performance benefits with maximum simplicity and web compatibility!

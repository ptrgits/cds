# Final Worklet Scales Architecture

## Overview

This document outlines the final, optimized worklet scale architecture for the Coinbase Design System's mobile visualization package. This approach provides maximum performance by pre-converting D3 scales to worklet-compatible formats and using simple worklet functions for coordinate transformations.

## Architecture Summary

```
D3 Scale (JS Thread) → useMemo → WorkletScale → useCallback → Worklet Function (UI Thread)
```

## Key Benefits

### ✅ **Performance Optimized**

- **Pre-conversion**: D3 scales are converted to worklet scales once when they change (not on every call)
- **Memoized**: Worklet scales are cached using `useMemo` and only recalculated when D3 scales change
- **Fast Lookups**: Worklet functions perform simple property access and math operations
- **No SharedValue Overhead**: Direct function calls instead of reactive state management

### ✅ **Simple API**

- **Direct Function Calls**: `getXScaleWorklet(value)` instead of complex SharedValue access
- **Type Safe**: Clear TypeScript interfaces for all worklet functions
- **Consistent**: Same API pattern across all scale types and components

### ✅ **Memory Efficient**

- **No Coordinate Arrays**: No large pre-calculated coordinate arrays stored in memory
- **Lightweight Scales**: WorkletScale objects contain only essential domain/range data
- **Automatic Cleanup**: Memoized scales are garbage collected when components unmount

## Implementation Details

### 1. Worklet Scale Types

```typescript
// packages/mobile-visualization/src/chart/utils/workletScales.ts

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
```

### 2. Pre-conversion with Memoization

```typescript
// In CartesianChart.tsx

// Pre-convert D3 scales to worklet-compatible scales when they change
const workletXScale = useMemo((): WorkletScale | undefined => {
  if (!xScale) return undefined;
  return convertToWorkletScale(xScale, 'x');
}, [xScale]);

const workletYScales = useMemo((): Record<string, WorkletScale> => {
  const converted: Record<string, WorkletScale> = {};
  yScales.forEach((scale, id) => {
    const workletScale = convertToWorkletScale(scale, 'y');
    if (workletScale) {
      converted[id] = workletScale;
    }
  });
  return converted;
}, [yScales]);
```

### 3. Optimized Worklet Functions

```typescript
// Create worklet scale functions that use pre-converted scales
const getXScaleWorklet = useCallback(
  (value: number | string): number => {
    'worklet';

    if (!workletXScale) return 0;
    return applyWorkletScale(value, workletXScale);
  },
  [workletXScale], // Only re-creates when workletXScale changes
);

const getYScaleWorklet = useCallback(
  (value: number, yAxisId?: string): number => {
    'worklet';

    const targetWorkletScale = workletYScales[yAxisId ?? defaultAxisId];
    if (!targetWorkletScale) return 0;
    return applyWorkletScale(value, targetWorkletScale);
  },
  [workletYScales], // Only re-creates when workletYScales changes
);
```

### 4. Inverse Scale Functions

```typescript
// packages/mobile-visualization/src/chart/utils/inverseWorkletScales.ts

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
```

## Usage Examples

### ReferenceLine Component

```typescript
const yPixel = useDerivedValue(() => {
  if (dataY === undefined) return undefined;

  const currentDataY = unwrapAnimatedValue(dataY);
  return getYScaleWorklet(currentDataY, yAxisId); // Simple, direct call
}, [getYScaleWorklet, dataY, yAxisId]);
```

### ScrubberProvider Component

```typescript
const getDataIndexFromX = useCallback(
  (touchX: number): number | undefined => {
    'worklet';
    return getDataIndexFromXWorklet(touchX); // Simple, direct call
  },
  [getDataIndexFromXWorklet],
);
```

### ScrubberBeacon Component

```typescript
return {
  x: getXScaleWorklet(xValue), // Simple, direct call
  y: getYScaleWorklet(yValue, targetSeries?.yAxisId), // Simple, direct call
};
```

## Performance Characteristics

### Conversion Cost (One-time per scale change)

- **Linear Scale**: O(1) - Extract domain/range
- **Log Scale**: O(1) - Extract domain/range + base
- **Band Scale**: O(1) - Extract domain/range + bandwidth

### Worklet Function Cost (Per call)

- **Linear Scale**: O(1) - Simple linear interpolation
- **Log Scale**: O(1) - Logarithmic calculation
- **Band Scale**: O(1) - Array index lookup

### Memory Usage

- **WorkletScale**: ~100 bytes per scale (domain + range + metadata)
- **No Coordinate Arrays**: Eliminates potentially large arrays (could be MBs for large datasets)
- **Automatic Cleanup**: Scales are garbage collected when D3 scales change

## Comparison with Previous Approaches

### vs. Coordinate Arrays

| Aspect          | Coordinate Arrays      | Worklet Scales        |
| --------------- | ---------------------- | --------------------- |
| **Memory**      | O(n) per series        | O(1) per scale        |
| **Flexibility** | Fixed data points only | Any data value        |
| **Setup Cost**  | O(n) pre-calculation   | O(1) conversion       |
| **Lookup Cost** | O(log n) binary search | O(1) calculation      |
| **Scale Types** | Limited support        | Full D3 compatibility |

### vs. SharedValue Approach

| Aspect             | SharedValue                       | Direct Functions            |
| ------------------ | --------------------------------- | --------------------------- |
| **API Complexity** | High (nested object access)       | Low (direct function calls) |
| **Performance**    | Reactive overhead                 | Direct execution            |
| **Type Safety**    | Complex nested types              | Simple function signatures  |
| **Debugging**      | Difficult (SharedValue internals) | Easy (standard functions)   |

## Migration Benefits

### For Developers

1. **Simpler API**: Direct function calls instead of complex SharedValue access
2. **Better IntelliSense**: Clear function signatures with proper TypeScript support
3. **Easier Debugging**: Standard function calls that can be easily traced
4. **Consistent Patterns**: Same approach across all components

### For Performance

1. **Faster Execution**: No SharedValue overhead or reactive updates
2. **Lower Memory**: No large coordinate arrays stored in memory
3. **Better Scaling**: O(1) operations regardless of data size
4. **Efficient Updates**: Only recompute when scales actually change

### For Maintainability

1. **Cleaner Code**: Removed complex coordinate array building logic
2. **Better Separation**: Clear distinction between D3 (JS thread) and worklet (UI thread) concerns
3. **Easier Testing**: Simple functions that can be unit tested
4. **Future Proof**: Easy to extend with new scale types

## Conclusion

This final architecture provides the optimal balance of performance, simplicity, and maintainability. By pre-converting D3 scales to worklet-compatible formats and using direct function calls, we achieve:

- **Maximum Performance**: O(1) worklet operations with minimal memory overhead
- **Developer Experience**: Simple, type-safe API that's easy to use and debug
- **Scalability**: Works efficiently with datasets of any size
- **Maintainability**: Clean, well-separated concerns that are easy to extend

The implementation successfully eliminates the complexity of the previous approaches while providing better performance characteristics and a more intuitive API for chart interactions on the UI thread.

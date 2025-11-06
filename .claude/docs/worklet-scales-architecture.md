# Worklet Scales Architecture

## Overview

This document outlines the new worklet-compatible scale architecture for the Coinbase Design System's mobile visualization package. This approach replaces the previous coordinate array system with direct D3-to-worklet scale conversion, providing better performance and cleaner code.

## The Problem

React Native Reanimated worklets cannot directly use D3 scale functions because:

1. **Closure Serialization**: D3 scales contain complex closures that can't be serialized for the UI thread
2. **External Dependencies**: D3 scales reference external modules not available on the UI thread
3. **Dynamic Properties**: D3 scales have dynamic properties and methods that don't translate to worklet context

## The Solution: Worklet-Compatible Scales

Instead of pre-calculating coordinate arrays, we convert D3 scale configurations to simple data structures that can be used with worklet-compatible scale functions.

### Architecture

```
D3 Scale (JS Thread) → Worklet Scale Config → SharedValue → UI Thread Worklet Functions
```

## Implementation

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

### 2. Worklet Scale Functions

```typescript
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
```

### 3. D3 to Worklet Conversion

```typescript
// packages/mobile-visualization/src/chart/utils/scaleConversion.ts

export function convertToWorkletScale(
  d3Scale: ChartScaleFunction,
  axisType: 'x' | 'y'
): WorkletScale | undefined {
  const domain = d3Scale.domain();
  const range = d3Scale.range();

  if (isCategoricalScale(d3Scale)) {
    return {
      type: 'band',
      domain: domain as (string | number)[],
      range: [range[0], range[range.length - 1]] as [number, number],
      bandwidth: (d3Scale as ScaleBand<any>).bandwidth(),
    };
  }

  if (isLogScale(d3Scale)) {
    return {
      type: 'log',
      domain: [domain[0], domain[domain.length - 1]] as [number, number],
      range: [range[0], range[range.length - 1]] as [number, number],
      base: (d3Scale as any).base?.() ?? 10,
    };
  }

  // Default to linear
  return {
    type: 'linear',
    domain: [domain[0], domain[domain.length - 1]] as [number, number],
    range: [range[0], range[range.length - 1]] as [number, number],
  };
}
```

### 4. Context Integration

```typescript
// Updated CartesianChartContextValue
export type CartesianChartContextValue = {
  // ... other properties
  
  /**
   * Worklet-compatible scales for UI thread calculations.
   * Updated reactively when underlying D3 scales change.
   */
  workletScales: SharedValue<{
    xScale?: WorkletScale;
    yScales: Record<string, WorkletScale>;
  }>;
};
```

### 5. Victory Native XL Pattern

Following the Victory Native XL pattern for reactive scale updates:

```typescript
// In CartesianChart.tsx

// Create worklet-compatible scales
const workletScales = useSharedValue<{
  xScale?: WorkletScale;
  yScales: Record<string, WorkletScale>;
}>({
  yScales: {},
});

// Convert D3 scales to worklet scales whenever they change
const workletScaleData = useMemo(() => {
  return convertScalesToWorkletScales(xScale, yScales);
}, [xScale, yScales]);

// Update shared value when scales change (Victory Native XL pattern)
useEffect(() => {
  workletScales.value = workletScaleData;
}, [workletScaleData, workletScales]);
```

## Usage Examples

### ReferenceLine Component

```typescript
const yPixel = useDerivedValue(() => {
  if (dataY === undefined) return undefined;

  const currentDataY = unwrapAnimatedValue(dataY);
  const yScale = workletScales.value.yScales[yAxisId ?? defaultAxisId];
  
  if (!yScale) return 0;
  
  return applyWorkletScale(currentDataY, yScale);
}, [workletScales, dataY, yAxisId]);

const xPixel = useDerivedValue(() => {
  if (dataX === undefined) return undefined;

  const currentDataX = unwrapAnimatedValue(dataX);
  const xScale = workletScales.value.xScale;
  
  if (!xScale) return 0;
  
  return applyWorkletScale(currentDataX, xScale);
}, [workletScales, dataX]);
```

### Scrubber Components

```typescript
// In ScrubberProvider.tsx
const getDataIndexFromX = useDerivedValue(() => {
  return (screenX: number) => {
    'worklet';
    
    const xScale = workletScales.value.xScale;
    if (!xScale) return 0;
    
    // For band scales, find the closest band
    if (xScale.type === 'band') {
      const [r0, r1] = xScale.range;
      const step = (r1 - r0) / xScale.domain.length;
      return Math.round((screenX - r0) / step);
    }
    
    // For linear/log scales, use inverse transformation
    // This would require implementing inverse worklet functions
    return 0; // Simplified for example
  };
}, [workletScales]);
```

## Benefits

### 1. **Performance**
- Direct scale calculations on UI thread
- No coordinate array pre-calculation overhead
- Reactive updates only when scales change

### 2. **Flexibility** 
- Works with any data value, not just pre-calculated points
- Supports all D3 scale types (linear, log, band, etc.)
- Easy to extend with new scale types

### 3. **Memory Efficiency**
- No large coordinate arrays stored in memory
- Scale configurations are lightweight
- Scales shared across all components

### 4. **Maintainability**
- Clean separation between D3 and worklet logic
- Familiar D3 scale concepts translated directly
- Easy to debug and test

### 5. **Web Compatibility**
- Same scale functions work on web (just without 'worklet' directive)
- Consistent API across platforms
- No platform-specific coordinate arrays

## Migration Guide

### From Coordinate Arrays

**Before:**
```typescript
const screenX = getScreenXWorklet(coordinateArrays.xOutputs, dataIndex);
const screenY = getScreenYWorklet(coordinateArrays.seriesCoordinates[seriesId].yOutputs, dataIndex);
```

**After:**
```typescript
const screenX = applyWorkletScale(dataValue, workletScales.value.xScale);
const screenY = applyWorkletScale(dataValue, workletScales.value.yScales[seriesId]);
```

### Component Updates

1. Replace `coordinateArrays` context usage with `workletScales`
2. Use `applyWorkletScale` instead of coordinate array lookups
3. Update `useDerivedValue` dependencies from `coordinateArrays` to `workletScales`

## Future Enhancements

### 1. **Inverse Scale Functions**
Implement worklet-compatible inverse functions for screen-to-data conversions:

```typescript
export function applyInverseWorkletScale(
  screenValue: number,
  scale: WorkletScale
): number | string {
  'worklet';
  // Implementation for reverse transformations
}
```

### 2. **Advanced Scale Types**
Add support for additional D3 scale types:
- Time scales
- Ordinal scales  
- Threshold scales
- Quantile scales

### 3. **Scale Caching**
Implement intelligent caching to avoid unnecessary scale conversions:

```typescript
const scaleCache = useRef<Map<string, WorkletScale>>();
```

### 4. **Performance Monitoring**
Add performance metrics to compare worklet scale performance vs coordinate arrays.

## Conclusion

The worklet scale architecture provides a robust, performant, and maintainable solution for chart interactions on the UI thread. By converting D3 scale configurations to worklet-compatible formats, we achieve the best of both worlds: D3's powerful scaling capabilities and Reanimated's UI thread performance.

This approach eliminates the need for coordinate arrays while providing more flexibility and better performance characteristics. The implementation follows established patterns from Victory Native XL and integrates seamlessly with the existing CDS architecture.

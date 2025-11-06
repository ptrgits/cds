import React, { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { Haptics } from '@coinbase/cds-mobile/utils/haptics';

import { useCartesianChartContext } from '../ChartProvider';
import { isCategoricalScale, ScrubberContext, type ScrubberContextValue } from '../utils';

export type ScrubberProviderProps = Partial<Pick<ScrubberContextValue, 'enableScrubbing'>> & {
  children: React.ReactNode;
  /**
   * Allows continuous gestures on the chart to continue outside the bounds of the chart element.
   */
  allowOverflowGestures?: boolean;
  /**
   * Callback fired when the scrubber position changes.
   * Receives the dataIndex of the scrubber or undefined when not scrubbing.
   */
  onScrubberPositionChange?: (index: number | undefined) => void;
};

/**
 * A component which encapsulates the ScrubberContext.
 * It depends on a ChartContext in order to provide accurate touch tracking.
 */
export const ScrubberProvider: React.FC<ScrubberProviderProps> = ({
  children,
  enableScrubbing,
  onScrubberPositionChange,
  allowOverflowGestures,
}) => {
  const chartContext = useCartesianChartContext();

  if (!chartContext) {
    throw new Error('ScrubberProvider must be used within a ChartContext');
  }

  const { getXScale, getXAxis, series } = chartContext;
  const scrubberPosition = useSharedValue<number | undefined>(undefined);

  const getDataIndexFromX = useCallback(
    (touchX: number): number => {
      const xScale = getXScale();
      const xAxis = getXAxis();

      if (!xScale || !xAxis) return 0;

      if (isCategoricalScale(xScale)) {
        const categories = xScale.domain?.() ?? xAxis.data ?? [];
        const bandwidth = xScale.bandwidth?.() ?? 0;
        let closestIndex = 0;
        let closestDistance = Infinity;
        for (let i = 0; i < categories.length; i++) {
          const xPos = xScale(i);
          if (xPos !== undefined) {
            const distance = Math.abs(touchX - (xPos + bandwidth / 2));
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = i;
            }
          }
        }
        return closestIndex;
      } else {
        // For numeric scales with axis data, find the nearest data point
        const axisData = xAxis.data;
        if (axisData && Array.isArray(axisData) && typeof axisData[0] === 'number') {
          // We have numeric axis data - find the closest data point
          const numericData = axisData as number[];
          let closestIndex = 0;
          let closestDistance = Infinity;

          for (let i = 0; i < numericData.length; i++) {
            const xValue = numericData[i];
            const xPos = xScale(xValue);
            if (xPos !== undefined) {
              const distance = Math.abs(touchX - xPos);
              if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = i;
              }
            }
          }
          return closestIndex;
        } else {
          const xValue = xScale.invert(touchX);
          const dataIndex = Math.round(xValue);
          const domain = xAxis.domain;
          return Math.max(domain.min ?? 0, Math.min(dataIndex, domain.max ?? 0));
        }
      }
    },
    [getXScale, getXAxis],
  );

  const handleStartEndHaptics = useCallback(() => {
    void Haptics.lightImpact();
  }, []);

  // Create the long press pan gesture
  const longPressGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(110)
        .shouldCancelWhenOutside(!allowOverflowGestures)
        .onStart(function onStart(event) {
          runOnJS(handleStartEndHaptics)();

          // Android does not trigger onUpdate when the gesture starts. This achieves consistent behavior across both iOS and Android
          if (Platform.OS === 'android') {
            const newScrubberPosition = getDataIndexFromX(event.x);
            if (newScrubberPosition !== scrubberPosition.value) {
              scrubberPosition.value = newScrubberPosition;
              if (onScrubberPositionChange !== undefined)
                runOnJS(onScrubberPositionChange)(newScrubberPosition);
            }
          }
        })
        .onUpdate(function onUpdate(event) {
          const newScrubberPosition = getDataIndexFromX(event.x);
          if (newScrubberPosition !== scrubberPosition.value) {
            scrubberPosition.value = newScrubberPosition;
            if (onScrubberPositionChange !== undefined)
              runOnJS(onScrubberPositionChange)(newScrubberPosition);
          }
        })
        .onEnd(function onEnd() {
          if (enableScrubbing) {
            runOnJS(handleStartEndHaptics)();
            scrubberPosition.value = undefined;
            if (onScrubberPositionChange !== undefined)
              runOnJS(onScrubberPositionChange)(undefined);
          }
        })
        .onTouchesCancelled(function onTouchesCancelled() {
          if (enableScrubbing) {
            scrubberPosition.value = undefined;
            if (onScrubberPositionChange !== undefined)
              runOnJS(onScrubberPositionChange)(undefined);
          }
        }),
    [
      allowOverflowGestures,
      handleStartEndHaptics,
      getDataIndexFromX,
      scrubberPosition,
      onScrubberPositionChange,
      enableScrubbing,
    ],
  );

  const contextValue: ScrubberContextValue = useMemo(
    () => ({
      enableScrubbing: !!enableScrubbing,
      scrubberPosition,
    }),
    [enableScrubbing, scrubberPosition],
  );

  const content = (
    <ScrubberContext.Provider value={contextValue}>{children}</ScrubberContext.Provider>
  );

  // Wrap with gesture handler only if scrubbing is enabled
  if (enableScrubbing) {
    return <GestureDetector gesture={longPressGesture}>{content}</GestureDetector>;
  }

  return content;
};

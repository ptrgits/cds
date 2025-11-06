import React, { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { Haptics } from '@coinbase/cds-mobile/utils/haptics';

import { useCartesianChartContext } from '../ChartProvider';
import {
  type CategoricalScale,
  isCategoricalScale,
  ScrubberContext,
  type ScrubberContextValue,
} from '../utils';

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

  const { getXScale, getXAxis, getDataIndexFromXWorklet } = chartContext;
  const scrubberPosition = useSharedValue<number | undefined>(undefined);

  const xAxis = useMemo(() => getXAxis(), [getXAxis]);
  const xScale = useMemo(() => getXScale(), [getXScale]);
  const isXScaleCategorical = useMemo(
    () => xScale !== undefined && isCategoricalScale(xScale),
    [xScale],
  );

  const xDataArray: number[] | undefined = useMemo(() => {
    if (
      !xAxis ||
      !Array.isArray(xAxis.data) ||
      xAxis.data.length === 0 ||
      typeof xAxis.data[0] !== 'number'
    )
      return undefined;
    return xAxis.data as number[];
  }, [xAxis]);

  const dataIndexScaleValues = useMemo(() => {
    if (!xAxis || !xScale) return;

    const scaleValues: Record<number, number> = {};

    if (xDataArray) {
      xDataArray.forEach((dataValue) => {
        scaleValues[dataValue] = xScale(dataValue) ?? 0;
      });
    } else {
      for (let i = xAxis.domain.min; i <= xAxis.domain.max; i++) {
        scaleValues[i] = xScale(i) ?? 0;
      }
    }

    return scaleValues;
  }, [xAxis, xScale, xDataArray]);

  const categoricalXScaleBandwidth = useMemo(() => {
    if (!xAxis || !xScale) return;
    if (isCategoricalScale(xScale)) {
      return xScale.bandwidth?.() ?? 0;
    }
    return undefined;
  }, [xAxis, xScale]);

  const getDataIndexFromX = useCallback(
    (touchX: number): number | undefined => {
      'worklet';
      return getDataIndexFromXWorklet(touchX);
    },
    [getDataIndexFromXWorklet],
  );

  // Gesture handler callbacks
  const handleOnStartJsThread = useCallback(() => {
    void Haptics.lightImpact();
    // Could add onScrubStart callback here if needed
  }, []);

  // Create the long press pan gesture
  const longPressGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(110)
        .shouldCancelWhenOutside(!allowOverflowGestures)
        .onStart(function onStart(event) {
          runOnJS(handleOnStartJsThread)();

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
      handleOnStartJsThread,
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

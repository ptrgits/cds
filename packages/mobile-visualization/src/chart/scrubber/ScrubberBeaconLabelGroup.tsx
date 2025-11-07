import { forwardRef, memo, useImperativeHandle, useMemo } from 'react';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import type { SharedProps } from '@coinbase/cds-common/types';
import { useTheme } from '@coinbase/cds-mobile';
import { type AnimatedProp, Circle, Group } from '@shopify/react-native-skia';

import { useCartesianChartContext } from '../ChartProvider';
import { applySerializableScale, useScrubberContext } from '../utils';
import { type GradientDefinition } from '../utils/gradient';
import { convertToSerializableScale } from '../utils/scale';
import { buildTransition, defaultTransition, type TransitionConfig } from '../utils/transition';

type ScrubberBeaconLabelSeries = {
  id: string;
  label: string;
  dataX: AnimatedProp<number>;
  dataY: AnimatedProp<number>;
};

export type ScrubberBeaconLabelGroupProps = SharedProps & {
  labels: ScrubberBeaconLabelSeries[];
};

/*
This component needs to
- get updates each time a dataX or dataY changes
- recalculate ordering, first by creating a list of x and y values somehow
- ensure we have a smooth pass to <ScrubberBeaconLabel /> and then dynamically set x and y
*/

export const ScrubberBeaconLabelGroup = memo(({ labels }: ScrubberBeaconLabelGroupProps) => {
  const theme = useTheme();
  const {
    series,
    getXAxis,
    getSeries,
    getXSerializableScale,
    getYSerializableScale,
    getXScale,
    getYScale,
    getSeriesData,
    animate,
  } = useCartesianChartContext();
  const { scrubberPosition } = useScrubberContext();

  const xAxis = useMemo(() => getXAxis(), [getXAxis]);

  const targetSeries = useMemo(() => getSeries(seriesId), [getSeries, seriesId]);
  const sourceData = useMemo(() => getSeriesData(seriesId), [getSeriesData, seriesId]);
  const gradient = useMemo(
    () => gradientProp ?? targetSeries?.gradient,
    [gradientProp, targetSeries?.gradient],
  );
  const xScale = useMemo(() => getXSerializableScale(), [getXSerializableScale]);
  const yScale = useMemo(
    () => getYSerializableScale(targetSeries?.yAxisId),
    [getYSerializableScale, targetSeries?.yAxisId],
  );

  const maxDataLength = useMemo(
    () =>
      series?.reduce((max: any, s: any) => {
        const seriesData = getSeriesData(s.id);
        return Math.max(max, seriesData?.length ?? 0);
      }, 0) ?? 0,
    [series, getSeriesData],
  );

  const dataIndex = useDerivedValue(() => {
    return scrubberPosition.value ?? Math.max(0, maxDataLength - 1);
  }, [scrubberPosition, maxDataLength]);

  const dataX = useDerivedValue(() => {
    if (xAxis?.data && Array.isArray(xAxis.data) && xAxis.data[dataIndex.value] !== undefined) {
      const dataValue = xAxis.data[dataIndex.value];
      return typeof dataValue === 'string' ? dataIndex.value : dataValue;
    }
    return dataIndex.value;
  }, [xAxis, dataIndex]);

  const dataY = useDerivedValue(() => {
    if (xScale && yScale) {
      if (
        sourceData &&
        dataIndex.value !== undefined &&
        dataIndex.value >= 0 &&
        dataIndex.value < sourceData.length
      ) {
        const dataValue = sourceData[dataIndex.value];

        if (typeof dataValue === 'number') {
          return dataValue;
        } else if (Array.isArray(dataValue)) {
          const validValues = dataValue.filter((val): val is number => val !== null);
          if (validValues.length >= 1) {
            return validValues[validValues.length - 1];
          }
        }
      }
    }
  }, [sourceData, scrubberPosition, xScale, yScale]);

  const pulseOpacity = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    pulse: () => {
      if (isIdleState.value && animate) {
        pulseOpacity.value = 0.1;
        pulseOpacity.value = buildTransition(0, pulseTransitionConfig);
      }
    },
  }));

  /*useEffect(() => {
        if (animate && idlePulse) {
          // Use a derived value to control pulse based on scrubber state
          const shouldPulse = scrubberPosition.value === undefined;

          if (shouldPulse) {
            pulseOpacity.value = withRepeat(
              withSequence(
                buildTransition(0.1, pulseTransitionConfig),
                buildTransition(0, pulseTransitionConfig),
              ),
              -1, // loop
              false,
            );
          } else {
            cancelAnimation(pulseOpacity);
            pulseOpacity.value = buildTransition(0, pulseTransitionConfig);
          }
        } else {
          cancelAnimation(pulseOpacity);
          pulseOpacity.value = buildTransition(0, pulseTransitionConfig);
        }
      }, [animate, idlePulse, pulseOpacity, pulseTransitionConfig, scrubberPosition]);*/

  // Update position when data coordinates change
  /*useEffect(() => {
        const currentPixelCoordinate = pixelCoordinate.value;
        if (!currentPixelCoordinate) return;

        const currentIsIdleState = isIdleState.value;

        // When scrubbing or animations disabled: snap immediately
        if (!currentIsIdleState || !animate || !previousIdleState) {
          // Cancel any ongoing animations before snapping
          cancelAnimation(animatedX);
          cancelAnimation(animatedY);
          animatedX.value = currentPixelCoordinate.x;
          animatedY.value = currentPixelCoordinate.y;
        } else {
          animatedX.value = buildTransition(currentPixelCoordinate.x, updateTransitionConfig);
          animatedY.value = buildTransition(currentPixelCoordinate.y, updateTransitionConfig);
        }
      }, [
        pixelCoordinate,
        isIdleState,
        animate,
        previousIdleState,
        animatedX,
        animatedY,
        updateTransitionConfig,
      ]);*/

  // Create derived animated point for circles

  const pointColor = useDerivedValue(() => {
    /*if (gradient && gradientScale) {
          const axis = gradient.axis ?? 'y';
          const dataValue = axis === 'x' ? dataX.value : dataY.value;

          if (dataValue !== undefined) {
            const evaluatedColor = evaluateGradientAtValueWithSerializableScale(
              gradient,
              dataValue,
              gradientScale,
            );
            if (evaluatedColor) {
              return evaluatedColor;
            }
          }
        }*/

    return color ?? targetSeries?.color ?? theme.color.fgPrimary;
  }, [gradient, gradientScale, dataX, dataY, color, targetSeries?.color, theme.color.fgPrimary]);

  const scrubberPoint = useDerivedValue(() => {
    const pixelX =
      dataX.value !== undefined && xScale ? applySerializableScale(dataX.value, xScale) : 25;
    const pixelY =
      dataY.value !== undefined && yScale ? applySerializableScale(dataY.value, yScale) : 25;
    if (pixelX === undefined || pixelY === undefined) return { x: 25, y: 50 };
    return { x: pixelX, y: pixelY };
  }, [dataX, dataY, xScale, yScale]);

  const scrubberStateOpacity = useDerivedValue(() => {
    return isIdleState.value ? 1 : 0;
  }, [isIdleState]);

  const idleStatePoint = useDerivedValue(() => {
    const pixelX =
      dataX.value !== undefined && xScale ? applySerializableScale(dataX.value, xScale) : undefined;
    const pixelY =
      dataY.value !== undefined && yScale ? applySerializableScale(dataY.value, yScale) : undefined;
    if (pixelX === undefined || pixelY === undefined) return { x: 50, y: 25 };
    return { x: pixelX, y: pixelY };
  }, [dataX, dataY, xScale, yScale]);

  const idleStateOpacity = useDerivedValue(() => {
    return isIdleState.value ? 0 : 1;
  }, [isIdleState]);

  return (
    <>
      <Group opacity={scrubberStateOpacity}>
        {/* Glow circle behind */}
        <Circle c={scrubberPoint} color={pointColor} opacity={0.15} r={glowRadius} />
        {/* Outer stroke circle */}
        <Circle c={scrubberPoint} color={theme.color.bg} r={radius + strokeWidth / 2} />
        {/* Inner fill circle */}
        <Circle c={scrubberPoint} color={pointColor} r={radius - strokeWidth / 2} />
      </Group>
      <Group opacity={idleStateOpacity}>
        {/* Glow circle */}
        <Circle c={idleStatePoint} color={pointColor} opacity={0.15} r={glowRadius} />
        {/* Pulse circle */}
        <Circle c={idleStatePoint} color={pointColor} opacity={pulseOpacity} r={pulseRadius} />
        {/* Outer stroke circle */}
        <Circle c={idleStatePoint} color={theme.color.bg} r={radius + strokeWidth / 2} />
        {/* Inner fill circle */}
        <Circle c={idleStatePoint} color={pointColor} r={radius - strokeWidth / 2} />
      </Group>
    </>
  );
});

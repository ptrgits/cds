import { forwardRef, memo, useEffect, useImperativeHandle, useMemo } from 'react';
import {
  cancelAnimation,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import type { SharedProps } from '@coinbase/cds-common/types';
import { useTheme } from '@coinbase/cds-mobile';
import { Circle, Group } from '@shopify/react-native-skia';

import { useCartesianChartContext } from '../ChartProvider';
import { projectPoint, useScrubberContext } from '../utils';
import { evaluateGradientAtValue, type GradientDefinition } from '../utils/gradient';
import { buildTransition, defaultTransition, type TransitionConfig } from '../utils/transition';

const radius = 5;
const glowRadius = 10;
const pulseRadius = 15;
const strokeWidth = 2;

const defaultPulseTransitionConfig: TransitionConfig = {
  type: 'timing',
  duration: 1000,
};

export type ScrubberBeaconRef = {
  /**
   * Triggers a single pulse animation.
   */
  pulse: () => void;
};

export type ScrubberBeaconProps = SharedProps & {
  /**
   * Optional data X coordinate to position the beacon.
   * If not provided, uses the scrubber position from context.
   */
  dataX?: number;
  /**
   * Optional data Y coordinate to position the beacon.
   * If not provided, looks up the Y value from series data at scrubber position.
   */
  dataY?: number;
  /**
   * Filter to only show dot for specific series (used for hover-based positioning).
   */
  seriesId?: string;
  /**
   * Color of the beacon point.
   * If not provided, uses the series color.
   */
  color?: string;
  /**
   * Gradient configuration.
   * When provided, the beacon color is evaluated based on the data value.
   */
  gradient?: GradientDefinition;
  /**
   * Opacity of the beacon.
   * @default 1
   */
  opacity?: number;
  /**
   * Pulse the scrubber beacon while it is at rest.
   */
  idlePulse?: boolean;
  /**
   * Transition configuration for beacon animations.
   * Allows customization of both position update animations and pulse animations.
   *
   * @example
   * // Custom update and pulse animations
   * beaconTransitionConfig={{
   *   update: { type: 'spring', damping: 8, stiffness: 100 },
   *   pulse: { type: 'timing', duration: 1500 }
   * }}
   */
  beaconTransitionConfig?: {
    /**
     * Transition used for beacon position updates when idle.
     * @default defaultTransition
     */
    update?: TransitionConfig;
    /**
     * Transition used for the pulse animation (0->peak->0).
     * This duration represents a single pulse cycle.
     * @default { type: 'timing', duration: 1000 }
     */
    pulse?: TransitionConfig;
  };
};

/**
 * The ScrubberBeacon is a special instance of a Point used to mark the scrubber's position on a specific series.
 */
export const ScrubberBeacon = memo(
  forwardRef<ScrubberBeaconRef, ScrubberBeaconProps>(
    (
      {
        seriesId,
        dataX: dataXProp,
        dataY: dataYProp,
        color,
        gradient: gradientProp,
        testID,
        idlePulse,
        opacity = 1,
        beaconTransitionConfig,
      },
      ref,
    ) => {
      const theme = useTheme();
      const {
        getSeries,
        getXAxis,
        getXScale,
        getYScale,
        getSeriesData,
        animate,
        getSeriesGradientScale,
      } = useCartesianChartContext();
      const { scrubberPosition } = useScrubberContext();

      const targetSeries = getSeries(seriesId);
      const sourceData = getSeriesData(seriesId);
      const gradient = gradientProp ?? targetSeries?.gradient;
      const xScale = getXScale();
      const yScale = getYScale(targetSeries?.yAxisId);
      const gradientScale = seriesId ? getSeriesGradientScale(seriesId) : undefined;

      const isIdleState = scrubberPosition === undefined;

      // Extract update and pulse configs with defaults
      const updateTransitionConfig = useMemo(
        () => beaconTransitionConfig?.update ?? defaultTransition,
        [beaconTransitionConfig?.update],
      );
      const pulseTransitionConfig = useMemo(
        () => beaconTransitionConfig?.pulse ?? defaultPulseTransitionConfig,
        [beaconTransitionConfig?.pulse],
      );

      const dataX = useDerivedValue(() => {
        if (dataXProp !== undefined) return dataXProp;
        const xAxis = getXAxis();
        if (!xAxis || scrubberPosition.value === undefined) return undefined;
        if (
          !Array.isArray(xAxis.data) ||
          xAxis.data.length === 0 ||
          typeof xAxis.data[0] !== 'number'
        )
          return scrubberPosition.value;
        return xAxis.data[scrubberPosition.value] as number;
      }, [scrubberPosition]);

      const dataY = useDerivedValue(() => {
        if (dataYProp !== undefined) return dataYProp;
        if (dataX.value === undefined) return undefined;
        const dataY = sourceData?.[dataX.value];

        if (Array.isArray(dataY)) return dataY[dataY.length - 1];
        return dataY;
      }, [sourceData, scrubberPosition]);

      const pixelCoordinate = useDerivedValue(() => {
        if (
          !xScale ||
          !yScale ||
          dataX === undefined ||
          dataY === undefined ||
          dataX.value === null ||
          dataY.value === null
        )
          return undefined;

        const point = projectPoint({
          x: dataX.value!,
          y: dataY.value!,
          xScale,
          yScale,
        });

        // Return undefined if coordinates are invalid
        if (!point || isNaN(point.x) || isNaN(point.y)) return undefined;

        return point;
      }, [xScale, yScale, dataX, dataY]);

      const pulseOpacity = useSharedValue(0);

      useImperativeHandle(ref, () => ({
        pulse: () => {
          if (isIdleState && animate) {
            pulseOpacity.value = 0.1;
            pulseOpacity.value = buildTransition(0, pulseTransitionConfig);
          }
        },
      }));

      useEffect(() => {
        const shouldPulse = animate && isIdleState && idlePulse;

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
      }, [animate, isIdleState, idlePulse, pulseOpacity, pulseTransitionConfig]);

      // Update position when data coordinates change
      /*useEffect(() => {
        if (!pixelCoordinate) return;

        // When scrubbing or animations disabled: snap immediately
        if (!isIdleState || !animate || !previousIdleState) {
          // Cancel any ongoing animations before snapping
          cancelAnimation(animatedX);
          cancelAnimation(animatedY);
          animatedX.value = pixelCoordinate.x;
          animatedY.value = pixelCoordinate.y;
        } else {
          animatedX.value = buildTransition(pixelCoordinate.x, updateTransitionConfig);
          animatedY.value = buildTransition(pixelCoordinate.y, updateTransitionConfig);
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

      const pointColor = useDerivedValue(() => {
        if (gradient && gradientScale) {
          const axis = gradient.axis ?? 'y';
          const dataValue = axis === 'x' ? dataX : dataY;

          if (dataValue.value !== undefined && dataValue.value !== null) {
            const evaluatedColor = evaluateGradientAtValue(
              gradient,
              dataValue.value,
              gradientScale,
            );
            if (evaluatedColor) {
              return evaluatedColor;
            }
          }
        }

        return color ?? targetSeries?.color ?? theme.color.fgPrimary;
      }, [
        gradient,
        gradientScale,
        dataX,
        dataY,
        color,
        targetSeries?.color,
        theme.color.fgPrimary,
      ]);

      if (!pixelCoordinate) return null;

      if (!isIdleState) {
        return (
          <Group opacity={opacity}>
            {/* Glow circle behind */}
            <Circle c={pixelCoordinate} color={pointColor} opacity={0.15} r={glowRadius} />
            {/* Outer stroke circle */}
            <Circle c={pixelCoordinate} color={theme.color.bg} r={radius + strokeWidth / 2} />
            {/* Inner fill circle */}
            <Circle c={pixelCoordinate} color={pointColor} r={radius - strokeWidth / 2} />
          </Group>
        );
      }

      return (
        <Group opacity={opacity}>
          {/* Glow circle */}
          <Circle c={pixelCoordinate} color={pointColor} opacity={0.15} r={glowRadius} />
          {/* Pulse circle */}
          <Circle c={pixelCoordinate} color={pointColor} opacity={pulseOpacity} r={pulseRadius} />
          {/* Outer stroke circle */}
          <Circle c={pixelCoordinate} color={theme.color.bg} r={radius + strokeWidth / 2} />
          {/* Inner fill circle */}
          <Circle c={pixelCoordinate} color={pointColor} r={radius - strokeWidth / 2} />
        </Group>
      );
    },
  ),
);

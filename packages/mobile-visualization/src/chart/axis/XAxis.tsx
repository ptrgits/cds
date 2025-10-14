import { memo, useCallback, useEffect, useId, useMemo } from 'react';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Circle, G, Line, Rect } from 'react-native-svg';
import { useTheme } from '@coinbase/cds-mobile/hooks/useTheme';

import { useCartesianChartContext } from '../ChartProvider';
import { DottedLine } from '../line/DottedLine';
import { ReferenceLine } from '../line/ReferenceLine';
import { ChartText } from '../text/ChartText';
import { SmartChartTextGroup, type TextLabelData } from '../text/SmartChartTextGroup';
import { getAxisTicksData, isCategoricalScale } from '../utils';

import { type AxisBaseProps, type AxisProps } from './Axis';

const AnimatedG = Animated.createAnimatedComponent(G);

const AXIS_HEIGHT = 32;
const LABEL_SIZE = 20;

export type XAxisBaseProps = AxisBaseProps & {
  /**
   * The position of the axis relative to the chart's drawing area.
   * @default 'bottom'
   */
  position?: 'top' | 'bottom';
  /**
   * Height of the axis. This value is inclusive of the padding.
   * @default 32 when no label is provided, 52 when a label is provided
   */
  height?: number;
};

export type XAxisProps = AxisProps & XAxisBaseProps;

export const XAxis = memo<XAxisProps>(
  ({
    position = 'bottom',
    showGrid,
    requestedTickCount,
    ticks,
    tickLabelFormatter,
    style,
    className,
    styles,
    classNames,
    GridLineComponent = DottedLine,
    tickMarkLabelGap = 2,
    minTickLabelGap = 4,
    showTickMarks,
    showLine,
    tickMarkSize = 4,
    tickInterval = 32,
    tickMinStep = 1,
    tickMaxStep,
    label,
    labelGap = 4,
    height = label ? AXIS_HEIGHT + LABEL_SIZE : AXIS_HEIGHT,
    ...props
  }) => {
    const theme = useTheme();
    const registrationId = useId();
    const { animate, getXScale, getXAxis, registerAxis, unregisterAxis, getAxisBounds } =
      useCartesianChartContext();

    const xScale = getXScale();
    const xAxis = getXAxis();
    const axisBounds = getAxisBounds(registrationId);

    const gridOpacity = useSharedValue(1);

    const axisLineProps = useMemo(
      () => ({
        stroke: theme.color.fg,
        strokeLinecap: 'square' as const,
        strokeWidth: 1,
      }),
      [theme.color.fg],
    );

    const axisTickMarkProps = useMemo(
      () => ({
        stroke: theme.color.fg,
        strokeLinecap: 'square' as const,
        strokeWidth: 1,
      }),
      [theme.color.fg],
    );

    useEffect(() => {
      registerAxis(registrationId, position, height);

      return () => unregisterAxis(registrationId);
    }, [registrationId, registerAxis, unregisterAxis, position, height]);

    const formatTick = useCallback(
      (value: any) => {
        // If we have string labels and no custom formatter, use the labels
        const axisData = xAxis?.data;
        const hasStringLabels =
          axisData && Array.isArray(axisData) && typeof axisData[0] === 'string';

        let finalValue = value;

        // For band scales with string data, value is an index
        if (hasStringLabels && typeof value === 'number' && axisData[value] !== undefined) {
          finalValue = axisData[value];
        }

        // Use the formatter (if provided) or the value itself
        return tickLabelFormatter?.(finalValue) ?? finalValue;
      },
      [xAxis?.data, tickLabelFormatter],
    );

    const ticksData = useMemo(() => {
      if (!xScale) return [];

      // Check if we have string labels
      const axisData = xAxis?.data;
      const hasStringLabels =
        axisData && Array.isArray(axisData) && typeof axisData[0] === 'string';

      // For band scales, we need categories
      let categories: string[] | undefined;
      if (hasStringLabels) {
        categories = axisData as string[];
      } else if (isCategoricalScale(xScale)) {
        // For band scales without explicit string data, generate numeric categories
        // based on the domain of the scale
        const domain = xScale.domain();
        categories = domain.map(String);
      }

      let possibleTickValues: number[] | undefined;

      // If we have discrete data, we can use the indices as possible tick values
      if (
        axisData &&
        Array.isArray(axisData) &&
        (typeof axisData[0] === 'string' ||
          (typeof axisData[0] === 'number' && isCategoricalScale(xScale)))
      ) {
        possibleTickValues = Array.from({ length: axisData.length }, (_, i) => i);
      }

      return getAxisTicksData({
        scaleFunction: xScale,
        ticks,
        requestedTickCount,
        categories,
        possibleTickValues,
        tickInterval: tickInterval,
        options: {
          minStep: tickMinStep,
          maxStep: tickMaxStep,
        },
      });
    }, [ticks, xScale, requestedTickCount, tickInterval, tickMinStep, tickMaxStep, xAxis?.data]);

    const chartTextData: TextLabelData[] | null = useMemo(() => {
      if (!axisBounds) return null;

      return ticksData.map((tick) => {
        const tickOffset = tickMarkLabelGap + (showTickMarks ? tickMarkSize : 0);

        // Use AXIS_HEIGHT for centering, not full axisBounds.height
        // This ensures tick labels are centered in the axis area, not including label space
        const availableSpace = AXIS_HEIGHT - tickOffset;
        const labelOffset = availableSpace / 2;

        // For bottom position: start at axisBounds.y
        // For top position with label: start at axisBounds.y + LABEL_SIZE
        const baseY = position === 'top' && label ? axisBounds.y + LABEL_SIZE : axisBounds.y;

        const labelY =
          position === 'top' ? baseY + labelOffset - tickOffset : baseY + labelOffset + tickOffset;

        return {
          x: tick.position,
          y: labelY,
          label: String(formatTick(tick.tick)),
          chartTextProps: {
            className: classNames?.tickLabel,
            color: theme.color.fgMuted,
            verticalAlignment: 'middle',
            style: styles?.tickLabel,
            horizontalAlignment: 'center',
          },
        };
      });
    }, [
      axisBounds,
      ticksData,
      theme.color.fgMuted,
      tickMarkLabelGap,
      showTickMarks,
      tickMarkSize,
      position,
      formatTick,
      classNames?.tickLabel,
      styles?.tickLabel,
      label,
    ]);

    const gridAnimatedStyle = useAnimatedStyle(() => ({
      opacity: gridOpacity.value,
    }));

    if (!xScale || !axisBounds) return;

    const labelX = axisBounds.x + axisBounds.width / 2;
    const labelY =
      position === 'bottom'
        ? axisBounds.y + axisBounds.height - LABEL_SIZE / 2
        : axisBounds.y + LABEL_SIZE / 2;

    return (
      <G data-axis="x" data-position={position} {...props}>
        {showGrid && (
          <AnimatedG animatedProps={gridAnimatedStyle}>
            {ticksData.map((tick, index) => {
              const verticalLine = (
                <ReferenceLine LineComponent={GridLineComponent} dataX={tick.tick} />
              );

              return <G key={`grid-${tick.tick}-${index}`}>{verticalLine}</G>;
            })}
          </AnimatedG>
        )}
        {chartTextData && (
          <SmartChartTextGroup
            prioritizeEndLabels
            labels={chartTextData}
            minGap={minTickLabelGap}
          />
        )}
        {axisBounds && showTickMarks && (
          <G data-testid="tick-marks">
            {ticksData.map((tick, index) => {
              const tickY = position === 'bottom' ? axisBounds.y : axisBounds.y + axisBounds.height;
              const tickMarkSizePixels = tickMarkSize;
              const tickY2 =
                position === 'bottom'
                  ? axisBounds.y + tickMarkSizePixels
                  : axisBounds.y + axisBounds.height - tickMarkSizePixels;

              return (
                <Line
                  key={`tick-mark-${tick.tick}-${index}`}
                  {...axisTickMarkProps}
                  x1={tick.position}
                  x2={tick.position}
                  y1={tickY}
                  y2={tickY2}
                />
              );
            })}
          </G>
        )}
        {showLine && (
          <Line
            {...axisLineProps}
            x1={axisBounds.x}
            x2={axisBounds.x + axisBounds.width}
            y1={position === 'bottom' ? axisBounds.y : axisBounds.y + axisBounds.height}
            y2={position === 'bottom' ? axisBounds.y : axisBounds.y + axisBounds.height}
          />
        )}
        {label && (
          <ChartText horizontalAlignment="center" verticalAlignment="middle" x={labelX} y={labelY}>
            {label}
          </ChartText>
        )}
      </G>
    );
  },
);

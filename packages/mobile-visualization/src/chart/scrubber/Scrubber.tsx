import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { Animated } from 'react-native';
import Reanimated, {
  runOnJS,
  type SharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { G, Line, Rect, type RectProps } from 'react-native-svg';
import { useRefMap } from '@coinbase/cds-common/hooks/useRefMap';
import type { SharedProps } from '@coinbase/cds-common/types';
import {
  type ChartScaleFunction,
  projectPoint,
  useScrubberContext,
} from '@coinbase/cds-common/visualizations/charts';
import { useTheme } from '@coinbase/cds-mobile';

import { useCartesianChartContext } from '../ChartProvider';
import { ReferenceLine, type ReferenceLineProps } from '../line';
import { ChartText } from '../text/ChartText';

import { ScrubberHead, type ScrubberHeadProps, type ScrubberHeadRef } from './ScrubberHead';

const AnimatedG = Reanimated.createAnimatedComponent(G);
const AnimatedLine = Reanimated.createAnimatedComponent(Line);
const AnimatedRectComponent = Reanimated.createAnimatedComponent(Rect);
const RNAnimatedRect = Animated.createAnimatedComponent(Rect);
const RNAnimatedLine = Animated.createAnimatedComponent(Line);

const AnimatedRect = memo(
  forwardRef<Rect, RectProps>((props, ref) => {
    console.log('[AnimatedRect] Render:', props);
    return <Rect ref={ref} {...props} />;
  }),
);

/**
 * Optimized overlay component that obscures future data.
 * Uses setNativeProps pattern (like Path.tsx) for maximum performance without React re-renders.
 */
const ScrubberOverlay = memo(
  ({
    pixelX,
    drawingArea,
    overlayOffset,
  }: {
    pixelX: number;
    drawingArea: any;
    overlayOffset: number;
  }) => {
    const theme = useTheme();
    const rectRef = useRef<Rect>(null);

    // Shared values for animated updates
    const animatedX = useSharedValue(pixelX);
    const animatedWidth = useSharedValue(
      drawingArea.x + drawingArea.width - pixelX + overlayOffset,
    );

    // Callback to update native props (called from worklet)
    const updateOverlay = useCallback((x: number, width: number) => {
      console.log('[ScrubberOverlay] setNativeProps:', { x, width });
      rectRef.current?.setNativeProps({
        x,
        width,
      });
    }, []);

    // Watch shared values and update via setNativeProps (no React re-render!)
    useAnimatedReaction(
      () => ({ x: animatedX.value, width: animatedWidth.value }),
      (current) => {
        'worklet';
        runOnJS(updateOverlay)(current.x, current.width);
      },
      [updateOverlay],
    );

    // Update shared values when pixelX changes
    useEffect(() => {
      console.log('[ScrubberOverlay] Effect - updating shared values:', { pixelX });
      animatedX.value = pixelX;
      animatedWidth.value = drawingArea.x + drawingArea.width - pixelX + overlayOffset;
    }, [pixelX, drawingArea.x, drawingArea.width, overlayOffset, animatedX, animatedWidth]);

    console.log('[ScrubberOverlay] Render (should be rare):', { pixelX });

    return (
      <AnimatedRect
        ref={rectRef}
        fill={theme.color.bg}
        height={drawingArea.height + overlayOffset * 2}
        opacity={0.8}
        width={0}
        x={0}
        y={drawingArea.y - overlayOffset}
      />
    );
  },
);

type FadeInGroupProps = {
  children: React.ReactNode;
};

const FadeInGroup = memo(
  forwardRef<React.ComponentRef<typeof G>, FadeInGroupProps>(({ children }, ref) => {
    const { animate } = useCartesianChartContext();

    const opacity = useSharedValue(0);

    const animatedProps = useAnimatedProps(() => ({
      opacity: opacity.value,
    }));

    useEffect(() => {
      if (animate) {
        opacity.value = withDelay(
          850,
          withTiming(1, {
            duration: 150,
          }),
        );
      } else {
        opacity.value = 1;
      }
    }, [animate, opacity]);

    return (
      <AnimatedG ref={ref} animatedProps={animatedProps}>
        {children}
      </AnimatedG>
    );
  }),
);

// charts screen goes to about 15 when loading in, ~35 when not animating in

/**
 * Configuration for scrubber functionality across chart components.
 * Provides consistent API with smart defaults and component customization.
 */
export type ScrubberProps = SharedProps &
  Pick<ScrubberHeadProps, 'idlePulse'> & {
    /**
     * An array of series IDs that will receive visual emphasis as the user scrubs through the chart.
     * Use this prop to restrict the scrubbing visual behavior to specific series.
     * By default, all series will be highlighted by the Scrubber.
     */
    seriesIds?: string[];

    /**
     * Hides the scrubber line
     */
    hideLine?: boolean;

    /**
     * Whether to hide the overlay rect which obscures future data.
     */
    hideOverlay?: boolean;

    /**
     * Offset of the overlay rect relative to the drawing area.
     * Useful for when scrubbing over lines, where the stroke width would cause part of the line to be visible.
     * @default 2
     */
    overlayOffset?: number;

    /**
     * Label text displayed above the scrubber line.
     */
    label?: ReferenceLineProps['label'] | ((dataIndex: number) => ReferenceLineProps['label']);

    /**
     * Props passed to the scrubber line's label.
     */
    scrubberLabelProps?: ReferenceLineProps['labelConfig'];

    /**
     * Stroke color for the scrubber line.
     */
    lineStroke?: ReferenceLineProps['stroke'];

    /**
     * Custom component for the scrubber head.
     */
    HeadComponent?: React.ComponentType<ScrubberHeadProps>;

    /**
     * Custom component for the scrubber line.
     */
    LineComponent?: React.ComponentType<ReferenceLineProps>;
  };

export type ScrubberRef = ScrubberHeadRef;

/**
 * Unified component that manages scrubber elements (heads, line) with smooth animations.
 */
export const Scrubber = memo(
  forwardRef<ScrubberRef, ScrubberProps>(
    (
      {
        seriesIds,
        hideLine,
        label,
        lineStroke,
        scrubberLabelProps,
        HeadComponent = ScrubberHead,
        LineComponent = ReferenceLine,
        hideOverlay,
        overlayOffset = 2,
        testID,
        idlePulse,
      },
      ref,
    ) => {
      const theme = useTheme();
      const scrubberHeadRefs = useRefMap<ScrubberHeadRef>();

      const { scrubberPosition: scrubberPosition } = useScrubberContext();
      const { getXScale, getYScale, getSeriesData, getXAxis, series, drawingArea } =
        useCartesianChartContext();
      const getStackedSeriesData = getSeriesData; // getSeriesData now returns stacked data

      // Expose imperative handle with pulse method
      useImperativeHandle(ref, () => ({
        pulse: () => {
          // Pulse all registered scrubber heads
          Object.values(scrubberHeadRefs.refs).forEach((headRef) => {
            headRef?.pulse();
          });
        },
      }));

      // React Native Animated values for overlay
      const overlayAnimatedX = useRef(new Animated.Value(0)).current;
      const overlayAnimatedWidth = useRef(new Animated.Value(0)).current;

      const { dataX, dataIndex } = useMemo(() => {
        const xScale = getXScale() as ChartScaleFunction;
        const xAxis = getXAxis();
        if (!xScale) return { dataX: undefined, dataIndex: undefined };

        // todo: can we store this in axis config?
        const maxDataLength =
          series?.reduce((max: any, s: any) => {
            const seriesData = getStackedSeriesData(s.id) || getSeriesData(s.id);
            return Math.max(max, seriesData?.length ?? 0);
          }, 0) ?? 0;

        const dataIndex = scrubberPosition ?? Math.max(0, maxDataLength - 1);

        // Convert index to actual x value if axis has data
        let dataX: number;
        if (xAxis?.data && Array.isArray(xAxis.data) && xAxis.data[dataIndex] !== undefined) {
          const dataValue = xAxis.data[dataIndex];
          dataX = typeof dataValue === 'string' ? dataIndex : dataValue;
        } else {
          dataX = dataIndex;
        }

        return { dataX, dataIndex };
      }, [getXScale, getXAxis, series, scrubberPosition, getStackedSeriesData, getSeriesData]);

      const headPositions = useMemo(() => {
        const xScale = getXScale() as ChartScaleFunction;

        if (!xScale || dataX === undefined || dataIndex === undefined) return [];

        const positions =
          series
            ?.filter((s) => {
              if (seriesIds === undefined) return true;
              return seriesIds.includes(s.id);
            })
            ?.map((s) => {
              const sourceData = getStackedSeriesData(s.id) || getSeriesData(s.id);
              // Use dataIndex to get the y value from the series data array
              const stuff = sourceData?.[dataIndex];
              let dataY: number | undefined;
              if (Array.isArray(stuff)) {
                dataY = stuff[stuff.length - 1];
              } else if (typeof stuff === 'number') {
                dataY = stuff;
              }

              if (dataY !== undefined) {
                const yScale = getYScale(s.yAxisId) as ChartScaleFunction;
                const pixelPosition = projectPoint({
                  x: dataX,
                  y: dataY,
                  xScale,
                  yScale,
                });

                const resolvedLabel = typeof s.label === 'function' ? s.label(dataIndex) : s.label;

                return {
                  x: dataX,
                  y: dataY,
                  label: resolvedLabel,
                  pixelX: pixelPosition.x,
                  pixelY: pixelPosition.y,
                  targetSeries: s,
                };
              }
            })
            .filter((head: any) => head !== undefined) ?? [];

        console.log('[Scrubber] headPositions calculated:', {
          dataIndex,
          dataX,
          count: positions.length,
          positions: positions.map((p) => ({
            seriesId: p?.targetSeries.id,
            dataX: p?.x,
            dataY: p?.y,
            pixelX: p?.pixelX,
            pixelY: p?.pixelY,
          })),
        });

        return positions;
      }, [
        getXScale,
        dataX,
        dataIndex,
        series,
        seriesIds,
        getStackedSeriesData,
        getSeriesData,
        getYScale,
      ]);

      // Callback to create ref handlers for scrubber heads
      const createScrubberHeadRef = useCallback(
        (seriesId: string) => {
          return (headRef: ScrubberHeadRef | null) => {
            if (headRef) {
              scrubberHeadRefs.registerRef(seriesId, headRef);
            }
          };
        },
        [scrubberHeadRefs],
      );

      // Check if we have at least the default scales
      const defaultXScale = getXScale();
      const defaultYScale = getYScale();

      const pixelX = dataX !== undefined && defaultXScale ? defaultXScale(dataX) : undefined;

      // Memoize overlay calculations and update Animated values
      useMemo(() => {
        const rightEdge = drawingArea.x + drawingArea.width + overlayOffset;
        if (pixelX === undefined) {
          overlayAnimatedX.setValue(rightEdge);
          overlayAnimatedWidth.setValue(0);
        } else {
          const newWidth = Math.max(0, rightEdge - pixelX);
          overlayAnimatedX.setValue(pixelX);
          overlayAnimatedWidth.setValue(newWidth);
        }
      }, [
        pixelX,
        drawingArea.x,
        drawingArea.width,
        overlayOffset,
        overlayAnimatedX,
        overlayAnimatedWidth,
      ]);

      const scrubberLabel: ReferenceLineProps['label'] = useMemo(() => {
        if (typeof label === 'function') {
          if (dataIndex === undefined) return undefined;
          return label(dataIndex);
        }
        return label;
      }, [label, dataIndex]);

      console.log('[Scrubber] Main render:', {
        scrubberPosition,
        dataIndex,
        dataX,
        pixelX,
        headPositionsCount: headPositions.length,
        hideOverlay,
        hideLine,
      });

      if (!defaultXScale || !defaultYScale) return null;

      // Wrap content in AnimatedG only if animation is enabled
      const content = (
        <>
          {!hideOverlay &&
            dataX !== undefined &&
            scrubberPosition !== undefined &&
            pixelX !== undefined && (
              <G>
                {/* Vertical line */}
                <RNAnimatedLine
                  stroke={theme.color.fgMuted}
                  strokeWidth={1}
                  x1={overlayAnimatedX}
                  x2={overlayAnimatedX}
                  y1={drawingArea.y - overlayOffset}
                  y2={drawingArea.y + drawingArea.height + overlayOffset}
                />
                {/* Overlay rect that obscures future data */}
                <RNAnimatedRect
                  fill={theme.color.bg}
                  height={drawingArea.height + overlayOffset * 2}
                  opacity={0.8}
                  width={overlayAnimatedWidth}
                  x={overlayAnimatedX}
                  y={drawingArea.y - overlayOffset}
                />
              </G>
            )}
          {!hideLine &&
            scrubberPosition !== undefined &&
            dataX !== undefined &&
            scrubberLabel &&
            pixelX !== undefined && (
              <ChartText
                textAnchor="middle"
                x={pixelX}
                y={drawingArea.y - overlayOffset - 4}
                {...scrubberLabelProps}
              >
                {scrubberLabel}
              </ChartText>
            )}
          {headPositions.map((scrubberHead: any) => {
            if (!scrubberHead) return null;
            return (
              <HeadComponent
                key={scrubberHead.targetSeries.id}
                ref={createScrubberHeadRef(scrubberHead.targetSeries.id)}
                color={scrubberHead.targetSeries?.color}
                dataX={scrubberHead.x}
                dataY={scrubberHead.y}
                idlePulse={idlePulse}
                // OPTIMIZATION: Pass pre-calculated pixel coordinates
                pixelX={scrubberHead.pixelX}
                pixelY={scrubberHead.pixelY}
                seriesId={scrubberHead.targetSeries.id}
                testID={testID ? `${testID}-${scrubberHead.targetSeries.id}-dot` : undefined}
              />
            );
          })}
        </>
      );
      return <FadeInGroup>{content}</FadeInGroup>;
    },
  ),
);

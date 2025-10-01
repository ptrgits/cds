import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import Reanimated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { G, Line, Rect } from 'react-native-svg';
import { useRefMap } from '@coinbase/cds-common/hooks/useRefMap';
import type { SharedProps } from '@coinbase/cds-common/types';
import {
  type ChartScaleFunction,
  projectPoint,
  useScrubberContext,
} from '@coinbase/cds-common/visualizations/charts';
import { useTheme } from '@coinbase/cds-mobile';

import { useCartesianChartContext } from '../ChartProvider';
import { type ReferenceLineProps } from '../line';
import { ChartText } from '../text/ChartText';

import { ScrubberBeacon, type ScrubberBeaconProps, type ScrubberBeaconRef } from './ScrubberBeacon';

const AnimatedG = Reanimated.createAnimatedComponent(G);
const RNAnimatedRect = Reanimated.createAnimatedComponent(Rect);
const RNAnimatedLine = Reanimated.createAnimatedComponent(Line);

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
        opacity.value = withTiming(1, {
          duration: 300,
        });
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

/**
 * Configuration for scrubber functionality across chart components.
 * Provides consistent API with smart defaults and component customization.
 */
export type ScrubberProps = SharedProps &
  Pick<ScrubberBeaconProps, 'idlePulse'> & {
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
    labelProps?: Partial<ReferenceLineProps['labelProps']>;

    /**
     * Stroke color for the scrubber line.
     */
    lineStroke?: ReferenceLineProps['stroke'];
  };

export type ScrubberRef = ScrubberBeaconRef;

/**
 * Unified component that manages scrubber elements (beacons, line) with smooth animations.
 */
export const Scrubber = memo(
  forwardRef<ScrubberRef, ScrubberProps>(
    (
      {
        seriesIds,
        hideLine,
        label,
        lineStroke,
        labelProps,
        hideOverlay,
        overlayOffset = 2,
        testID,
        idlePulse,
      },
      ref,
    ) => {
      const theme = useTheme();
      const scrubberBeaconRefs = useRefMap<ScrubberBeaconRef>();

      const { scrubberPosition: scrubberPosition } = useScrubberContext();
      const { getXScale, getYScale, getSeriesData, getXAxis, series, drawingArea } =
        useCartesianChartContext();
      const getStackedSeriesData = getSeriesData; // getSeriesData now returns stacked data

      // Expose imperative handle with pulse method
      useImperativeHandle(ref, () => ({
        pulse: () => {
          // Pulse all registered scrubber beacons
          Object.values(scrubberBeaconRefs.refs).forEach((beaconRef) => {
            beaconRef?.pulse();
          });
        },
      }));

      // Reanimated shared values for overlay
      const overlayAnimatedX = useSharedValue(0);
      const overlayAnimatedWidth = useSharedValue(0);

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

      const beaconPositions = useMemo(() => {
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
            .filter((beacon: any) => beacon !== undefined) ?? [];

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

      // Callback to create ref handlers for scrubber beacons
      const createScrubberBeaconRef = useCallback(
        (seriesId: string) => {
          return (beaconRef: ScrubberBeaconRef | null) => {
            if (beaconRef) {
              scrubberBeaconRefs.registerRef(seriesId, beaconRef);
            }
          };
        },
        [scrubberBeaconRefs],
      );

      // Check if we have at least the default scales
      const defaultXScale = getXScale();
      const defaultYScale = getYScale();

      const pixelX = dataX !== undefined && defaultXScale ? defaultXScale(dataX) : undefined;

      // Update shared values for overlay
      useEffect(() => {
        const rightEdge = drawingArea.x + drawingArea.width + overlayOffset;
        if (pixelX === undefined) {
          overlayAnimatedX.value = rightEdge;
          overlayAnimatedWidth.value = 0;
        } else {
          const newWidth = Math.max(0, rightEdge - pixelX);
          overlayAnimatedX.value = pixelX;
          overlayAnimatedWidth.value = newWidth;
        }
      }, [
        pixelX,
        drawingArea.x,
        drawingArea.width,
        overlayOffset,
        overlayAnimatedX,
        overlayAnimatedWidth,
      ]);

      // Animated props for overlay rect
      const overlayRectAnimatedProps = useAnimatedProps(() => ({
        x: overlayAnimatedX.value,
        width: overlayAnimatedWidth.value,
      }));

      // Animated props for overlay line
      const overlayLineAnimatedProps = useAnimatedProps(() => ({
        x1: overlayAnimatedX.value,
        x2: overlayAnimatedX.value,
      }));

      const scrubberLabel: ReferenceLineProps['label'] = useMemo(() => {
        if (typeof label === 'function') {
          if (dataIndex === undefined) return undefined;
          return label(dataIndex);
        }
        return label;
      }, [label, dataIndex]);

      if (!defaultXScale || !defaultYScale) return null;

      const content = (
        <>
          {!hideOverlay &&
            dataX !== undefined &&
            scrubberPosition !== undefined &&
            pixelX !== undefined && (
              <G>
                {/* Overlay rect that obscures future data */}
                <RNAnimatedRect
                  animatedProps={overlayRectAnimatedProps}
                  fill={theme.color.bg}
                  height={drawingArea.height + overlayOffset * 2}
                  opacity={0.8}
                  y={drawingArea.y - overlayOffset}
                />
                {/* Vertical line */}
                <RNAnimatedLine
                  animatedProps={overlayLineAnimatedProps}
                  stroke={lineStroke ?? theme.color.fgMuted}
                  strokeDasharray="0 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  y1={drawingArea.y - overlayOffset}
                  y2={drawingArea.y + drawingArea.height + overlayOffset}
                />
              </G>
            )}
          {!hideLine &&
            scrubberPosition !== undefined &&
            dataX !== undefined &&
            scrubberLabel &&
            pixelX !== undefined && (
              <ChartText
                verticalAlignment="middle"
                x={pixelX}
                y={drawingArea.y / 2}
                {...labelProps}
              >
                {scrubberLabel}
              </ChartText>
            )}
          {beaconPositions.map((scrubberBeacon: any) => {
            if (!scrubberBeacon) return null;
            return (
              <ScrubberBeacon
                key={scrubberBeacon.targetSeries.id}
                ref={createScrubberBeaconRef(scrubberBeacon.targetSeries.id)}
                color={scrubberBeacon.targetSeries?.color}
                dataX={scrubberBeacon.x}
                dataY={scrubberBeacon.y}
                idlePulse={idlePulse}
                pixelX={scrubberBeacon.pixelX}
                pixelY={scrubberBeacon.pixelY}
                seriesId={scrubberBeacon.targetSeries.id}
                testID={testID ? `${testID}-${scrubberBeacon.targetSeries.id}-dot` : undefined}
              />
            );
          })}
        </>
      );
      return <FadeInGroup>{content}</FadeInGroup>;
    },
  ),
);

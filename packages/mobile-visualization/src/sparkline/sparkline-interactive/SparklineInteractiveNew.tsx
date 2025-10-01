import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { G } from 'react-native-svg';
import type { ThemeVars } from '@coinbase/cds-common/core/theme';
import { chartCompactHeight, chartHeight } from '@coinbase/cds-common/tokens/sparkline';
import type { Placement } from '@coinbase/cds-common/types';
import type {
  ChartData,
  ChartFormatAmount,
  ChartFormatDate,
  ChartScrubParams,
} from '@coinbase/cds-common/types/Chart';
import { getAccessibleColor } from '@coinbase/cds-common/utils/getAccessibleColor';
import { chartFallbackNegative, chartFallbackPositive } from '@coinbase/cds-lottie-files';
import { Lottie } from '@coinbase/cds-mobile/animation';
import { useScreenReaderStatus } from '@coinbase/cds-mobile/hooks/useScreenReaderStatus';
import { useTheme } from '@coinbase/cds-mobile/hooks/useTheme';
import { Box, VStack } from '@coinbase/cds-mobile/layout';
import { emptyArray, noop } from '@coinbase/cds-utils';
import isObject from 'lodash/isObject';

import { Point } from '../../chart';
import { XAxis } from '../../chart/axis';
import { LineChart, type LineSeries } from '../../chart/line';
import { Scrubber } from '../../chart/scrubber';

import { type SparklineInteractiveHoverDateRefProps } from './SparklineInteractiveHoverDate';
import { SparklineInteractivePeriodSelector } from './SparklineInteractivePeriodSelector';

const axisHeight = 70;

export * from '@coinbase/cds-common/types/Chart';

export type SparklineInteractiveBaseProps<Period extends string> = {
  /**
   * Chart data bucketed by Period. Period is a string keyC
   */
  data?: Record<Period, ChartData>;
  /**
   * A list of periods that the chart will use. label is what is shown in the bottom of the chart and the value is the key.
   */
  periods: { label: string; value: Period }[];
  /**
   * default period value that the chart will use
   */
  defaultPeriod: Period;
  /**
   * Callback when the user selects a new period.
   */
  onPeriodChanged?: (period: Period) => void;
  /**
   * Callback when the user starts scrubbing
   */
  onScrubStart?: () => void;
  /**
   * Callback when a user finishes scrubbing
   */
  onScrubEnd?: () => void;
  /**
   * Callback used when the user is scrubbing. This will be called for every data point change.
   */
  onScrub?: (params: ChartScrubParams<Period>) => void;
  /**
   * Disables the scrub user interaction from the chart
   */
  disableScrubbing?: boolean;
  /**
   * function used to format the date that is shown in the bottom of the chart as the user scrubs
   */
  formatDate: ChartFormatDate<Period>;
  /**
   * Color of the line*
   */
  strokeColor: string;
  /**
   * Fallback shown in the chart when data is not available. This is usually a loading state.
   */
  fallback?: React.ReactNode;
  /**
   * If you use the default fallback then this specifies if the fallback line is decreasing or increasing
   */
  fallbackType?: 'positive' | 'negative';
  /**
   * Show the chart in compact height
   */
  compact?: boolean;
  /**
   * Hides the period selector at the bottom of the chart
   */
  hidePeriodSelector?: boolean;
  /**
   * Adds an area fill to the Sparkline
   *
   * @default true
   */
  fill?: boolean;
  /**
   Formats the date above the chart as you scrub. Omit this if you don't want to show the date as the user scrubs
   */
  formatHoverDate?: (date: Date, period: Period) => string;
  /**
   Formats the price above the chart as you scrub. Omit this if you don't want to show the price as the user scrubs
   */
  formatHoverPrice?: (price: number) => string;
  /**
   * Adds a header node above the chart. It will be placed next to the period selector on web.
   */
  headerNode?: React.ReactNode;
  /**
   * Optional gutter to add to the Period selector. This is useful if you choose to use the full screen width for the chart
   */
  timePeriodGutter?: ThemeVars.Space;
  /**
   * Optional placement prop that position the period selector component above or below the chart
   */
  periodSelectorPlacement?: Extract<Placement, 'above' | 'below'>;
  /** Scales the sparkline to show more or less variance. Use a number less than 1 for less variance and a number greater than 1 for more variance. If you use a number greater than 1 it may clip the boundaries of the sparkline. */
  yAxisScalingFactor?: number;
  /**
   * The type of area fill to add to the Sparkline
   * @default 'gradient'
   */
  fillType?: 'gradient' | 'solid' | 'dotted';
  /**
   * The type of line to render.
   * @default 'solid'
   */
  lineType?: 'solid' | 'dotted' | 'gradient';
  children?: React.ReactNode;
};

export type SparklineInteractiveProps<Period extends string> =
  SparklineInteractiveBaseProps<Period> & {
    /**
     * Hides the min and max label
     */
    hideMinMaxLabel?: boolean;
    /**
     * function used to format the amount of money used in the minMaxLabel
     */
    formatMinMaxLabel?: ChartFormatAmount;
    /**
     * The amount of padding to apply to the left and right of the chart. The chart width is calculated by (screen width - 2* gutter).
     *
     * @default 3
     */
    gutter?: ThemeVars.Space;
    /**
     * The chart applies horizontal padding by default which is specified by the gutter.
     * If the chart is placed in a container with padding then you can disable horizontal padding and set the gutter
     * to match the container padding.
     *
     */
    disableHorizontalPadding?: boolean;
    /**
     * Allows continuous gestures on the Sparkline chart to continue outside the bounds of the chart element.
     */
    allowOverflowGestures?: boolean;
    /**
     * Custom style for the root element.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Custom styles for the component.
     */
    styles?: {
      /**
       * Custom style for the header node.
       */
      header?: StyleProp<ViewStyle>;
      /**
       * Custom style for the root element.
       */
      root?: StyleProp<ViewStyle>;
    };
    /** Test ID for the header */
    headerTestID?: string;
  };

export type SparklineInteractiveDefaultFallback = Pick<
  SparklineInteractiveBaseProps<string>,
  'fallbackType' | 'compact'
>;

const DefaultFallback = memo(({ fallbackType }: SparklineInteractiveDefaultFallback) => {
  const source = fallbackType === 'negative' ? chartFallbackNegative : chartFallbackPositive;
  return (
    <Box alignItems="center" justifyContent="center">
      <Lottie autoplay loop height="100%" source={source} />
    </Box>
  );
});

function defaultFormatMinMaxLabel(value: string | number) {
  return `${value}`;
}

const componentStyles = StyleSheet.create({
  periodSelectorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

const SparklineInteractiveComponent = <Period extends string>({
  data,
  periods,
  defaultPeriod,
  onPeriodChanged,
  strokeColor,
  onScrub = noop,
  onScrubStart = noop,
  onScrubEnd = noop,
  formatMinMaxLabel = defaultFormatMinMaxLabel,
  formatDate,
  fallback = null,
  hideMinMaxLabel = false,
  hidePeriodSelector = false,
  disableScrubbing = false,
  fill = true,
  yAxisScalingFactor = 1.0,
  formatHoverDate,
  headerNode,
  fallbackType = 'positive',
  disableHorizontalPadding = false,
  fillType,
  lineType,
  timePeriodGutter,
  allowOverflowGestures,
  style,
  styles,
  headerTestID,
  children,
  compact,
  gutter = 3,
}: SparklineInteractiveProps<Period>) => {
  const renderCount = useRef(-1);
  renderCount.current++;
  const height = (compact ? chartCompactHeight : chartHeight) + axisHeight;
  const color = strokeColor;
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const periodSelectorOpacity = useRef(new Animated.Value(1)).current;
  const chartHoverTextInputRef = useRef<SparklineInteractiveHoverDateRefProps<Period> | null>(null);
  const theme = useTheme();
  const isScreenReaderEnabled = useScreenReaderStatus();

  // Animate period selector opacity based on scrubbing state

  useEffect(() => {
    Animated.timing(periodSelectorOpacity, {
      toValue: !hidePeriodSelector && !isScrubbing ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [periodSelectorOpacity, hidePeriodSelector, isScrubbing]);

  const sparklineColor = useMemo(() => {
    return color !== 'auto'
      ? color
      : getAccessibleColor({
          background: theme.color.bg,
          foreground: 'auto',
          usage: 'graphic',
        });
  }, [color, theme.color.bg]);

  const dataForPeriod = useMemo(() => {
    if (!data) {
      return emptyArray;
    }
    return data[selectedPeriod] ?? emptyArray;
  }, [data, selectedPeriod]);

  const formatHoverDateForPeriod = useCallback(
    (dataIndex: number) => {
      if (dataIndex !== undefined && !dataForPeriod[dataIndex]) return '';
      const { date } = dataForPeriod[dataIndex];
      return formatHoverDate?.(date, selectedPeriod);
    },
    [dataForPeriod, formatHoverDate, selectedPeriod],
  );

  // If dataForPeriod is empty we know that we are either loading
  // or backend returned bad data and we should show fallback UI.
  const hasData = dataForPeriod.length > 0;

  // Find min and max points with their indices in a single pass
  const { minPoint, maxPoint } = useMemo(() => {
    if (!hasData || dataForPeriod.length === 0) {
      return { minPoint: null, maxPoint: null };
    }

    let minPt = { ...dataForPeriod[0], index: 0 };
    let maxPt = { ...dataForPeriod[0], index: 0 };

    dataForPeriod.forEach((point, index) => {
      if (point.value < minPt.value) {
        minPt = { ...point, index };
      }
      if (point.value > maxPt.value) {
        maxPt = { ...point, index };
      }
    });

    return { minPoint: minPt, maxPoint: maxPt };
  }, [dataForPeriod, hasData]);

  const handlePeriodChange = useCallback(
    (tab: { id: string } | null) => {
      if (tab && tab.id) {
        const period = tab.id as Period;

        if (isObject(data) && period !== selectedPeriod) {
          setSelectedPeriod(period);
          onPeriodChanged?.(period);
        }
      }
    },
    [data, selectedPeriod, onPeriodChanged],
  );

  const { tabs, activeTab } = useMemo(() => {
    const tabsArray = periods.map((period) => ({
      id: period.value,
      label: period.label,
    }));

    return {
      tabs: tabsArray,
      activeTab: tabsArray.find((tab) => tab.id === selectedPeriod) || null,
    };
  }, [periods, selectedPeriod]);

  const handleScrub = useCallback(
    (params: ChartScrubParams<Period>) => {
      chartHoverTextInputRef.current?.update(params);
      onScrub?.(params);
    },
    [onScrub],
  );

  const handleScrubStart = useCallback(() => {
    setIsScrubbing(true);
    onScrubStart?.();
  }, [onScrubStart]);

  const handleScrubEnd = useCallback(() => {
    setIsScrubbing(false);
    onScrubEnd?.();
  }, [onScrubEnd]);

  let header;
  if (headerNode) {
    header = (
      <Box paddingBottom={2} style={styles?.header} testID={headerTestID}>
        {headerNode}
      </Box>
    );
  }

  const chartHorizontalGutter = useMemo(() => theme.space[gutter], [theme.space, gutter]);

  // Calculate the period selector gutter - use timePeriodGutter if provided, otherwise use chart gutter
  const periodSelectorGutter = useMemo(
    () => (timePeriodGutter !== undefined ? theme.space[timePeriodGutter] : chartHorizontalGutter),
    [timePeriodGutter, theme.space, chartHorizontalGutter],
  );

  const rootStyles = useMemo(() => {
    return [
      !disableHorizontalPadding && { paddingHorizontal: chartHorizontalGutter },
      style,
      styles?.root,
    ];
  }, [style, styles?.root, chartHorizontalGutter, disableHorizontalPadding]);

  // Extract values and dates once to avoid repeated mapping
  const { values, dates } = useMemo(() => {
    return {
      values: dataForPeriod.map((d) => d.value),
      dates: dataForPeriod.map((d) => d.date),
    };
  }, [dataForPeriod]);

  const formatAxisDate = useCallback(
    (index: number) => {
      if (!dates[index]) return '';
      return formatDate(dates[index], selectedPeriod);
    },
    [dates, formatDate, selectedPeriod],
  );

  // Calculate y-axis bounds based on scaling factor
  // A scaling factor < 1 reduces variance (zooms out), > 1 increases variance (zooms in)
  const yAxisBounds = useMemo(() => {
    if (!values.length || yAxisScalingFactor === undefined) return undefined;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const center = (min + max) / 2;

    // Apply scaling factor: < 1 expands range (less variance), > 1 shrinks range (more variance)
    const scaledRange = range / yAxisScalingFactor;

    return {
      min: center - scaledRange / 2,
      max: center + scaledRange / 2,
    };
  }, [values, yAxisScalingFactor]);

  const series = useMemo((): LineSeries[] => {
    // If we have custom y-axis bounds (from scaling), pass tuple data
    // so the area extends to the scaled minimum, not just the data minimum
    const seriesData = yAxisBounds
      ? values.map((v) => [yAxisBounds.min, v] as [number, number])
      : values;

    return [
      {
        id: 'main',
        data: seriesData,
        color: sparklineColor,
        areaBaseline: yAxisBounds?.min,
      },
    ];
  }, [values, sparklineColor, yAxisBounds]);

  const formatPriceAtIndex = useCallback(
    (index: number) => {
      if (!dataForPeriod[index]) return '';
      return formatMinMaxLabel(dataForPeriod[index].value);
    },
    [dataForPeriod, formatMinMaxLabel],
  );

  const onScrubberPositionChange = useCallback(
    (position: number | undefined) => {
      if (position !== undefined) {
        if (!isScrubbing) {
          handleScrubStart();
        }
      } else if (isScrubbing) {
        handleScrubEnd();
      }
    },
    [isScrubbing, handleScrubStart, handleScrubEnd],
  );

  return (
    <Box style={rootStyles}>
      {header}
      <VStack position="relative">
        <LineChart
          allowOverflowGestures={allowOverflowGestures}
          areaType={fillType}
          enableScrubbing={!disableScrubbing}
          height={height}
          inset={{
            left: 2,
            right: 2,
            top: !hideMinMaxLabel ? 38 : 18,
            bottom: 0,
          }}
          onScrubberPositionChange={onScrubberPositionChange}
          series={series}
          showArea={fill}
          type={lineType}
          xAxis={{
            domainLimit: 'strict',
          }}
          yAxis={{
            domain: yAxisBounds,
            domainLimit: 'strict',
            range: !hideMinMaxLabel ? ({ min, max }) => ({ min, max: max - 20 }) : undefined,
          }}
        >
          <G opacity={hidePeriodSelector || !isScrubbing ? 1 : 0}>
            {!hideMinMaxLabel && maxPoint && (
              <Point
                dataX={maxPoint.index}
                dataY={maxPoint.value}
                label={formatPriceAtIndex(maxPoint.index)}
                labelConfig={{ position: 'top', dy: -12 }}
                opacity={isScrubbing ? 0 : 1}
                radius={0}
              />
            )}
            {!hideMinMaxLabel && minPoint && (
              <Point
                dataX={minPoint.index}
                dataY={minPoint.value}
                label={formatPriceAtIndex(minPoint.index)}
                labelConfig={{ position: 'bottom', dy: 12 }}
                opacity={isScrubbing ? 0 : 1}
                radius={0}
              />
            )}
          </G>
          {!hidePeriodSelector && (
            <G opacity={isScrubbing ? 1 : 0}>
              <XAxis height={axisHeight} tickLabelFormatter={formatAxisDate} tickMarkSize={16} />
            </G>
          )}
          {children}
          <Scrubber
            label={formatHoverDateForPeriod}
            labelProps={{ dy: -9, alignmentBaseline: 'middle' }}
            lineStroke={sparklineColor}
            seriesIds={[]}
          />
        </LineChart>
        {!hasData && (
          <Box
            alignItems="center"
            height="100%"
            justifyContent="center"
            position="absolute"
            top={0}
            width="100%"
          >
            {fallback ?? <DefaultFallback fallbackType={fallbackType} />}
          </Box>
        )}
        {!hidePeriodSelector && (
          <Animated.View
            pointerEvents={isScrubbing ? 'none' : 'auto'}
            style={[
              componentStyles.periodSelectorContainer,
              !disableHorizontalPadding && { paddingHorizontal: periodSelectorGutter },
              { opacity: periodSelectorOpacity },
            ]}
          >
            <SparklineInteractivePeriodSelector
              activeTab={activeTab}
              color={color}
              onChange={handlePeriodChange}
              tabs={tabs}
            />
          </Animated.View>
        )}
      </VStack>
    </Box>
  );
};

export const SparklineInteractive = memo(
  SparklineInteractiveComponent,
) as typeof SparklineInteractiveComponent;

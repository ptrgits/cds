import { memo, useMemo } from 'react';
import { runOnJS, useDerivedValue } from 'react-native-reanimated';
import type { SharedProps } from '@coinbase/cds-common/types';
import { useTheme } from '@coinbase/cds-mobile/hooks/useTheme';
import type { AnimatedProp } from '@shopify/react-native-skia';

import { useCartesianChartContext } from '../ChartProvider';
import { ChartText } from '../text';
import type {
  ChartTextChildren,
  ChartTextProps,
  TextHorizontalAlignment,
  TextVerticalAlignment,
} from '../text/ChartText';
import { unwrapAnimatedValue } from '../utils/chart';
import {
  findClosestXIndexWorklet,
  getScreenXWorklet,
  getScreenYWorklet,
} from '../utils/coordinateWorklets';

import { DottedLine } from './DottedLine';
import type { LineComponent } from './Line';

/**
 * Configuration for ReferenceLine label rendering using ChartText.
 */
export type ReferenceLineLabelProps = Pick<
  ChartTextProps,
  | 'color'
  | 'inset'
  | 'background'
  | 'borderRadius'
  | 'disableRepositioning'
  | 'bounds'
  | 'horizontalAlignment'
  | 'verticalAlignment'
  | 'font'
  | 'opacity'
  | 'xOffset'
  | 'yOffset'
  | 'elevation'
  | 'shadowColor'
  | 'shadowOffset'
  | 'shadowBlur'
  | 'shadowOpacity'
>;

type BaseReferenceLineProps = SharedProps & {
  /**
   * Label content to display near the reference line.
   * Can be a string or ReactNode for rich formatting.
   *
   * @example
   * // Simple string label
   * label="Target Price"
   *
   * @example
   * // ReactNode with styling
   * label={<tspan style={{ fontWeight: 'bold', fill: 'red' }}>Stop Loss</tspan>}
   */
  label?: ChartTextChildren;
  /**
   * Component to render the line.
   * @default DottedLine
   */
  LineComponent?: LineComponent;
  /**
   * The color of the line.
   * @default theme.color.bgLine
   */
  stroke?: string;
  /**
   * Props for the label rendering.
   * Consolidates styling and positioning options for the ChartText component.
   * Alignment defaults are set based on line orientation and can be overridden here.
   */
  labelProps?: ReferenceLineLabelProps;
};

type HorizontalReferenceLineProps = BaseReferenceLineProps & {
  /**
   * Y-value for horizontal reference line (data value).
   */
  dataY: AnimatedProp<number>;
  /**
   * The ID of the y-axis to use for positioning.
   * Defaults to defaultAxisId if not specified.
   */
  yAxisId?: string;
  /**
   * Position of the label along the horizontal line.
   * @default 'right'
   */
  labelPosition?: TextHorizontalAlignment;
  dataX?: never;
};

type VerticalReferenceLineProps = BaseReferenceLineProps & {
  /**
   * X-value for vertical reference line (data index).
   */
  dataX: AnimatedProp<number>;
  /**
   * Position of the label along the vertical line.
   * @default 'top'
   */
  labelPosition?: TextVerticalAlignment;
  dataY?: never;
  yAxisId?: never;
};

export type ReferenceLineProps = HorizontalReferenceLineProps | VerticalReferenceLineProps;

export const ReferenceLine = memo<ReferenceLineProps>(
  ({
    dataX,
    dataY,
    yAxisId,
    label,
    labelPosition = dataY !== undefined ? 'right' : 'top',
    testID,
    LineComponent = DottedLine,
    stroke,
    labelProps,
  }) => {
    const theme = useTheme();
    const { drawingArea, coordinateArrays } = useCartesianChartContext();

    const effectiveLineStroke = stroke ?? theme.color.bgLine;

    // Merge default props with user provided props
    const finalLabelProps: ReferenceLineLabelProps = useMemo(
      () => ({
        borderRadius: 8,
        color: theme.color.fgMuted,
        inset: { top: 8, bottom: 8, left: 12, right: 12 },
        // Set default alignment based on orientation
        ...(dataY !== undefined
          ? { verticalAlignment: 'middle' as const }
          : { horizontalAlignment: 'center' as const }),
        ...labelProps,
      }),
      [dataY, labelProps, theme.color.fgMuted],
    );

    // Pre-calculate pixel coordinates for both horizontal and vertical lines
    // This ensures hooks are called in the same order every render
    const yPixel = useDerivedValue(() => {
      if (dataY === undefined) return undefined;

      const currentDataY = unwrapAnimatedValue(dataY);

      // Use coordinate arrays only - no fallbacks
      const availableSeries = Object.entries(coordinateArrays.seriesCoordinates);
      if (availableSeries.length === 0) return 0;

      // For now, use the first series. In the future, we could match by yAxisId
      const [, seriesData] = availableSeries[0];

      // Find closest Y input value and use its corresponding output position
      let closestIndex = 0;
      let minDistance = Infinity;

      seriesData.yInputs.forEach((inputValue, index) => {
        if (inputValue) {
          const distance = Math.abs(inputValue[1] - currentDataY); // Compare with top of stack
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        }
      });

      return seriesData.yOutputs[closestIndex] ?? 0;
    }, [coordinateArrays, dataY, yAxisId]);

    const pixelX = useDerivedValue(() => {
      if (dataX === undefined) return;

      const currentDataX = unwrapAnimatedValue(dataX);

      return getScreenXWorklet(coordinateArrays.xOutputs, currentDataX);
    }, [coordinateArrays, dataX]);

    const pixelY = useDerivedValue(() => {
      if (dataY === undefined) return;

      const currentDataY = unwrapAnimatedValue(dataY);

      return 0;
      //return getScreenYWorklet(coordinateArrays.seriesCoordinates[seriesId].yOutputs, currentDataY);
    }, [coordinateArrays, dataY]);

    const horizontalPath = useDerivedValue(() => {
      if (yPixel.value === undefined) return '';
      return `M${drawingArea.x},${yPixel.value} L${drawingArea.x + drawingArea.width},${yPixel.value}`;
    }, [yPixel]);

    const verticalPath = useDerivedValue(() => {
      if (pixelX.value === undefined) return '';
      return `M${pixelX.value},${drawingArea.y} L${pixelX.value},${drawingArea.y + drawingArea.height}`;
    }, [pixelX]);

    if (dataY !== undefined) {
      let labelX: number;
      if (labelPosition === 'left') {
        labelX = drawingArea.x;
      } else if (labelPosition === 'center') {
        labelX = drawingArea.x + drawingArea.width / 2;
      } else {
        labelX = drawingArea.x + drawingArea.width;
      }

      return (
        <>
          <LineComponent animate={false} d={horizontalPath} stroke={effectiveLineStroke} />
          {label && (
            <ChartText {...finalLabelProps} x={labelX} y={yPixel.value ?? 0}>
              {label}
            </ChartText>
          )}
        </>
      );
    }

    // Vertical reference line logic
    if (dataX !== undefined) {
      let labelY: number;
      if (labelPosition === 'top') {
        labelY = drawingArea.y;
      } else if (labelPosition === 'middle') {
        labelY = drawingArea.y + drawingArea.height / 2;
      } else {
        labelY = drawingArea.y + drawingArea.height;
      }

      return (
        <>
          <LineComponent animate={false} d={verticalPath} stroke={effectiveLineStroke} />
          {label && (
            <ChartText {...finalLabelProps} x={pixelX.value ?? 0} y={labelY}>
              {label}
            </ChartText>
          )}
        </>
      );
    }
  },
);

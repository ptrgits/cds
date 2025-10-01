import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { findNodeHandle, type LayoutChangeEvent, UIManager } from 'react-native';
import { G, Rect as SvgRect, Text, type TextProps } from 'react-native-svg';
import type { Rect, SharedProps } from '@coinbase/cds-common/types';
import { type ChartInset, getChartInset } from '@coinbase/cds-common/visualizations/charts';
import { useTheme } from '@coinbase/cds-mobile/hooks/useTheme';

import { useCartesianChartContext } from '../ChartProvider';

/**
 * The supported content types for ChartText.
 * Currently limited to simple text content
 */
export type ChartTextChildren = string | null | undefined;

export type ChartTextProps = SharedProps &
  Pick<
    TextProps,
    | 'textAnchor'
    | 'alignmentBaseline'
    | 'dx'
    | 'dy'
    | 'fontSize'
    | 'fontFamily'
    | 'fontWeight'
    | 'opacity'
  > & {
    /**
     * The text color.
     * @default theme.color.fgMuted
     */
    color?: string;
    /**
     * The background color of the text's container element.
     * @default 'transparent'
     */
    background?: string;
    // override box responsive style
    /**
     * The text content to display.
     */
    children: ChartTextChildren;
    /**
     * The desired x position in SVG pixels.
     * @note Text will be automatically positioned to fit within bounds unless `disableRepositioning` is true.
     */
    x: number;
    /**
     * The desired y position in SVG pixels.
     * @note Text will be automatically positioned to fit within bounds unless `disableRepositioning` is true.
     */
    y: number;
    /**
     * When true, disables automatic repositioning to fit within bounds.
     */
    disableRepositioning?: boolean;
    /**
     * Optional bounds rectangle to constrain the text within. If provided, text will be positioned
     * to stay within these bounds. If not provided, defaults to the full chart bounds.
     */
    bounds?: Rect;
    /**
     * Callback fired when text dimensions change.
     * Used for collision detection and smart positioning.
     * Returns the adjusted position and dimensions.
     */
    onDimensionsChange?: (rect: Rect) => void;
    /**
     * Inset around the text content for the background rect.
     * Only affects the background, text position remains unchanged.
     */
    inset?: number | ChartInset;
    /**
     * Border radius for the background rectangle.
     * @default 4
     */
    borderRadius?: number;
  };

type ChartTextVisibleProps = {
  children: ChartTextChildren;
  background: string;
  textAnchor: TextProps['textAnchor'];
  alignmentBaseline: TextProps['alignmentBaseline'];
  fontFamily: TextProps['fontFamily'];
  fontSize: TextProps['fontSize'];
  fontWeight: TextProps['fontWeight'];
  textDimensions: Rect;
  fill?: string;
  borderRadius?: number;
  inset?: number | ChartInset;
  dx?: TextProps['dx'];
  dy?: TextProps['dy'];
};

const ChartTextVisible = memo<ChartTextVisibleProps>(
  ({
    children,
    background,
    textAnchor,
    alignmentBaseline,
    fontFamily,
    fontSize,
    fontWeight,
    fill,
    borderRadius,
    inset: insetInput,
    textDimensions,
    dx,
    dy,
  }) => {
    const theme = useTheme();
    const inset = useMemo(() => getChartInset(insetInput), [insetInput]);

    const rectHeight = useMemo(
      () => textDimensions.height + inset.top + inset.bottom,
      [textDimensions, inset],
    );
    const rectWidth = useMemo(
      () => textDimensions.width + inset.left + inset.right,
      [textDimensions, inset],
    );

    return (
      <G>
        {background !== 'transparent' && (
          <SvgRect
            fill={background}
            height={rectHeight}
            rx={borderRadius}
            ry={borderRadius}
            width={rectWidth}
            x={textDimensions.x - inset.left}
            y={textDimensions.y - inset.top}
          />
        )}
        <Text
          alignmentBaseline={alignmentBaseline}
          dx={dx}
          dy={dy}
          fill={fill ?? theme.color.fgMuted}
          fontFamily={fontFamily}
          fontSize={fontSize}
          fontWeight={fontWeight}
          textAnchor={textAnchor}
        >
          {children}
        </Text>
      </G>
    );
  },
);

export const ChartText = memo<ChartTextProps>(
  ({
    children,
    x,
    y,
    textAnchor = 'middle',
    alignmentBaseline = 'central',
    dx,
    dy,
    disableRepositioning = false,
    bounds,
    testID,
    fontFamily,
    fontSize = 12,
    fontWeight,
    color,
    background = 'transparent',
    borderRadius,
    inset: insetInput,
    onDimensionsChange,
    opacity = 1,
  }) => {
    const measurementRef = useRef<Text>(null);
    const { width: chartWidth, height: chartHeight } = useCartesianChartContext();

    const fullChartBounds = useMemo(
      () => ({ x: 0, y: 0, width: chartWidth, height: chartHeight }),
      [chartWidth, chartHeight],
    );

    const [textSize, setTextSize] = useState<Rect | null>(null);

    const textBBox = useMemo(() => {
      if (!textSize) {
        return null;
      }

      return {
        x: x + textSize.x,
        y: y + textSize.y,
        width: textSize.width,
        height: textSize.height,
      };
    }, [x, y, textSize]);

    const isDimensionsReady = disableRepositioning || textBBox !== null;

    // todo: make sure this works with chart text children
    const backgroundRectDimensions = useMemo(() => {
      if (!textBBox) {
        return null;
      }

      const inset = getChartInset(insetInput);
      return {
        x: textBBox.x - inset.left,
        y: textBBox.y - inset.top,
        width: textBBox.width + inset.left + inset.right,
        height: textBBox.height + inset.top + inset.bottom,
      };
    }, [textBBox, insetInput]);

    const overflowAmount = useMemo(() => {
      if (disableRepositioning) {
        return { x: 0, y: 0 };
      }

      const parentBounds = bounds ?? fullChartBounds;
      // TODO: it might be more clear to allow chartRect to be null until it has been measured after first render
      if (
        !backgroundRectDimensions ||
        !parentBounds ||
        parentBounds.width <= 0 ||
        parentBounds.height <= 0
      ) {
        return { x: 0, y: 0 };
      }

      let x = 0;
      let y = 0;

      // X-axis overflow
      if (backgroundRectDimensions.x < parentBounds.x) {
        x = parentBounds.x - backgroundRectDimensions.x; // positive = shift right
      } else if (
        backgroundRectDimensions.x + backgroundRectDimensions.width >
        parentBounds.x + parentBounds.width
      ) {
        x =
          parentBounds.x +
          parentBounds.width -
          (backgroundRectDimensions.x + backgroundRectDimensions.width); // negative = shift left
      }

      // Y-axis overflow
      if (backgroundRectDimensions.y < parentBounds.y) {
        y = parentBounds.y - backgroundRectDimensions.y; // positive = shift down
      } else if (
        backgroundRectDimensions.y + backgroundRectDimensions.height >
        parentBounds.y + parentBounds.height
      ) {
        y =
          parentBounds.y +
          parentBounds.height -
          (backgroundRectDimensions.y + backgroundRectDimensions.height); // negative = shift up
      }

      return { x, y };
    }, [backgroundRectDimensions, fullChartBounds, bounds, disableRepositioning]);

    const reportedRect = useMemo(() => {
      if (!backgroundRectDimensions) return null;
      return {
        x: backgroundRectDimensions.x + overflowAmount.x,
        y: backgroundRectDimensions.y + overflowAmount.y,
        width: backgroundRectDimensions.width,
        height: backgroundRectDimensions.height,
      };
    }, [backgroundRectDimensions, overflowAmount.x, overflowAmount.y]);

    useEffect(() => {
      if (onDimensionsChange && reportedRect !== null) {
        onDimensionsChange(reportedRect);
      }
    }, [reportedRect, onDimensionsChange]);

    useEffect(() => {
      if (measurementRef.current) {
        const nodeHandle = findNodeHandle(measurementRef.current);
        if (nodeHandle !== null) {
          UIManager.measure(nodeHandle, (x, y, width, height) => {
            if (width > 0 && height > 0) {
              setTextSize({ x, y, width, height });
            }
          });
        }
      }
    }, [measurementRef, children]);

    return (
      <G opacity={isDimensionsReady ? opacity : 0}>
        {textSize && (
          <G
            transform={[{ translateX: x + overflowAmount.x }, { translateY: y + overflowAmount.y }]}
          >
            <ChartTextVisible
              alignmentBaseline={alignmentBaseline}
              background={background}
              borderRadius={borderRadius}
              dx={dx}
              dy={dy}
              fill={color}
              fontFamily={fontFamily}
              fontSize={fontSize}
              fontWeight={fontWeight}
              inset={insetInput}
              textAnchor={textAnchor}
              textDimensions={textSize}
            >
              {children}
            </ChartTextVisible>
          </G>
        )}
        <Text
          ref={measurementRef}
          alignmentBaseline={alignmentBaseline}
          dx={dx}
          dy={dy}
          fill="transparent"
          fontFamily={fontFamily}
          fontSize={fontSize}
          fontWeight={fontWeight}
          opacity={0}
          textAnchor={textAnchor}
        >
          {children}
        </Text>
      </G>
    );
  },
);

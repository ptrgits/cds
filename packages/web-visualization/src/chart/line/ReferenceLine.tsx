import React, { memo, useMemo } from 'react';
import type { SharedProps } from '@coinbase/cds-common/types';
import { projectPoint } from '@coinbase/cds-common/visualizations/charts';

import { useChartContext } from '../ChartContext';
import { ChartText } from '../text';
import type { ChartTextChildren, ChartTextProps } from '../text/ChartText';

import { DottedLine } from './DottedLine';
import type { LineComponent } from './Line';

/**
 * Configuration for ReferenceLine label rendering using ChartText.
 * Note: The labelConfig styles and classNames will be merged with the top-level
 * styles.text and classNames.text properties if both are provided.
 */
export type ReferenceLineLabelConfig = Pick<
  ChartTextProps,
  | 'dx'
  | 'dy'
  | 'font'
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'color'
  | 'elevation'
  | 'padding'
  | 'background'
  | 'borderRadius'
  | 'disableRepositioning'
  | 'bounds'
  | 'styles'
  | 'classNames'
  | 'dominantBaseline'
  | 'textAnchor'
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
   * @default 'var(--color-bgLine)'
   */
  lineStroke?: string;
  /**
   * Configuration for the label rendering.
   * Consolidates styling and positioning options for the ChartText component.
   */
  labelConfig?: ReferenceLineLabelConfig;
  /**
   * Custom class name for the root element.
   */
  className?: string;
  /**
   * Custom inline styles for the root element.
   */
  style?: React.CSSProperties;
  /**
   * Custom class names for the component parts.
   */
  classNames?: {
    /**
     * Custom class name for the root element.
     */
    root?: string;
    /**
     * Custom class name for the text label.
     */
    text?: string;
  };
  /**
   * Custom styles for the component parts.
   */
  styles?: {
    /**
     * Custom styles for the root element.
     */
    root?: React.CSSProperties;
    /**
     * Custom styles for the text label.
     */
    text?: React.CSSProperties;
  };
};

export type HorizontalReferenceLineProps = BaseReferenceLineProps & {
  /**
   * Y-value for horizontal reference line (data value).
   */
  dataY: number;
  /**
   * The ID of the y-axis to use for positioning.
   * Defaults to defaultAxisId if not specified.
   */
  yAxisId?: string;
  /**
   * Position of the label along the horizontal line.
   * @default 'right'
   */
  labelPosition?: 'left' | 'center' | 'right';
  dataX?: never;
  xAxisId?: never;
};

export type VerticalReferenceLineProps = BaseReferenceLineProps & {
  /**
   * X-value for vertical reference line (data index).
   */
  dataX: number;
  /**
   * The ID of the x-axis to use for positioning.
   * Defaults to defaultAxisId if not specified.
   */
  xAxisId?: string;
  /**
   * Position of the label along the vertical line.
   * @default 'top'
   */
  labelPosition?: 'top' | 'center' | 'bottom';
  dataY?: never;
  yAxisId?: never;
};

export type ReferenceLineProps = HorizontalReferenceLineProps | VerticalReferenceLineProps;

export const ReferenceLine = memo<ReferenceLineProps>(
  ({
    dataX,
    dataY,
    xAxisId,
    yAxisId,
    label,
    labelPosition,
    testID,
    LineComponent = DottedLine,
    lineStroke = 'var(--color-bgLine)',
    labelConfig,
    className,
    style,
    classNames,
    styles,
  }) => {
    const { width, height, rect, getXScale, getYScale } = useChartContext();

    // Merge default config with user provided config, including text-specific styles and classNames
    const finalLabelConfig: ReferenceLineLabelConfig = useMemo(
      () => ({
        dominantBaseline: 'middle',
        borderRadius: 200,
        color: 'var(--color-fgMuted)',
        elevation: 0,
        padding: { top: 7.5, bottom: 7.5, left: 12, right: 12 },
        ...labelConfig,
        // Merge classNames for text
        classNames: {
          ...labelConfig?.classNames,
          ...(classNames?.text && { text: classNames.text }),
        },
        // Merge styles for text
        styles: {
          ...labelConfig?.styles,
          ...(styles?.text && { text: styles.text }),
        },
      }),
      [labelConfig, classNames?.text, styles?.text],
    );

    // Combine root classNames
    const rootClassName = [className, classNames?.root].filter(Boolean).join(' ') || undefined;

    // Combine root styles
    const rootStyle = { ...style, ...styles?.root } as React.CSSProperties | undefined;
    // Horizontal reference line logic
    if (dataY !== undefined) {
      const yScale = getYScale?.(yAxisId);

      // Don't render if we don't have a scale
      if (!yScale) {
        return null;
      }

      const yPixel = yScale(dataY);

      const getLabelX = () => {
        switch (labelPosition as 'left' | 'center' | 'right') {
          case 'left':
            return rect.x + 8;
          case 'center':
            return (rect.x + rect.x + rect.width) / 2;
          case 'right':
          default:
            return rect.x + rect.width - 5;
        }
      };

      if (yPixel === undefined) return null;

      return (
        <g data-testid={testID} className={rootClassName} style={rootStyle}>
          <LineComponent
            disableAnimations
            d={`M${rect.x},${yPixel} L${rect.x + rect.width},${yPixel}`}
            stroke={lineStroke}
          />
          {label && (
            <ChartText
              textAnchor={
                labelPosition === 'left' ? 'start' : labelPosition === 'center' ? 'middle' : 'end'
              }
              {...finalLabelConfig}
              x={getLabelX()}
              y={yPixel}
            >
              {label}
            </ChartText>
          )}
        </g>
      );
    }

    // Vertical reference line logic
    if (dataX !== undefined) {
      const xScale = getXScale?.(xAxisId);
      // We need a y scale for projectPoint, but we only care about the x coordinate
      // so we can use any available y scale
      const yScale = getYScale?.();

      // Don't render if we don't have scales
      if (!xScale || !yScale) {
        return null;
      }

      // Use projectPoint to handle both numeric and band scales properly
      const pixelCoord = projectPoint({
        x: dataX,
        y: 0, // We only care about x, so y can be any value
        xScale,
        yScale,
      });
      const xPixel = pixelCoord.x;

      const getLabelY = () => {
        switch (labelPosition as 'top' | 'center' | 'bottom') {
          case 'top':
            return 0;
          case 'center':
            return height / 2;
          case 'bottom':
          default:
            return height - 24;
        }
      };

      if (xPixel === undefined) return null;

      return (
        <g data-testid={testID} className={rootClassName} style={rootStyle}>
          <LineComponent
            disableAnimations
            d={`M${xPixel},${rect.y} L${xPixel},${rect.y + rect.height}`}
            stroke={lineStroke}
          />
          {label && (
            <ChartText textAnchor="middle" {...finalLabelConfig} x={xPixel} y={getLabelY()}>
              {label}
            </ChartText>
          )}
        </g>
      );
    }

    // Should not reach here if types are correct
    return null;
  },
);

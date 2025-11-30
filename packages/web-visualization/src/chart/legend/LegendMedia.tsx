import React, { memo } from 'react';
import { Box, type BoxProps } from '@coinbase/cds-web/layout';

export type LegendShape = 'circle' | 'square' | 'squircle' | 'pill';

export type LegendMediaProps = Omit<BoxProps<'svg'>, 'children'> & {
  /**
   * Shape of the legend media.
   * @default 'circle'
   */
  shape?: LegendShape;
  /**
   * Color of the legend media.
   */
  color: string;
  /**
   * Whether the media should be dashed (stroked instead of filled).
   * @default false
   */
  dashed?: boolean;
  /**
   * Size of the media in pixels.
   * @default 10
   */
  size?: number;
};

export const LegendMedia = memo(
  ({
    shape = 'circle',
    color,
    dashed = false,
    size = 10,
    className,
    style,
    ...props
  }: LegendMediaProps) => {
    // Adjust stroke width and positioning for dashed (stroked) variants
    const strokeWidth = dashed ? 1.5 : 0;
    const halfStroke = strokeWidth / 2;
    const dimension = size - strokeWidth;

    const commonProps = {
      fill: dashed ? 'none' : color,
      stroke: dashed ? color : 'none',
      strokeWidth: strokeWidth,
      strokeDasharray: dashed ? '2 1' : undefined,
    };

    let content;
    switch (shape) {
      case 'square':
        content = (
          <rect
            height={dimension}
            width={dimension}
            x={halfStroke}
            y={halfStroke}
            {...commonProps}
          />
        );
        break;
      case 'squircle':
        content = (
          <rect
            height={dimension}
            rx={size * 0.2}
            width={dimension}
            x={halfStroke}
            y={halfStroke}
            {...commonProps}
          />
        );
        break;
      case 'pill':
      case 'circle':
      default: {
        const radius = dimension / 2;
        content = <circle cx={size / 2} cy={size / 2} r={radius} {...commonProps} />;
        break;
      }
    }

    return (
      <Box
        as="svg"
        className={className}
        height={size}
        style={{ display: 'block', ...style }}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        {...props}
      >
        {content}
      </Box>
    );
  },
);

LegendMedia.displayName = 'LegendMedia';

import React, { memo, useMemo } from 'react';
import { m as motion } from 'framer-motion';

import { type ArcData, createArcPath, usePolarChartContext } from '../polar';

export type ArcBaseProps = {
  /**
   * Arc data containing angles and radii.
   */
  arcData: ArcData;
  /**
   * Fill color for the arc.
   */
  fill?: string;
  /**
   * Fill opacity.
   * @default 1
   */
  fillOpacity?: number;
  /**
   * Stroke color.
   */
  stroke?: string;
  /**
   * Stroke width in pixels.
   * @default 0
   */
  strokeWidth?: number;
  /**
   * Corner radius in pixels.
   * @default 0
   */
  cornerRadius?: number;
  /**
   * CSS class name.
   */
  className?: string;
  /**
   * Inline styles.
   */
  style?: React.CSSProperties;
  /**
   * Callback fired when the arc is clicked.
   */
  onClick?: (data: ArcData, event: React.MouseEvent<SVGPathElement>) => void;
  /**
   * Callback fired when the mouse enters the arc.
   */
  onMouseEnter?: (data: ArcData, event: React.MouseEvent<SVGPathElement>) => void;
  /**
   * Callback fired when the mouse leaves the arc.
   */
  onMouseLeave?: (data: ArcData, event: React.MouseEvent<SVGPathElement>) => void;
};

export type ArcProps = ArcBaseProps;

/**
 * Renders an arc (slice) in a polar chart.
 * Used by PieChart and DonutChart components.
 */
export const Arc = memo<ArcProps>(
  ({
    arcData,
    fill,
    fillOpacity = 1,
    stroke,
    strokeWidth = 0,
    cornerRadius = 0,
    onClick,
    onMouseEnter,
    onMouseLeave,
    className,
    style,
  }) => {
    const { animate, centerX, centerY } = usePolarChartContext();

    const path = useMemo(
      () =>
        createArcPath(
          arcData.startAngle,
          arcData.endAngle,
          arcData.innerRadius,
          arcData.outerRadius,
          cornerRadius,
        ),
      [
        arcData.startAngle,
        arcData.endAngle,
        arcData.innerRadius,
        arcData.outerRadius,
        cornerRadius,
      ],
    );

    const handleClick = (event: React.MouseEvent<SVGPathElement>) => {
      onClick?.(arcData, event);
    };

    const handleMouseEnter = (event: React.MouseEvent<SVGPathElement>) => {
      onMouseEnter?.(arcData, event);
    };

    const handleMouseLeave = (event: React.MouseEvent<SVGPathElement>) => {
      onMouseLeave?.(arcData, event);
    };

    const pathElement = (
      <motion.path
        animate={
          animate
            ? {
                opacity: 1,
                d: path,
              }
            : undefined
        }
        className={className}
        d={path}
        fill={fill}
        fillOpacity={fillOpacity}
        initial={
          animate
            ? {
                opacity: 0,
              }
            : undefined
        }
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        stroke={stroke}
        strokeWidth={strokeWidth}
        style={style}
        transition={
          animate
            ? {
                duration: 0.5,
                ease: 'easeOut',
              }
            : undefined
        }
      />
    );

    return <g transform={`translate(${centerX}, ${centerY})`}>{pathElement}</g>;
  },
);

import React, { memo } from 'react';
import { animate as frameAnimate, m as motion, useMotionValue, useTransform } from 'framer-motion';

import { type ArcData, usePolarChartContext } from '../polar';
import { getArcPath } from '../utils/path';

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
   * Clip path ID to apply to this arc.
   */
  clipPathId?: string;
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
    clipPathId,
    onClick,
    onMouseEnter,
    onMouseLeave,
    className,
    style,
  }) => {
    const { animate, centerX, centerY, startAngle: chartStartAngle } = usePolarChartContext();

    // Animate both angles from the chart's global startAngle to their respective positions
    // This creates a sweeping effect while ensuring segments positioned later stay ahead
    // and never get passed by earlier segments
    const animatedStartAngle = useMotionValue(chartStartAngle);
    const animatedEndAngle = useMotionValue(chartStartAngle);

    // Transform the animated angles into an SVG path
    const path = useTransform([animatedStartAngle, animatedEndAngle], (values: number[]) => {
      const [currentStartAngle, currentEndAngle] = values;
      return getArcPath({
        startAngle: currentStartAngle,
        endAngle: currentEndAngle,
        innerRadius: arcData.innerRadius,
        outerRadius: arcData.outerRadius,
        cornerRadius,
        padAngle: arcData.padAngle,
      });
    });

    // Trigger animation when the component mounts or data changes
    React.useEffect(() => {
      if (animate) {
        const startControls = frameAnimate(animatedStartAngle, arcData.startAngle, {
          duration: 1,
          ease: 'easeOut',
        });
        const endControls = frameAnimate(animatedEndAngle, arcData.endAngle, {
          duration: 1,
          ease: 'easeOut',
        });
        return () => {
          startControls.stop();
          endControls.stop();
        };
      } else {
        animatedStartAngle.set(arcData.startAngle);
        animatedEndAngle.set(arcData.endAngle);
      }
    }, [
      arcData.startAngle,
      arcData.endAngle,
      arcData.index,
      animate,
      animatedStartAngle,
      animatedEndAngle,
    ]);

    const handleClick = (event: React.MouseEvent<SVGPathElement>) => {
      onClick?.(arcData, event);
    };

    const handleMouseEnter = (event: React.MouseEvent<SVGPathElement>) => {
      onMouseEnter?.(arcData, event);
    };

    const handleMouseLeave = (event: React.MouseEvent<SVGPathElement>) => {
      onMouseLeave?.(arcData, event);
    };

    // Don't render if we don't have valid dimensions
    if (arcData.outerRadius <= 0) return;

    const pathElement = (
      <motion.path
        className={className}
        d={path}
        fill={fill}
        fillOpacity={fillOpacity}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        stroke={stroke}
        strokeWidth={strokeWidth}
        style={style}
      />
    );

    return (
      <g
        clipPath={clipPathId ? `url(#${clipPathId})` : undefined}
        transform={`translate(${centerX}, ${centerY})`}
      >
        {pathElement}
      </g>
    );
  },
);

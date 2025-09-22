import { memo } from 'react';
import type { SharedProps } from '@coinbase/cds-common/types';
import { projectPoint } from '@coinbase/cds-common/visualizations/charts';

import { ReferenceLine, type VerticalReferenceLineProps } from './line/ReferenceLine';
import { useScrubberContext } from './Chart';
import { useChartContext } from './ChartContext';
import { DottedLine } from './line';

export type ScrubberLineProps = SharedProps &
  Omit<VerticalReferenceLineProps, 'dataX'> & {
    /**
     * Direct x-coordinate. When provided, overrides value stored in scrubber context.
     */
    dataX?: number;
    /**
     * Whether to hide the overlay rect which hides future data.
     * @default true when hovering, false otherwise
     */
    hideOverlay?: boolean;

    /**
     * Whether to hide the scrubber's vertical reference line.
     * @default false
     */
    hideScrubberLine?: boolean;
    /**
     * The color of the overlay that de-emphasizes future data.
     * @default 'var(--color-bg)'
     */
    overlayColor?: string;
  };

/**
 * A specialized instance of ReferenceLine that sets some opinioned a
 */
export const ScrubberLine = memo<ScrubberLineProps>(
  ({
    dataX,
    hideOverlay,
    hideScrubberLine = false,
    labelPosition = 'top',
    overlayColor = 'var(--color-bg)',
    LineComponent = DottedLine,
    lineStroke = 'var(--color-bgLineHeavy)',
    testID,
    ...referenceLineProps
  }) => {
    const { rect, getXScale, getXAxis, getYScale } = useChartContext();

    const xScale = getXScale?.(referenceLineProps.xAxisId);
    const xAxis = getXAxis?.(referenceLineProps.xAxisId);
    // We need a y scale for projectPoint, but we only care about the x coordinate
    // so we can use any available y scale
    const yScale = getYScale?.();

    const { highlightedIndex } = useScrubberContext();

    if (!xScale || !yScale) {
      return null;
    }

    const isDirectPositioning = dataX !== undefined;
    const isHovering = !isDirectPositioning && highlightedIndex !== undefined;

    let pixelX: number | undefined;
    let vertRefLineXPosition: number;

    // Use direct X coordinate if provided
    if (dataX !== undefined) {
      // When directX is provided, it's the actual x value, not an index
      vertRefLineXPosition = dataX;

      // Use projectPoint to handle both numeric and band scales properly
      const pixelCoord = projectPoint({
        x: dataX,
        y: 0, // We only care about x, so y can be any value
        xScale,
        yScale,
      });
      pixelX = pixelCoord.x;
    } else {
      // Use highlight data index
      if (highlightedIndex === undefined) {
        return null;
      }

      // If xAxis has data array, use the actual data value at the index
      // Otherwise use the index itself (for ordinal/linear scales without explicit data)
      if (xAxis?.data && Array.isArray(xAxis.data)) {
        const dataValue = xAxis.data[highlightedIndex];
        // Convert string to number if needed for numeric scales
        vertRefLineXPosition = typeof dataValue === 'string' ? highlightedIndex : dataValue;
      } else {
        vertRefLineXPosition = highlightedIndex;
      }

      // Use projectPoint to handle both numeric and band scales properly
      const pixelCoord = projectPoint({
        x: vertRefLineXPosition,
        y: 0, // We only care about x, so y can be any value
        xScale,
        yScale,
      });
      pixelX = pixelCoord.x;
    }

    if (pixelX === undefined) return null;

    return (
      <g data-testid={testID}>
        {!(hideOverlay ?? !isHovering) && (
          <rect
            fill={overlayColor}
            height={rect.height}
            opacity={0.8}
            width={rect.x + rect.width - pixelX}
            x={pixelX}
            y={rect.y}
          />
        )}
        {!hideScrubberLine && (
          <ReferenceLine
            LineComponent={LineComponent}
            dataX={vertRefLineXPosition}
            labelPosition={labelPosition}
            lineStroke={lineStroke}
            {...referenceLineProps}
          />
        )}
      </g>
    );
  },
);

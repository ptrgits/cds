import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Divider, HStack, VStack, type VStackProps } from '@coinbase/cds-web/layout';
import { Portal } from '@coinbase/cds-web/overlays/Portal';
import { tooltipContainerId } from '@coinbase/cds-web/overlays/PortalProvider';
import { Text } from '@coinbase/cds-web/typography';
import { flip, offset, shift, useFloating, type VirtualElement } from '@floating-ui/react-dom';

import { LegendMedia } from './legend/LegendMedia';
import type { LegendShape } from './utils/chart';
import { useCartesianChartContext } from './ChartProvider';
import { isCategoricalScale, useScrubberContext } from './utils';

export type ChartTooltipProps = VStackProps<'div'> & {
  /**
   * Label text displayed at the top of the tooltip.
   * Can be a static string, a custom ReactNode, or a function that receives the current dataIndex.
   * If not provided, defaults to the x-axis data value at the current index.
   * If null is returned, the label is omitted.
   */
  label?: React.ReactNode | ((dataIndex: number) => React.ReactNode);
  /**
   * Array of series IDs to include in the tooltip.
   * By default, all series will be included.
   */
  seriesIds?: string[];
  /**
   * Formatter function for series values.
   * Receives the numeric series value and should return a ReactNode.
   * String results will automatically be wrapped in Text with font="label2".
   */
  valueFormatter?: (value: number) => React.ReactNode;
};

export const ChartTooltip = ({
  label,
  seriesIds,
  valueFormatter,
  gap = 2,
  minWidth = 320,
  ...props
}: ChartTooltipProps) => {
  const { svgRef, series, getSeriesData, getXAxis, getXScale, dataLength } =
    useCartesianChartContext();
  const { scrubberPosition } = useScrubberContext();
  const [isPointerActive, setIsPointerActive] = useState(false);
  const [internalScrubberPosition, setInternalScrubberPosition] = useState<number | undefined>(
    undefined,
  );

  // Use scrubberPosition if available (from context), otherwise track internal state
  const currentDataIndex = scrubberPosition ?? internalScrubberPosition;

  const isTooltipVisible =
    (isPointerActive || scrubberPosition !== undefined) && currentDataIndex !== undefined;

  const { refs, floatingStyles } = useFloating({
    open: isTooltipVisible,
    placement: 'bottom-start', // Default: bottom-right
    middleware: [
      // Use a function to dynamically set the offset
      offset(({ placement }) => {
        // Bottom or top
        const mainAxis = placement.includes('bottom') ? 16 : 8;
        const crossAxis = placement.includes('start') ? 16 : -8;

        return { mainAxis, crossAxis };
      }),

      flip({
        // Define the 4 corners in order of preference
        fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
      }),

      shift({ padding: 8 }),
    ],
  });

  const getDataIndexFromX = useCallback(
    (mouseX: number): number | undefined => {
      const xScale = getXScale();
      const xAxis = getXAxis();

      if (!xScale || !xAxis) return undefined;

      if (isCategoricalScale(xScale)) {
        const categories = xScale.domain?.() ?? xAxis.data ?? [];
        const bandwidth = xScale.bandwidth?.() ?? 0;
        let closestIndex = 0;
        let closestDistance = Infinity;
        for (let i = 0; i < categories.length; i++) {
          const xPos = xScale(i);
          if (xPos !== undefined) {
            const distance = Math.abs(mouseX - (xPos + bandwidth / 2));
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = i;
            }
          }
        }
        return closestIndex;
      }

      const axisData = xAxis.data;
      if (axisData && Array.isArray(axisData) && typeof axisData[0] === 'number') {
        const numericData = axisData as number[];
        let closestIndex = 0;
        let closestDistance = Infinity;

        for (let i = 0; i < numericData.length; i++) {
          const xValue = numericData[i];
          const xPos = xScale(xValue);
          if (xPos !== undefined) {
            const distance = Math.abs(mouseX - xPos);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = i;
            }
          }
        }
        return closestIndex;
      }

      if (
        'invert' in xScale &&
        typeof (xScale as { invert?: (value: number) => number }).invert === 'function'
      ) {
        const xValue = (xScale as { invert: (value: number) => number }).invert(mouseX);
        const domain = xAxis.domain;
        const min = domain.min ?? 0;
        const max = domain.max ?? (dataLength ? dataLength - 1 : min);
        const clamped = Math.max(min, Math.min(Math.round(xValue), max));
        return clamped;
      }

      return undefined;
    },
    [dataLength, getXAxis, getXScale],
  );

  useEffect(() => {
    const element = svgRef?.current;
    if (!element) return;

    const handleMouseMove = (event: Event) => {
      const { clientX, clientY } = event as MouseEvent;
      const virtualEl: VirtualElement = {
        getBoundingClientRect() {
          return {
            width: 0,
            height: 0,
            x: clientX,
            y: clientY,
            left: clientX,
            right: clientX,
            top: clientY,
            bottom: clientY,
          } as DOMRect;
        },
      };
      refs.setReference(virtualEl);
      const rect = element.getBoundingClientRect();
      const x = clientX - rect.left;
      const dataIndex = getDataIndexFromX(x);
      setInternalScrubberPosition(dataIndex);
      setIsPointerActive(true);
    };

    const handleMouseLeave = () => {
      setIsPointerActive(false);
      setInternalScrubberPosition(undefined);
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [getDataIndexFromX, refs, svgRef]);

  const { resolvedLabel, seriesItems } = useMemo(() => {
    if (currentDataIndex === undefined) {
      return { resolvedLabel: null, seriesItems: [] as TooltipSeriesItem[] };
    }

    // Resolve label
    let resolvedLabel: React.ReactNode;
    if (label !== undefined) {
      resolvedLabel = typeof label === 'function' ? label(currentDataIndex) : label;
    } else {
      // Default to x-axis data value
      const xAxis = getXAxis();
      if (xAxis?.data && xAxis.data[currentDataIndex] !== undefined) {
        resolvedLabel = xAxis.data[currentDataIndex];
      } else {
        resolvedLabel = currentDataIndex;
      }
    }

    // Wrap string label in Text
    if (typeof resolvedLabel === 'string' || typeof resolvedLabel === 'number') {
      resolvedLabel = <Text font="label1">{resolvedLabel}</Text>;
    }

    // Filter series
    const filteredSeries = seriesIds ? series.filter((s) => seriesIds.includes(s.id)) : series;

    // Resolve series data
    const seriesItems: TooltipSeriesItem[] = [];
    filteredSeries.forEach((s) => {
      const data = getSeriesData(s.id);
      const dataPoint = data?.[currentDataIndex];
      let value: number | undefined;

      if (dataPoint && dataPoint !== null) {
        const [start, end] = dataPoint;
        value = end - start;
      } else if (s.data) {
        const rawPoint = s.data[currentDataIndex];
        if (rawPoint !== undefined && rawPoint !== null) {
          value = Array.isArray(rawPoint) ? (rawPoint[1] ?? undefined) : (rawPoint as number);
        }
      }

      if (value === undefined || value === null || Number.isNaN(value)) return;

      let formattedValue: React.ReactNode = value;
      if (valueFormatter) {
        formattedValue = valueFormatter(value);
      }

      if (formattedValue === null || formattedValue === undefined) {
        return;
      }

      if (typeof formattedValue === 'string' || typeof formattedValue === 'number') {
        formattedValue = <Text font="label2">{formattedValue}</Text>;
      }

      seriesItems.push({
        id: s.id,
        label: s.label,
        color: s.color,
        shape: s.legendShape,
        value: formattedValue,
      });
    });

    return {
      resolvedLabel: resolvedLabel ?? null,
      seriesItems,
    };
  }, [currentDataIndex, label, seriesIds, series, getSeriesData, getXAxis, valueFormatter]);

  if (!isTooltipVisible || (!resolvedLabel && seriesItems.length === 0)) {
    return null;
  }

  return (
    <Portal containerId={tooltipContainerId}>
      <VStack
        ref={refs.setFloating}
        background="bg"
        borderRadius={400}
        color="fg"
        elevation={2}
        gap={gap}
        minWidth={minWidth}
        paddingX={3}
        paddingY={2}
        style={floatingStyles}
        {...props}
      >
        {resolvedLabel}
        <Divider />
        {seriesItems.length > 0 && (
          <VStack gap={1}>
            {seriesItems.map((item) => (
              <HStack key={item.id} alignItems="center" gap={1} justifyContent="space-between">
                <HStack alignItems="center">
                  <LegendMedia color={item.color} shape={item.shape} />
                  <Text font="label1">{item.label ?? item.id}</Text>
                </HStack>
                {item.value}
              </HStack>
            ))}
          </VStack>
        )}
      </VStack>
    </Portal>
  );
};

type TooltipSeriesItem = {
  id: string;
  label?: string;
  color?: string;
  shape?: LegendShape;
  value: React.ReactNode;
};

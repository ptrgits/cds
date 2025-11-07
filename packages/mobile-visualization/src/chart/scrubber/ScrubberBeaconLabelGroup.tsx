import { memo, useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';
import type { SharedProps } from '@coinbase/cds-common/types';
import { Group } from '@shopify/react-native-skia';

import { useCartesianChartContext } from '../ChartProvider';
import { applySerializableScale, useScrubberContext } from '../utils';

import { ScrubberBeaconLabel } from './ScrubberBeaconLabel';

// Simple wrapper to extract position from positions array
const PositionedLabel = memo<{
  seriesId: string;
  index: number;
  positions: any;
  label: string;
}>(({ seriesId, index, positions, label }) => {
  const x = useDerivedValue(() => positions.value[index]?.x ?? 0, [positions, index]);
  const y = useDerivedValue(() => positions.value[index]?.y ?? 0, [positions, index]);

  return (
    <ScrubberBeaconLabel horizontalAlignment="right" x={x} xOffset={-16} y={y}>
      {label}
    </ScrubberBeaconLabel>
  );
});

type ScrubberBeaconLabelSeries = {
  id: string;
  label: string;
};

export type ScrubberBeaconLabelGroupProps = SharedProps & {
  labels: ScrubberBeaconLabelSeries[];
};

/**
 * Simple component that positions labels at beacon locations.
 */
export const ScrubberBeaconLabelGroup = memo<ScrubberBeaconLabelGroupProps>(({ labels }) => {
  const {
    getSeries,
    getSeriesData,
    getXSerializableScale,
    getYSerializableScale,
    getXAxis,
    series,
  } = useCartesianChartContext();
  const { scrubberPosition } = useScrubberContext();

  // Pre-calculate series information (non-reactive)
  const seriesInfo = useMemo(() => {
    return labels
      .map((label) => {
        const series = getSeries(label.id);
        if (!series) return null;

        const sourceData = getSeriesData(label.id);
        const yScale = getYSerializableScale(series.yAxisId);

        return {
          id: label.id,
          sourceData,
          yScale,
        };
      })
      .filter((info): info is NonNullable<typeof info> => info !== null);
  }, [labels, getSeries, getSeriesData, getYSerializableScale]);

  // Calculate max data length for fallback positioning (same as ScrubberBeacon)
  const maxDataLength = useMemo(
    () =>
      series?.reduce((max: any, s: any) => {
        const seriesData = getSeriesData(s.id);
        return Math.max(max, seriesData?.length ?? 0);
      }, 0) ?? 0,
    [series, getSeriesData],
  );

  const xScale = getXSerializableScale();
  const xAxis = getXAxis();

  // Calculate data index and x value (same logic as ScrubberBeacon)
  const dataIndex = useDerivedValue(() => {
    return scrubberPosition.value ?? Math.max(0, maxDataLength - 1);
  }, [scrubberPosition, maxDataLength]);

  const dataX = useDerivedValue(() => {
    if (xAxis?.data && Array.isArray(xAxis.data) && xAxis.data[dataIndex.value] !== undefined) {
      const dataValue = xAxis.data[dataIndex.value];
      return typeof dataValue === 'string' ? dataIndex.value : dataValue;
    }
    return dataIndex.value;
  }, [xAxis, dataIndex]);

  // Calculate all label positions in a single derived value
  const allLabelPositions = useDerivedValue(() => {
    const sharedPixelX =
      dataX.value !== undefined && xScale ? applySerializableScale(dataX.value, xScale) : 0;

    return seriesInfo.map((info) => {
      // Calculate dataY for this series
      let dataY: number | undefined;
      if (xScale && info.yScale) {
        if (
          info.sourceData &&
          dataIndex.value !== undefined &&
          dataIndex.value >= 0 &&
          dataIndex.value < info.sourceData.length
        ) {
          const dataValue = info.sourceData[dataIndex.value];

          if (typeof dataValue === 'number') {
            dataY = dataValue;
          } else if (Array.isArray(dataValue)) {
            const validValues = dataValue.filter((val): val is number => val !== null);
            if (validValues.length >= 1) {
              dataY = validValues[validValues.length - 1];
            }
          }
        }
      }

      const pixelY =
        dataY !== undefined && info.yScale ? applySerializableScale(dataY, info.yScale) : 0;

      return {
        id: info.id,
        x: sharedPixelX,
        y: pixelY,
      };
    });
  }, [seriesInfo, dataIndex, dataX, xScale]);

  return (
    <Group>
      {seriesInfo.map((info, index) => {
        // Find the corresponding label from the original labels array
        const labelInfo = labels.find((label) => label.id === info.id);
        const labelText = labelInfo?.label || '';

        return (
          <PositionedLabel
            key={info.id}
            index={index}
            label={labelText}
            positions={allLabelPositions}
            seriesId={info.id}
          />
        );
      })}
    </Group>
  );
});

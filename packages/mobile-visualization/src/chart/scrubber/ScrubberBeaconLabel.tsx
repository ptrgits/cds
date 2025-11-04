import { memo, useRef } from 'react';
import { FontWeight } from '@shopify/react-native-skia';

import { ChartText, type ChartTextProps } from '../text';

export type ScrubberBeaconLabelProps = ChartTextProps;

/**
 * The ScrubberBeaconLabel is a special instance of ChartText used to label a series' scrubber beacon (i.e. a point on the series pinned to the scrubber position).
 */
export const ScrubberBeaconLabel = memo<ScrubberBeaconLabelProps>(
  ({
    background = 'transparent',
    color = 'var(--color-fgPrimary)',
    elevation = background !== 'transparent' ? 1 : undefined,
    borderRadius = background !== 'transparent' ? 4 : undefined,
    font = 'label1',
    verticalAlignment = 'middle',
    ...chartTextProps
  }) => {
    const renderCount = useRef(0);
    renderCount.current++;

    return (
      <>
        <ChartText
          color="red"
          x={chartTextProps.x ? chartTextProps.x + 50 : 50}
          y={chartTextProps.y ? chartTextProps.y - 10 : 40}
        >
          {`renderCount: ${renderCount.current}`}
        </ChartText>
        <ChartText
          background={background}
          borderRadius={borderRadius}
          color={color}
          elevation={elevation}
          font={font}
          verticalAlignment={verticalAlignment}
          {...chartTextProps}
        />
      </>
    );
  },
);

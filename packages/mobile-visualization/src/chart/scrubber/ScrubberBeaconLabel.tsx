import { memo } from 'react';
import { useTheme } from '@coinbase/cds-mobile';

import { ChartText, type ChartTextProps } from '../text';

export type ScrubberBeaconLabelProps = ChartTextProps;

/**
 * The ScrubberBeaconLabel is a special instance of ChartText used to label a series' scrubber beacon (i.e. a point on the series pinned to the scrubber position).
 */
export const ScrubberBeaconLabel = memo<ScrubberBeaconLabelProps>(
  ({
    background,
    color,
    elevation = 1,
    borderRadius = 4,
    font = 'label1',
    verticalAlignment = 'middle',
    ...chartTextProps
  }) => {
    const theme = useTheme();
    return (
      <ChartText
        background={background ?? theme.color.bg}
        borderRadius={borderRadius}
        color={color ?? theme.color.fgPrimary}
        elevation={elevation}
        font={font}
        verticalAlignment={verticalAlignment}
        {...chartTextProps}
      />
    );
  },
);

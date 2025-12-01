import React, { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@coinbase/cds-mobile';
import { Box, type BoxProps } from '@coinbase/cds-mobile/layout';

import type { LegendShape } from '../utils';

const shapeDimensions = StyleSheet.create({
  pill: {
    height: 24,
    width: 6,
  },
  circle: {
    height: 10,
    width: 10,
  },
  square: {
    height: 10,
    width: 10,
  },
  squircle: {
    height: 10,
    width: 10,
  },
});

export type LegendMediaProps = Omit<BoxProps, 'color'> & {
  /**
   * The color of the legend indicator.
   * @default theme.color.fg
   */
  color?: string;
  /**
   * Shape of the legend indicator.
   * @default 'circle'
   */
  shape?: LegendShape;
};

/**
 * Media for a chart legend.
 */
export const LegendMedia = memo<LegendMediaProps>(
  ({ color: colorProp, shape = 'circle', style, testID, ...props }) => {
    const theme = useTheme();
    const color = colorProp ?? theme.color.fg;
    const dimensionStyle = shapeDimensions[shape] ?? shapeDimensions.circle;

    const borderRadiusStyle = useMemo(() => {
      if (shape === 'square') {
        return { borderRadius: 0 };
      }
      if (shape === 'squircle') {
        return { borderRadius: theme.borderRadius[200] };
      }
      return { borderRadius: theme.borderRadius[1000] };
    }, [shape, theme.borderRadius]);

    return (
      <Box
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[dimensionStyle, borderRadiusStyle, { backgroundColor: color }, style]}
        testID={testID}
        {...props}
      />
    );
  },
);

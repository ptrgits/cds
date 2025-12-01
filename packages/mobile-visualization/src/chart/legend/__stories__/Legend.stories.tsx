import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@coinbase/cds-mobile';
import { Example, ExampleScreen } from '@coinbase/cds-mobile/examples/ExampleScreen';
import { Box, HStack, VStack } from '@coinbase/cds-mobile/layout';
import { TextLabel2 } from '@coinbase/cds-mobile/typography';

import type { LegendShape } from '../../utils/chart';

const shapeStyles = StyleSheet.create({
  mediaBase: {
    borderRadius: 999,
  },
  pill: {
    height: 28,
    width: 8,
  },
  circle: {
    height: 12,
    width: 12,
  },
  dot: {
    height: 6,
    width: 6,
  },
  square: {
    borderRadius: 2,
    height: 12,
    width: 12,
  },
  squircle: {
    borderRadius: 4,
    height: 12,
    width: 12,
  },
});

const stylesByShape: Record<LegendShape, number> = {
  pill: shapeStyles.pill,
  circle: shapeStyles.circle,
  dot: shapeStyles.dot,
  square: shapeStyles.square,
  squircle: shapeStyles.squircle,
};

type LegendMediaProps = {
  color: string;
  shape?: LegendShape;
  testID?: string;
};

const LegendMedia = memo(({ color, shape = 'circle', testID }: LegendMediaProps) => {
  return (
    <Box
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[shapeStyles.mediaBase, stylesByShape[shape], { backgroundColor: color }]}
      testID={testID}
    />
  );
});

type LegendItemProps = {
  color: string;
  label: string;
  shape?: LegendShape;
};

const LegendItem = memo(({ color, label, shape = 'circle' }: LegendItemProps) => (
  <HStack alignItems="center" gap={0.5}>
    <LegendMedia color={color} shape={shape} />
    <TextLabel2>{label}</TextLabel2>
  </HStack>
));

const shapes: LegendShape[] = ['pill', 'circle', 'squircle', 'square', 'dot'];

const LegendStories = () => {
  const theme = useTheme();

  const colorPalette = useMemo(
    () => [
      theme.color.accentBoldBlue,
      theme.color.accentBoldGreen,
      theme.color.accentBoldOrange,
      theme.color.accentBoldPink,
      theme.color.accentBoldPurple,
      theme.color.accentBoldYellow,
    ],
    [
      theme.color.accentBoldBlue,
      theme.color.accentBoldGreen,
      theme.color.accentBoldOrange,
      theme.color.accentBoldPink,
      theme.color.accentBoldPurple,
      theme.color.accentBoldYellow,
    ],
  );

  const legendSeries = useMemo(
    () => [
      {
        label: 'Gross Volume',
        color: theme.color.accentBoldBlue,
        shape: 'pill' as LegendShape,
      },
      {
        label: 'Active Wallets',
        color: theme.color.accentBoldGreen,
        shape: 'circle' as LegendShape,
      },
      {
        label: 'Net Revenue',
        color: theme.color.accentBoldPurple,
        shape: 'squircle' as LegendShape,
      },
      {
        label: 'Marketing Spend',
        color: theme.color.accentBoldOrange,
        shape: 'square' as LegendShape,
      },
    ],
    [
      theme.color.accentBoldBlue,
      theme.color.accentBoldGreen,
      theme.color.accentBoldPurple,
      theme.color.accentBoldOrange,
    ],
  );

  return (
    <ExampleScreen>
      <Example title="Legend media shapes">
        <VStack gap={2}>
          {shapes.map((shape) => (
            <HStack key={shape} gap={0.5}>
              {colorPalette.map((color, index) => (
                <LegendMedia
                  key={`${shape}-${index}`}
                  color={color}
                  shape={shape}
                  testID={`legend-media-${shape}-${index}`}
                />
              ))}
            </HStack>
          ))}
        </VStack>
      </Example>
      <Example title="Legend items">
        <VStack gap={1}>
          {legendSeries.map((series) => (
            <LegendItem key={series.label} color={series.color} label={series.label} shape={series.shape} />
          ))}
        </VStack>
      </Example>
    </ExampleScreen>
  );
};

export default LegendStories;


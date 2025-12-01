import { useMemo } from 'react';
import { Example, ExampleScreen } from '@coinbase/cds-mobile/examples/ExampleScreen';
import { HStack, VStack } from '@coinbase/cds-mobile/layout';

import type { LegendShape } from '../../utils/chart';
import { LegendMedia } from '..';

const shapes: LegendShape[] = ['pill', 'circle', 'squircle', 'square'];

const spectrumColors = [
  'blue',
  'green',
  'orange',
  'yellow',
  'gray',
  'indigo',
  'pink',
  'purple',
  'red',
  'teal',
  'chartreuse',
];

const LegendStories = () => {
  const colorPalette = useMemo(() => spectrumColors.map((color) => `rgb(var(--${color}40))`), []);

  return (
    <ExampleScreen>
      <Example title="Shapes">
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
    </ExampleScreen>
  );
};

export default LegendStories;

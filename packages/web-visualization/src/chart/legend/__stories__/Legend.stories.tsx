import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';

import type { LegendShape } from '../../utils/chart';
import { LegendMedia } from '../LegendMedia';

export default {
  component: LegendMedia,
  title: 'Components/Chart/Legend',
};

const Example: React.FC<
  React.PropsWithChildren<{ title: string; description?: string | React.ReactNode }>
> = ({ children, title, description }) => {
  return (
    <VStack gap={2}>
      <Text as="h2" display="block" font="title3">
        {title}
      </Text>
      {description}
      {children}
    </VStack>
  );
};

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

const shapes: LegendShape[] = ['pill', 'circle', 'squircle', 'square'];

export const All = () => {
  return (
    <VStack gap={8}>
      <Example title="Shapes">
        <VStack gap={2}>
          {shapes.map((shape) => (
            <HStack key={shape} gap={1}>
              {spectrumColors.map((color) => (
                <Box key={color} justifyContent="center" style={{ width: 10 }}>
                  <LegendMedia color={`rgb(var(--${color}40))`} shape={shape} />
                </Box>
              ))}
            </HStack>
          ))}
        </VStack>
      </Example>
    </VStack>
  );
};

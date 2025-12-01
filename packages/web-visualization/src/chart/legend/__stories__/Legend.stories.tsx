import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';

import { CartesianChart } from '../../CartesianChart';
import { Line, LineChart } from '../../line';
import { Scrubber } from '../../scrubber';
import type { LegendShape } from '../../utils/chart';
import { Legend } from '../Legend';
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
      <Example title="Line Chart">
        <LineChart
          enableScrubbing
          points
          showArea
          showXAxis
          showYAxis
          curve="natural"
          height={{ base: 200, tablet: 225, desktop: 250 }}
          inset={{ top: 16, right: 16, bottom: 0, left: 0 }}
          series={[
            {
              id: 'line',
              data: [2, 5.5, 2, 8.5, 1.5, 5],
            },
          ]}
          xAxis={{
            data: [1, 2, 3, 5, 8, 10],
            showLine: true,
            showTickMarks: true,
            showGrid: true,
          }}
          yAxis={{
            domain: { min: 0 },
            position: 'left',
            showLine: true,
            showTickMarks: true,
            showGrid: true,
          }}
        >
          <Scrubber hideOverlay />
          <Legend />
        </LineChart>
      </Example>
    </VStack>
  );
};

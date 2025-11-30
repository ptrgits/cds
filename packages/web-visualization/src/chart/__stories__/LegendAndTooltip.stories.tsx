import React from 'react';
import { Box, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import type { Meta } from '@storybook/react';

import { Legend } from '../legend/Legend';
import { LineChart } from '../line/LineChart';
import { Scrubber } from '../scrubber/Scrubber';
import { ChartTooltip } from '../tooltip/ChartTooltip';

const meta: Meta<typeof LineChart> = {
  title: 'Components/Chart/LegendAndTooltip',
  component: LineChart,
};

export default meta;

const data = [10, 22, 29, 45, 98, 45, 22, 52, 21, 4, 68, 20, 21, 58];

const Example: React.FC<React.PropsWithChildren<{ title: string; description?: string }>> = ({
  children,
  title,
  description,
}) => {
  return (
    <VStack gap={2}>
      <Text as="h2" display="block" font="title3">
        {title}
      </Text>
      {description && <Text>{description}</Text>}
      {children}
    </VStack>
  );
};

export const Default = () => {
  return (
    <VStack gap={4}>
      <Example description="Simple LineChart with Legend and Tooltip." title="Basic Usage">
        <LineChart
          enableScrubbing
          showArea
          height={{ base: 200, tablet: 225, desktop: 250 }}
          series={[
            {
              id: 'prices',
              label: 'Price',
              data: data,
            },
          ]}
        >
          <Legend shapes={{ prices: 'circle' }} style={{ marginBottom: 16 }} />
          <ChartTooltip
            content={(dataIndex: number) => (
              <Box
                style={{
                  boxShadow: 'var(--elevation-high)',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '8px',
                }}
              >
                <Text font="label1">Index: {dataIndex}</Text>
                <Text>Value: {data[dataIndex]}</Text>
              </Box>
            )}
          />
          <Scrubber />
        </LineChart>
      </Example>
    </VStack>
  );
};

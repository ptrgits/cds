import React from 'react';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';

import { DonutChart } from '../../pie/DonutChart';
import { PieChart } from '../../pie/PieChart';
import { PiePlot } from '../../pie/PiePlot';
import { getArcPath } from '../../utils/path';
import { PolarChart } from '../PolarChart';
import type { PolarDataPoint } from '../utils/polar';

export default {
  title: 'Components/Chart/PolarChart',
  component: PieChart,
};

const Example: React.FC<
  React.PropsWithChildren<{ title: string; description?: string | React.ReactNode }>
> = ({ children, title, description }) => {
  return (
    <VStack gap={2}>
      <Text as="h2" display="block" font="title3">
        {title}
      </Text>
      {description && (
        <Text display="block" font="body">
          {description}
        </Text>
      )}
      {children}
    </VStack>
  );
};

const sampleData: PolarDataPoint[] = [
  { value: 30, label: 'Bitcoin', id: 'btc', color: 'var(--color-accentBoldOrange)' },
  { value: 20, label: 'Ethereum', id: 'eth', color: 'var(--color-accentBoldBlue)' },
  { value: 15, label: 'USDC', id: 'usdc', color: 'var(--color-accentBoldGreen)' },
  { value: 25, label: 'Others', id: 'others', color: 'var(--color-accentBoldPurple)' },
  { value: 10, label: 'Cash', id: 'cash', color: 'var(--color-accentBoldYellow)' },
];

const CoinbaseOneRewardsChart = () => {
  // Chart parameters
  const radius = 100;
  const innerRadiusRatio = 0.75;
  const angleEachSideGap = (45 / 4) * 3; // in degrees

  const startAngleDegrees = angleEachSideGap - 180;
  const endAngleDegrees = 180 - angleEachSideGap;

  const angleGapDegrees = 5;
  const totalGapDegrees = angleGapDegrees * 2;
  const gapBetweenDegrees = totalGapDegrees / 3;

  const sectionLengthDegrees = (endAngleDegrees - startAngleDegrees) / 3 - gapBetweenDegrees;

  const firstSectionEnd = startAngleDegrees + sectionLengthDegrees;
  const secondSectionStart = firstSectionEnd + gapBetweenDegrees;
  const secondSectionEnd = secondSectionStart + sectionLengthDegrees;
  const thirdSectionStart = secondSectionEnd + gapBetweenDegrees;
  const thirdSectionEnd = thirdSectionStart + sectionLengthDegrees;

  // Calculate progress angle based on percentage
  const totalChartAngle = endAngleDegrees - startAngleDegrees;
  const progressAngle = 0;

  // Background: full ring
  const backgroundData = [
    { value: 100, label: 'Background', id: 'bg', color: 'var(--color-fgMuted)' },
  ];

  // Foreground: single arc that fills based on progress
  const foregroundData = [
    { value: 100, label: 'Progress', id: 'progress', color: 'var(--color-positive)' },
  ];

  return (
    <VStack gap={4}>
      <Box style={{ width: 200, height: 200, position: 'relative' }}>
        <PolarChart
          animate
          height={300}
          series={[
            { id: 'background', data: backgroundData },
            { id: 'foreground', data: foregroundData },
          ]}
          style={{ position: 'absolute', inset: 0 }}
        >
          <defs>
            <clipPath id="background-clip">
              <path
                d={getArcPath({
                  startAngle: (startAngleDegrees * Math.PI) / 180,
                  endAngle: (firstSectionEnd * Math.PI) / 180,
                  innerRadius: innerRadiusRatio * radius,
                  outerRadius: radius,
                  cornerRadius: 100,
                })}
              />
              <path
                d={getArcPath({
                  startAngle: (secondSectionStart * Math.PI) / 180,
                  endAngle: (secondSectionEnd * Math.PI) / 180,
                  innerRadius: innerRadiusRatio * radius,
                  outerRadius: radius,
                  cornerRadius: 100,
                })}
              />
              <path
                d={getArcPath({
                  startAngle: (thirdSectionStart * Math.PI) / 180,
                  endAngle: (thirdSectionEnd * Math.PI) / 180,
                  innerRadius: innerRadiusRatio * radius,
                  outerRadius: radius,
                  cornerRadius: 100,
                })}
              />
            </clipPath>
          </defs>
          <g opacity={0.25}>
            <path
              d={getArcPath({
                startAngle: (startAngleDegrees * Math.PI) / 180,
                endAngle: (firstSectionEnd * Math.PI) / 180,
                innerRadius: innerRadiusRatio * radius,
                outerRadius: radius,
                cornerRadius: 100,
              })}
              fill="var(--color-fgMuted)"
              transform="translate(100, 150)"
            />
            <path
              d={getArcPath({
                startAngle: (secondSectionStart * Math.PI) / 180,
                endAngle: (secondSectionEnd * Math.PI) / 180,
                innerRadius: innerRadiusRatio * radius,
                outerRadius: radius,
                cornerRadius: 100,
              })}
              fill="var(--color-fgMuted)"
              transform="translate(100, 150)"
            />
            <path
              d={getArcPath({
                startAngle: (thirdSectionStart * Math.PI) / 180,
                endAngle: (thirdSectionEnd * Math.PI) / 180,
                innerRadius: innerRadiusRatio * radius,
                outerRadius: radius,
                cornerRadius: 100,
              })}
              fill="var(--color-fgMuted)"
              transform="translate(100, 150)"
            />
          </g>
          <PiePlot
            clipPathId="background-clip"
            cornerRadius={100}
            endAngle={progressAngle}
            innerRadiusRatio={innerRadiusRatio}
            seriesId="foreground"
            startAngle={startAngleDegrees}
          />
        </PolarChart>
      </Box>
    </VStack>
  );
};

const WalletBreakdownChart = () => {
  const walletData: PolarDataPoint[] = [
    { value: 15, label: 'Card', id: 'card', color: '#5B8DEF' },
    { value: 45, label: 'Cash', id: 'cash', color: '#4CAF93' },
    { value: 12, label: 'Stake', id: 'stake', color: '#E67C5C' },
    { value: 18, label: 'Lend', id: 'lend', color: '#6DD4E0' },
  ];

  return (
    <DonutChart
      animate
      cornerRadius={100}
      data={walletData}
      height={200}
      innerRadiusRatio={0.8}
      paddingAngle={3}
      width={200}
    />
  );
};

const WalletBreakdownPieChart = () => {
  const walletData: PolarDataPoint[] = [
    { value: 15, label: 'Card', id: 'card', color: '#5B8DEF' },
    { value: 45, label: 'Cash', id: 'cash', color: '#4CAF93' },
    { value: 12, label: 'Stake', id: 'stake', color: '#E67C5C' },
    { value: 18, label: 'Lend', id: 'lend', color: '#6DD4E0' },
  ];

  return (
    <PieChart
      animate
      data={walletData}
      height={200}
      overflow="visible"
      stroke="var(--color-bg)"
      strokeWidth={1}
      width={200}
    />
  );
};

export const All = () => {
  return (
    <VStack gap={6}>
      <Example title="Coinbase One Rewards">
        <CoinbaseOneRewardsChart />
      </Example>
      <Example title="Wallet Breakdown">
        <WalletBreakdownChart />
      </Example>
      <Example title="Wallet Breakdown">
        <WalletBreakdownPieChart />
      </Example>
    </VStack>
  );
};

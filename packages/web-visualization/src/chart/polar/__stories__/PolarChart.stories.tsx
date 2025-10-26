import React from 'react';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';

import { DonutChart } from '../../pie/DonutChart';
import { PieChart } from '../../pie/PieChart';
import { PiePlot } from '../../pie/PiePlot';
import { PolarChart } from '../../PolarChart';
import { getArcPath } from '../../utils/path';
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
    { value: 100, label: 'Progress', id: 'progress', color: 'var(--color-fg)' },
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
            angularAxis={{ range: { min: startAngleDegrees, max: progressAngle } }}
            clipPathId="background-clip"
            cornerRadius={100}
            radialAxis={{ range: ({ max }) => ({ min: innerRadiusRatio * max, max }) }}
            seriesId="foreground"
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
      angularAxis={{ paddingAngle: 3 }}
      cornerRadius={100}
      data={walletData}
      height={200}
      innerRadiusRatio={0.8}
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

const NestedWalletBreakdown = () => {
  // Inner pie chart - main categories
  const categoryData: PolarDataPoint[] = [
    { value: 35, label: 'Crypto', id: 'crypto', color: '#5B8DEF' },
    { value: 45, label: 'Fiat', id: 'fiat', color: '#4CAF93' },
    { value: 20, label: 'Rewards', id: 'rewards', color: '#E67C5C' },
  ];

  // Outer donut chart - detailed breakdown
  const detailData: PolarDataPoint[] = [
    // Crypto breakdown (35% of total)
    { value: 15, label: 'Bitcoin', id: 'btc', color: '#7FA8F5' },
    { value: 12, label: 'Ethereum', id: 'eth', color: '#95B8F7' },
    { value: 8, label: 'Other', id: 'other-crypto', color: '#ABC8F9' },

    // Fiat breakdown (45% of total)
    { value: 30, label: 'USD', id: 'usd', color: '#6BC9A9' },
    { value: 15, label: 'EUR', id: 'eur', color: '#8DD9BC' },

    // Rewards breakdown (20% of total)
    { value: 12, label: 'Cash Back', id: 'cashback', color: '#ED9274' },
    { value: 8, label: 'Points', id: 'points', color: '#F2AB91' },
  ];

  return (
    <PolarChart
      animate
      height={300}
      overflow="visible"
      series={[
        { id: 'categories', data: categoryData, label: 'Categories' },
        { id: 'details', data: detailData, label: 'Details' },
      ]}
      width={300}
    >
      {/* Inner pie chart - uses ~60% of radius */}
      <PiePlot
        cornerRadius={4}
        radialAxis={{
          range: ({ max }) => ({ min: 0, max: max - 16 }),
        }}
        seriesId="categories"
        stroke="var(--color-bg)"
        strokeWidth={2}
      />
      {/* Outer donut ring - from 65% to 100% of radius */}
      <PiePlot
        cornerRadius={4}
        radialAxis={{
          range: ({ max }) => ({ min: max - 16, max }),
        }}
        seriesId="details"
        stroke="var(--color-bg)"
        strokeWidth={2}
      />
    </PolarChart>
  );
};

export const All = () => {
  return (
    <VStack gap={6}>
      <Example
        description="A nested visualization showing main categories in the center pie chart with detailed breakdowns in the surrounding donut chart."
        title="Nested Wallet Breakdown"
      >
        <NestedWalletBreakdown />
      </Example>
      <Example title="Coinbase One Rewards">
        <CoinbaseOneRewardsChart />
      </Example>
      <Example title="Wallet Breakdown - Donut">
        <WalletBreakdownChart />
      </Example>
      <Example title="Wallet Breakdown - Pie">
        <WalletBreakdownPieChart />
      </Example>
    </VStack>
  );
};

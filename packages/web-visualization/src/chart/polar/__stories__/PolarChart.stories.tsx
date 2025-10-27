import React, { memo, useMemo } from 'react';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';

import { DonutChart } from '../../pie/DonutChart';
import { PieChart } from '../../pie/PieChart';
import { PiePlot } from '../../pie/PiePlot';
import { PolarChart } from '../../PolarChart';
import { getArcPath } from '../../utils/path';
import { usePolarChartContext } from '../PolarChartProvider';
import type { PolarDataPoint } from '../utils/polar';

export default {
  title: 'Components/Chart/PolarChart',
  component: PieChart,
};

/**
 * Helper component that draws a rectangle around the chart's drawing area.
 * Useful for visualizing where the chart content will be rendered.
 */
const DrawingAreaRect = memo(() => {
  const { drawingArea } = usePolarChartContext();

  if (!drawingArea) return null;

  return (
    <rect
      {...drawingArea}
      fill="none"
      stroke="var(--color-accentBoldPurple)"
      strokeDasharray="4"
      strokeWidth={2}
    />
  );
});

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

/**
 * Background arcs component for Coinbase One Rewards chart.
 * Calculates arc paths based on the actual drawing area from context.
 */
const RewardsBackgroundArcs = memo<{
  innerRadiusRatio: number;
  startAngleDegrees: number;
  firstSectionEnd: number;
  secondSectionStart: number;
  secondSectionEnd: number;
  thirdSectionStart: number;
  thirdSectionEnd: number;
}>(
  ({
    innerRadiusRatio,
    startAngleDegrees,
    firstSectionEnd,
    secondSectionStart,
    secondSectionEnd,
    thirdSectionStart,
    thirdSectionEnd,
  }) => {
    const { drawingArea } = usePolarChartContext();

    const { centerX, centerY, radius, innerRadius, outerRadius } = useMemo(() => {
      const cx = drawingArea.x + drawingArea.width / 2;
      const cy = drawingArea.y + drawingArea.height / 2;
      const r = Math.min(drawingArea.width, drawingArea.height) / 2;
      return {
        centerX: cx,
        centerY: cy,
        radius: r,
        innerRadius: r * innerRadiusRatio,
        outerRadius: r,
      };
    }, [drawingArea, innerRadiusRatio]);

    const sections = useMemo(
      () => [
        { start: startAngleDegrees, end: firstSectionEnd },
        { start: secondSectionStart, end: secondSectionEnd },
        { start: thirdSectionStart, end: thirdSectionEnd },
      ],
      [
        startAngleDegrees,
        firstSectionEnd,
        secondSectionStart,
        secondSectionEnd,
        thirdSectionStart,
        thirdSectionEnd,
      ],
    );

    return (
      <>
        <defs>
          <clipPath id="background-clip">
            {sections.map((section, i) => (
              <path
                key={i}
                d={getArcPath({
                  startAngle: (section.start * Math.PI) / 180,
                  endAngle: (section.end * Math.PI) / 180,
                  innerRadius,
                  outerRadius,
                  cornerRadius: 100,
                })}
              />
            ))}
          </clipPath>
        </defs>
        <g opacity={0.25}>
          {sections.map((section, i) => (
            <path
              key={i}
              d={getArcPath({
                startAngle: (section.start * Math.PI) / 180,
                endAngle: (section.end * Math.PI) / 180,
                innerRadius,
                outerRadius,
                cornerRadius: 100,
              })}
              fill="var(--color-fgMuted)"
              transform={`translate(${centerX}, ${centerY})`}
            />
          ))}
        </g>
      </>
    );
  },
);

const CoinbaseOneRewardsChart = () => {
  // Chart parameters
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
      <Box style={{ width: 100, height: 100, position: 'relative' }}>
        <PolarChart
          animate
          angularAxis={{ range: { min: startAngleDegrees, max: progressAngle } }}
          inset={0}
          radialAxis={{ range: ({ max }) => ({ min: innerRadiusRatio * max, max }) }}
          series={[
            { id: 'background', data: backgroundData },
            { id: 'foreground', data: foregroundData },
          ]}
          style={{ position: 'absolute', inset: 0 }}
        >
          <RewardsBackgroundArcs
            firstSectionEnd={firstSectionEnd}
            innerRadiusRatio={innerRadiusRatio}
            secondSectionEnd={secondSectionEnd}
            secondSectionStart={secondSectionStart}
            startAngleDegrees={startAngleDegrees}
            thirdSectionEnd={thirdSectionEnd}
            thirdSectionStart={thirdSectionStart}
          />
          <PiePlot clipPathId="background-clip" cornerRadius={100} seriesId="foreground" />
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
      height={100}
      innerRadiusRatio={0.8}
      inset={0}
      width={100}
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

  return <PieChart animate data={walletData} height={100} inset={0} width={100} />;
};

const DrawingAreaVisualization = () => {
  const data: PolarDataPoint[] = [
    { value: 30, label: 'A', id: 'a', color: 'var(--color-accentBoldPurple)' },
    { value: 40, label: 'B', id: 'b', color: 'var(--color-accentBoldBlue)' },
    { value: 30, label: 'C', id: 'c', color: 'var(--color-accentBoldGreen)' },
  ];

  return (
    <HStack gap={4}>
      <VStack gap={2}>
        <Text font="label2">No inset</Text>
        <PolarChart
          animate
          height={100}
          inset={0}
          series={[{ id: 'series', data }]}
          style={{ backgroundColor: 'var(--color-bgAccent)' }}
          width={100}
        >
          <DrawingAreaRect />
          <PiePlot />
        </PolarChart>
      </VStack>

      {/* With inset - drawing area is smaller */}
      <VStack gap={2}>
        <Text font="label2">20px inset</Text>
        <PolarChart
          animate
          height={100}
          inset={20}
          series={[{ id: 'series', data }]}
          style={{ backgroundColor: 'var(--color-bgAccent)' }}
          width={100}
        >
          <DrawingAreaRect />
          <PiePlot />
        </PolarChart>
      </VStack>

      {/* With asymmetric inset */}
      <VStack gap={2}>
        <Text font="label2">Asymmetric inset</Text>
        <PolarChart
          animate
          height={100}
          inset={{ top: 10, right: 30, bottom: 10, left: 30 }}
          series={[{ id: 'series', data }]}
          style={{ backgroundColor: 'var(--color-bgAccent)' }}
          width={100}
        >
          <DrawingAreaRect />
          <PiePlot />
        </PolarChart>
      </VStack>
    </HStack>
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
      height={100}
      inset={0}
      radialAxis={[
        { id: 'inner', range: ({ max }) => ({ min: 0, max: max - 8 }) },
        { id: 'outer', range: ({ max }) => ({ min: max - 8, max }) },
      ]}
      series={[
        { id: 'categories', data: categoryData, label: 'Categories', radialAxisId: 'inner' },
        { id: 'details', data: detailData, label: 'Details', radialAxisId: 'outer' },
      ]}
      width={100}
    >
      <PiePlot seriesId="categories" strokeWidth={2} />
      <PiePlot cornerRadius={4} seriesId="details" strokeWidth={2} />
    </PolarChart>
  );
};

/**
 * Multi-Axis Example: Top and Bottom Semicircles
 * Demonstrates using multiple angular and radial axes to create complex layouts.
 */
const MultiAxisSemicircles = () => {
  // Top semicircle data
  const topInnerData: PolarDataPoint[] = [
    { value: 30, label: 'Revenue', id: 'revenue', color: 'pink' },
    { value: 50, label: 'Profit', id: 'profit', color: 'pink' },
    { value: 20, label: 'Costs', id: 'costs', color: 'pink' },
  ];

  const topOuterData: PolarDataPoint[] = [
    { value: 15, label: 'Q1', id: 'q1', color: 'red' },
    { value: 15, label: 'Q2', id: 'q2', color: 'red' },
    { value: 25, label: 'Q3', id: 'q3', color: 'red' },
    { value: 25, label: 'Q4', id: 'q4', color: 'red' },
    { value: 10, label: 'Adj', id: 'adj', color: 'red' },
    { value: 10, label: 'Other', id: 'other', color: 'red' },
  ];

  // Bottom semicircle data
  const bottomInnerData: PolarDataPoint[] = [
    { value: 40, label: 'Users', id: 'users', color: 'pink' },
    { value: 35, label: 'Sessions', id: 'sessions', color: 'pink' },
    { value: 25, label: 'Conversions', id: 'conversions', color: 'pink' },
  ];

  const bottomOuterData: PolarDataPoint[] = [
    { value: 20, label: 'Desktop', id: 'desktop', color: 'red' },
    { value: 20, label: 'Mobile', id: 'mobile', color: 'red' },
    { value: 17, label: 'Direct', id: 'direct', color: 'red' },
    { value: 18, label: 'Organic', id: 'organic', color: 'red' },
    { value: 13, label: 'Paid', id: 'paid', color: 'red' },
    { value: 12, label: 'Social', id: 'social', color: 'red' },
  ];

  return (
    <PolarChart
      animate
      angularAxis={[
        { id: 'top', range: { min: -90, max: 90 } },
        { id: 'bottom', range: { min: 90, max: 270 } },
      ]}
      height={100}
      inset={0}
      radialAxis={[
        { id: 'topInner', range: ({ max }) => ({ min: 0, max: max * 0.5 }) },
        { id: 'topOuter', range: ({ max }) => ({ min: max * 0.5, max: max }) },
        { id: 'bottomInner', range: ({ max }) => ({ min: 0, max: max * 0.9 }) },
        { id: 'bottomOuter', range: ({ max }) => ({ min: max * 0.9, max: max }) },
      ]}
      series={[
        { id: 'topInner', data: topInnerData, angularAxisId: 'top', radialAxisId: 'topInner' },
        { id: 'topOuter', data: topOuterData, angularAxisId: 'top', radialAxisId: 'topOuter' },
        {
          id: 'bottomInner',
          data: bottomInnerData,
          angularAxisId: 'bottom',
          radialAxisId: 'bottomInner',
        },
        {
          id: 'bottomOuter',
          data: bottomOuterData,
          angularAxisId: 'bottom',
          radialAxisId: 'bottomOuter',
        },
      ]}
      width={100}
    >
      <PiePlot cornerRadius={4} seriesId="topInner" strokeWidth={2} />
      <PiePlot cornerRadius={4} seriesId="topOuter" strokeWidth={2} />
      <PiePlot cornerRadius={4} seriesId="bottomInner" strokeWidth={2} />
      <PiePlot cornerRadius={4} seriesId="bottomOuter" strokeWidth={2} />
    </PolarChart>
  );
};

/**
 * Multi-Axis Example: Quadrants
 * Demonstrates dividing a circle into four quadrants with independent data.
 */
const QuadrantChart = () => {
  const q1Data: PolarDataPoint[] = [
    { value: 50, label: 'A', id: 'a', color: '#5B8DEF' },
    { value: 30, label: 'B', id: 'b', color: '#4CAF93' },
    { value: 20, label: 'C', id: 'c', color: '#E67C5C' },
  ];

  const q2Data: PolarDataPoint[] = [
    { value: 40, label: 'D', id: 'd', color: '#9B6DD4' },
    { value: 35, label: 'E', id: 'e', color: '#F5A623' },
    { value: 25, label: 'F', id: 'f', color: '#50E3C2' },
  ];

  const q3Data: PolarDataPoint[] = [
    { value: 45, label: 'G', id: 'g', color: '#FF6B9D' },
    { value: 30, label: 'H', id: 'h', color: '#C06C84' },
    { value: 25, label: 'I', id: 'i', color: '#6C5B7B' },
  ];

  const q4Data: PolarDataPoint[] = [
    { value: 35, label: 'J', id: 'j', color: '#FFB6B9' },
    { value: 40, label: 'K', id: 'k', color: '#FFC9B9' },
    { value: 25, label: 'L', id: 'l', color: '#FFE5B9' },
  ];

  return (
    <PolarChart
      animate
      angularAxis={[
        { id: 'q1', range: { min: 0, max: 90 }, paddingAngle: 3 },
        { id: 'q2', range: { min: 90, max: 180 }, paddingAngle: 3 },
        { id: 'q3', range: { min: 180, max: 270 }, paddingAngle: 3 },
        { id: 'q4', range: { min: 270, max: 360 }, paddingAngle: 3 },
      ]}
      height={100}
      inset={0}
      overflow="visible"
      series={[
        { id: 'q1', data: q1Data, angularAxisId: 'q1' },
        { id: 'q2', data: q2Data, angularAxisId: 'q2' },
        { id: 'q3', data: q3Data, angularAxisId: 'q3' },
        { id: 'q4', data: q4Data, angularAxisId: 'q4' },
      ]}
      width={100}
    >
      <PiePlot cornerRadius={6} seriesId="q1" strokeWidth={3} />
      <PiePlot cornerRadius={6} seriesId="q2" strokeWidth={3} />
      <PiePlot cornerRadius={6} seriesId="q3" strokeWidth={3} />
      <PiePlot cornerRadius={6} seriesId="q4" strokeWidth={3} />
    </PolarChart>
  );
};

export const All = () => {
  return (
    <VStack gap={2}>
      <Example title="Multi-Axis: Semicircles">
        <MultiAxisSemicircles />
      </Example>
      <Example title="Multi-Axis: Quadrants">
        <QuadrantChart />
      </Example>
      <Example title="Drawing Area & Inset">
        <DrawingAreaVisualization />
      </Example>
      <Example title="Nested Wallet Breakdown">
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

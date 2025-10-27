import React, { memo, useMemo } from 'react';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';

import { DonutChart } from '../../pie/DonutChart';
import { PieChart } from '../../pie/PieChart';
import { PiePlot } from '../../pie/PiePlot';
import { PolarChart } from '../../PolarChart';
import { getArcPath } from '../../utils/path';
import { usePolarChartContext } from '../PolarChartProvider';

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

  return (
    <VStack gap={4}>
      <Box style={{ width: 100, height: 100, position: 'relative' }}>
        <PolarChart
          animate
          angularAxis={{ range: { min: startAngleDegrees, max: progressAngle } }}
          inset={0}
          radialAxis={{ range: ({ max }) => ({ min: innerRadiusRatio * max, max }) }}
          series={[
            // Foreground: single slice that fills based on progress
            { id: 'progress', data: 100, label: 'Progress', color: 'var(--color-fg)' },
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
          <PiePlot clipPathId="background-clip" cornerRadius={100} />
        </PolarChart>
      </Box>
    </VStack>
  );
};

const WalletBreakdownChart = () => {
  return (
    <DonutChart
      animate
      angularAxis={{ paddingAngle: 3 }}
      cornerRadius={100}
      height={100}
      innerRadiusRatio={0.8}
      inset={0}
      series={[
        { id: 'card', data: 15, label: 'Card', color: '#5B8DEF' },
        { id: 'cash', data: 45, label: 'Cash', color: '#4CAF93' },
        { id: 'stake', data: 12, label: 'Stake', color: '#E67C5C' },
        { id: 'lend', data: 18, label: 'Lend', color: '#6DD4E0' },
      ]}
      width={100}
    />
  );
};

const WalletBreakdownPieChart = () => {
  return (
    <PieChart
      animate
      height={100}
      inset={0}
      series={[
        { id: 'card', data: 15, label: 'Card', color: '#5B8DEF' },
        { id: 'cash', data: 45, label: 'Cash', color: '#4CAF93' },
        { id: 'stake', data: 12, label: 'Stake', color: '#E67C5C' },
        { id: 'lend', data: 18, label: 'Lend', color: '#6DD4E0' },
      ]}
      width={100}
    />
  );
};

const DrawingAreaVisualization = () => {
  const series = [
    { id: 'a', data: 30, label: 'A', color: 'var(--color-accentBoldPurple)' },
    { id: 'b', data: 40, label: 'B', color: 'var(--color-accentBoldBlue)' },
    { id: 'c', data: 30, label: 'C', color: 'var(--color-accentBoldGreen)' },
  ];

  return (
    <HStack gap={4}>
      <VStack gap={2}>
        <Text font="label2">No inset</Text>
        <PolarChart
          animate
          height={100}
          inset={0}
          series={series}
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
          series={series}
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
          series={series}
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
        // Inner pie - main categories
        { id: 'crypto', data: 35, label: 'Crypto', color: '#5B8DEF', radialAxisId: 'inner' },
        { id: 'fiat', data: 45, label: 'Fiat', color: '#4CAF93', radialAxisId: 'inner' },
        { id: 'rewards', data: 20, label: 'Rewards', color: '#E67C5C', radialAxisId: 'inner' },
        // Outer ring - detailed breakdown
        { id: 'btc', data: 15, label: 'Bitcoin', color: '#7FA8F5', radialAxisId: 'outer' },
        { id: 'eth', data: 12, label: 'Ethereum', color: '#95B8F7', radialAxisId: 'outer' },
        { id: 'other-crypto', data: 8, label: 'Other', color: '#ABC8F9', radialAxisId: 'outer' },
        { id: 'usd', data: 30, label: 'USD', color: '#6BC9A9', radialAxisId: 'outer' },
        { id: 'eur', data: 15, label: 'EUR', color: '#8DD9BC', radialAxisId: 'outer' },
        { id: 'cashback', data: 12, label: 'Cash Back', color: '#ED9274', radialAxisId: 'outer' },
        { id: 'points', data: 8, label: 'Points', color: '#F2AB91', radialAxisId: 'outer' },
      ]}
      width={100}
    >
      <PiePlot radialAxisId="inner" strokeWidth={2} />
      <PiePlot cornerRadius={4} radialAxisId="outer" strokeWidth={2} />
    </PolarChart>
  );
};

/**
 * Multi-Axis Example: Top and Bottom Semicircles
 * Demonstrates using multiple angular and radial axes to create complex layouts.
 */
const MultiAxisSemicircles = () => {
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
        // Top semicircle - inner
        {
          id: 'revenue',
          data: 30,
          label: 'Revenue',
          color: 'pink',
          angularAxisId: 'top',
          radialAxisId: 'topInner',
        },
        {
          id: 'profit',
          data: 50,
          label: 'Profit',
          color: 'pink',
          angularAxisId: 'top',
          radialAxisId: 'topInner',
        },
        {
          id: 'costs',
          data: 20,
          label: 'Costs',
          color: 'pink',
          angularAxisId: 'top',
          radialAxisId: 'topInner',
        },
        // Top semicircle - outer
        {
          id: 'q1',
          data: 15,
          label: 'Q1',
          color: 'red',
          angularAxisId: 'top',
          radialAxisId: 'topOuter',
        },
        {
          id: 'q2',
          data: 15,
          label: 'Q2',
          color: 'red',
          angularAxisId: 'top',
          radialAxisId: 'topOuter',
        },
        {
          id: 'q3',
          data: 25,
          label: 'Q3',
          color: 'red',
          angularAxisId: 'top',
          radialAxisId: 'topOuter',
        },
        {
          id: 'q4',
          data: 25,
          label: 'Q4',
          color: 'red',
          angularAxisId: 'top',
          radialAxisId: 'topOuter',
        },
        {
          id: 'adj',
          data: 10,
          label: 'Adj',
          color: 'red',
          angularAxisId: 'top',
          radialAxisId: 'topOuter',
        },
        {
          id: 'other-top',
          data: 10,
          label: 'Other',
          color: 'red',
          angularAxisId: 'top',
          radialAxisId: 'topOuter',
        },
        // Bottom semicircle - inner
        {
          id: 'users',
          data: 40,
          label: 'Users',
          color: 'pink',
          angularAxisId: 'bottom',
          radialAxisId: 'bottomInner',
        },
        {
          id: 'sessions',
          data: 35,
          label: 'Sessions',
          color: 'pink',
          angularAxisId: 'bottom',
          radialAxisId: 'bottomInner',
        },
        {
          id: 'conversions',
          data: 25,
          label: 'Conversions',
          color: 'pink',
          angularAxisId: 'bottom',
          radialAxisId: 'bottomInner',
        },
        // Bottom semicircle - outer
        {
          id: 'desktop',
          data: 20,
          label: 'Desktop',
          color: 'red',
          angularAxisId: 'bottom',
          radialAxisId: 'bottomOuter',
        },
        {
          id: 'mobile',
          data: 20,
          label: 'Mobile',
          color: 'red',
          angularAxisId: 'bottom',
          radialAxisId: 'bottomOuter',
        },
        {
          id: 'direct',
          data: 17,
          label: 'Direct',
          color: 'red',
          angularAxisId: 'bottom',
          radialAxisId: 'bottomOuter',
        },
        {
          id: 'organic',
          data: 18,
          label: 'Organic',
          color: 'red',
          angularAxisId: 'bottom',
          radialAxisId: 'bottomOuter',
        },
        {
          id: 'paid',
          data: 13,
          label: 'Paid',
          color: 'red',
          angularAxisId: 'bottom',
          radialAxisId: 'bottomOuter',
        },
        {
          id: 'social',
          data: 12,
          label: 'Social',
          color: 'red',
          angularAxisId: 'bottom',
          radialAxisId: 'bottomOuter',
        },
      ]}
      width={100}
    >
      <PiePlot angularAxisId="top" cornerRadius={4} radialAxisId="topInner" strokeWidth={2} />
      <PiePlot angularAxisId="top" cornerRadius={4} radialAxisId="topOuter" strokeWidth={2} />
      <PiePlot angularAxisId="bottom" cornerRadius={4} radialAxisId="bottomInner" strokeWidth={2} />
      <PiePlot angularAxisId="bottom" cornerRadius={4} radialAxisId="bottomOuter" strokeWidth={2} />
    </PolarChart>
  );
};

/**
 * Multi-Axis Example: Quadrants
 * Demonstrates dividing a circle into four quadrants with independent data.
 */
const QuadrantChart = () => {
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
        // Quadrant 1 (top-right)
        { id: 'a', data: 50, label: 'A', color: '#5B8DEF', angularAxisId: 'q1' },
        { id: 'b', data: 30, label: 'B', color: '#4CAF93', angularAxisId: 'q1' },
        { id: 'c', data: 20, label: 'C', color: '#E67C5C', angularAxisId: 'q1' },
        // Quadrant 2 (top-left)
        { id: 'd', data: 40, label: 'D', color: '#9B6DD4', angularAxisId: 'q2' },
        { id: 'e', data: 35, label: 'E', color: '#F5A623', angularAxisId: 'q2' },
        { id: 'f', data: 25, label: 'F', color: '#50E3C2', angularAxisId: 'q2' },
        // Quadrant 3 (bottom-left)
        { id: 'g', data: 45, label: 'G', color: '#FF6B9D', angularAxisId: 'q3' },
        { id: 'h', data: 30, label: 'H', color: '#C06C84', angularAxisId: 'q3' },
        { id: 'i', data: 25, label: 'I', color: '#6C5B7B', angularAxisId: 'q3' },
        // Quadrant 4 (bottom-right)
        { id: 'j', data: 35, label: 'J', color: '#FFB6B9', angularAxisId: 'q4' },
        { id: 'k', data: 40, label: 'K', color: '#FFC9B9', angularAxisId: 'q4' },
        { id: 'l', data: 25, label: 'L', color: '#FFE5B9', angularAxisId: 'q4' },
      ]}
      width={100}
    >
      <PiePlot angularAxisId="q1" cornerRadius={6} strokeWidth={3} />
      <PiePlot angularAxisId="q2" cornerRadius={6} strokeWidth={3} />
      <PiePlot angularAxisId="q3" cornerRadius={6} strokeWidth={3} />
      <PiePlot angularAxisId="q4" cornerRadius={6} strokeWidth={3} />
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

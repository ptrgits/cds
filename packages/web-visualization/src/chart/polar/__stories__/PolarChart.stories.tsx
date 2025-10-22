import React, { useState } from 'react';
import { HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';

import { DonutChart } from '../../pie/DonutChart';
import { PieChart } from '../../pie/PieChart';
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
        <Text display="block" font="body" style={{ color: 'var(--color-fgSecondary)' }}>
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

const cryptoPortfolioData: PolarDataPoint[] = [
  { value: 45000, label: 'BTC', id: 'btc' },
  { value: 32000, label: 'ETH', id: 'eth' },
  { value: 15000, label: 'SOL', id: 'sol' },
  { value: 8000, label: 'USDC', id: 'usdc' },
  { value: 5000, label: 'Others', id: 'others' },
];

const revenueData: PolarDataPoint[] = [
  { value: 450, label: 'Trading', id: 'trading', color: 'var(--color-primary)' },
  { value: 280, label: 'Staking', id: 'staking', color: 'var(--color-positive)' },
  { value: 150, label: 'Lending', id: 'lending', color: 'var(--color-info)' },
  { value: 120, label: 'Other', id: 'other', color: 'var(--color-attention)' },
];

// Dominant segment with smaller slices - matches first design
const dominantSegmentData: PolarDataPoint[] = [
  { value: 65, label: 'Primary Asset', id: 'primary', color: '#5b7cfa' },
  { value: 12, label: 'Asset A', id: 'asset-a', color: '#ffc657' },
  { value: 8, label: 'Asset B', id: 'asset-b', color: '#6fdfbd' },
  { value: 8, label: 'Asset C', id: 'asset-c', color: '#5bc9e8' },
  { value: 4, label: 'Asset D', id: 'asset-d', color: '#ff6b8a' },
  { value: 3, label: 'Asset E', id: 'asset-e', color: '#7dd6a0' },
];

// Wallet breakdown - matches second design
const walletBreakdownData: PolarDataPoint[] = [
  { value: 32, label: 'Card', id: 'card', color: '#5b7cfa' },
  { value: 38, label: 'Cash', id: 'cash', color: '#6fdfbd' },
  { value: 18, label: 'Stake', id: 'stake', color: '#ff8b5a' },
  { value: 12, label: 'Lend', id: 'lend', color: '#5bc9e8' },
];

// MUI-inspired test data for comparison
const muiTestData: PolarDataPoint[] = [
  { value: 30, label: 'Windows', id: 'windows', color: '#5b7cfa' },
  { value: 25, label: 'MacOS', id: 'macos', color: '#6fdfbd' },
  { value: 15, label: 'Linux', id: 'linux', color: '#ff8b5a' },
  { value: 15, label: 'Chrome OS', id: 'chromeos', color: '#5bc9e8' },
  { value: 15, label: 'Other', id: 'other', color: '#ffc657' },
];

const BasicPieChart = () => {
  return <PieChart data={sampleData} height={300} label="Portfolio Distribution" width={300} />;
};

const MUIComparisonChart = () => {
  return (
    <DonutChart
      cornerRadius={5}
      data={muiTestData}
      height={300}
      innerRadiusRatio={0.3}
      padAngle={0.0872665} // 5 degrees in radians
      width={300}
    />
  );
};

const BasicDonutChart = () => {
  return (
    <DonutChart
      data={sampleData}
      height={300}
      innerRadiusRatio={0.6}
      label="Portfolio Distribution"
      width={300}
    />
  );
};

const InteractivePieChart = () => {
  const [selectedSlice, setSelectedSlice] = useState<PolarDataPoint | null>(null);

  return (
    <VStack gap={4}>
      <PieChart
        data={cryptoPortfolioData}
        height={400}
        onArcClick={(data, index, event) => {
          setSelectedSlice(data);
        }}
        onArcMouseEnter={(data, index, event) => {
          // Optional: add hover effects
        }}
        onArcMouseLeave={(data, index, event) => {
          // Optional: remove hover effects
        }}
        width={400}
      />
      {selectedSlice && (
        <Text font="body">
          Selected: {selectedSlice.label} - ${selectedSlice.value.toLocaleString()}
        </Text>
      )}
    </VStack>
  );
};

const DonutWithCenterText = () => {
  return (
    <DonutChart data={revenueData} height={300} innerRadiusRatio={0.65} width={300}>
      <text
        dominantBaseline="middle"
        fill="var(--color-fgPrimary)"
        fontSize="32"
        fontWeight="bold"
        textAnchor="middle"
        x="50%"
        y="48%"
      >
        $1,000
      </text>
      <text
        dominantBaseline="middle"
        fill="var(--color-fgSecondary)"
        fontSize="14"
        textAnchor="middle"
        x="50%"
        y="58%"
      >
        Total Revenue
      </text>
    </DonutChart>
  );
};

const CustomStyling = () => {
  return (
    <HStack gap={4}>
      <PieChart
        data={sampleData}
        height={300}
        padAngle={0.02}
        stroke="var(--color-bgPrimary)"
        strokeWidth={2}
        width={300}
      />
      <DonutChart
        cornerRadius={4}
        data={sampleData}
        height={300}
        innerRadiusRatio={0.5}
        padAngle={0.05}
        stroke="var(--color-bgPrimary)"
        strokeWidth={3}
        width={300}
      />
    </HStack>
  );
};

const VariousInnerRadii = () => {
  return (
    <HStack gap={4}>
      <DonutChart
        data={revenueData}
        height={250}
        innerRadiusRatio={0.3}
        label="30% Inner Radius"
        width={250}
      />
      <DonutChart
        data={revenueData}
        height={250}
        innerRadiusRatio={0.5}
        label="50% Inner Radius"
        width={250}
      />
      <DonutChart
        data={revenueData}
        height={250}
        innerRadiusRatio={0.7}
        label="70% Inner Radius"
        width={250}
      />
    </HStack>
  );
};

const AnimatedCharts = () => {
  const [data, setData] = useState(sampleData);

  const randomizeData = () => {
    setData(
      data.map((d) => ({
        ...d,
        value: Math.floor(Math.random() * 50) + 10,
      })),
    );
  };

  return (
    <VStack gap={4}>
      <HStack gap={4}>
        <PieChart animate data={data} height={300} width={300} />
        <DonutChart animate data={data} height={300} innerRadiusRatio={0.6} width={300} />
      </HStack>
      <button
        onClick={randomizeData}
        style={{
          padding: '8px 16px',
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
        type="button"
      >
        Randomize Data
      </button>
    </VStack>
  );
};

const CustomAngles = () => {
  return (
    <HStack gap={4}>
      <PieChart data={sampleData} endAngle={Math.PI} height={300} startAngle={0} width={300} />
      <DonutChart
        data={sampleData}
        endAngle={Math.PI * 1.5}
        height={300}
        innerRadiusRatio={0.5}
        startAngle={-Math.PI * 0.5}
        width={300}
      />
    </HStack>
  );
};

const ResponsiveCharts = () => {
  return (
    <VStack gap={4}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <PieChart data={sampleData} height={400} width="100%" />
      </div>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <DonutChart data={sampleData} height={400} innerRadiusRatio={0.6} width="100%" />
      </div>
    </VStack>
  );
};

const DominantSegmentChart = () => {
  return (
    <DonutChart
      cornerRadius={50}
      data={dominantSegmentData}
      height={400}
      innerRadiusRatio={0.55}
      padAngle={0.03}
      width={400}
    />
  );
};

const WalletBreakdownChart = () => {
  return (
    <DonutChart
      cornerRadius={100}
      data={walletBreakdownData}
      height={350}
      innerRadiusRatio={0.7}
      padAngle={0.05}
      width={350}
    >
      <text
        dominantBaseline="middle"
        fill="var(--color-fgPrimary)"
        fontSize="28"
        fontWeight="600"
        textAnchor="middle"
        x="50%"
        y="50%"
      >
        Wallet
      </text>
    </DonutChart>
  );
};

export const All = () => {
  return (
    <VStack gap={6}>
      <Example
        description="Donut chart matching MUI X Charts defaults for direct comparison. Uses d3-shape's arc generator with cornerRadius=5 and paddingAngle=5°."
        title="MUI X Charts Comparison"
      >
        <MUIComparisonChart />
      </Example>

      <Example
        description="A simple pie chart showing portfolio distribution."
        title="Basic Pie Chart"
      >
        <BasicPieChart />
      </Example>

      <Example
        description="A donut chart with a hollow center for additional context."
        title="Basic Donut Chart"
      >
        <BasicDonutChart />
      </Example>

      <Example
        description="Click on slices to see interactions. Supports onClick, onMouseEnter, and onMouseLeave."
        title="Interactive Chart"
      >
        <InteractivePieChart />
      </Example>

      <Example
        description="Donut charts can display text or components in the center area."
        title="Donut with Center Content"
      >
        <DonutWithCenterText />
      </Example>

      <Example
        description="Customize appearance with padding, strokes, and corner radius."
        title="Custom Styling"
      >
        <CustomStyling />
      </Example>

      <Example
        description="Donut charts support various inner radius ratios."
        title="Various Inner Radii"
      >
        <VariousInnerRadii />
      </Example>

      <Example description="Charts animate smoothly when data changes." title="Animated Charts">
        <AnimatedCharts />
      </Example>

      <Example
        description="Control the start and end angles to create partial circles."
        title="Custom Angles"
      >
        <CustomAngles />
      </Example>

      <Example
        description="Showcases prominent padding angles (gaps between segments) and rounded corners for a modern look. Features one dominant segment with smaller slices."
        title="Dominant Segment Layout"
      >
        <DominantSegmentChart />
      </Example>

      <Example
        description="Demonstrates larger inner radius (thinner ring), rounded corners, and generous padding between segments for a clean, modern appearance."
        title="Wallet Breakdown"
      >
        <WalletBreakdownChart />
      </Example>

      <Example
        description="Charts adapt to container width while maintaining aspect ratio."
        title="Responsive Charts"
      >
        <ResponsiveCharts />
      </Example>
    </VStack>
  );
};

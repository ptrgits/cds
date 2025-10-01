import { forwardRef, memo, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { assets } from '@coinbase/cds-common/internal/data/assets';
import { sparklineInteractiveData } from '@coinbase/cds-common/internal/visualizations/SparklineInteractiveData';
import { useTabsContext } from '@coinbase/cds-common/tabs/TabsContext';
import type { TabValue } from '@coinbase/cds-common/tabs/useTabs';
import { IconButton } from '@coinbase/cds-mobile/buttons';
import { Example, ExampleScreen } from '@coinbase/cds-mobile/examples/ExampleScreen';
import { useTheme } from '@coinbase/cds-mobile/hooks/useTheme';
import { Box, HStack, VStack } from '@coinbase/cds-mobile/layout';
import { type TabComponent, type TabsActiveIndicatorProps } from '@coinbase/cds-mobile/tabs';
import { SegmentedTab, type SegmentedTabProps } from '@coinbase/cds-mobile/tabs/SegmentedTab';

import { LiveTabLabel, PeriodSelector, PeriodSelectorActiveIndicator } from '../PeriodSelector';

const PeriodSelectorExample = () => {
  const tabs = [
    { id: '1H', label: '1H' },
    { id: '1D', label: '1D' },
    { id: '1W', label: '1W' },
    { id: '1M', label: '1M' },
    { id: '1Y', label: '1Y' },
    { id: 'All', label: 'All' },
  ];
  const [activeTab, setActiveTab] = useState<TabValue | null>(tabs[0]);
  return <PeriodSelector activeTab={activeTab} onChange={(tab) => setActiveTab(tab)} tabs={tabs} />;
};

const MinWidthPeriodSelectorExample = () => {
  const tabs = [
    { id: '1H', label: '1H' },
    { id: '1D', label: '1D' },
    { id: '1W', label: '1W' },
    { id: '1M', label: '1M' },
    { id: '1Y', label: '1Y' },
    { id: 'All', label: 'All' },
  ];
  const [activeTab, setActiveTab] = useState<TabValue | null>(tabs[0]);
  return (
    <PeriodSelector
      activeTab={activeTab}
      gap={0.5}
      onChange={(tab) => setActiveTab(tab)}
      tabs={tabs}
      width="fit-content"
    />
  );
};

const LivePeriodSelectorExample = () => {
  const tabs = useMemo(
    () => [
      {
        id: '1H',
        label: <LiveTabLabel />,
      },
      { id: '1D', label: '1D' },
      { id: '1W', label: '1W' },
      { id: '1M', label: '1M' },
      { id: '1Y', label: '1Y' },
      { id: 'All', label: 'All' },
    ],
    [],
  );

  const [activeTab, setActiveTab] = useState<TabValue | null>(tabs[0]);
  const isLive = useMemo(() => activeTab?.id === '1H', [activeTab]);

  const activeBackground = useMemo(() => (!isLive ? 'bgPrimaryWash' : 'bgNegativeWash'), [isLive]);

  return (
    <PeriodSelector
      activeBackground={activeBackground}
      activeTab={activeTab}
      onChange={setActiveTab}
      tabs={tabs}
    />
  );
};

const TooManyPeriodsSelectorExample = () => {
  const theme = useTheme();
  const tabs = useMemo(
    () => [
      {
        id: '1H',
        label: <LiveTabLabel />,
      },
      { id: '1D', label: '1D' },
      { id: '1W', label: '1W' },
      { id: '1M', label: '1M' },
      { id: 'YTD', label: 'YTD' },
      { id: '1Y', label: '1Y' },
      { id: '5Y', label: '5Y' },
      { id: 'All', label: 'All' },
    ],
    [],
  );

  const [activeTab, setActiveTab] = useState<TabValue | null>(tabs[0]);
  const isLive = useMemo(() => activeTab?.id === '1H', [activeTab]);

  const activeBackground = useMemo(() => (!isLive ? 'bgPrimaryWash' : 'bgNegativeWash'), [isLive]);

  // todo: icon button cannot have a height lower than 40px - and our PeriodSelector is 36px
  // We can fix this by making IconButton more extensible
  return (
    <HStack alignItems="center" maxWidth="100%" width="100%">
      <ScrollView
        horizontal
        contentContainerStyle={{
          display: 'flex',
          flexDirection: 'row',
          paddingEnd: theme.space[2],
          justifyContent: 'center',
          alignItems: 'center',
        }}
        showsHorizontalScrollIndicator={false}
      >
        <PeriodSelector
          activeBackground={activeBackground}
          activeTab={activeTab}
          gap={1}
          justifyContent="flex-start"
          onChange={setActiveTab}
          tabs={tabs}
          width="fit-content"
        />
      </ScrollView>
      <IconButton
        compact
        accessibilityLabel="Configure chart"
        flexShrink={0}
        name="filter"
        variant="secondary"
      />
    </HStack>
  );
};

const btcColor = assets.btc.color;

const BTCActiveIndicator = memo((props: TabsActiveIndicatorProps) => (
  <PeriodSelectorActiveIndicator {...props} background={`${btcColor}1A` as any} />
));

BTCActiveIndicator.displayName = 'BTCActiveIndicator';

const BTCActiveExcludingLiveIndicator = memo((props: TabsActiveIndicatorProps) => {
  const theme = useTheme();
  const { activeTab } = useTabsContext();
  const isLive = useMemo(() => activeTab?.id === '1H', [activeTab]);

  const backgroundColor = useMemo(
    () => (isLive ? theme.color.bgNegativeWash : `${btcColor}1A`),
    [isLive, theme.color.bgNegativeWash],
  );

  return <PeriodSelectorActiveIndicator {...props} background={backgroundColor as any} />;
});

BTCActiveExcludingLiveIndicator.displayName = 'BTCActiveExcludingLiveIndicator';

const BTCTab: TabComponent = memo(
  forwardRef(({ label, ...props }: SegmentedTabProps, ref: React.ForwardedRef<any>) => {
    const theme = useTheme();

    // Determine the active color based on theme - use the raw color string for animation
    const btcActiveColorKey = useMemo(() => {
      // For light mode, we'll need to use the hex directly as it's not a theme color
      // For dark mode, we can use the BTC color
      return theme.activeColorScheme === 'light' ? '#593203' : btcColor;
    }, [theme.activeColorScheme]);

    return (
      <SegmentedTab
        ref={ref}
        activeColor={btcActiveColorKey as any}
        font="label1"
        label={label}
        {...props}
      />
    );
  }),
);

BTCTab.displayName = 'BTCTab';

const ColoredPeriodSelectorExample = () => {
  const theme = useTheme();

  const liveLabelColor = theme.activeColorScheme === 'light' ? '#593203' : btcColor;

  const tabs = [
    {
      id: '1H',
      label: (
        <LiveTabLabel
          styles={{ text: { color: liveLabelColor }, dot: { backgroundColor: liveLabelColor } }}
        />
      ),
    },
    { id: '1D', label: '1D' },
    { id: '1W', label: '1W' },
    { id: '1M', label: '1M' },
    { id: '1Y', label: '1Y' },
    { id: 'All', label: 'All' },
  ];
  const [activeTab, setActiveTab] = useState<TabValue | null>(tabs[0]);

  return (
    <PeriodSelector
      TabComponent={BTCTab}
      TabsActiveIndicatorComponent={BTCActiveIndicator}
      activeTab={activeTab}
      onChange={(tab) => setActiveTab(tab)}
      tabs={tabs}
    />
  );
};

const ColoredExcludingLivePeriodSelectorExample = () => {
  const tabs = [
    { id: '1H', label: <LiveTabLabel /> },
    { id: '1D', label: '1D' },
    { id: '1W', label: '1W' },
    { id: '1M', label: '1M' },
    { id: '1Y', label: '1Y' },
    { id: 'All', label: 'All' },
  ];
  const [activeTab, setActiveTab] = useState<TabValue | null>(tabs[0]);

  return (
    <PeriodSelector
      TabComponent={BTCTab}
      TabsActiveIndicatorComponent={BTCActiveExcludingLiveIndicator}
      activeTab={activeTab}
      onChange={(tab) => setActiveTab(tab)}
      tabs={tabs}
    />
  );
};

const ColorShiftPeriodSelectorExample = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabValue | null>({ id: '1H', label: '1H' });

  const tabConversion = {
    '1H': 'hour',
    '1D': 'day',
    '1W': 'week',
    '1M': 'month',
    '1Y': 'year',
    All: 'all',
  };

  const currentPriceData = activeTab
    ? sparklineInteractiveData[
        tabConversion[
          activeTab.id as keyof typeof tabConversion
        ] as keyof typeof sparklineInteractiveData
      ]
    : sparklineInteractiveData.hour;

  const currentData = useMemo(
    () => [...currentPriceData.map((price) => price.value)],
    [currentPriceData],
  );

  const startPrice = currentData[0];
  const currentPrice = currentData[currentData.length - 1];
  const priceChange = currentPrice - startPrice;

  // Determine colors based on trend
  const trendColor = useMemo(() => {
    return priceChange >= 0 ? theme.color.fgPositive : theme.color.fgNegative;
  }, [priceChange, theme.color.fgPositive, theme.color.fgNegative]);

  const activeBackground = useMemo(() => {
    return priceChange >= 0 ? 'bgPositiveWash' : 'bgNegativeWash';
  }, [priceChange]);

  const tabs = useMemo(
    () => [
      {
        id: '1H',
        label: (
          <LiveTabLabel
            styles={{ text: { color: trendColor }, dot: { backgroundColor: trendColor } }}
          />
        ),
      },
      { id: '1D', label: '1D' },
      { id: '1W', label: '1W' },
      { id: '1M', label: '1M' },
      { id: '1Y', label: '1Y' },
      { id: 'All', label: 'All' },
    ],
    [trendColor],
  );

  // Custom tab component that uses the trend color for both active and inactive states
  const ColorShiftTab: TabComponent = useMemo(
    () =>
      memo(
        forwardRef(({ label, ...props }: SegmentedTabProps, ref: React.ForwardedRef<any>) => {
          return (
            <SegmentedTab
              ref={ref}
              activeColor={trendColor as any}
              color={trendColor as any}
              font="label1"
              label={label}
              {...props}
            />
          );
        }),
      ),
    [trendColor],
  );

  return (
    <PeriodSelector
      TabComponent={ColorShiftTab}
      activeBackground={activeBackground}
      activeTab={activeTab}
      onChange={setActiveTab}
      tabs={tabs}
    />
  );
};

const PeriodSelectorStories = () => {
  return (
    <ExampleScreen>
      <Example title="Basic Example">
        <PeriodSelectorExample />
      </Example>
      <Example title="Min Width Period Selector">
        <MinWidthPeriodSelectorExample />
      </Example>
      <Example title="Live Period Selector">
        <LivePeriodSelectorExample />
      </Example>
      <Example title="Period Selector with Overflow & Button">
        <TooManyPeriodsSelectorExample />
      </Example>
      <Example title="Colored Period Selector">
        <ColoredPeriodSelectorExample />
      </Example>
      <Example title="Colored Excluding Live Period Selector">
        <ColoredExcludingLivePeriodSelectorExample />
      </Example>
      <Example title="Color Shift Period Selector">
        <ColorShiftPeriodSelectorExample />
      </Example>
    </ExampleScreen>
  );
};

export default PeriodSelectorStories;

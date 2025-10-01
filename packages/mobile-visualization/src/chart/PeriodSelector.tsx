import React, { forwardRef, memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@coinbase/cds-mobile/hooks/useTheme';
import {
  SegmentedTabs,
  type SegmentedTabsProps,
  type TabComponent,
  type TabsActiveIndicatorProps,
} from '@coinbase/cds-mobile/tabs';
import { SegmentedTab, type SegmentedTabProps } from '@coinbase/cds-mobile/tabs/SegmentedTab';
import { tabsSpringConfig } from '@coinbase/cds-mobile/tabs/Tabs';
import { Text, type TextBaseProps } from '@coinbase/cds-mobile/typography/Text';

// todo: apply this to normal segmented tabs?
// Animated active indicator to support smooth transition of position and size
export const PeriodSelectorActiveIndicator = ({
  activeTabRect,
  background = 'bgPrimaryWash',
  position = 'absolute',
  borderRadius = 1000,
}: TabsActiveIndicatorProps) => {
  const theme = useTheme();
  const { width, height, x } = activeTabRect;

  // Get the background color
  const backgroundColorKey = background as keyof typeof theme.color;
  const backgroundColor = theme.color[backgroundColorKey] || background;

  // Track previous values for first render detection
  const previousActiveTabRect = React.useRef(activeTabRect);

  // Animated value for position and size only
  const animatedValues = useSharedValue({ x, width });

  const isFirstRenderWithWidth =
    previousActiveTabRect.current.width === 0 && activeTabRect.width > 0;

  if (previousActiveTabRect.current !== activeTabRect) {
    previousActiveTabRect.current = activeTabRect;
    const newAnimatedValues = { x, width };
    animatedValues.value = isFirstRenderWithWidth
      ? newAnimatedValues
      : withSpring(newAnimatedValues, tabsSpringConfig);
  }

  const animatedStyles = useAnimatedStyle(
    () => ({
      transform: [{ translateX: animatedValues.value.x }],
      width: animatedValues.value.width,
    }),
    [animatedValues],
  );

  if (!width) return null;

  return (
    <Animated.View
      style={[
        {
          position: position as any,
          height,
          borderRadius,
          backgroundColor,
        },
        animatedStyles,
      ]}
      testID="period-selector-active-indicator"
    />
  );
};

export type LiveTabLabelBaseProps = TextBaseProps & {
  /**
   * The label to display.
   * @default 'LIVE'
   */
  label?: string;
  /**
   * Whether to hide the dot.
   */
  hideDot?: boolean;
  /**
   * Whether to disable the pulse animation.
   */
  disablePulse?: boolean;
  /**
   * Style overrides for different parts of the component
   */
  styles?: {
    /** Style for the root container */
    root?: StyleProp<ViewStyle>;
    /** Style for the dot */
    dot?: StyleProp<ViewStyle>;
    /** Style for the text */
    text?: StyleProp<TextStyle>;
  };
};

export type LiveTabLabelProps = LiveTabLabelBaseProps;

const defaultRootStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
};

export const LiveTabLabel = memo(
  forwardRef<View, LiveTabLabelProps>(
    (
      {
        color = 'fgNegative',
        label = 'LIVE',
        font = 'label1',
        hideDot,
        disablePulse,
        styles,
        ...props
      },
      ref,
    ) => {
      const theme = useTheme();
      const opacity = useSharedValue(1);

      useEffect(() => {
        if (!disablePulse) {
          // Pulse animation: 1 -> 0 -> 1, repeating infinitely
          // Total duration: 2 seconds (matching web's pulseTransitionConfig)
          opacity.value = withRepeat(
            withSequence(
              withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
              withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            ),
            -1, // -1 means infinite repeats
            false,
          );
        }
      }, [disablePulse, opacity]);

      const dotStyle = useMemo(
        () => [
          {
            width: theme.space[1],
            height: theme.space[1],
            borderRadius: 1000,
            marginRight: theme.space[0.75],
            backgroundColor: color && theme.color[color],
          },
          styles?.dot,
        ],
        [theme.space, theme.color, color, styles?.dot],
      );

      const animatedDotStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
      }));

      const containerStyle = useMemo(() => [defaultRootStyle, styles?.root], [styles?.root]);

      return (
        <View ref={ref} style={containerStyle}>
          {!hideDot && <Animated.View style={[dotStyle, !disablePulse && animatedDotStyle]} />}
          <Text color={color} font={font} style={styles?.text} {...props}>
            {label}
          </Text>
        </View>
      );
    },
  ),
);

// Custom tab component with primary color for active state
const PeriodSelectorTab: TabComponent = memo(
  forwardRef((props: SegmentedTabProps, ref: React.ForwardedRef<any>) => (
    <SegmentedTab ref={ref} activeColor="fgPrimary" font="label1" {...props} />
  )),
);

export type PeriodSelectorProps = SegmentedTabsProps;

/**
 * PeriodSelector is a specialized version of SegmentedTabs optimized for chart period selection.
 * It provides transparent background, primary wash active state, and full-width layout by default.
 */
export const PeriodSelector = memo(
  forwardRef(
    (
      {
        background = 'transparent',
        activeBackground = 'bgPrimaryWash',
        width = '100%',
        justifyContent = 'space-between',
        TabComponent = PeriodSelectorTab,
        TabsActiveIndicatorComponent = PeriodSelectorActiveIndicator,
        ...props
      }: PeriodSelectorProps,
      ref: React.ForwardedRef<any>,
    ) => (
      <SegmentedTabs
        ref={ref}
        TabComponent={TabComponent}
        TabsActiveIndicatorComponent={TabsActiveIndicatorComponent}
        activeBackground={activeBackground}
        background={background}
        justifyContent={justifyContent}
        width={width}
        {...props}
      />
    ),
  ),
);

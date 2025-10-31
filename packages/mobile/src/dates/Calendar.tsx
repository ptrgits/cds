import { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type StyleProp, StyleSheet, type View, type ViewStyle } from 'react-native';
import { generateCalendarMonth } from '@coinbase/cds-common/dates/generateCalendarMonth';
import { getMidnightDate } from '@coinbase/cds-common/dates/getMidnightDate';
import { getTimesFromDatesAndRanges } from '@coinbase/cds-common/dates/getTimesFromDatesAndRanges';
import { useLocale } from '@coinbase/cds-common/system/LocaleProvider';
import { accessibleOpacityDisabled } from '@coinbase/cds-common/tokens/interactable';

import { useA11y } from '../hooks/useA11y';
import { Icon } from '../icons/Icon';
import { Box } from '../layout/Box';
import { HStack } from '../layout/HStack';
import { VStack, type VStackProps } from '../layout/VStack';
import { Tooltip } from '../overlays/tooltip/Tooltip';
import { Pressable, type PressableBaseProps } from '../system/Pressable';
import { Text } from '../typography/Text';

const CALENDAR_DAY_SIZE = 40;
// Delay for initial focus - waiting for Calendar date refs to populate after mount
const A11Y_INITIAL_FOCUS_DELAY_MS = 300;

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});

export type CalendarPressableBaseProps = PressableBaseProps & {
  borderRadius?: number;
  width?: number;
  height?: number;
  background?: 'transparent' | 'bg' | 'bgPrimary';
};

const CalendarPressable = memo(
  forwardRef<View, CalendarPressableBaseProps>(
    (
      {
        background = 'transparent',
        borderRadius = 1000,
        width = CALENDAR_DAY_SIZE,
        height = CALENDAR_DAY_SIZE,
        children,
        ...props
      },
      ref,
    ) => {
      return (
        <Pressable
          ref={ref}
          background={background}
          borderRadius={borderRadius}
          contentStyle={styles.pressable}
          height={height}
          width={width}
          {...props}
        >
          {children}
        </Pressable>
      );
    },
  ),
);

CalendarPressable.displayName = 'CalendarPressable';

export type CalendarDayProps = {
  /** Date of this CalendarDay. */
  date: Date;
  /** Callback function fired when pressing this CalendarDay. */
  onPress?: (date: Date) => void;
  /** Toggle active styles. */
  active?: boolean;
  /** Disables user interaction. */
  disabled?: boolean;
  /** Toggle highlighted styles. */
  highlighted?: boolean;
  /** Toggle today's date styles. */
  isToday?: boolean;
  /** Toggle current month styles. */
  isCurrentMonth?: boolean;
  /** Tooltip content shown when hovering or focusing a disabled Calendar Day. */
  disabledError?: string;
};

const getDayAccessibilityLabel = (date: Date, locale = 'en-US') =>
  `${date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
  })} ${date.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })}`;

const CalendarDay = memo(
  forwardRef<View, CalendarDayProps>(
    (
      {
        date,
        active,
        disabled,
        highlighted,
        isToday,
        isCurrentMonth,
        onPress,
        disabledError = 'Date unavailable',
      },
      ref,
    ) => {
      const { locale } = useLocale();
      const handlePress = useCallback(() => onPress?.(date), [date, onPress]);
      const accessibilityLabel = getDayAccessibilityLabel(date, locale);

      if (!isCurrentMonth) {
        return <Box height={CALENDAR_DAY_SIZE} width={CALENDAR_DAY_SIZE} />;
      }

      // Render disabled dates as non-interactive elements
      if (disabled) {
        const disabledDayView = (
          <Box
            ref={ref}
            alignItems="center"
            background="bg"
            borderColor={isToday ? 'bgPrimary' : undefined}
            borderRadius={1000}
            bordered={isToday}
            height={CALENDAR_DAY_SIZE}
            justifyContent="center"
            opacity={0.4}
            width={CALENDAR_DAY_SIZE}
          >
            <Text align="center" color={highlighted ? 'fgPrimary' : 'fgMuted'} font="body">
              {date.getDate()}
            </Text>
          </Box>
        );

        return (
          <Tooltip
            triggerDisabled
            accessibilityLabel={`${accessibilityLabel}. Disabled. ${disabledError}.`}
            content={disabledError}
          >
            {disabledDayView}
          </Tooltip>
        );
      }

      // Render interactive dates as Pressable buttons
      return (
        <CalendarPressable
          ref={ref}
          accessibilityHint={isToday ? 'Today' : undefined}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          background={active ? 'bgPrimary' : 'bg'}
          borderColor={isToday ? 'bgPrimary' : undefined}
          bordered={isToday}
          feedback="light"
          onPress={handlePress}
        >
          <Text
            align="center"
            color={active ? 'fgInverse' : highlighted ? 'fgPrimary' : undefined}
            font="body"
          >
            {date.getDate()}
          </Text>
        </CalendarPressable>
      );
    },
  ),
);

CalendarDay.displayName = 'CalendarDay';

export type CalendarBaseProps = {
  /** Currently selected Calendar date. Date used to generate the Calendar month. Will be rendered with active styles. */
  selectedDate?: Date | null;
  /** Date used to generate the Calendar month when there is no value for the `selectedDate` prop, defaults to today. */
  seedDate?: Date;
  /** Callback function fired when pressing a Calendar date. */
  onPressDate?: (date: Date) => void;
  /** Disables user interaction. */
  disabled?: boolean;
  /** Hides the Calendar next and previous month arrows, but does not prevent navigating to the next or previous months via keyboard. This probably only makes sense to be used when `minDate` and `maxDate` are set to the first and last days of the same month. */
  hideControls?: boolean;
  /** Array of disabled dates, and date tuples for date ranges. Make sure to set `disabledDateError` as well. A number is created for every individual date within a tuple range, so do not abuse this with massive ranges. */
  disabledDates?: (Date | [Date, Date])[];
  /** Array of highlighted dates, and date tuples for date ranges. A number is created for every individual date within a tuple range, so do not abuse this with massive ranges. */
  highlightedDates?: (Date | [Date, Date])[];
  /** Minimum date allowed to be selected, inclusive. Dates before the `minDate` are disabled. All navigation to months before the `minDate` is disabled. */
  minDate?: Date;
  /** Maximum date allowed to be selected, inclusive. Dates after the `maxDate` are disabled. All navigation to months after the `maxDate` is disabled. */
  maxDate?: Date;
  /**
   * Tooltip content shown when hovering or focusing a disabled date, including dates before the `minDate` or after the `maxDate`.
   * @default 'Date unavailable'
   */
  disabledDateError?: string;
  /**
   * Accessibility label describing the Calendar next month arrow.
   * @default 'Go to next month'
   */
  nextArrowAccessibilityLabel?: string;
  /**
   * Accessibility label describing the Calendar previous month arrow.
   * @default 'Go to previous month'
   */
  previousArrowAccessibilityLabel?: string;
  /** Used to locate this element in unit and end-to-end tests. */
  testID?: string;
  /** Custom style to apply to the Calendar container. */
  style?: StyleProp<ViewStyle>;
};

export type CalendarProps = CalendarBaseProps & Omit<VStackProps, 'children' | 'ref'>;

// These could be dynamically generated, but our Calendar and DatePicker aren't localized so there's no point
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const Calendar = memo(
  forwardRef<View, CalendarProps>(
    (
      {
        selectedDate,
        seedDate,
        onPressDate,
        disabled,
        hideControls,
        disabledDates,
        highlightedDates,
        minDate,
        maxDate,
        disabledDateError = 'Date unavailable',
        nextArrowAccessibilityLabel = 'Go to next month',
        previousArrowAccessibilityLabel = 'Go to previous month',
        testID,
        style,
        ...props
      },
      ref,
    ) => {
      const { setA11yFocus } = useA11y();
      const today = useMemo(() => getMidnightDate(new Date()), []);

      // Determine default calendar seed date: use whichever comes first between maxDate and today
      const defaultSeedDate = useMemo<Date>(() => {
        if (selectedDate) {
          return selectedDate;
        }
        if (seedDate) {
          return seedDate;
        }
        if (maxDate) {
          const maxDateTime = getMidnightDate(maxDate).getTime();
          const todayTime = today.getTime();
          return maxDateTime < todayTime ? maxDate : today;
        }
        return today;
      }, [selectedDate, seedDate, maxDate, today]);

      const [calendarSeedDate, setCalendarSeedDate] = useState<Date>(defaultSeedDate);

      // Refs to track date buttons for focus management
      const dateRefs = useRef<Map<number, View>>(new Map());
      const hasInitializedFocusRef = useRef(false);
      const calendarMonth = useMemo(
        () => generateCalendarMonth(calendarSeedDate),
        [calendarSeedDate],
      );

      const selectedTime = useMemo(
        () => (selectedDate ? getMidnightDate(selectedDate).getTime() : null),
        [selectedDate],
      );

      const disabledTimes = useMemo(
        () => new Set(getTimesFromDatesAndRanges(disabledDates || [])),
        [disabledDates],
      );

      // Callback for setting date refs
      const setDateRef = useCallback((time: number, node: View | null) => {
        if (node) {
          dateRefs.current.set(time, node);
        } else {
          dateRefs.current.delete(time);
        }
      }, []);

      // Handle date selection with focus management
      const handleDatePress = useCallback(
        (date: Date) => {
          onPressDate?.(date);

          // Note: We don't need to re-focus the button after selection.
          // The button remains focused after activation, and both TalkBack and VoiceOver
          // automatically announce the updated accessibilityState={{ selected: true }}.
        },
        [onPressDate],
      );

      // Set initial focus on mount
      useEffect(() => {
        if (disabled || hasInitializedFocusRef.current) {
          return;
        }

        hasInitializedFocusRef.current = true;

        // Focus on selected date or today
        const focusTime = selectedTime || today.getTime();

        const timeoutId = setTimeout(() => {
          const dateButton = dateRefs.current.get(focusTime);
          if (dateButton) {
            setA11yFocus({ current: dateButton });
          }
        }, A11Y_INITIAL_FOCUS_DELAY_MS);

        return () => {
          clearTimeout(timeoutId);
        };
      }, [disabled, selectedTime, today, setA11yFocus]);

      const minTime = useMemo(() => minDate && getMidnightDate(minDate).getTime(), [minDate]);

      const maxTime = useMemo(() => maxDate && getMidnightDate(maxDate).getTime(), [maxDate]);

      const highlightedTimes = useMemo(
        () => new Set(getTimesFromDatesAndRanges(highlightedDates || [])),
        [highlightedDates],
      );

      const handleGoNextMonth = useCallback(
        () => setCalendarSeedDate((s) => new Date(s.getFullYear(), s.getMonth() + 1, 1)),
        [setCalendarSeedDate],
      );

      const handleGoPreviousMonth = useCallback(
        () => setCalendarSeedDate((s) => new Date(s.getFullYear(), s.getMonth() - 1, 1)),
        [setCalendarSeedDate],
      );

      const disableGoNextMonth = useMemo(() => {
        if (disabled) {
          return true;
        }
        const firstDateOfNextMonth = new Date(
          calendarSeedDate.getFullYear(),
          calendarSeedDate.getMonth() + 1,
          1,
        );
        return maxTime ? maxTime < firstDateOfNextMonth.getTime() : false;
      }, [maxTime, calendarSeedDate, disabled]);

      const disableGoPreviousMonth = useMemo(() => {
        if (disabled) {
          return true;
        }
        const lastDateOfPreviousMonth = new Date(
          calendarSeedDate.getFullYear(),
          calendarSeedDate.getMonth(),
          0,
        );
        return minTime ? minTime > lastDateOfPreviousMonth.getTime() : false;
      }, [minTime, calendarSeedDate, disabled]);

      // Split calendar month into weeks (rows of 7 days)
      const calendarWeeks = useMemo(() => {
        const weeks = [];
        for (let i = 0; i < calendarMonth.length; i += 7) {
          weeks.push(calendarMonth.slice(i, i + 7));
        }
        return weeks;
      }, [calendarMonth]);

      return (
        <VStack
          ref={ref}
          background="bg"
          borderRadius={400}
          opacity={disabled ? accessibleOpacityDisabled : undefined}
          overflow="hidden"
          padding={2}
          style={style}
          testID={testID}
          {...props}
        >
          <HStack
            alignItems="center"
            justifyContent="space-between"
            paddingBottom={2}
            paddingX={1.5}
          >
            <Text accessibilityRole="header" font="headline">
              {calendarSeedDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            {!hideControls && (
              <HStack gap={1}>
                <CalendarPressable
                  accessibilityLabel={previousArrowAccessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !!disableGoPreviousMonth }}
                  background="bg"
                  disabled={disableGoPreviousMonth}
                  feedback="light"
                  onPress={disableGoPreviousMonth ? undefined : handleGoPreviousMonth}
                >
                  <Icon color="fg" name="backArrow" size="s" />
                </CalendarPressable>
                <CalendarPressable
                  accessibilityLabel={nextArrowAccessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !!disableGoNextMonth }}
                  background="bg"
                  disabled={disableGoNextMonth}
                  feedback="light"
                  onPress={disableGoNextMonth ? undefined : handleGoNextMonth}
                >
                  <Icon color="fg" name="forwardArrow" size="s" />
                </CalendarPressable>
              </HStack>
            )}
          </HStack>

          {/* Days of week header */}
          <HStack aria-hidden={true} gap={1} justifyContent="space-between" paddingBottom={1}>
            {daysOfWeek.map((day) => (
              <Box
                key={day}
                alignItems="center"
                height={CALENDAR_DAY_SIZE}
                justifyContent="center"
                width={CALENDAR_DAY_SIZE}
              >
                <Text font="body" userSelect="none">
                  {day.charAt(0)}
                </Text>
              </Box>
            ))}
          </HStack>

          {/* Calendar grid - weeks */}
          <VStack gap={1}>
            {calendarWeeks.map((week, weekIndex) => (
              <HStack key={weekIndex} gap={1} justifyContent="space-between">
                {week.map((date) => {
                  const time = date.getTime();
                  return (
                    <CalendarDay
                      key={time}
                      ref={(node) => setDateRef(time, node)}
                      active={time === selectedTime}
                      date={date}
                      disabled={
                        disabled ||
                        (minTime !== undefined && minTime !== null && time < minTime) ||
                        (maxTime !== undefined && maxTime !== null && time > maxTime) ||
                        disabledTimes.has(time)
                      }
                      disabledError={disabledDateError}
                      highlighted={highlightedTimes.has(time)}
                      isCurrentMonth={date.getMonth() === calendarSeedDate.getMonth()}
                      isToday={time === today.getTime()}
                      onPress={handleDatePress}
                    />
                  );
                })}
              </HStack>
            ))}
          </VStack>
        </VStack>
      );
    },
  ),
);

Calendar.displayName = 'Calendar';

import { forwardRef, memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  type NativeSyntheticEvent,
  type StyleProp,
  type TextInput,
  type TextInputChangeEventData,
  View,
  type ViewStyle,
} from 'react-native';
import { type DateInputValidationError } from '@coinbase/cds-common/dates/DateInputValidationError';

import { Button } from '../buttons/Button';
import { InputIconButton } from '../controls/InputIconButton';
import { useA11y } from '../hooks/useA11y';
import { VStack } from '../layout/VStack';
import { Tray } from '../overlays/tray/Tray';

import { Calendar, type CalendarProps } from './Calendar';
import { DateInput, type DateInputProps } from './DateInput';

export type DatePickerProps = {
  /** Control the date value of the DatePicker. */
  date: Date | null;
  /** Callback function fired when the date changes, e.g. when a valid date is selected or unselected. */
  onChangeDate: (selectedDate: Date | null) => void;
  /** Control the error value of the DatePicker. */
  error: DateInputValidationError | null;
  /** Callback function fired when validation finds an error, e.g. required input fields and impossible or disabled dates. Will always be called after `onChangeDate`. */
  onErrorDate: (error: DateInputValidationError | null) => void;
  /** Disables user interaction. */
  disabled?: boolean;
  /** Array of disabled dates, and date tuples for date ranges. Make sure to set `disabledDateError` as well. A number is created for every individual date within a tuple range, so do not abuse this with massive ranges. */
  disabledDates?: (Date | [Date, Date])[];
  /** Minimum date allowed to be selected, inclusive. Dates before the `minDate` are disabled. All navigation to months before the `minDate` is disabled. */
  minDate?: Date;
  /** Maximum date allowed to be selected, inclusive. Dates after the `maxDate` are disabled. All navigation to months after the `maxDate` is disabled. */
  maxDate?: Date;
  /**
   * Error text to display when a disabled date is selected with the DateInput, including dates before the `minDate` or after the `maxDate`.
   * @default 'Date unavailable'
   */
  disabledDateError?: string;
  /** Callback function fired when the DateInput text value changes. Prefer to use `onChangeDate` instead. Will always be called before `onChangeDate`. This prop should only be used for edge cases, such as custom error handling.  */
  onChange?: (event: NativeSyntheticEvent<TextInputChangeEventData>) => void;
  /** Callback function fired when the picker is opened.  */
  onOpen?: () => void;
  /** Callback function fired when the picker is closed. Will always be called after `onCancel`, `onConfirm`, and `onChangeDate`.  */
  onClose?: () => void;
  /** Callback function fired when the user selects a date using the picker. Interacting with the DateInput does not fire this callback. Will always be called before `onClose`. */
  onConfirm?: () => void;
  /** Callback function fired when the user closes the picker without selecting a date. Interacting with the DateInput does not fire this callback. Will always be called before `onClose`. */
  onCancel?: () => void;
  /**
   * If `true`, the focus trap will restore focus to the previously focused element when it unmounts.
   *
   * WARNING: If you disable this, you need to ensure that focus is restored properly so it doesn't end up on the body
   * @default true
   */
  restoreFocusOnUnmount?: boolean;
  /**
   * Accessibility label describing the calendar IconButton, which opens the calendar when pressed.
   * @default 'Open calendar'
   */
  calendarIconButtonAccessibilityLabel?: string;
  /**
   * Accessibility label for the handle bar that closes the picker.
   * @default 'Close calendar'
   */
  handleBarAccessibilityLabel?: string;
  dateInputStyle?: StyleProp<ViewStyle>;
  /**
   * Text to display on the confirm button.
   * @default 'Confirm'
   */
  confirmText?: string;
  /**
   * Accessibility label for the confirm button.
   * @default 'Confirm date selection'
   */
  confirmButtonAccessibilityLabel?: string;
  /**
   * Accessibility hint for the confirm button in its disabled state.
   * Only applies when no date is selected. When a date is selected, no hint is shown.
   * @default 'Select a date first'
   */
  confirmButtonDisabledAccessibilityHint?: string;
  /** Custom style to apply to the Calendar container. */
  calendarStyle?: StyleProp<ViewStyle>;
} & Omit<
  DateInputProps,
  | 'date'
  | 'separator'
  | 'onChangeDate'
  | 'disabledDates'
  | 'minDate'
  | 'maxDate'
  | 'disabledDateError'
  | 'style'
> &
  Pick<
    CalendarProps,
    | 'seedDate'
    | 'highlightedDates'
    | 'nextArrowAccessibilityLabel'
    | 'previousArrowAccessibilityLabel'
  >;

export const DatePicker = memo(
  forwardRef<View, DatePickerProps>(
    (
      {
        date,
        calendarStyle,
        highlightedDates,
        nextArrowAccessibilityLabel,
        previousArrowAccessibilityLabel,
        disabledDates,
        onChangeDate,
        error,
        onErrorDate,
        required,
        disabled,
        seedDate,
        minDate,
        maxDate,
        requiredError = 'This field is required',
        invalidDateError = 'Please enter a valid date',
        disabledDateError = 'Date unavailable',
        label,
        accessibilityHint = 'Enter date or select from calendar using the calendar button.',
        accessibilityLabel,
        accessibilityLabelledBy,
        calendarIconButtonAccessibilityLabel = 'Open calendar',
        handleBarAccessibilityLabel = 'Close calendar',
        restoreFocusOnUnmount = true,
        dateInputStyle,
        compact,
        variant,
        confirmText = 'Confirm',
        confirmButtonDisabledAccessibilityHint = 'Select a date first',
        confirmButtonAccessibilityLabel = 'Confirm date selection',
        helperText,
        onOpen,
        onClose,
        onConfirm,
        onCancel,
        onChange,
        ...props
      },
      ref,
    ) => {
      const { setA11yFocus } = useA11y();
      const [showPicker, setShowPicker] = useState(false);
      const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(null);
      const dateInputRef = useRef<TextInput | null>(null);
      const calendarButtonRef = useRef<View | null>(null);

      /**
       * Be careful to preserve the correct event orders
       *   1. Selecting a date with the picker:                onOpen -> onConfirm -> onChangeDate -> onErrorDate -> onClose
       *   2. Closing the picker without selecting a date:     onOpen -> onCancel -> onClose
       *   3. Typing a date in a blank DateInput:                     onChange -> onChange -> ... -> onChangeDate -> onErrorDate
       *   4. Typing a date in a DateInput that already had a date:   onChange -> onChangeDate -> onChange -> onChange -> ... -> onChangeDate -> onErrorDate
       */

      const handleOpenPicker = useCallback(() => {
        onOpen?.();
        setCalendarSelectedDate(date); // Initialize with current date
        setShowPicker(true);
      }, [onOpen, date]);

      const handleClosePicker = useCallback(() => {
        onClose?.();
        setShowPicker(false);

        // Restore focus to the calendar button when picker closes
        if (restoreFocusOnUnmount && calendarButtonRef.current) {
          setA11yFocus(calendarButtonRef);
        }
      }, [onClose, restoreFocusOnUnmount, setA11yFocus]);

      const handleConfirmPicker = useCallback(
        (date: Date) => {
          onConfirm?.();
          onChangeDate(date);
          if (error && error.type !== 'custom') {
            onErrorDate(null);
          }
          handleClosePicker();
        },
        [onChangeDate, onConfirm, error, onErrorDate, handleClosePicker],
      );

      const handleCancelPicker = useCallback(() => {
        onCancel?.();
        setCalendarSelectedDate(null); // Reset calendar selection
        handleClosePicker();
      }, [onCancel, handleClosePicker]);

      const handleCalendarDatePress = useCallback((selectedDate: Date) => {
        // Update local state, user must press confirm button
        setCalendarSelectedDate(selectedDate);
      }, []);

      const handleConfirmCalendar = useCallback(() => {
        if (calendarSelectedDate) {
          handleConfirmPicker(calendarSelectedDate);
        }
      }, [calendarSelectedDate, handleConfirmPicker]);

      const dateInputCalendarButton = useMemo(
        () => (
          <VStack ref={calendarButtonRef} paddingEnd={0.5}>
            <InputIconButton
              disableInheritFocusStyle
              transparent
              accessibilityLabel={calendarIconButtonAccessibilityLabel}
              name="calendarEmpty"
              onPress={handleOpenPicker}
              variant="secondary"
            />
          </VStack>
        ),
        [handleOpenPicker, calendarIconButtonAccessibilityLabel],
      );

      return (
        <View ref={ref}>
          <DateInput
            ref={dateInputRef}
            {...props}
            accessibilityHint={accessibilityHint}
            accessibilityLabel={accessibilityLabel}
            accessibilityLabelledBy={accessibilityLabelledBy}
            compact={compact}
            date={date}
            disabled={disabled}
            disabledDateError={disabledDateError}
            disabledDates={disabledDates}
            end={dateInputCalendarButton}
            error={error}
            helperText={helperText}
            invalidDateError={invalidDateError}
            label={label}
            maxDate={maxDate}
            minDate={minDate}
            onChange={onChange}
            onChangeDate={onChangeDate}
            onErrorDate={onErrorDate}
            required={required}
            requiredError={requiredError}
            style={dateInputStyle}
            variant={variant}
          />
          {showPicker && (
            <Tray
              handleBarAccessibilityLabel={handleBarAccessibilityLabel}
              onCloseComplete={handleCancelPicker}
            >
              <VStack alignItems="center" gap={2} paddingBottom={2} paddingX={3}>
                <Calendar
                  disabled={disabled}
                  disabledDateError={disabledDateError}
                  disabledDates={disabledDates}
                  highlightedDates={highlightedDates}
                  maxDate={maxDate}
                  minDate={minDate}
                  nextArrowAccessibilityLabel={nextArrowAccessibilityLabel}
                  onPressDate={handleCalendarDatePress}
                  previousArrowAccessibilityLabel={previousArrowAccessibilityLabel}
                  seedDate={seedDate}
                  selectedDate={calendarSelectedDate}
                  style={calendarStyle}
                />
                <Button
                  block
                  compact
                  accessibilityHint={
                    !calendarSelectedDate ? confirmButtonDisabledAccessibilityHint : undefined
                  }
                  accessibilityLabel={confirmButtonAccessibilityLabel}
                  disabled={!calendarSelectedDate}
                  onPress={handleConfirmCalendar}
                >
                  {confirmText}
                </Button>
              </VStack>
            </Tray>
          )}
        </View>
      );
    },
  ),
);

DatePicker.displayName = 'DatePicker';

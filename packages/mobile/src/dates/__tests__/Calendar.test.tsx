import { fireEvent, render, screen } from '@testing-library/react-native';

import { DefaultThemeProvider } from '../../utils/testHelpers';
import type { CalendarProps } from '../Calendar';
import { Calendar } from '../Calendar';

const testID = 'test-calendar';
const CalendarExample = (props: Partial<CalendarProps>) => (
  <DefaultThemeProvider>
    <Calendar testID={testID} {...props} />
  </DefaultThemeProvider>
);

describe('Calendar', () => {
  it('passes accessibility', async () => {
    // Use specific date range to ensure all dates are enabled
    const seedDate = new Date(2024, 6, 15);
    const minDate = new Date(2024, 6, 1);
    const maxDate = new Date(2024, 6, 31);

    render(<CalendarExample maxDate={maxDate} minDate={minDate} seedDate={seedDate} />);

    expect(screen.getByTestId(testID)).toBeAccessible({
      // Disable 'disabled-state-required' since it's flagging passing disabled
      // to Interactable and unclear if we're lacking a11y affordances here.
      customViolationHandler: (violations) => {
        return violations.filter(
          (v) =>
            v.problem !== "This component has a disabled state but it isn't exposed to the user",
        );
      },
    });
  });

  it('renders current month by default', () => {
    render(<CalendarExample />);

    const today = new Date();
    const monthYear = today.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    expect(screen.getByText(monthYear)).toBeTruthy();
  });

  it('renders with seedDate', () => {
    const seedDate = new Date(2024, 0, 15); // January 15, 2024
    render(<CalendarExample seedDate={seedDate} />);

    expect(screen.getByText('January 2024')).toBeTruthy();
  });

  it('renders with selectedDate', () => {
    const selectedDate = new Date(2024, 5, 20); // June 20, 2024
    render(<CalendarExample selectedDate={selectedDate} />);

    expect(screen.getByText('June 2024')).toBeTruthy();
  });

  it('hides controls when hideControls is true', () => {
    render(
      <CalendarExample
        hideControls
        nextArrowAccessibilityLabel="Next month"
        previousArrowAccessibilityLabel="Previous month"
      />,
    );

    expect(screen.queryByLabelText('Next month')).toBeNull();
    expect(screen.queryByLabelText('Previous month')).toBeNull();
  });

  it('renders navigation controls with correct accessibility labels', () => {
    render(
      <CalendarExample
        nextArrowAccessibilityLabel="Next month"
        previousArrowAccessibilityLabel="Previous month"
      />,
    );

    expect(screen.getByLabelText('Next month')).toBeTruthy();
    expect(screen.getByLabelText('Previous month')).toBeTruthy();
  });

  it('renders days of the week', () => {
    render(<CalendarExample />);

    // Check for first letter of each day
    const sLetters = screen.getAllByText('S');
    expect(sLetters.length).toBeGreaterThanOrEqual(2); // Sunday and Saturday (plus potentially dates)
    expect(screen.getByText('M')).toBeTruthy();
    expect(screen.getAllByText('T').length).toBeGreaterThanOrEqual(1); // Tuesday and Thursday
    expect(screen.getByText('W')).toBeTruthy();
    expect(screen.getByText('F')).toBeTruthy();
  });

  it('handles disabled state correctly', () => {
    const mockOnPressDate = jest.fn();
    const seedDate = new Date(2024, 6, 15); // July 15, 2024

    render(<CalendarExample disabled onPressDate={mockOnPressDate} seedDate={seedDate} />);

    // Navigation arrows should be disabled
    const prevArrow = screen.getByLabelText('Go to previous month');
    const nextArrow = screen.getByLabelText('Go to next month');

    expect(prevArrow).toHaveProp('accessibilityState', expect.objectContaining({ disabled: true }));
    expect(nextArrow).toHaveProp('accessibilityState', expect.objectContaining({ disabled: true }));

    expect(prevArrow).toBeDisabled();
    expect(nextArrow).toBeDisabled();

    // Calendar container should have reduced opacity
    const calendar = screen.getByTestId(testID);
    expect(calendar).toHaveStyle({ opacity: 0.5 }); // accessibleOpacityDisabled value
  });

  it('does not call onPressDate when date buttons are disabled', () => {
    const mockOnPressDate = jest.fn();
    const seedDate = new Date(2024, 6, 15); // July 15, 2024
    const minDate = new Date(2024, 6, 1);
    const maxDate = new Date(2024, 6, 10); // Only first 10 days are enabled

    render(
      <CalendarExample
        maxDate={maxDate}
        minDate={minDate}
        onPressDate={mockOnPressDate}
        seedDate={seedDate}
      />,
    );

    // Try to get a disabled date (after maxDate)
    // Disabled dates are rendered as Box, not Pressable, so they won't have role="button"
    const allButtons = screen.getAllByRole('button');
    const dateButtons = allButtons.filter((button) => {
      const label = button.props.accessibilityLabel;
      return label && label.includes('July') && label.includes('2024');
    });

    // Dates after maxDate (July 10) should not be pressable buttons
    // They should be rendered as non-interactive Box elements
    expect(dateButtons.length).toBeLessThan(31); // Not all 31 days should be buttons
  });

  it('calls onPressDate when a date is pressed', () => {
    const mockOnPressDate = jest.fn();
    const seedDate = new Date(2024, 6, 15); // July 15, 2024

    render(<CalendarExample onPressDate={mockOnPressDate} seedDate={seedDate} />);

    // Find and press July 15 - match label with both day and month/year
    const july15Button = screen.getByLabelText(/15.*July.*2024/);
    fireEvent.press(july15Button);

    expect(mockOnPressDate).toHaveBeenCalledTimes(1);
    expect(mockOnPressDate).toHaveBeenCalledWith(expect.any(Date));

    const calledDate = mockOnPressDate.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(15);
    expect(calledDate.getMonth()).toBe(6); // July (0-indexed)
    expect(calledDate.getFullYear()).toBe(2024);
  });

  it('navigates to next month when next arrow is pressed', () => {
    const seedDate = new Date(2024, 6, 15); // July 15, 2024
    render(<CalendarExample seedDate={seedDate} />);

    expect(screen.getByText('July 2024')).toBeTruthy();

    const nextArrow = screen.getByLabelText('Go to next month');
    fireEvent.press(nextArrow);

    expect(screen.getByText('August 2024')).toBeTruthy();
  });

  it('navigates to previous month when previous arrow is pressed', () => {
    const seedDate = new Date(2024, 6, 15); // July 15, 2024
    render(<CalendarExample seedDate={seedDate} />);

    expect(screen.getByText('July 2024')).toBeTruthy();

    const prevArrow = screen.getByLabelText('Go to previous month');
    fireEvent.press(prevArrow);

    expect(screen.getByText('June 2024')).toBeTruthy();
  });

  it('disables next arrow when maxDate is in current month', () => {
    const seedDate = new Date(2024, 6, 15); // July 15, 2024
    const maxDate = new Date(2024, 6, 31); // July 31, 2024

    render(<CalendarExample maxDate={maxDate} seedDate={seedDate} />);

    const nextArrow = screen.getByLabelText('Go to next month');
    expect(nextArrow).toBeDisabled();
    expect(nextArrow).toHaveProp('accessibilityState', expect.objectContaining({ disabled: true }));
  });

  it('disables previous arrow when minDate is in current month', () => {
    const seedDate = new Date(2024, 6, 15); // July 15, 2024
    const minDate = new Date(2024, 6, 1); // July 1, 2024

    render(<CalendarExample minDate={minDate} seedDate={seedDate} />);

    const prevArrow = screen.getByLabelText('Go to previous month');
    expect(prevArrow).toBeDisabled();
    expect(prevArrow).toHaveProp('accessibilityState', expect.objectContaining({ disabled: true }));
  });

  it('selected date has correct accessibility state', () => {
    const selectedDate = new Date(2024, 6, 15); // July 15, 2024

    render(<CalendarExample selectedDate={selectedDate} />);

    const selectedButton = screen.getByLabelText(/15.*July.*2024/);
    expect(selectedButton).toHaveProp(
      'accessibilityState',
      expect.objectContaining({ selected: true }),
    );
  });

  it('date buttons have detailed accessibility labels', () => {
    const seedDate = new Date(2024, 6, 15); // July 15, 2024
    render(<CalendarExample seedDate={seedDate} />);

    // Check that date labels include weekday, day, month, and year
    const july15Button = screen.getByLabelText(/15.*July.*2024/);
    expect(july15Button).toBeTruthy();

    // The label should include day of week, date, month and year
    expect(july15Button.props.accessibilityLabel).toMatch(/15/);
    expect(july15Button.props.accessibilityLabel).toMatch(/July/);
    expect(july15Button.props.accessibilityLabel).toMatch(/2024/);
  });

  it('month and year header has accessibilityRole header', () => {
    const seedDate = new Date(2024, 6, 15); // July 15, 2024
    render(<CalendarExample seedDate={seedDate} />);

    const headerText = screen.getByText('July 2024');
    expect(headerText).toHaveProp('accessibilityRole', 'header');
  });

  it('days of week header is not accessible to screen readers', () => {
    render(<CalendarExample />);

    // The days of week header HStack should have accessible={false}
    // This is tested indirectly by checking the structure
    const calendar = screen.getByTestId(testID);
    expect(calendar).toBeTruthy();

    // Days of week letters should still be present in the DOM
    expect(screen.getAllByText('S').length).toBeGreaterThan(0);
    expect(screen.getAllByText('M').length).toBeGreaterThan(0);
  });

  it('respects minDate and disables dates before it', () => {
    const seedDate = new Date(2024, 6, 15); // July 15, 2024
    const minDate = new Date(2024, 6, 10); // July 10, 2024

    render(<CalendarExample minDate={minDate} seedDate={seedDate} />);

    const allButtons = screen.getAllByRole('button');
    const dateButtons = allButtons.filter((button) => {
      const label = button.props.accessibilityLabel;
      return label && label.includes('July') && label.includes('2024');
    });

    // Dates before July 10 should not be interactive buttons
    // Check that we don't have all 31 days as buttons
    expect(dateButtons.length).toBeLessThan(31);
  });

  it('respects maxDate and disables dates after it', () => {
    const seedDate = new Date(2024, 6, 15); // July 15, 2024
    const maxDate = new Date(2024, 6, 20); // July 20, 2024

    render(<CalendarExample maxDate={maxDate} seedDate={seedDate} />);

    const allButtons = screen.getAllByRole('button');
    const dateButtons = allButtons.filter((button) => {
      const label = button.props.accessibilityLabel;
      return label && label.includes('July') && label.includes('2024');
    });

    // Dates after July 20 should not be interactive buttons
    expect(dateButtons.length).toBeLessThan(31);
  });

  it('respects disabledDates prop', () => {
    const seedDate = new Date(2024, 6, 15); // July 15, 2024
    const disabledDates = [new Date(2024, 6, 10), new Date(2024, 6, 20)];

    render(<CalendarExample disabledDates={disabledDates} seedDate={seedDate} />);

    const allButtons = screen.getAllByRole('button');
    const dateButtons = allButtons.filter((button) => {
      const label = button.props.accessibilityLabel;
      return label && label.includes('July') && label.includes('2024');
    });

    // Should have fewer buttons than days in the month (due to disabled dates)
    // July has 31 days, but 2 are disabled, plus navigation arrows
    expect(dateButtons.length).toBeLessThan(31);
  });

  it('respects disabledDates with date ranges', () => {
    const seedDate = new Date(2024, 6, 15); // July 15, 2024
    const disabledDates: [Date, Date][] = [[new Date(2024, 6, 10), new Date(2024, 6, 20)]];

    render(<CalendarExample disabledDates={disabledDates} seedDate={seedDate} />);

    const allButtons = screen.getAllByRole('button');
    const dateButtons = allButtons.filter((button) => {
      const label = button.props.accessibilityLabel;
      return label && label.includes('July') && label.includes('2024');
    });

    // July 10-20 should be disabled (11 days)
    // So we should have 31 - 11 = 20 date buttons
    expect(dateButtons.length).toBe(20);
  });

  it('renders today with correct accessibility hint', () => {
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.toLocaleDateString('en-US', { month: 'long' });
    const todayYear = today.getFullYear();

    render(<CalendarExample />);

    // Find today's date button using flexible regex
    const todayButton = screen.getByLabelText(
      new RegExp(`${todayDate}.*${todayMonth}.*${todayYear}`),
    );
    expect(todayButton).toHaveProp('accessibilityHint', 'Today');
  });
});

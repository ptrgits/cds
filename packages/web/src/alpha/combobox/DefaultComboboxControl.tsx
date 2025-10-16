import React, { forwardRef, memo, useCallback, useMemo, useRef } from 'react';
import type { ThemeVars } from '@coinbase/cds-common/core/theme';
import type { InputVariant } from '@coinbase/cds-common/types/InputBaseProps';
import { css } from '@linaria/core';

import { Chip } from '../../chips/Chip';
import { InputChip } from '../../chips/InputChip';
import { HelperText } from '../../controls/HelperText';
import { InputLabel } from '../../controls/InputLabel';
import { InputStack } from '../../controls/InputStack';
import { NativeInput } from '../../controls/NativeInput';
import { cx } from '../../cx';
import type { AriaHasPopupType } from '../../hooks/useA11yControlledVisibility';
import { HStack } from '../../layout/HStack';
import { VStack } from '../../layout/VStack';
import { AnimatedCaret } from '../../motion/AnimatedCaret';
import { Pressable } from '../../system/Pressable';
import { findClosestNonDisabledNodeIndex } from '../../utils/findClosestNonDisabledNodeIndex';
import type { SelectOption, SelectType } from '../select/Select';

const noFocusOutlineCss = css`
  &:focus,
  &:focus-visible,
  &:focus-within {
    outline: none;
  }
`;

const nativeInputContainerCss = css`
  padding-top: var(--space-1);
  padding-bottom: var(--space-1);
  padding-inline-start: var(--space-1);
  padding-inline-end: var(--space-1);
`;

const variantColor: Record<string, ThemeVars.Color> = {
  foreground: 'fg',
  positive: 'fgPositive',
  negative: 'fgNegative',
  primary: 'fgPrimary',
  foregroundMuted: 'fgMuted',
  secondary: 'fgMuted',
};

export type ComboboxControlProps<T extends string = string> = {
  /** Array of options to display in the combobox dropdown */
  options: SelectOption<T>[];
  /** Current value(s) - always an array for multi-select */
  value: T[];
  /** Change handler - accepts single value or array for multi-select */
  onChange: (value: T | T[]) => void;
  /** Whether the dropdown is currently open */
  open: boolean;
  /** Function to update the dropdown open state */
  setOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  /** Search text value */
  searchText: string;
  /** Search text change handler */
  onSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Label displayed above the control */
  label?: React.ReactNode;
  /** Placeholder text displayed in the search input */
  placeholder?: React.ReactNode;
  /** Helper text displayed below the combobox */
  helperText?: React.ReactNode;
  /** Whether the combobox is disabled */
  disabled?: boolean;
  /** Input variant for styling */
  variant?: InputVariant;
  /** Label variant for positioning */
  labelVariant?: 'inside' | 'outside';
  /** Node displayed at the start of the control */
  startNode?: React.ReactNode;
  /** Node displayed at the end of the control */
  endNode?: React.ReactNode;
  /** Whether to use compact styling */
  compact?: boolean;
  /** Maximum number of selected options to show before truncating */
  maxSelectedOptionsToShow?: number;
  /** Label to show for showcasing count of hidden selected options */
  hiddenSelectedOptionsLabel?: string;
  /** Accessibility label for each chip in a multi-select */
  removeSelectedOptionAccessibilityLabel?: string;
  /** ARIA haspopup attribute value */
  ariaHaspopup?: AriaHasPopupType;
  /** Custom styles for different parts of the control */
  styles?: {
    controlStartNode?: React.CSSProperties;
    controlInputNode?: React.CSSProperties;
    controlValueNode?: React.CSSProperties;
    controlLabelNode?: React.CSSProperties;
    controlHelperTextNode?: React.CSSProperties;
    controlEndNode?: React.CSSProperties;
  };
  /** Custom class names for different parts of the control */
  classNames?: {
    controlStartNode?: string;
    controlInputNode?: string;
    controlValueNode?: string;
    controlLabelNode?: string;
    controlHelperTextNode?: string;
    controlEndNode?: string;
  };
  /** Accessibility label for the combobox */
  accessibilityLabel?: string;
  /** Test ID for the combobox */
  testID?: string;
};

export type ComboboxControlComponent<T extends string = string> = React.FC<
  ComboboxControlProps<T> & { ref?: React.Ref<HTMLElement> }
>;

const DefaultComboboxControlComponent = <T extends string = string>(
  {
    options,
    value,
    onChange,
    open,
    placeholder,
    disabled,
    setOpen,
    variant,
    helperText,
    label,
    labelVariant,
    startNode,
    endNode: customEndNode,
    compact,
    maxSelectedOptionsToShow = 6,
    hiddenSelectedOptionsLabel = 'more',
    removeSelectedOptionAccessibilityLabel = 'Remove',
    ariaHaspopup,
    searchText,
    onSearch,
    styles,
    classNames,
    accessibilityLabel,
    testID,
    ...props
  }: ComboboxControlProps<T>,
  ref: React.Ref<HTMLElement>,
) => {
  const shouldShowCompactLabel = compact && label;
  const hasValue = value.length > 0;

  const inputRef = useRef<HTMLInputElement>(null);
  const valueNodeContainerRef = useRef<HTMLDivElement>(null);

  const handleUnselectValue = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      const currentValue = [...value];
      const changedValue = currentValue[index];
      onChange?.(changedValue);

      // Keep focus on the input after removing a chip
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [onChange, value],
  );

  const handleInputClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!open) {
        setOpen(true);
      }
    },
    [setOpen, open],
  );

  const helperTextNode = useMemo(
    () =>
      typeof helperText === 'string' ? (
        <HelperText
          className={classNames?.controlHelperTextNode}
          color={variant ? variantColor[variant] : 'fgMuted'}
          overflow="truncate"
          style={styles?.controlHelperTextNode}
        >
          {helperText}
        </HelperText>
      ) : (
        helperText
      ),
    [helperText, variant, classNames?.controlHelperTextNode, styles?.controlHelperTextNode],
  );

  const labelNode = useMemo(
    () =>
      typeof label === 'string' && labelVariant === 'inside' ? (
        <Pressable
          noScaleOnPress
          className={classNames?.controlLabelNode}
          disabled={disabled}
          onClick={handleInputClick}
          style={styles?.controlLabelNode}
          tabIndex={-1}
        >
          <InputLabel color="fg" paddingBottom={0} paddingTop={1} paddingX={2}>
            {label}
          </InputLabel>
        </Pressable>
      ) : (
        label
      ),
    [
      label,
      labelVariant,
      disabled,
      handleInputClick,
      classNames?.controlLabelNode,
      styles?.controlLabelNode,
    ],
  );

  const chipsNode = useMemo(() => {
    if (!hasValue) return null;

    const valuesToShow =
      value.length <= maxSelectedOptionsToShow ? value : value.slice(0, maxSelectedOptionsToShow);
    const optionsToShow = valuesToShow
      .map((value) => options.find((option) => option.value === value))
      .filter(Boolean) as SelectOption[];

    return (
      <HStack
        ref={valueNodeContainerRef}
        alignItems="center"
        className={classNames?.controlValueNode}
        flexWrap="wrap"
        gap={1}
        padding={2}
        paddingBottom={0}
        style={styles?.controlValueNode}
      >
        {optionsToShow.map((option, index) => (
          <InputChip
            key={option.value}
            data-selected-value
            accessibilityLabel={`${removeSelectedOptionAccessibilityLabel} ${option.label ?? option.description ?? option.value ?? ''}`}
            disabled={option.disabled}
            invertColorScheme={false}
            label={option.label ?? option.description ?? option.value ?? ''}
            maxWidth={200}
            onClick={(event) => handleUnselectValue(event, index)}
          />
        ))}
        {value.length - maxSelectedOptionsToShow > 0 && (
          <Chip>{`+${value.length - maxSelectedOptionsToShow} ${hiddenSelectedOptionsLabel}`}</Chip>
        )}
      </HStack>
    );
  }, [
    hasValue,
    options,
    value,
    maxSelectedOptionsToShow,
    hiddenSelectedOptionsLabel,
    removeSelectedOptionAccessibilityLabel,
    handleUnselectValue,
    classNames?.controlValueNode,
    styles?.controlValueNode,
  ]);

  const inputNode = useMemo(
    () => (
      <VStack
        className={cx(noFocusOutlineCss, classNames?.controlInputNode)}
        gap={0}
        style={styles?.controlInputNode}
        width="100%"
      >
        {/* Chips container */}
        {chipsNode}

        {/* Text input */}
        <HStack alignItems="center" width="100%">
          {!!startNode && (
            <HStack
              alignItems="center"
              className={classNames?.controlStartNode}
              height="100%"
              justifyContent="center"
              minWidth={0}
              paddingX={1}
              style={styles?.controlStartNode}
            >
              {startNode}
            </HStack>
          )}
          {shouldShowCompactLabel ? (
            <HStack alignItems="center" height="100%" maxWidth="40%" padding={1}>
              <InputLabel color="fg" overflow="truncate">
                {label}
              </InputLabel>
            </HStack>
          ) : null}
          <HStack
            alignItems="center"
            flexGrow={1}
            paddingBottom={1}
            paddingTop={0}
            paddingX={1}
            width="100%"
          >
            <NativeInput
              ref={inputRef}
              aria-haspopup={ariaHaspopup}
              containerSpacing={nativeInputContainerCss}
              disabled={disabled}
              onChange={onSearch}
              onClick={handleInputClick}
              placeholder={placeholder as string}
              testID={testID}
              value={searchText}
            />
          </HStack>
        </HStack>
      </VStack>
    ),
    [
      classNames?.controlInputNode,
      classNames?.controlStartNode,
      styles?.controlInputNode,
      styles?.controlStartNode,
      chipsNode,
      startNode,
      shouldShowCompactLabel,
      label,
      ariaHaspopup,
      disabled,
      onSearch,
      handleInputClick,
      placeholder,
      testID,
      searchText,
    ],
  );

  const endNode = useMemo(
    () => (
      <HStack
        alignItems="center"
        className={classNames?.controlEndNode}
        paddingX={2}
        style={styles?.controlEndNode}
      >
        <Pressable aria-hidden onClick={() => setOpen((s) => !s)} tabIndex={-1}>
          {customEndNode ? (
            customEndNode
          ) : (
            <AnimatedCaret
              color={!open ? 'fg' : variant ? variantColor[variant] : 'fgPrimary'}
              rotate={open ? 0 : 180}
            />
          )}
        </Pressable>
      </HStack>
    ),
    [open, variant, setOpen, customEndNode, classNames?.controlEndNode, styles?.controlEndNode],
  );

  return (
    <InputStack
      ref={ref}
      disabled={disabled}
      endNode={endNode}
      helperTextNode={helperTextNode}
      inputNode={inputNode}
      labelNode={shouldShowCompactLabel ? null : labelNode}
      labelVariant={labelVariant}
      variant={variant}
      {...props}
    />
  );
};

export const DefaultComboboxControl = memo(forwardRef(DefaultComboboxControlComponent)) as <
  T extends string = string,
>(
  props: ComboboxControlProps<T> & { ref?: React.Ref<HTMLElement> },
) => ReturnType<ComboboxControlComponent<T>>;

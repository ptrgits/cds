import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { SharedAccessibilityProps } from '@coinbase/cds-common';
import { flip, useFloating, type UseFloatingReturn } from '@floating-ui/react-dom';
import Fuse from 'fuse.js';

import { useClickOutside } from '../../hooks/useClickOutside';
import { useHasMounted } from '../../hooks/useHasMounted';
import { Portal } from '../../overlays/Portal';
import { modalContainerId } from '../../overlays/PortalProvider';
import type { InteractableBlendStyles } from '../../system/Interactable';
import { DefaultSelectAllOption } from '../select/DefaultSelectAllOption';
import { DefaultSelectDropdown } from '../select/DefaultSelectDropdown';
import { DefaultSelectEmptyDropdownContents } from '../select/DefaultSelectEmptyDropdownContents';
import { DefaultSelectOption } from '../select/DefaultSelectOption';
import {
  defaultAccessibilityRoles,
  type SelectDropdownComponent,
  type SelectDropdownProps,
  type SelectEmptyDropdownContentComponent,
  type SelectOption,
  type SelectOptionComponent,
} from '../select/Select';

import {
  type ComboboxControlComponent,
  type ComboboxControlProps,
  DefaultComboboxControl,
} from './DefaultComboboxControl';

export type ComboboxBaseProps<T extends string = string> = Pick<
  SharedAccessibilityProps,
  'accessibilityLabel'
> &
  Pick<
    ComboboxControlProps<T>,
    | 'label'
    | 'placeholder'
    | 'helperText'
    | 'hiddenSelectedOptionsLabel'
    | 'removeSelectedOptionAccessibilityLabel'
    | 'startNode'
    | 'variant'
    | 'disabled'
    | 'labelVariant'
    | 'endNode'
  > &
  Pick<SelectDropdownProps<'multi', T>, 'accessory' | 'media' | 'detail'> &
  Pick<
    SelectDropdownProps<'multi'>,
    | 'selectAllLabel'
    | 'emptyOptionsLabel'
    | 'clearAllLabel'
    | 'hideSelectAll'
    | 'accessibilityRoles'
  > & {
    /** Array of options to display in the combobox dropdown */
    options: SelectOption<T>[];
    /** Current selected values (always an array for multi-select) */
    value: T[];
    /** Change handler for selection changes */
    onChange: (value: T | T[]) => void;
    /** Controlled search text value */
    searchText?: string;
    /** Search text change handler */
    onSearch?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    /** Default search text value for uncontrolled mode */
    defaultSearchText?: string;
    /** Controlled open state of the dropdown */
    open?: boolean;
    /** Callback to update the open state */
    setOpen?: (open: boolean | ((open: boolean) => boolean)) => void;
    /** Whether clicking outside the dropdown should close it */
    disableClickOutsideClose?: boolean;
    /** Whether to use compact styling */
    compact?: boolean;
    /** Initial open state when component mounts (uncontrolled mode) */
    defaultOpen?: boolean;
    /** Maximum number of selected options to show before truncating */
    maxSelectedOptionsToShow?: number;
    /** Custom filter function for searching options */
    filterFunction?: (options: SelectOption<T>[], searchText: string) => SelectOption<T>[];
    /** Custom component to render the dropdown container */
    SelectDropdownComponent?: SelectDropdownComponent<'multi', T>;
    /** Custom component to render the combobox control */
    ComboboxControlComponent?: ComboboxControlComponent<T>;
    /** Custom component to render individual options */
    SelectOptionComponent?: SelectOptionComponent<'multi', T>;
    /** Custom component to render the "Select All" option */
    SelectAllOptionComponent?: SelectOptionComponent<'multi', T>;
    /** Custom component to render when no options are available */
    SelectEmptyDropdownContentsComponent?: SelectEmptyDropdownContentComponent;
    /** Inline styles for the root element */
    style?: React.CSSProperties;
    /** CSS class name for the root element */
    className?: string;
    /** Test ID for the root element */
    testID?: string;
  };

/**
 * Props for the Combobox component
 */
export type ComboboxProps<T extends string = string> = ComboboxBaseProps<T> & {
  /** Custom styles for different parts of the combobox */
  styles?: {
    /** Styles for the root container */
    root?: React.CSSProperties;
    /** Styles for the control element */
    control?: React.CSSProperties;
    /** Styles for the start node element */
    controlStartNode?: React.CSSProperties;
    /** Styles for the input node element */
    controlInputNode?: React.CSSProperties;
    /** Styles for the value node element */
    controlValueNode?: React.CSSProperties;
    /** Styles for the label node element */
    controlLabelNode?: React.CSSProperties;
    /** Styles for the helper text node element */
    controlHelperTextNode?: React.CSSProperties;
    /** Styles for the end node element */
    controlEndNode?: React.CSSProperties;
    /** Blend styles for control interactivity */
    controlBlendStyles?: InteractableBlendStyles;
    /** Styles for the dropdown container */
    dropdown?: React.CSSProperties;
    /** Styles for individual options */
    option?: React.CSSProperties;
    /** Blend styles for option interactivity */
    optionBlendStyles?: InteractableBlendStyles;
    /** Styles for the option cell element */
    optionCell?: React.CSSProperties;
    /** Styles for the option content wrapper */
    optionContent?: React.CSSProperties;
    /** Styles for the option label element */
    optionLabel?: React.CSSProperties;
    /** Styles for the option description element */
    optionDescription?: React.CSSProperties;
    /** Styles for the select all divider element */
    selectAllDivider?: React.CSSProperties;
    /** Styles for the empty contents container element */
    emptyContentsContainer?: React.CSSProperties;
    /** Styles for the empty contents text element */
    emptyContentsText?: React.CSSProperties;
  };
  /** Custom class names for different parts of the combobox */
  classNames?: {
    /** Class name for the root container */
    root?: string;
    /** Class name for the control element */
    control?: string;
    /** Class name for the start node element */
    controlStartNode?: string;
    /** Class name for the input node element */
    controlInputNode?: string;
    /** Class name for the value node element */
    controlValueNode?: string;
    /** Class name for the label node element */
    controlLabelNode?: string;
    /** Class name for the helper text node element */
    controlHelperTextNode?: string;
    /** Class name for the end node element */
    controlEndNode?: string;
    /** Class name for the dropdown container */
    dropdown?: string;
    /** Class name for individual options */
    option?: string;
    /** Class name for the option cell element */
    optionCell?: string;
    /** Class name for the option content wrapper */
    optionContent?: string;
    /** Class name for the option label element */
    optionLabel?: string;
    /** Class name for the option description element */
    optionDescription?: string;
    /** Class name for the select all divider element */
    selectAllDivider?: string;
    /** Class name for the empty contents container element */
    emptyContentsContainer?: string;
    /** Class name for the empty contents text element */
    emptyContentsText?: string;
  };
};

export type ComboboxRef = HTMLElement &
  Pick<ComboboxProps, 'open' | 'setOpen'> & {
    refs: UseFloatingReturn['refs'];
  };

type ComboboxComponent = <T extends string = string>(
  props: ComboboxProps<T> & { ref?: React.Ref<ComboboxRef> },
) => React.ReactElement;

const ComboboxBase = memo(
  forwardRef(
    <T extends string = string>(
      {
        value,
        options,
        onChange,
        open: openProp,
        setOpen: setOpenProp,
        disabled,
        disableClickOutsideClose,
        placeholder,
        helperText,
        hiddenSelectedOptionsLabel,
        removeSelectedOptionAccessibilityLabel,
        compact,
        label,
        labelVariant,
        accessibilityLabel,
        accessibilityRoles = defaultAccessibilityRoles,
        selectAllLabel,
        emptyOptionsLabel,
        clearAllLabel,
        hideSelectAll,
        defaultOpen,
        startNode,
        endNode,
        variant,
        maxSelectedOptionsToShow,
        accessory,
        media,
        detail,
        searchText: searchTextProp,
        onSearch: onSearchProp,
        defaultSearchText = '',
        filterFunction,
        SelectOptionComponent = DefaultSelectOption,
        SelectAllOptionComponent = DefaultSelectAllOption,
        SelectDropdownComponent = DefaultSelectDropdown,
        ComboboxControlComponent = DefaultComboboxControl,
        SelectEmptyDropdownContentsComponent = DefaultSelectEmptyDropdownContents as SelectEmptyDropdownContentComponent,
        style,
        styles,
        className,
        classNames,
        testID,
        ...props
      }: ComboboxProps<T>,
      ref: React.Ref<ComboboxRef>,
    ) => {
      const hasMounted = useHasMounted();
      const [openInternal, setOpenInternal] = useState(defaultOpen ?? false);
      const open = openProp ?? openInternal;
      const setOpen = setOpenProp ?? setOpenInternal;

      const [searchTextInternal, setSearchTextInternal] = useState(defaultSearchText);
      const searchText = searchTextProp ?? searchTextInternal;

      if (
        (typeof openProp === 'undefined' && typeof setOpenProp !== 'undefined') ||
        (typeof openProp !== 'undefined' && typeof setOpenProp === 'undefined')
      )
        throw Error(
          'Combobox component must be fully controlled or uncontrolled: "open" and "setOpen" props must be provided together or not at all',
        );

      if (
        (typeof searchTextProp === 'undefined' && typeof onSearchProp !== 'undefined') ||
        (typeof searchTextProp !== 'undefined' && typeof onSearchProp === 'undefined')
      )
        throw Error(
          'Combobox component must be fully controlled or uncontrolled: "searchText" and "onSearch" props must be provided together or not at all',
        );

      const rootStyles = useMemo(
        () => ({
          ...style,
          ...styles?.root,
        }),
        [style, styles?.root],
      );

      const { refs, floatingStyles } = useFloating({
        open,
        middleware: [flip()],
      });

      useClickOutside(() => !disableClickOutsideClose && setOpen(false), {
        ref: refs.floating,
        excludeRefs: [refs.reference as React.MutableRefObject<HTMLElement>],
      });

      const containerRef = useRef<HTMLElement>(null);

      useImperativeHandle(ref, () =>
        Object.assign(containerRef.current as HTMLElement, {
          open,
          setOpen,
          refs,
        }),
      );

      const handleSearch = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
          setSearchTextInternal(event.target.value);
          setOpen(true);
        },
        [setOpen],
      );

      const onSearch = onSearchProp ?? handleSearch;

      const fuse = useMemo(
        () =>
          new Fuse(options, {
            keys: ['label', 'description'],
            threshold: 0.3,
          }),
        [options],
      );

      const filteredOptions = useMemo(() => {
        if (searchText.length === 0) return options;
        if (filterFunction) return filterFunction(options, searchText);
        return fuse.search(searchText).map((result) => result.item);
      }, [filterFunction, fuse, options, searchText]);

      return (
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          className={classNames?.root ?? className}
          data-testid={testID}
          style={rootStyles}
        >
          <ComboboxControlComponent
            ref={refs.setReference}
            accessibilityLabel={accessibilityLabel}
            ariaHaspopup={accessibilityRoles?.dropdown}
            classNames={{
              controlStartNode: classNames?.controlStartNode,
              controlInputNode: classNames?.controlInputNode,
              controlValueNode: classNames?.controlValueNode,
              controlLabelNode: classNames?.controlLabelNode,
              controlHelperTextNode: classNames?.controlHelperTextNode,
              controlEndNode: classNames?.controlEndNode,
            }}
            compact={compact}
            disabled={disabled}
            endNode={endNode}
            helperText={helperText}
            hiddenSelectedOptionsLabel={hiddenSelectedOptionsLabel}
            label={label}
            labelVariant={labelVariant}
            maxSelectedOptionsToShow={maxSelectedOptionsToShow}
            onChange={onChange}
            onSearch={onSearch}
            open={open}
            options={options}
            placeholder={placeholder}
            removeSelectedOptionAccessibilityLabel={removeSelectedOptionAccessibilityLabel}
            searchText={searchText}
            setOpen={setOpen}
            startNode={startNode}
            styles={{
              controlStartNode: styles?.controlStartNode,
              controlInputNode: styles?.controlInputNode,
              controlValueNode: styles?.controlValueNode,
              controlLabelNode: styles?.controlLabelNode,
              controlHelperTextNode: styles?.controlHelperTextNode,
              controlEndNode: styles?.controlEndNode,
            }}
            testID={testID}
            value={value}
            variant={variant}
          />
          <Portal containerId={modalContainerId}>
            <SelectDropdownComponent
              ref={refs.setFloating}
              SelectAllOptionComponent={SelectAllOptionComponent}
              SelectEmptyDropdownContentsComponent={SelectEmptyDropdownContentsComponent}
              SelectOptionComponent={SelectOptionComponent}
              accessibilityLabel={accessibilityLabel}
              accessibilityRoles={accessibilityRoles}
              accessory={accessory}
              classNames={{
                root: classNames?.dropdown,
                option: classNames?.option,
                optionCell: classNames?.optionCell,
                optionContent: classNames?.optionContent,
                optionLabel: classNames?.optionLabel,
                optionDescription: classNames?.optionDescription,
                selectAllDivider: classNames?.selectAllDivider,
                emptyContentsContainer: classNames?.emptyContentsContainer,
                emptyContentsText: classNames?.emptyContentsText,
              }}
              clearAllLabel={clearAllLabel}
              compact={compact}
              controlRef={refs.reference as React.MutableRefObject<HTMLElement>}
              detail={detail}
              disabled={disabled}
              emptyOptionsLabel={emptyOptionsLabel}
              hideSelectAll={hideSelectAll}
              label={label}
              media={media}
              onChange={onChange}
              open={hasMounted && open}
              options={filteredOptions}
              selectAllLabel={selectAllLabel}
              setOpen={setOpen}
              styles={{
                root: { ...floatingStyles, ...styles?.dropdown },
                option: styles?.option,
                optionBlendStyles: styles?.optionBlendStyles,
                optionCell: styles?.optionCell,
                optionContent: styles?.optionContent,
                optionLabel: styles?.optionLabel,
                optionDescription: styles?.optionDescription,
                selectAllDivider: styles?.selectAllDivider,
                emptyContentsContainer: styles?.emptyContentsContainer,
                emptyContentsText: styles?.emptyContentsText,
              }}
              type="multi"
              value={value}
            />
          </Portal>
        </div>
      );
    },
  ),
);

export const Combobox = ComboboxBase as ComboboxComponent;

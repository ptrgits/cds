import { Box } from '../../layout/Box';
import { Text } from '../../typography/Text';

import type { SelectSelectAllOptionComponent } from './Select';

export const DefaultSelectSelectAllOption: SelectSelectAllOptionComponent<'single' | 'multi'> = ({
  SelectOptionComponent,
  accessory,
  blendStyles,
  compact,
  detail,
  description,
  label,
  media,
  multiline,
  className,
  style,
  disabled,
  onClick,
  selected,
  type,
  value,
  accessibilityRole,
  ...props
}) => {
  return (
    <>
      <SelectOptionComponent
        key="select-all"
        accessory={accessory}
        blendStyles={styles?.optionBlendStyles}
        className={classNames?.option}
        compact={compact}
        detail={
          <Button
            compact
            transparent
            onClick={onClick}
            role="option"
            style={{ margin: 'var(--space-1)' }}
          >
            {clearAllLabel}
          </Button>
        }
        disabled={disabled}
        label={`${selectAllLabel} (${options.filter((o) => o.value !== null).length})`}
        media={
          media ?? (
            <Checkbox
              readOnly
              checked={isAllOptionsSelected}
              iconStyle={{ opacity: 1 }}
              indeterminate={!isAllOptionsSelected && isSomeOptionsSelected ? true : false}
              tabIndex={-1}
            />
          )
        }
        onClick={toggleSelectAll}
        selected={isAllOptionsSelected || isSomeOptionsSelected}
        style={styles?.option}
        type={type}
        value="select-all"
      />
      <Divider paddingX={2} />
    </>
  );
};

import { Box } from '../../layout/Box';
import { Text } from '../../typography/Text';

import type { SelectEmptyDropdownContentComponent } from './Select';

export const DefaultSelectEmptyDropdownContents: SelectEmptyDropdownContentComponent = ({
  label,
  padding = 2,
  ...props
}) => {
  return (
    <Box padding={padding} {...props}>
      <Text font="body">{label}</Text>
    </Box>
  );
};

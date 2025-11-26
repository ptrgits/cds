import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { PaddingProps } from '@coinbase/cds-common/types';

import { useTheme } from '../hooks/useTheme';
import type { BoxProps } from '../layout/Box';
import { Box } from '../layout/Box';
import { Divider } from '../layout/Divider';
import { VStack } from '../layout/VStack';
import { Text } from '../typography/Text';

type ExampleRenderChildren = () => NonNullable<JSX.Element>;
export type ExampleProps = {
  children: ExampleRenderChildren | React.ReactNode[] | React.ReactNode;
  inline?: boolean;
  title?: string;
  titlePadding?: PaddingProps;
} & Omit<BoxProps, 'children'>;

export const Example = ({ children, inline, title, titlePadding, ...props }: ExampleProps) => {
  const childStyles = useMemo(() => {
    const style: ViewStyle = { paddingTop: 12 };

    if (inline) {
      style.alignItems = 'flex-start';
    }

    return style;
  }, [inline]);

  const content = (
    <>
      <Box background="bg" padding={2} paddingBottom={3} {...props}>
        {!!title && (
          <Text font="title3" {...titlePadding}>
            {title}
          </Text>
        )}

        {typeof children === 'function'
          ? children()
          : React.Children.map(children, (item, index) => (
              <View key={index} style={childStyles}>
                {item}
              </View>
            ))}
      </Box>
      <Divider />
    </>
  );

  return content;
};

export const ExampleScreen = React.forwardRef<ScrollView, React.PropsWithChildren<unknown>>(
  ({ children }, ref) => {
    const theme = useTheme();

    return (
      <View testID="mobile-playground-screen">
        <ScrollView
          ref={ref}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="always"
          persistentScrollbar={false}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: theme.color.bg, height: '100%' }}
        >
          <Divider testID="mobile-playground-scrollview-start" />
          {children}
          <Divider testID="mobile-playground-scrollview-end" />
        </ScrollView>
      </View>
    );
  },
);
ExampleScreen.displayName = 'ExampleScreen';

import React from 'react';
import { getAvatarFallbackColor } from '@coinbase/cds-common/media/getAvatarFallbackColor';
import { colorSchemeMap } from '@coinbase/cds-common/tokens/avatar';
import type { AvatarFallbackColor, AvatarSize } from '@coinbase/cds-common/types';

import { Example, ExampleScreen } from '../../examples/ExampleScreen';
import { HStack } from '../../layout/HStack';
import { VStack } from '../../layout/VStack';
import { Avatar } from '../Avatar';
import { Box } from '../../layout';
import { Text } from '../../typography/Text';
import { View } from 'react-native';

const image = 'https://avatars.slack-edge.com/2019-12-09/865473396980_e8c83b072b452e4d03f7_192.jpg';
const names = ['Sneezy', 'Happy', 'Sleepy', 'Doc', 'Bashful', 'Grumpy', 'Dopey', 'Lilo', 'Stitch'];
const sizes: AvatarSize[] = ['s', 'm', 'l', 'xl', 'xxl', 'xxxl'];

const FallbackColored = () => {
  return (
    <>
      {/* {names.map((name, idx) => {
        const avatarFallbackColor = getAvatarFallbackColor(name);
        return (
          <Avatar
            key={name}
            accessibilityLabel=""
            colorScheme={idx === 0 ? 'blue' : avatarFallbackColor}
            name={name}
            size={sizes[idx % sizes.length]}
          />
        );
      })} */}

      {/* iOS: crashes - can't calculate baseline with both dimensions constrained */}
      {/* Android: works - baseline calculation handles constraints */}
      <HStack alignItems="baseline">
        <Box background="bgAlternate" width={100} height={100} alignItems="center" justifyContent="center">
          <Text>Hello</Text>
        </Box>
      </HStack>

      {/* iOS: works - at least one flexible dimension */}
      <HStack alignItems="baseline">
        <Box background="bgAlternate" width={100} alignItems="center" justifyContent="center">
          <Text>Hello</Text>
        </Box>
      </HStack>
    </>
  );
};

const colorSchemes = Object.keys(colorSchemeMap) as AvatarFallbackColor[];

const AvatarScreen = () => {
  return (
    <ExampleScreen>
      <Example title="Normal">
        <HStack alignItems="center" flexWrap="wrap" gap={2}>
          <Avatar accessibilityLabel="" src={image} />
          <Avatar accessibilityLabel="" name="Happy" shape="square" src={image} />
          <Avatar accessibilityLabel="" name="Grumpy" shape="hexagon" src={image} />
          <Avatar accessibilityLabel="" borderColor="bgPositive" name="Sleepy" src={image} />
          <Avatar accessibilityLabel="" name="Bashful" size="m" src={image} />
          <Avatar accessibilityLabel="" name="Grumpy" size="l" src={image} />
          <Avatar accessibilityLabel="" name="Grumpy" size="xl" src={image} />
          <Avatar accessibilityLabel="" name="Grumpy" size="xxl" src={image} />
          <Avatar accessibilityLabel="" name="Grumpy" size="xxxl" src={image} />
        </HStack>
      </Example>
      <Example title="Fallback Image">
        <HStack alignItems="center" flexWrap="wrap" gap={2}>
          <Avatar accessibilityLabel="" />
          <Avatar accessibilityLabel="" shape="square" />
          <Avatar accessibilityLabel="" shape="hexagon" />
          <Avatar accessibilityLabel="" borderColor="bgPositive" />
          <Avatar accessibilityLabel="" size="m" />
          <Avatar accessibilityLabel="" size="l" />
          <Avatar accessibilityLabel="" size="xl" />
          <Avatar accessibilityLabel="" size="xxl" />
          <Avatar accessibilityLabel="" size="xxxl" />
        </HStack>
      </Example>
      <Example title="Color Schemes">
        <HStack gap={2}>
          {colorSchemes.map((colorScheme) => (
            <Avatar
              key={colorScheme}
              accessibilityLabel=""
              colorScheme={colorScheme}
              name={colorScheme}
              size="l"
            />
          ))}
        </HStack>
      </Example>
      <Example title="Fallback Colored">
        <VStack gap={2}>
          <FallbackColored />
        </VStack>
      </Example>
    </ExampleScreen>
  );
};

export default AvatarScreen;

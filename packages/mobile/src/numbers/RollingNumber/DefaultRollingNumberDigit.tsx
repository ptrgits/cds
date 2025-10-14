import { forwardRef, memo, useEffect, useMemo, useRef } from 'react';
import { type View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '../../typography/Text';

import { DefaultRollingNumberMask } from './DefaultRollingNumberMask';
import {
  defaultTransitionConfig,
  digits,
  type RollingNumberDigitComponent,
  type RollingNumberDigitProps,
} from './RollingNumber';

const AnimatedText = Animated.createAnimatedComponent(Text);
/**
 * Note that the DefaultRollingNumberDigit component implementation is different in web
 * and mobile due to different animation libraries and the performance issue in mobile.
 * This has nearly unnoticeable difference in animation effect.
 *  */
export const DefaultRollingNumberDigit: RollingNumberDigitComponent = memo(
  forwardRef<View, RollingNumberDigitProps>(
    (
      {
        value,
        digitHeight,
        initialValue = value,
        textProps,
        style,
        styles,
        transitionConfig,
        RollingNumberMaskComponent = DefaultRollingNumberMask,
        ...props
      },
      ref,
    ) => {
      const position = useSharedValue(initialValue * digitHeight * -1);
      const prevValue = useRef(initialValue);

      useEffect(() => {
        if (prevValue.current === value) return;
        const newPosition = value * digitHeight * -1;
        if (transitionConfig?.y?.type === 'spring') {
          position.value = withSpring(newPosition, transitionConfig?.y);
        } else {
          position.value = withTiming(
            newPosition,
            transitionConfig?.y ?? defaultTransitionConfig.y,
          );
        }
        prevValue.current = value;
      }, [digitHeight, position, transitionConfig?.y, value]);

      const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: position.value }],
      }));

      const maskStyle = useMemo(() => ({ height: digitHeight }), [digitHeight]);

      const digitStackStyle = useMemo(
        () => [
          animatedStyle,
          { height: digitHeight * 10 },
          style,
          styles?.root,
          styles?.text,
          { lineHeight: digitHeight },
        ],
        [animatedStyle, digitHeight, style, styles?.root, styles?.text],
      );

      return (
        <RollingNumberMaskComponent ref={ref} {...props} style={maskStyle}>
          <AnimatedText {...textProps} style={digitStackStyle}>
            {/* We are doing it this way instead of a VStack because it's more performant, the color animation is applied 1 time instead of 10 */}
            {digits.join('\n')}
          </AnimatedText>
        </RollingNumberMaskComponent>
      );
    },
  ),
);

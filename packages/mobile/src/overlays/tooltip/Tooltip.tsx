import { Fragment, memo, useCallback, useMemo, useRef, useState } from 'react';
import { Modal as RNModal, TouchableOpacity, View } from 'react-native';
import type { AccessibilityRole } from 'react-native';

import { InvertedThemeProvider } from '../../system/ThemeProvider';

import { InternalTooltip } from './InternalTooltip';
import type { SubjectLayout, TooltipProps } from './TooltipProps';
import { useTooltipAnimation } from './useTooltipAnimation';

export const Tooltip = memo(
  ({
    children,
    content,
    placement = 'top',
    onCloseTooltip,
    onOpenTooltip,
    gap = 1,
    yShiftByStatusBarHeight,
    testID,
    accessibilityLabel,
    accessibilityHint,
    accessibilityLabelForContent,
    accessibilityHintForContent,
    visible,
    invertColorScheme = true,
    elevation,
    triggerDisabled = false,
  }: TooltipProps) => {
    const subjectRef = useRef<View | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const isVisible = visible !== false && isOpen;
    const [subjectLayout, setSubjectLayout] = useState<SubjectLayout>();

    const WrapperComponent = invertColorScheme ? InvertedThemeProvider : Fragment;

    const { opacity, translateY, animateIn, animateOut } = useTooltipAnimation(placement);

    const handleRequestClose = useCallback(() => {
      animateOut.start(() => {
        setIsOpen(false);
        onCloseTooltip?.();
      });
    }, [animateOut, onCloseTooltip]);

    const handlePressSubject = useCallback(() => {
      subjectRef.current?.measure((x, y, width, height, pageOffsetX, pageOffsetY) => {
        setSubjectLayout({
          width,
          height,
          pageOffsetX,
          pageOffsetY,
        });
      });
      setIsOpen(true);
      onOpenTooltip?.();
    }, [onOpenTooltip]);

    const computedAccessibilityLabel = useMemo(
      () =>
        typeof children === 'string' && accessibilityLabel === undefined
          ? children
          : accessibilityLabel,
      [children, accessibilityLabel],
    );

    const computedAccessibilityHint = useMemo(
      () =>
        typeof children === 'string' && accessibilityHint === undefined
          ? children
          : accessibilityHint,
      [children, accessibilityHint],
    );

    // When trigger is disabled, make wrapper accessible instead of TouchableOpacity
    // This prevents TalkBack from detecting the onPress handler
    const accessibilityPropsForWrapper = useMemo(() => {
      if (!triggerDisabled) {
        return undefined;
      }

      return {
        accessible: true,
        accessibilityRole: 'text' as AccessibilityRole,
        accessibilityLabel: computedAccessibilityLabel,
        accessibilityHint: computedAccessibilityHint,
      };
    }, [triggerDisabled, computedAccessibilityLabel, computedAccessibilityHint]);

    // The accessibility props for the trigger component. Trigger component
    // equals the component where when you click on it, it will show the tooltip
    const accessibilityPropsForTrigger = useMemo(() => {
      if (triggerDisabled) {
        return {
          'aria-hidden': true,
        };
      }

      return {
        accessibilityLabel: computedAccessibilityLabel,
        accessibilityHint: computedAccessibilityHint,
        accessibilityRole: 'button' as AccessibilityRole,
      };
    }, [triggerDisabled, computedAccessibilityLabel, computedAccessibilityHint]);

    const accessibilityPropsForContent = useMemo(
      () => ({
        accessibilityLabel:
          typeof content === 'string' && accessibilityLabelForContent === undefined
            ? content
            : accessibilityLabelForContent,
        accessibilityHint:
          typeof content === 'string' && accessibilityHintForContent === undefined
            ? content
            : accessibilityHintForContent,
        onAccessibilityEscape: handleRequestClose,
        onAccessibilityTap: handleRequestClose,
      }),
      [content, accessibilityLabelForContent, accessibilityHintForContent, handleRequestClose],
    );

    return (
      <View ref={subjectRef} collapsable={false} {...accessibilityPropsForWrapper}>
        <TouchableOpacity {...accessibilityPropsForTrigger} onPress={handlePressSubject}>
          {children}
        </TouchableOpacity>

        <RNModal
          hardwareAccelerated
          transparent
          accessibilityRole="alert"
          animationType="none"
          onRequestClose={handleRequestClose}
          visible={isVisible}
        >
          <TouchableOpacity
            accessibilityElementsHidden
            accessibilityRole="button"
            activeOpacity={1}
            onPress={handleRequestClose}
            style={{ flex: 1 }}
          />
          <WrapperComponent>
            <InternalTooltip
              animateIn={animateIn}
              content={content}
              elevation={elevation}
              gap={gap}
              opacity={opacity}
              placement={placement}
              subjectLayout={subjectLayout}
              testID={testID}
              translateY={translateY}
              yShiftByStatusBarHeight={yShiftByStatusBarHeight}
              {...accessibilityPropsForContent}
            />
          </WrapperComponent>
        </RNModal>
      </View>
    );
  },
);

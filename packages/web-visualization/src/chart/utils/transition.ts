import { useEffect, useRef } from 'react';
import { interpolatePath } from 'd3-interpolate-path';
import {
  animate,
  type AnimationPlaybackControls,
  type MotionValue,
  type Transition,
  useMotionValue,
  useTransform,
  type ValueAnimationTransition,
} from 'framer-motion';

/**
 * Default transition configuration used across all chart components.
 * Uses a smooth spring animation with balanced stiffness and damping.
 */
export const defaultTransition: Transition = {
  type: 'spring',
  stiffness: 900,
  damping: 120,
  mass: 4,
};

/**
 * Hook that manages path animation state and transitions using d3-interpolate-path
 * with framer-motion's transition system (supports springs, tweens, etc.).
 *
 * This provides smooth path morphing with configurable transition types and automatic
 * interruption handling. When an animation is interrupted by a new path change, it will
 * smoothly transition from the current interpolated position to the new target.
 *
 * @param currentPath - Current target path to animate to
 * @param initialPath - Initial path for enter animation. When provided, the first animation will go from initialPath to currentPath. If not provided, defaults to currentPath (no enter animation)
 * @param transitionConfigs - Transition configurations for different animation phases
 * @returns MotionValue containing the current interpolated path string
 *
 * @example
 * // Simple path transition with spring
 * const animatedPath = usePathTransition({
 *   currentPath: d ?? '',
 *   transitionConfigs: {
 *     update: { type: 'spring', stiffness: 300, damping: 20 }
 *   }
 * });
 *
 * @example
 * // Enter animation with different initial config
 * const animatedPath = usePathTransition({
 *   currentPath: targetPath,
 *   initialPath: baselinePath,
 *   transitionConfigs: {
 *     enter: { type: 'spring', duration: 0.6 },
 *     update: { type: 'tween', duration: 0.3, ease: 'easeInOut' }
 *   }
 * });
 */
export const usePathTransition = ({
  currentPath,
  initialPath,
  transitionConfigs,
}: {
  /**
   * Current target path to animate to.
   */
  currentPath: string;
  /**
   * Initial path for enter animation.
   * When provided, the first animation will go from initialPath to currentPath.
   * If not provided, defaults to currentPath (no enter animation).
   */
  initialPath?: string;
  /**
   * Transition configurations for different animation phases.
   */
  transitionConfigs?: {
    /**
     * Transition used when the path first enters/mounts.
     */
    enter?: Transition;
    /**
     * Transition used when the path morphs to new data.
     */
    update?: Transition;
  };
}): MotionValue<string> => {
  const isInitialRender = useRef(true);
  const previousPathRef = useRef(initialPath ?? currentPath);
  const targetPathRef = useRef(currentPath);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  const progress = useMotionValue(0);

  // Derive the interpolated path from progress using useTransform
  const interpolatedPath = useTransform(progress, (latest) => {
    const pathInterpolator = interpolatePath(previousPathRef.current, targetPathRef.current);
    return pathInterpolator(latest);
  });

  useEffect(() => {
    // Only proceed if the target path has actually changed
    if (targetPathRef.current !== currentPath) {
      // Cancel any ongoing animation before starting a new one
      const wasAnimating = !!animationRef.current;
      if (animationRef.current) {
        animationRef.current.cancel();
        animationRef.current = null;
      }

      const currentInterpolatedPath = interpolatedPath.get();

      // If we were animating and the interpolated path is different from both start and end,
      // use it as the starting point for the next animation (smooth interruption)
      const isInterpolatedPosition =
        currentInterpolatedPath !== previousPathRef.current &&
        currentInterpolatedPath !== currentPath;

      if (wasAnimating && isInterpolatedPosition) {
        previousPathRef.current = currentInterpolatedPath;
      }

      targetPathRef.current = currentPath;

      const configToUse =
        isInitialRender.current && transitionConfigs?.enter
          ? transitionConfigs.enter
          : (transitionConfigs?.update ?? defaultTransition);

      progress.set(0);
      animationRef.current = animate(progress, 1, {
        ...(configToUse as ValueAnimationTransition<number>),
        onComplete: () => {
          previousPathRef.current = currentPath;
        },
      });

      isInitialRender.current = false;
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
      }
    };
  }, [currentPath, transitionConfigs, progress, interpolatedPath]);

  return interpolatedPath;
};

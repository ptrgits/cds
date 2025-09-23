import 'd3-transition';

import React, { memo, useCallback, useEffect, useRef } from 'react';
import type { SVGProps } from 'react';
import { useValueChanges } from '@coinbase/cds-common/hooks/useValueChanges';
import type { Rect, SharedProps } from '@coinbase/cds-common/types';
import { generateRandomId } from '@coinbase/cds-utils';
import { interpolatePath } from 'd3-interpolate-path';
import { select } from 'd3-selection';
import { m } from 'framer-motion';

import { useChartContext } from './ChartContext';

export type PathProps = SharedProps &
  Omit<
    SVGProps<SVGPathElement>,
    | 'onAnimationStart'
    | 'onAnimationEnd'
    | 'onAnimationIteration'
    | 'onAnimationStartCapture'
    | 'onAnimationEndCapture'
    | 'onAnimationIterationCapture'
    | 'onDrag'
    | 'onDragEnd'
    | 'onDragStart'
    | 'onDragCapture'
    | 'onDragEndCapture'
    | 'onDragStartCapture'
  > & {
    /**
     * Whether to disable animations for this path.
     */
    disableAnimations?: boolean;
    /**
     * Custom clip path rect. If provided, this overrides the default chart rect for clipping.
     */
    clipRect?: Rect;
    /**
     * The offset to add to the clip rect boundaries.
     */
    clipOffset?: number;
  };

export const Path = memo<PathProps>(
  ({ disableAnimations, clipRect, clipOffset = 0, d = '', ...pathProps }) => {
    const pathRef = useRef<SVGPathElement>(null);
    const clipPathIdRef = useRef<string>(generateRandomId());
    const { rect: contextRect } = useChartContext();
    const rect = clipRect ?? contextRect;

    // todo: do we need useValueChanges?
    const {
      previousValue: previousPath,
      newValue: newPath,
      hasChanged,
      addPreviousValue,
    } = useValueChanges(d);

    const morphPath = useCallback(() => {
      if (!pathRef.current || !newPath || !previousPath) return;

      select(pathRef.current)
        .transition()
        .duration(300)
        .attrTween('d', function tween() {
          return interpolatePath(previousPath as string, newPath as string);
        });
    }, [previousPath, newPath]);

    useEffect(() => {
      addPreviousValue(newPath);

      if (!disableAnimations && hasChanged && previousPath) {
        morphPath();
      }
    }, [addPreviousValue, newPath, disableAnimations, hasChanged, previousPath, morphPath]);

    // The clip offset provides extra padding to prevent path from being cut off
    // Area charts typically use offset=0 for exact clipping, while lines use offset=2 for breathing room
    const totalOffset = clipOffset * 2; // Applied on both sides

    return (
      <>
        <defs>
          <clipPath id={clipPathIdRef.current}>
            {disableAnimations ? (
              <rect
                height={rect.height + totalOffset}
                width={rect.width + totalOffset}
                x={rect.x - clipOffset}
                y={rect.y - clipOffset}
              />
            ) : (
              <m.rect
                animate="visible"
                height={rect.height + totalOffset}
                initial="hidden"
                variants={{
                  hidden: { width: 0 },
                  visible: {
                    width: rect.width + totalOffset,
                    transition: { type: 'spring', duration: 1, bounce: 0 },
                  },
                }}
                x={rect.x - clipOffset}
                y={rect.y - clipOffset}
              />
            )}
          </clipPath>
        </defs>
        <path ref={pathRef} clipPath={`url(#${clipPathIdRef.current})`} d={d} {...pathProps} />
      </>
    );
  },
);

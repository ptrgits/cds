import React, { memo, useEffect, useState } from 'react';
import { Box, type BoxProps } from '@coinbase/cds-web/layout';
import {
  autoUpdate,
  flip,
  offset,
  type Placement,
  shift,
  useFloating,
} from '@floating-ui/react-dom';

import { useScrubberContext } from '../utils';

export type ChartTooltipProps = Omit<BoxProps<'div'>, 'content'> & {
  /**
   * Content to render. Receives the current data index.
   */
  content?: React.ReactNode | ((dataIndex: number) => React.ReactNode);
  /**
   * Whether the tooltip should follow the mouse cursor.
   * If false, it will snap to the X position of the scrubber but stay at a fixed Y (top of chart).
   * @default true
   */
  followMouse?: boolean;
  /**
   * Preferred placement of the tooltip.
   * @default 'top'
   */
  placement?: Placement;
  /**
   * Offset from the reference point.
   * @default 16
   */
  offset?: number;
};

export const ChartTooltip = memo(
  ({
    content,
    followMouse = true,
    placement = 'bottom-start',
    offset: offsetValue = 16,
    className,
    style,
    ...props
  }: ChartTooltipProps) => {
    const { scrubberPosition, svgRef, scrubberClientCoordsRef } = useScrubberContext();

    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState<{ x: number; y: number } | undefined>(undefined);

    const { refs, floatingStyles, update } = useFloating({
      placement,
      middleware: [
        offset(({ placement }) => {
          const mainAxis = placement.includes('bottom') ? offsetValue : offsetValue / 2;
          const crossAxis = placement.includes('start') ? offsetValue : -(offsetValue / 2);
          return { mainAxis, crossAxis };
        }),
        flip({ fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] }),
        shift({ padding: 8 }),
      ],
      open: isOpen,
    });

    // Update coords when scrubber activates or moves
    useEffect(() => {
      if (scrubberPosition === undefined || !svgRef?.current) {
        setIsOpen(false);
        setCoords(undefined);
        return;
      }

      const svg = svgRef.current;

      // Initialize with last known coords if available
      if (scrubberClientCoordsRef?.current) {
        setCoords(scrubberClientCoordsRef.current);
        setIsOpen(true);
      }

      const handlePointerMove = (e: MouseEvent | TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        setCoords({ x: clientX, y: clientY });
        setIsOpen(true);
      };

      svg.addEventListener('mousemove', handlePointerMove);
      svg.addEventListener('touchmove', handlePointerMove, { passive: false });
      svg.addEventListener('touchstart', handlePointerMove, { passive: false });

      return () => {
        svg.removeEventListener('mousemove', handlePointerMove);
        svg.removeEventListener('touchmove', handlePointerMove);
        svg.removeEventListener('touchstart', handlePointerMove);
      };
    }, [scrubberPosition, svgRef, scrubberClientCoordsRef]);

    // Update floating position
    useEffect(() => {
      if (!isOpen || !coords) return;

      const virtualEl = {
        getBoundingClientRect() {
          const x = coords.x;
          let y = coords.y;

          if (!followMouse && svgRef?.current) {
            // If not following mouse, align Y to top of SVG, keep X
            const svgRect = svgRef.current.getBoundingClientRect();
            y = svgRect.top;
          }

          return {
            width: 0,
            height: 0,
            x,
            y,
            top: y,
            left: x,
            right: x,
            bottom: y,
          };
        },
      };

      refs.setReference(virtualEl);
      update();
    }, [isOpen, coords, followMouse, svgRef, refs, update]);

    // Auto update position when open
    useEffect(() => {
      if (isOpen && refs.reference.current && refs.floating.current) {
        return autoUpdate(refs.reference.current, refs.floating.current, update);
      }
    }, [isOpen, update, refs]);

    if (!isOpen || scrubberPosition === undefined) return null;

    const resolvedContent = typeof content === 'function' ? content(scrubberPosition) : content;

    return (
      <Box
        ref={refs.setFloating}
        className={className}
        style={{
          ...floatingStyles,
          zIndex: 9999,
          pointerEvents: 'none',
          position: 'fixed',
          ...style,
        }}
        {...props}
      >
        {resolvedContent}
      </Box>
    );
  },
);

ChartTooltip.displayName = 'ChartTooltip';
(ChartTooltip as any).cdsRole = 'tooltip';

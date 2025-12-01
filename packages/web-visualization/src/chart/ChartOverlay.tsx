import { memo, useEffect, useState } from 'react';
import type React from 'react';
import { createPortal } from 'react-dom';

export type ChartOverlayProps = {
  children: React.ReactNode;
  /**
   * The slot ref to portal into.
   */
  slotRef?: React.RefObject<HTMLElement | null>;
};

export const ChartOverlay = memo(function ChartOverlay({ children, slotRef }: ChartOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // We only want to mount after the slotRef is available
  if (!mounted || !slotRef?.current) {
    return null;
  }

  // Portal directly into the slot element
  return createPortal(children, slotRef.current);
});

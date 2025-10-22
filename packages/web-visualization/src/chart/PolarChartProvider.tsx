import { createContext, useContext } from 'react';

import type { PolarChartContextValue } from './polar/utils/context';

const PolarChartContext = createContext<PolarChartContextValue | undefined>(undefined);

/**
 * Hook to access the PolarChart context.
 * Must be used within a PolarChart component.
 */
export const usePolarChartContext = (): PolarChartContextValue => {
  const context = useContext(PolarChartContext);
  if (!context) {
    throw new Error(
      'usePolarChartContext must be used within a PolarChart component. See http://cds.coinbase.com/components/graphs/PolarChart.',
    );
  }
  return context;
};

export const PolarChartProvider = PolarChartContext.Provider;

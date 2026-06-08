'use client';

import { createContext, useContext } from 'react';

export interface LayoutContextValue {
  /**
   * Bumped by the PublicLayout when something globally invalidates
   * the lists (e.g. a movie is added, a favorite changes).
   * Children can depend on this to re-fetch.
   */
  refreshKey: number;
}

export const LayoutContext = createContext<LayoutContextValue>({ refreshKey: 0 });

export function useLayoutContext(): LayoutContextValue {
  return useContext(LayoutContext);
}

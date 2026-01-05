// src/context.tsx

import React, { createContext, useContext, ReactNode, useLayoutEffect } from 'react';
import { configureBasis } from './engine';
import { BasisHUD } from './ui/BasisHUD';

const BasisContext = createContext({ debug: false });
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

interface BasisProviderProps {
  children: ReactNode;
  debug?: boolean;
}

export const BasisProvider: React.FC<BasisProviderProps> = ({ children, debug = true }) => {
  useLayoutEffect(() => {
    configureBasis({ debug });
    if (isWeb) {
      (window as any)._basis_debug = debug;
    }
  }, [debug]);

  return (
    <BasisContext.Provider value={{ debug }}>
      {children}
      {(debug && isWeb) && <BasisHUD />}
    </BasisContext.Provider>
  );
};

export const useBasisConfig = () => useContext(BasisContext);
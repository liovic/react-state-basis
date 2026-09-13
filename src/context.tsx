// src/context.tsx

import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  ReactNode,
} from 'react';
import { configureBasis } from './engine';
import { BasisHUD } from './ui/BasisHUD';

const BasisContext = createContext({ debug: false });

const isWeb =
  typeof window !== 'undefined' && typeof window.document !== 'undefined';

interface BasisProviderProps {
  children: ReactNode;
  debug?: boolean;
  showHUD?: boolean;
}

export const BasisProvider: React.FC<BasisProviderProps> = ({
  children,
  debug = true,
  showHUD = true,
}) => {
  const [hudReady, setHudReady] = useState(false);

  useLayoutEffect(() => {
    configureBasis({ debug });
    if (isWeb) {
      (window as any)._basis_debug = debug;
      setHudReady(true);
    }
  }, [debug]);

  return (
    <BasisContext.Provider value={{ debug }}>
      {children}
      {debug && showHUD && hudReady ? <BasisHUD /> : null}
    </BasisContext.Provider>
  );
};

export const useBasisConfig = () => useContext(BasisContext);
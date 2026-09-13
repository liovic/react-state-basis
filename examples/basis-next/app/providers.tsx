'use client';

import { BasisProvider } from 'react-state-basis';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BasisProvider debug={true} showHUD={true}>
      {children}
    </BasisProvider>
  );
}
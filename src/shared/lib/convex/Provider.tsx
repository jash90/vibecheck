import { ReactNode } from 'react';

import { ConvexAuthProvider } from '@convex-dev/auth/react';

import { convex } from './client';
import { secureStorage } from './secure-store';

interface ConvexProviderProps {
  children: ReactNode;
}

export function ConvexProvider({ children }: ConvexProviderProps) {
  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      {children}
    </ConvexAuthProvider>
  );
}

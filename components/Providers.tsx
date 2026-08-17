'use client';

import { SessionProvider } from 'next-auth/react';
import { AnimatedToastProvider } from '@/components/ui/AnimatedToastStack';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AnimatedToastProvider>
        {children}
      </AnimatedToastProvider>
    </SessionProvider>
  );
}


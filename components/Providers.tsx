'use client';

import { SessionProvider } from 'next-auth/react';
import { MotionConfig } from 'framer-motion';
import { AnimatedToastProvider } from '@/components/ui/AnimatedToastStack';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* reducedMotion="user": Framer Motion skips movement for people whose
          OS is set to "reduce motion". CSS animations are handled in globals.css. */}
      <MotionConfig reducedMotion="user">
        <AnimatedToastProvider>
          {children}
        </AnimatedToastProvider>
      </MotionConfig>
    </SessionProvider>
  );
}

'use client';

import { AnimatePresence, LazyMotion, domAnimation, MotionConfig } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AuthProvider>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <AnimatePresence mode="wait" initial={false}>
            <div key={pathname} className="animate-fade-in">
              {children}
            </div>
          </AnimatePresence>
        </MotionConfig>
      </LazyMotion>
    </AuthProvider>
  );
}

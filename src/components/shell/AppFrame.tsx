'use client';

import type { ReactNode } from 'react';
import MobileHeader from '@/components/MobileHeader';
import { MobileTabBar } from '@/components/MobileTabBar';
import { Sidebar } from '@/components/Sidebar';
import { RingMark } from '@/components/ui';

export function AppFrame({ variant, children, banner }: { variant: 'member' | 'admin'; children: ReactNode; banner?: ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-page text-ink">
      <div className="hidden lg:flex">
        <Sidebar variant={variant} />
      </div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileHeader isAdmin={variant === 'admin'} />
        <main id="main" className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-[76px] lg:pt-8 pb-28 lg:pb-12">
          <div className="max-w-[1240px] mx-auto">
            {banner}
            {children}
          </div>
        </main>
        <MobileTabBar variant={variant} />
      </div>
    </div>
  );
}

export function FullScreenLoader({ label = 'Loading your group' }: { label?: string }) {
  return (
    <div className="h-dvh flex flex-col items-center justify-center gap-4 bg-page text-ink-2" role="status" aria-live="polite">
      <RingMark size={44} className="animate-spin [animation-duration:2.4s]" />
      <span className="text-[14px]">{label}</span>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const memberTabs = [
  {
    href: '/dashboard',
    icon: 'home',
    label: 'Home'
  },
  {
    href: '/dashboard/contributions',
    icon: 'payments',
    label: 'Contribute'
  },
  {
    href: '/dashboard/loans',
    icon: 'account_balance',
    label: 'Loans'
  },
  {
    href: '/dashboard/wallet',
    icon: 'account_balance_wallet',
    label: 'Wallet'
  },
  {
    href: null, // opens more sheet
    icon: 'grid_view',
    label: 'More'
  }
];

export function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('active_chama_id');
    router.push('/login');
  };

  return (
    <>
      {/* Tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 sidebar-bg border-t border-[var(--border)] h-16 flex items-center safe-area-inset-bottom pb-safe">
        {memberTabs.map((tab) => {
          const isActive = tab.href
            ? pathname === tab.href || (pathname.startsWith(tab.href + '/') && tab.href !== '/dashboard')
            : moreOpen;

          return (
            <button
              key={tab.label}
              onClick={() => {
                if (tab.href) {
                  router.push(tab.href);
                  setMoreOpen(false);
                } else {
                  setMoreOpen(!moreOpen);
                }
              }}
              className="flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-colors relative"
            >
              <span
                className={`material-symbols-outlined text-[24px] transition-colors ${
                  isActive ? 'text-[#22C55E]' : 'text-[#9CA3AF] dark:text-[#5a6e5a]'
                }`}
                style={{
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0"
                }}
              >
                {tab.icon}
              </span>

              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-[#22C55E]' : 'text-[#9CA3AF] dark:text-[#5a6e5a]'
                }`}
              >
                {tab.label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-1.5 w-1 h-1 rounded-full bg-[#22C55E]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* MORE BOTTOM SHEET */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />

          {/* Sheet */}
          <div className="md:hidden fixed bottom-16 left-0 right-0 z-50 card-bg border-t border-[var(--border)] rounded-t-3xl pb-safe max-h-[80vh] overflow-y-auto">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1 rounded-full bg-[#E5E7EB] dark:bg-[#2d3d2d]" />
            </div>

            {/* Sheet title */}
            <p className="px-6 pb-4 text-[13px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              All Features
            </p>

            {/* Grid of all other nav items */}
            <div className="grid grid-cols-4 gap-1 px-4 pb-6">
              {[
                { href: '/dashboard/savings', icon: 'savings', label: 'Savings' },
                { href: '/dashboard/members', icon: 'group', label: 'Members' },
                { href: '/dashboard/transactions', icon: 'receipt_long', label: 'History' },
                { href: '/dashboard/smartgrow', icon: 'trending_up', label: 'SmartGrow' },
                { href: '/dashboard/analytics', icon: 'insights', label: 'Analytics' },
                { href: '/dashboard/trust-score', icon: 'verified', label: 'Trust' },
                { href: '/dashboard/notifications', icon: 'notifications', label: 'Alerts' },
                { href: '/dashboard/activity', icon: 'timeline', label: 'Activity' },
                { href: '/dashboard/settings', icon: 'settings', label: 'Settings' },
                { href: '/dashboard/profile', icon: 'person', label: 'Profile' }
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl hover:bg-[#edf6ea] dark:hover:bg-[#1a2a1a] transition-colors active:scale-95 active:transition-transform"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#FAFAFA] dark:bg-[#1f2a1f] border border-[var(--border)] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px] text-[#3d4a3d] dark:text-[#8FA88F]">
                      {item.icon}
                    </span>
                  </div>

                  <span className="text-[11px] font-medium text-[var(--text-muted)] text-center">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>

            {/* Sign out at bottom of sheet */}
            <div className="mx-4 mb-6 pt-4 border-t border-[var(--border)]">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#ba1a1a] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                <span className="text-[15px] font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

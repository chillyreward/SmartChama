'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import GroupSwitcher from '@/components/GroupSwitcher';
import MobileHeader from '@/components/MobileHeader';
import { MobileTabBar } from '@/components/MobileTabBar';
import { NewContributionModal } from '@/components/NewContributionModal';
import { signOut } from '@/lib/auth-helpers';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, member, group, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showContributionModal, setShowContributionModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/login');
    }
  }, [isLoading, session, router]);

  if (isLoading || !session) {
    return (
      <div className="flex h-screen items-center justify-center page-bg">
        <div className="w-12 h-12 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const navItems = [
    { icon: 'dashboard', label: 'Overview', href: '/dashboard' },
    { icon: 'savings', label: 'Savings', href: '/dashboard/savings' },
    { icon: 'payments', label: 'Contributions', href: '/dashboard/contributions' },
    { icon: 'account_balance', label: 'Loans', href: '/dashboard/loans' },
    { icon: 'group', label: 'Members', href: '/dashboard/members' },
    { icon: 'account_balance_wallet', label: 'Wallet', href: '/dashboard/wallet' },
    { icon: 'receipt_long', label: 'Transactions', href: '/dashboard/transactions' },
    { icon: 'trending_up', label: 'SmartGrow', href: '/dashboard/smartgrow' },
    { icon: 'analytics', label: 'Analytics', href: '/dashboard/analytics' },
    { icon: 'settings', label: 'Settings', href: '/dashboard/settings' },
  ];

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const isRoleAdmin = member?.role && ['admin', 'chairlady', 'treasurer', 'secretary'].includes(member.role);

  return (
    <div className="flex flex-col min-h-screen page-bg font-inter text-[var(--text-main)]">
      
      {/* DESKTOP HEADER (DOUBLE-TIER) */}
      <header className="hidden md:block w-full sidebar-bg border-b border-[var(--border)] sticky top-0 z-30 shadow-sm">
        {/* Tier 1: Branding, Group Switcher, Utility Actions */}
        <div className="flex h-16 items-center justify-between px-8 border-b border-[var(--border)] max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="SmartChama"
                width={36}
                height={36}
                className="h-9 w-9 object-contain flex-shrink-0"
                priority
              />
              <span className="text-[20px] font-bold tracking-tight text-[var(--text-main)] font-geist">
                SmartChama
              </span>
            </Link>
            <div className="w-px h-6 bg-gray-200 dark:bg-[#2d3d2d]"></div>
            <GroupSwitcher />
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Action Button */}
            <button 
              onClick={() => setShowContributionModal(true)}
              className="bg-[#22C55E] hover:bg-[#1ea94e] text-white rounded px-4 py-2 flex items-center gap-2 transition-colors font-medium text-sm shadow-sm cursor-pointer animate-pulse-subtle"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Contribution</span>
            </button>

            {isRoleAdmin && (
              <Link 
                href="/admin/dashboard" 
                className="text-xs bg-[#006e2f]/10 dark:bg-green-950/20 text-[#005321] dark:text-[#4ae176] px-3 py-1.5 rounded-full font-bold hover:opacity-85 transition-all hover:scale-105"
              >
                Admin Panel
              </Link>
            )}

            <div className="w-px h-6 bg-gray-200 dark:bg-[#2d3d2d]"></div>

            <Link href="/dashboard/notifications" className="text-[var(--text-muted)] hover:text-[#006e2f] dark:hover:text-[#4ae176] transition-colors flex items-center p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#1a2218]" title="Notifications">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
            </Link>

            <Link href="/dashboard/support" className="text-[var(--text-muted)] hover:text-[#006e2f] dark:hover:text-[#4ae176] transition-colors flex items-center p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#1a2218]" title="Help & Support">
              <span className="material-symbols-outlined text-[22px]">help</span>
            </Link>

            <button 
              onClick={signOut}
              className="text-[var(--text-muted)] hover:text-red-500 transition-colors flex items-center p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/25 cursor-pointer"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
            </button>

            <Link href="/dashboard/profile" className="w-9 h-9 rounded-full bg-[#006e2f] dark:bg-[#22C55E] text-white flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm ml-1 hover:scale-105 transition-transform" title="My Profile">
              {getInitials(member?.full_name)}
            </Link>
          </div>
        </div>

        {/* Tier 2: Desktop Horizontal Navigation Tabs */}
        <div className="max-w-[1400px] mx-auto w-full px-8 flex items-center h-12 overflow-x-auto scrollbar-none">
          <nav className="flex gap-1 lg:gap-2">
            {navItems.map(item => {
              const isActive = item.href === '/dashboard' 
                ? pathname === '/dashboard' 
                : pathname?.startsWith(item.href);
              
              return (
                <Link 
                  key={item.label} 
                  href={item.href} 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all text-xs font-semibold ${
                    isActive 
                      ? "bg-[#22C55E]/10 text-[var(--brand-green)] font-bold border-b-2 border-[#22C55E]" 
                      : "text-[#3d4a3d] dark:text-[#8FA88F] hover:text-[#006e2f] dark:hover:text-[#4ae176] hover:bg-[#f5f5f5] dark:hover:bg-[#1f2a1f]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] shrink-0" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* MOBILE HEADER */}
      <MobileHeader />

      {/* SCROLLABLE MAIN CONTENT */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-8 overflow-y-auto">
        {children}
      </main>

      {/* MOBILE BOTTOM TAB BAR */}
      <MobileTabBar />
      
      {showContributionModal && (
        <NewContributionModal
          onClose={() => setShowContributionModal(false)}
          defaultAmount={group?.contribution_amount || 500}
          memberPhone={member?.phone_number || ''}
          membershipId={member?.id || ''}
          chamaId={group?.id || ''}
          chamaName={group?.name || ''}
        />
      )}
    </div>
  );
}
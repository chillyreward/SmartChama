"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { NewContributionModal } from '@/components/NewContributionModal';
import GroupSwitcher from '@/components/GroupSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import MobileHeader from '@/components/MobileHeader';
import { MobileTabBar } from '@/components/MobileTabBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, member, group, isLoading } = useAuth();
  const [showContributionModal, setShowContributionModal] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        router.push('/login');
      } else if (!member || !group) {
        router.push('/onboarding');
      }
    }
  }, [isLoading, session, member, group, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('active_chama_id');
    router.push('/login');
  };

  if (isLoading || !session || !member || !group) {
    return (
      <div className="flex h-screen page-bg items-center justify-center font-inter">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-body-sm text-[var(--text-muted)] animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { icon: 'dashboard', label: 'Overview', href: '/dashboard' },
    { icon: 'savings', label: 'My Savings', href: '/dashboard/savings' },
    { icon: 'payments', label: 'Contributions', href: '/dashboard/contributions' },
    { icon: 'account_balance', label: 'Loans', href: '/dashboard/loans' },
    { icon: 'group', label: 'Members', href: '/dashboard/members' },
    { icon: 'account_balance_wallet', label: 'Wallet', href: '/dashboard/wallet' },
    { icon: 'receipt_long', label: 'Transactions', href: '/dashboard/transactions' },
    { icon: 'trending_up', label: 'SmartGrow', href: '/dashboard/smartgrow' },
    { icon: 'analytics', label: 'Analytics', href: '/dashboard/analytics' },
    { icon: 'settings', label: 'Settings', href: '/dashboard/settings' },
  ];

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen page-bg font-inter overflow-hidden text-[var(--text-main)]">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 fixed left-0 top-0 h-screen sidebar-bg border-r border-[var(--border)] flex-col z-20 overflow-y-auto">
        
        {/* Top Branding */}
        <Link href="/" className="block">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border)]">
            <Image
              src="/logo.png"
              alt="SmartChama"
              width={40}
              height={40}
              className="h-10 w-10 object-contain flex-shrink-0"
              priority
            />
            <span className="text-[20px] font-bold tracking-tight text-[var(--text-main)]">
              SmartChama
            </span>
          </div>
        </Link>

        {/* Action button */}
        <div className="px-4 py-3">
          <button 
            onClick={() => setShowContributionModal(true)}
            className="w-full bg-[#22C55E] text-white rounded px-4 py-3 flex items-center justify-center gap-2 hover:bg-[#006e2f] transition-colors font-medium">
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="text-body-sm font-geist">New Contribution</span>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-1 px-4 overflow-y-auto pt-2">
          {navItems.map(item => {
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard' 
              : pathname?.startsWith(item.href);
            
            return (
              <Link 
                key={item.label} 
                href={item.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                  isActive 
                    ? "bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] border-l-2 border-[#22C55E] font-bold rounded-r" 
                    : "text-[#3d4a3d] dark:text-[#8FA88F] hover:text-[#006e2f] dark:hover:text-[#4ae176] hover:bg-[#f5f5f5] dark:hover:bg-[#1f2a1f]"
                }`}
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span className="text-body-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom support and logout */}
        <div className="border-t border-[var(--border)] pt-4 pb-4 px-4 flex flex-col gap-1">
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-[#3d4a3d] dark:text-[#8FA88F] hover:text-[#006e2f] dark:hover:text-[#4ae176] hover:bg-[#f5f5f5] dark:hover:bg-[#1f2a1f] transition-colors rounded">
            <span className="material-symbols-outlined">help</span>
            <span className="text-body-sm">Support</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-[#3d4a3d] dark:text-[#8FA88F] hover:text-[#006e2f] dark:hover:text-[#4ae176] hover:bg-[#f5f5f5] dark:hover:bg-[#1f2a1f] transition-colors rounded text-left">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-body-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden md:ml-64 text-[var(--text-main)]">
        
        {/* MOBILE HEADER */}
        <MobileHeader />

        {/* TOP NAV */}
        <header className="hidden md:flex h-16 sidebar-bg border-b border-[var(--border)] sticky top-0 justify-between items-center px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="text-headline-sm text-[var(--text-main)] font-bold font-geist">
              Portal
            </div>
            <div className="w-px h-6 bg-gray-200 dark:bg-[#2d3d2d]"></div>
            <GroupSwitcher />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/dashboard/notifications" className="text-[var(--text-muted)] hover:text-[#006e2f] dark:hover:text-[#4ae176] transition-colors flex items-center">
              <span className="material-symbols-outlined">notifications</span>
            </Link>
            <button className="text-[var(--text-muted)] hover:text-[#006e2f] dark:hover:text-[#4ae176] transition-colors flex items-center">
              <span className="material-symbols-outlined">help</span>
            </button>
            <Link href="/dashboard/profile" className="w-10 h-10 rounded-full bg-[#006e2f] dark:bg-[#22C55E] text-white flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm">
              {getInitials(member?.full_name)}
            </Link>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto pt-14 pb-20 px-4 md:pt-6 md:pb-6 md:px-6 page-bg">
          <div className="max-w-[1280px] mx-auto">
            {children}
          </div>
        </main>

      </div>

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
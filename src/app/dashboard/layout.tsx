"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, member, group, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/login');
    }
  }, [isLoading, session, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (isLoading || !session) {
    return (
      <div className="flex h-screen bg-[#FAFAFA] items-center justify-center font-inter">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-body-sm text-secondary animate-pulse">Loading dashboard...</p>
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

  const firstName = member?.full_name?.split(' ')[0] || 'Member';
  
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-inter overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 fixed left-0 top-0 h-screen bg-white border-r border-[#E5E7EB] flex flex-col z-20">
        
        {/* Top */}
        <div className="px-6 py-6 border-b border-[#E5E7EB]">
          <h1 className="text-headline-lg text-primary font-bold font-geist">SmartChama</h1>
          <div className="text-label-caps text-on-secondary-container mt-1 uppercase">
            {group?.name || 'Investment Group'}
          </div>
        </div>

        {/* Action button */}
        <div className="px-4 py-3">
          <button className="w-full bg-[#22C55E] text-white rounded px-4 py-3 flex items-center justify-center gap-2 hover:bg-[#006e2f] transition-colors">
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="text-headline-sm font-geist">New Contribution</span>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-1 px-4 overflow-y-auto pt-2">
          {navItems.map(item => {
            const isActive = pathname === item.href || (pathname === '/dashboard' && item.href === '/dashboard');
            
            return (
              <Link 
                key={item.label} 
                href={item.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                  isActive 
                    ? "text-primary font-bold border-l-2 border-[#22C55E] bg-surface-container-low rounded-r" 
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
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

        {/* Bottom */}
        <div className="border-t border-[#E5E7EB] pt-4 pb-4 px-4 flex flex-col gap-1">
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors rounded">
            <span className="material-symbols-outlined">help</span>
            <span className="text-body-sm">Support</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors rounded text-left">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-body-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        
        {/* TOP NAV */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] sticky top-0 flex justify-between items-center px-6 shrink-0 z-10">
          <div className="text-headline-sm text-on-surface font-geist">Good morning, {firstName} 👋</div>
          <div className="flex items-center gap-4">
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">help</span>
            </button>
            <Link href="/dashboard/profile" className="w-10 h-10 rounded-full bg-[#22C55E] hover:bg-[#006e2f] transition-colors text-white flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm">
              {getInitials(member?.full_name)}
            </Link>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">
          {children}
        </div>

      </main>
    </div>
  );
}
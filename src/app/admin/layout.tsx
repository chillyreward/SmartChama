"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "@/components/ThemeToggle";
import MobileHeader from "@/components/MobileHeader";
import { MobileAdminTabBar } from "@/components/MobileAdminTabBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, member, group, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        router.push("/login");
        return;
      }
      
      const adminRoles = ["admin", "chairlady", "treasurer", "secretary"];
      const isAdmin = member && adminRoles.includes(member.role);
      if (!isAdmin || !group) {
        router.push("/dashboard");
      }
    }
  }, [isLoading, session, member, group, router]);

  useEffect(() => {
    if (group) {
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', group.id)
        .eq('read', false)
        .then(({ count }) => setUnreadCount(count || 0));
    }
  }, [group]);

  const adminRoles = ["admin", "chairlady", "treasurer", "secretary"];
  const isAdmin = member && adminRoles.includes(member.role);

  if (isLoading || !member || !group || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center page-bg">
        <div className="w-12 h-12 border-4 border-[#006e2f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const roleBadgeMap: Record<string, { bg: string, text: string, label: string }> = {
    'chairlady': { bg: 'bg-[#006e2f]/10 dark:bg-green-950/20', text: 'text-[#005321] dark:text-[#4ae176]', label: 'Chairlady' },
    'treasurer': { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-400', label: 'Treasurer' },
    'admin': { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-[#ba1a1a] dark:text-red-405', label: 'Admin' },
    'secretary': { bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-yellow-700 dark:text-yellow-450', label: 'Secretary' }
  };
  const badge = roleBadgeMap[member.role] || roleBadgeMap['admin'];

  const navItems = [
    { name: "Overview", icon: "dashboard", href: "/admin/dashboard" },
    { name: "Members", icon: "group", href: "/admin/members" },
    { name: "Contributions", icon: "payments", href: "/admin/contributions" },
    { name: "Loans", icon: "account_balance", href: "/admin/loans" },
    { name: "Wallet", icon: "account_balance_wallet", href: "/admin/wallet" },
    { name: "Transactions", icon: "receipt_long", href: "/admin/transactions" },
    { name: "Trust Scores", icon: "verified", href: "/admin/trust-scores" },
    { name: "SmartGrow", icon: "trending_up", href: "/admin/smartgrow" },
    { name: "Analytics", icon: "insights", href: "/admin/analytics" },
    { name: "Group Settings", icon: "tune", href: "/admin/settings" },
    { name: "Announcements", icon: "notifications", href: "/admin/announcements" },
    { name: "Audit Log", icon: "shield", href: "/admin/audit-log" },
  ];

  const getPageTitle = () => {
    const currentItem = navItems.find(item => pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin/dashboard'));
    return currentItem ? currentItem.name : "Admin Panel";
  };

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';

  return (
    <div className="flex h-screen page-bg font-inter overflow-hidden text-[var(--text-main)]">
      
      {/* SIDEBAR */}
      <aside className="w-64 sidebar-bg border-r border-[var(--border)] flex flex-col shrink-0 overflow-y-auto hidden md:flex">
        <div className="px-6 py-6 border-b border-[var(--border)]">
          <h1 className="text-headline-lg text-primary dark:text-[#22C55E] font-bold font-geist">SmartChama</h1>
          <div className="text-label-caps text-error uppercase tracking-wider mt-1">Admin Panel</div>
          
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#006e2f] dark:bg-[#22C55E] text-white flex items-center justify-center font-bold text-lg shrink-0">
              {getInitials(member.full_name)}
            </div>
            <div className="min-w-0">
              <div className="text-body-sm font-medium text-on-surface dark:text-[#E8F0E4] truncate">{member.full_name}</div>
              <div className={`text-label-caps px-2 py-0.5 rounded inline-block mt-0.5 font-bold ${badge.bg} ${badge.text}`}>
                {badge.label}
              </div>
            </div>
          </div>
          
          <button className="mt-6 w-full bg-[#006e2f] dark:bg-[#22C55E] hover:bg-[#005321] dark:hover:bg-[#1ea94e] text-white flex items-center justify-center gap-2 py-2.5 rounded transition-colors shadow-sm font-medium">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Add Member
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin/dashboard');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group text-body-sm font-medium shrink-0 ${
                  isActive
                    ? 'bg-surface-container-low dark:bg-[#1a2a1a] text-primary dark:text-[#22C55E] border-l-2 border-[#006e2f] dark:border-[#22C55E]'
                    : 'text-on-surface-variant dark:text-[#8FA88F] hover:bg-surface-container-high dark:hover:bg-[#1f2a1f] hover:text-on-surface border-l-2 border-transparent'
                }`}
              >
                <span className={`material-symbols-outlined text-[22px] transition-colors ${
                  isActive ? 'text-primary dark:text-[#22C55E]' : 'text-secondary dark:text-[#5a6e5a] group-hover:text-on-surface dark:group-hover:text-[#E8F0E4]'
                }`}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-3 border-t border-[var(--border)] shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-on-surface-variant dark:text-[#8FA88F] hover:bg-surface-container-high dark:hover:bg-[#1f2a1f] hover:text-on-surface text-body-sm font-medium">
            <span className="material-symbols-outlined text-[22px] text-secondary dark:text-[#5a6e5a]">switch_account</span>
            Member View
          </Link>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              sessionStorage.removeItem('active_chama_id');
              router.push('/login');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-error hover:bg-red-50 dark:hover:bg-red-950/20 text-body-sm font-medium text-left"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* MOBILE HEADER */}
        <MobileHeader isAdmin={true} />

        {/* TOP NAV */}
        <header className="hidden md:flex h-16 sidebar-bg border-b border-[var(--border)] sticky top-0 justify-between items-center px-6 shrink-0 z-10">
          <div>
            <h2 className="text-headline-sm font-geist font-semibold text-on-surface dark:text-[#E8F0E4]">{getPageTitle()}</h2>
            <p className="text-body-sm text-secondary dark:text-[#8FA88F]">{group?.name || 'Loading group...'}</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary dark:text-[#5a6e5a] text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="Search members, loans..." 
                className="bg-surface-container-low dark:bg-[#1a2218] border border-[var(--border)] rounded px-4 py-2 pl-10 text-body-sm w-64 outline-none focus:border-[#006e2f] focus:ring-1 focus:ring-[#006e2f] transition-all text-on-surface dark:text-[#E8F0E4]"
              />
            </div>

            <ThemeToggle />

            <Link href="/dashboard/notifications" className="relative cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1f2a1f] p-2 rounded-full transition-colors flex items-center">
              <span className="material-symbols-outlined text-secondary dark:text-[#8FA88F]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-white"></span>
              )}
            </Link>

            <div className="w-8 h-8 rounded-full bg-[#006e2f] dark:bg-[#22C55E] text-white flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm relative group">
              {getInitials(member.full_name)}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto pt-14 pb-20 px-4 md:pt-6 md:pb-6 md:px-6">
          {children}
        </main>
        
      </div>

      {/* MOBILE BOTTOM TAB BAR */}
      <MobileAdminTabBar />
    </div>
  );
}

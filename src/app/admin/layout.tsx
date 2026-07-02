'use client';
import { useAuth } from "@/components/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import MobileHeader from "@/components/MobileHeader";
import { MobileAdminTabBar } from "@/components/MobileAdminTabBar";
import { signOut } from "@/lib/auth-helpers";
import Image from "next/image";

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
        .eq('chama_id', group.id)
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

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';

  return (
    <div className="flex flex-col min-h-screen page-bg font-inter text-[var(--text-main)]">
      
      {/* DESKTOP HEADER (DOUBLE-TIER) */}
      <header className="hidden md:block w-full sidebar-bg border-b border-[var(--border)] sticky top-0 z-30 shadow-sm">
        {/* Tier 1: Branding, Group Info, Badges, Utility Actions */}
        <div className="flex h-16 items-center justify-between px-8 border-b border-[var(--border)] max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="SmartChama Logo"
                width={36}
                height={36}
                className="h-9 w-9 object-contain flex-shrink-0"
                priority
              />
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-bold tracking-tight text-[var(--text-main)] font-geist">
                  SmartChama
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/20 text-[#ba1a1a] dark:text-red-400">
                  Admin
                </span>
              </div>
            </Link>
            
            <div className="w-px h-6 bg-gray-200 dark:bg-[#2d3d2d]"></div>
            
            <div className="text-sm font-semibold text-[var(--text-muted)] truncate max-w-[200px]" title={group?.name}>
              {group?.name}
            </div>

            <div className={`text-xs px-2 py-0.5 rounded font-bold ${badge.bg} ${badge.text}`}>
              {badge.label}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Link to Add Member */}
            <Link 
              href="/admin/settings" 
              className="bg-[#006e2f] hover:bg-[#005321] dark:bg-[#22C55E] dark:hover:bg-[#1ea94e] text-white rounded px-4 py-2 flex items-center gap-2 transition-colors font-medium text-sm shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Add Member</span>
            </Link>

            <Link 
              href="/dashboard" 
              className="text-xs bg-[#22C55E]/10 text-[var(--brand-green)] px-3 py-1.5 rounded-full font-bold hover:opacity-85 transition-all hover:scale-105"
            >
              Member Portal
            </Link>

            <div className="w-px h-6 bg-gray-200 dark:bg-[#2d3d2d]"></div>

            <Link href="/admin/notifications" className="relative cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1f2a1f] p-1.5 rounded-full transition-colors flex items-center">
              <span className="material-symbols-outlined text-[#3d4a3d] dark:text-[#8FA88F] text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-white"></span>
              )}
            </Link>

            <button 
              onClick={signOut}
              className="text-[var(--text-muted)] hover:text-red-500 transition-colors flex items-center p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/25 cursor-pointer"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
            </button>

            <div className="w-9 h-9 rounded-full bg-[#006e2f] dark:bg-[#22C55E] text-white flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm relative hover:scale-105 transition-transform" title={member.full_name}>
              {getInitials(member.full_name)}
            </div>
          </div>
        </div>

        {/* Tier 2: Admin Tabs Horizontal Navigation */}
        <div className="max-w-[1400px] mx-auto w-full px-8 flex items-center h-12 overflow-x-auto scrollbar-none">
          <nav className="flex gap-1 lg:gap-2">
            {navItems.map(item => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin/dashboard');
              
              return (
                <Link 
                  key={item.name} 
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
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* MOBILE HEADER */}
      <MobileHeader isAdmin={true} />

      {/* SCROLLABLE MAIN CONTENT */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-8 overflow-y-auto">
        {children}
      </main>

      {/* MOBILE BOTTOM TAB BAR */}
      <MobileAdminTabBar />
    </div>
  );
}

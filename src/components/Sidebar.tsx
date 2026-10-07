'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { signOut } from '@/lib/auth-helpers';
import GroupSwitcher from '@/components/GroupSwitcher';
import { 
  LayoutDashboard, Users, Landmark, Wallet, 
  Receipt, Award, TrendingUp, LineChart, Settings, 
  Megaphone, Shield, LogOut, Coins, RefreshCw, Heart, ShieldAlert
} from 'lucide-react';

import { ThemeToggle } from '@/components/ThemeToggle';

interface SidebarProps {
  variant: 'admin' | 'member';
}

export function Sidebar({ variant }: SidebarProps) {
  const pathname = usePathname();
  const { member } = useAuth();

  const adminNavItems = [
    { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Members", href: "/admin/members", icon: Users },
    { name: "Contributions", href: "/admin/contributions", icon: Coins },
    { name: "Merry-Go-Round", href: "/admin/merry-go-round", icon: RefreshCw },
    { name: "Welfare Fund", href: "/admin/welfare", icon: Heart },
    { name: "Penalties", href: "/admin/penalties", icon: ShieldAlert },
    { name: "Loans", href: "/admin/loans", icon: Landmark },
    { name: "Wallet", href: "/admin/wallet", icon: Wallet },
    { name: "Transactions", href: "/admin/transactions", icon: Receipt },
    { name: "Trust Scores", href: "/admin/trust-scores", icon: Award },
    { name: "SmartGrow", href: "/admin/smartgrow", icon: TrendingUp },
    { name: "Analytics", href: "/admin/analytics", icon: LineChart },
    { name: "Group Settings", href: "/admin/settings", icon: Settings },
    { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
    { name: "Audit Log", href: "/admin/audit-log", icon: Shield },
  ];

  const memberNavItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Savings", href: "/dashboard/savings", icon: Coins },
    { name: "Contributions", href: "/dashboard/contributions", icon: Coins },
    { name: "Merry-Go-Round", href: "/dashboard/merry-go-round", icon: RefreshCw },
    { name: "Welfare", href: "/dashboard/welfare", icon: Heart },
    { name: "Penalties", href: "/dashboard/penalties", icon: ShieldAlert },
    { name: "Loans", href: "/dashboard/loans", icon: Landmark },
    { name: "Members", href: "/dashboard/members", icon: Users },
    { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
    { name: "Transactions", href: "/dashboard/transactions", icon: Receipt },
    { name: "SmartGrow", href: "/dashboard/smartgrow", icon: TrendingUp },
    { name: "Analytics", href: "/dashboard/analytics", icon: LineChart },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const navItems = variant === 'admin' ? adminNavItems : memberNavItems;

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <aside className="w-64 h-screen flex flex-col border-r shrink-0 transition-colors duration-300 sidebar-bg"
      style={{ 
        backgroundColor: 'var(--bg-sidebar)', 
        borderColor: 'var(--border)' 
      }}>
      
      {/* Brand Logo & Title */}
      <div className="flex items-center justify-between h-16 px-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="SmartChama"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="text-[17px] font-bold tracking-tight font-geist text-[#22C55E]">
            SmartChama
          </span>
          {variant === 'admin' && (
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300">
              Admin
            </span>
          )}
        </div>
        <ThemeToggle />
      </div>

      {/* Multi-chama group switcher — only visible when user has 2+ groups */}
      <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <GroupSwitcher />
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href !== '/admin/dashboard');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-medium text-[14px] ${
                isActive
                  ? 'bg-[#22C55E]/10 text-[#22C55E] font-bold border-l-4 border-[#22C55E] rounded-l-none'
                  : 'text-[var(--text-secondary)] hover:text-[#22C55E] dark:hover:text-[#22C55E] hover:bg-[#22C55E]/5'
              }`}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: 'var(--border)' }}>
        {member && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-[#22C55E] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {getInitials(member.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate text-[var(--text-primary)]">{member.full_name}</p>
              <p className="text-[10px] truncate text-[var(--text-muted)]">{member.role}</p>
            </div>
          </div>
        )}

        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all text-[14px] font-medium border-0 bg-transparent text-left cursor-pointer"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Sign Out</span>
        </button>
      </div>

    </aside>
  );
}

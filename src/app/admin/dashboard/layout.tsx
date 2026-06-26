"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from '@/components/AuthProvider';
import { 
  LayoutDashboard, Users, Building2, TrendingUp, 
  Settings, LogOut, Crown, User, Menu, X
} from "lucide-react";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { member, group } = useAuth();

  const navItems = [
    { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "My Chamas", href: "/admin/dashboard/chamas", icon: Building2 },
    { name: "Members", href: "/admin/dashboard/members", icon: Users },
    { name: "Credit Scores", href: "/admin/dashboard/credit-scores", icon: Crown },
    { name: "SmartGrow", href: "/admin/dashboard/smartgrow", icon: TrendingUp },
    { name: "Analytics", href: "/admin/dashboard/analytics", icon: TrendingUp },
    { name: "Profile", href: "/admin/dashboard/profile", icon: User },
    { name: "Settings", href: "/admin/dashboard/settings", icon: Settings },
  ];

  const getInitials = (name: string) => {
    if (!name) return 'AD';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const NavLinks = ({ isMobile = false }) => (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto font-inter">
      {navItems.map((item) => {
        const isActive = item.href === '/admin/dashboard' 
          ? pathname === '/admin/dashboard' 
          : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => isMobile && setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${
              isActive
                ? 'bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] font-medium border-l-2 border-[#22C55E] rounded-r'
                : 'text-[#3d4a3d] dark:text-[#8FA88F] hover:text-[#006e2f] dark:hover:text-[#4ae176] hover:bg-[#f5f5f5] dark:hover:bg-[#1f2a1f] border-l-2 border-transparent'
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActive ? 'text-[var(--brand-green)]' : 'text-[var(--text-muted)]'}`} />
            {(sidebarOpen || isMobile) && <span className="text-body-sm">{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-[100dvh] page-bg overflow-hidden font-inter text-[var(--text-main)]">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className={`hidden lg:flex flex-col sidebar-bg border-r border-[var(--border)] transition-all duration-300 shrink-0 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <Link href="/" className="block">
          <div className={`flex items-center gap-3 border-b border-[var(--border)] transition-all duration-300 ${sidebarOpen ? 'px-6 py-5' : 'p-4 justify-center'}`}>
            <Image
              src="/logo.png"
              alt="SmartChama"
              width={40}
              height={40}
              className="h-10 w-10 object-contain flex-shrink-0"
              priority
            />
            {sidebarOpen && (
              <span className="text-[20px] font-bold tracking-tight text-[var(--text-main)]">
                SmartChama
              </span>
            )}
          </div>
        </Link>

        <NavLinks />

        <div className="p-4 border-t border-[var(--border)]">
          <Link href="/admin/login" className="flex items-center gap-3 px-4 py-3 text-[#3d4a3d] dark:text-[#8FA88F] hover:bg-[#f5f5f5] dark:hover:bg-[#1f2a1f] rounded transition-all">
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-body-sm font-medium">Logout</span>}
          </Link>
        </div>
      </aside>

      {/* --- MOBILE SIDEBAR (Slide-over) --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[#0B0F0C]/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          {/* Menu Panel */}
          <aside className="relative w-64 max-w-[80%] sidebar-bg border-r border-[var(--border)] flex flex-col h-full animate-in slide-in-from-left duration-300 shadow-xl">
            <div className="border-b border-[var(--border)] flex items-center justify-between">
              <Link href="/" className="block flex-1">
                <div className="flex items-center gap-3 px-6 py-5">
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
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 mr-4 text-[var(--text-muted)] hover:text-[#006e2f] bg-gray-50 dark:bg-[#1a2218] rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <NavLinks isMobile={true} />

            <div className="p-4 border-t border-[var(--border)]">
              <Link href="/admin/login" className="flex items-center gap-3 px-4 py-3 text-[#3d4a3d] dark:text-[#8FA88F] hover:bg-[#f5f5f5] dark:hover:bg-[#1f2a1f] rounded transition-all text-body-sm font-medium">
                <LogOut className="w-5 h-5" />
                Logout
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 sidebar-bg border-b border-[var(--border)] sticky top-0 justify-between items-center px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="text-headline-sm text-[var(--text-main)] font-bold font-geist">
              Admin Portal
            </div>
            {group && (
              <>
                <div className="w-px h-6 bg-gray-200 dark:bg-[#2d3d2d]"></div>
                <span className="text-[14px] font-semibold text-[var(--text-muted)]">{group.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/notifications" className="text-[var(--text-muted)] hover:text-[#006e2f] dark:hover:text-[#4ae176] transition-colors flex items-center">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </Link>
            <Link href="/admin/dashboard/profile" className="w-10 h-10 rounded-full bg-[#006e2f] dark:bg-[#22C55E] text-white flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm">
              {getInitials(member?.full_name)}
            </Link>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden shrink-0 h-16 border-b border-[var(--border)] flex items-center justify-between px-4 sidebar-bg z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-surface-container-low dark:bg-[#1a2a1a] rounded flex items-center justify-center border border-[var(--border)]">
              <Crown className="w-4 h-4 text-[#22C55E]" />
            </div>
            <span className="font-bold text-[var(--text-main)] text-headline-sm font-geist">Admin Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-[var(--text-muted)] hover:text-[#006e2f]">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* The Page Content - Handles its own scrolling */}
        <div className="flex-1 overflow-y-auto page-bg">
          {children}
        </div>
      </main>

    </div>
  );
}
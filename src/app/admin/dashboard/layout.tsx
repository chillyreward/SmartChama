"use client";

import { useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Building2, TrendingUp, 
  MessageSquare, Settings, LogOut, Crown, User, Menu, X
} from "lucide-react";

// Create context for invite modal
const InviteModalContext = createContext<{
  openInviteModal: () => void;
} | null>(null);

export const useInviteModal = () => {
  const context = useContext(InviteModalContext);
  if (!context) {
    return { openInviteModal: () => {} };
  }
  return context;
};

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // This will be called from the overview page
  const openInviteModal = () => {
    window.dispatchEvent(new CustomEvent('openInviteModal'));
  };

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

  const NavLinks = ({ isMobile = false }) => (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto font-inter">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => isMobile && setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${
              isActive
                ? 'bg-surface-container-low text-[#22C55E] font-medium border-l-2 border-[#22C55E] rounded-r'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-gray-50 border-l-2 border-transparent'
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActive ? 'text-[#22C55E]' : 'text-secondary'}`} />
            {(sidebarOpen || isMobile) && <span className="text-body-sm">{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-[100dvh] bg-[#FAFAFA] overflow-hidden font-inter">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-[#E5E7EB] transition-all duration-300 shrink-0 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-low rounded-lg flex items-center justify-center shrink-0 border border-[#E5E7EB]">
              <Crown className="w-5 h-5 text-[#22C55E]" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-on-surface text-headline-sm font-geist whitespace-nowrap">SmartChama</h1>
                <p className="text-label-caps text-secondary whitespace-nowrap mt-1">Admin Portal</p>
              </div>
            )}
          </div>
        </div>

        <NavLinks />

        <div className="p-4 border-t border-[#E5E7EB]">
          <Link href="/admin/login" className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-gray-50 hover:text-on-surface rounded transition-all">
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
          <aside className="relative w-64 max-w-[80%] bg-white border-r border-[#E5E7EB] flex flex-col h-full animate-in slide-in-from-left duration-300 shadow-xl">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-surface-container-low rounded flex items-center justify-center border border-[#E5E7EB]">
                  <Crown className="w-4 h-4 text-[#22C55E]" />
                </div>
                <div>
                  <h1 className="font-bold text-on-surface font-geist text-headline-sm">SmartChama</h1>
                  <p className="text-label-caps text-secondary mt-1">Admin</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-secondary hover:text-on-surface bg-gray-50 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <NavLinks isMobile={true} />

            <div className="p-4 border-t border-[#E5E7EB]">
              <Link href="/admin/login" className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-gray-50 hover:text-on-surface rounded transition-all text-body-sm font-medium">
                <LogOut className="w-5 h-5" />
                Logout
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Mobile Header */}
        <header className="lg:hidden shrink-0 h-16 border-b border-[#E5E7EB] flex items-center justify-between px-4 bg-white z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-surface-container-low rounded flex items-center justify-center border border-[#E5E7EB]">
              <Crown className="w-4 h-4 text-[#22C55E]" />
            </div>
            <span className="font-bold text-on-surface text-headline-sm font-geist">Admin Portal</span>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-secondary hover:text-on-surface">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* The Page Content - Handles its own scrolling */}
        <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">
          {children}
        </div>
      </main>

    </div>
  );
}
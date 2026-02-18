"use client";

import { useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Building2, TrendingUp, 
  MessageSquare, Settings, LogOut, Crown, User, Menu, X
} from "lucide-react";
import VoiceAssistant from "@/components/VoiceAssistant";

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
    { name: "SmartGrow", href: "/admin/dashboard/smartgrow", icon: TrendingUp },
    { name: "Analytics", href: "/admin/dashboard/analytics", icon: TrendingUp },
    { name: "AI Advisor", href: "/admin/dashboard/ai-advisor", icon: MessageSquare },
    { name: "Profile", href: "/admin/dashboard/profile", icon: User },
    { name: "Settings", href: "/admin/dashboard/settings", icon: Settings },
  ];

  const NavLinks = ({ isMobile = false }) => (
    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => isMobile && setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive
                ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {(sidebarOpen || isMobile) && <span className="text-sm">{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-[100dvh] bg-slate-950 overflow-hidden font-sans selection:bg-amber-500/30">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className={`hidden lg:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 shrink-0 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-black" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-white text-sm whitespace-nowrap">SmartChama</h1>
                <p className="text-[10px] text-amber-400 uppercase tracking-wider whitespace-nowrap">Admin Portal</p>
              </div>
            )}
          </div>
        </div>

        <NavLinks />

        <div className="p-4 border-t border-slate-800">
          <Link href="/admin/login" className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-xl transition-all">
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </Link>
        </div>
      </aside>

      {/* --- MOBILE SIDEBAR (Slide-over) --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          {/* Menu Panel */}
          <aside className="relative w-64 max-w-[80%] bg-slate-900 border-r border-slate-800 flex flex-col h-full animate-in slide-in-from-left duration-300 shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Crown className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h1 className="font-bold text-white text-sm">SmartChama</h1>
                  <p className="text-[10px] text-amber-400 uppercase">Admin</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <NavLinks isMobile={true} />

            <div className="p-4 border-t border-slate-800">
              <Link href="/admin/login" className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-xl transition-all font-medium text-sm">
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
        <header className="lg:hidden shrink-0 h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-white text-sm">Admin Portal</span>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* The Page Content - Handles its own scrolling */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-10">
          {children}
        </div>
      </main>

      {/* Voice Assistant - Available on all admin pages */}
      <VoiceAssistant />
    </div>
  );
}
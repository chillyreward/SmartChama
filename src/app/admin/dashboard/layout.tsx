"use client";

import { useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Building2, TrendingUp, 
  MessageSquare, Settings, LogOut, UserPlus, Crown, User
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

  // This will be called from the overview page
  const openInviteModal = () => {
    // Dispatch custom event that the overview page will listen to
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

  return (
    <div className="min-h-screen bg-slate-950 flex">
      
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col`}>
        
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-black" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-white text-sm">SmartChama</h1>
                <p className="text-[10px] text-amber-400 uppercase tracking-wider">Admin Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {sidebarOpen && <span className="text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <Link
            href="/admin/login"
            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>

      {/* Voice Assistant - Available on all admin pages */}
      <VoiceAssistant />
    </div>
  );
}

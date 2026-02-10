'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Wallet, 
  PieChart, 
  Users, 
  User,
  LogOut,
  Menu,
  HelpCircle
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-950 border-r border-slate-800 flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">SmartChama</h1>
              <p className="text-slate-400 text-xs">Wealth Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <Link 
            href="/dashboard" 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              pathname === '/dashboard' 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </Link>
          
          <Link 
            href="/dashboard/savings" 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              pathname === '/dashboard/savings' 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-5 h-5" />
            My Savings
          </Link>

          <Link 
            href="/dashboard/groups" 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              pathname === '/dashboard/groups' 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-5 h-5" />
            My Groups
          </Link>

          <Link 
            href="/dashboard/smartgrow" 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              pathname === '/dashboard/smartgrow' 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PieChart className="w-5 h-5" />
            SmartGrow
          </Link>

          <Link 
            href="/dashboard/profile" 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              pathname === '/dashboard/profile' 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User className="w-5 h-5" />
            Profile
          </Link>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 space-y-2 border-t border-slate-800">
          <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-colors">
            Add Member
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <HelpCircle className="w-5 h-5" />
            Help Center
          </button>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950/50 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-950">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="font-bold text-white">SmartChama</span>
          </div>
          <button className="p-2 text-slate-400"><Menu className="w-6 h-6" /></button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-900">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 w-full bg-slate-950 border-t border-slate-800 pb-safe z-30">
          <div className="flex justify-around items-center p-2">
            <MobileNavItem href="/dashboard" icon={<LayoutDashboard />} label="Home" active={pathname === '/dashboard'} />
            <MobileNavItem href="/dashboard/savings" icon={<Wallet />} label="Save" active={pathname === '/dashboard/savings'} />
            <div className="relative -top-6">
              <Link href="/dashboard/smartgrow">
                <div className="h-14 w-14 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30 border-4 border-slate-950">
                  <PieChart className="w-6 h-6" />
                </div>
              </Link>
            </div>
            <MobileNavItem href="/dashboard/groups" icon={<Users />} label="Groups" active={pathname === '/dashboard/groups'} />
            <MobileNavItem href="/dashboard/profile" icon={<User />} label="Profile" active={pathname === '/dashboard/profile'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileNavItem({ icon, label, href, active }: { icon: React.ReactNode, label: string, href: string, active?: boolean }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 p-2 ${active ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-400'}`}>
      <div className="w-5 h-5">{icon}</div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Wallet, 
  PieChart, 
  Users, 
  User,
  LogOut,
  Menu,
  UserPlus
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // FIXED: Changed h-screen to h-[100dvh] which prevents mobile browser bar issues
    <div className="flex h-[100dvh] bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950 hidden lg:flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">SmartChama</h1>
            <p className="text-xs text-slate-500 font-medium">Wealth Management</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <NavItem href="/dashboard" icon={<LayoutDashboard />} label="Overview" />
          <NavItem href="/dashboard/savings" icon={<Wallet />} label="My Savings" />
          <NavItem href="/dashboard/groups" icon={<Users />} label="My Groups" />
          <NavItem href="/dashboard/smartgrow" icon={<PieChart />} label="SmartGrow" />
          <NavItem href="/dashboard/profile" icon={<User />} label="Profile" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link href="/login" className="flex items-center gap-3 w-full px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-sm font-medium">
            <LogOut className="w-5 h-5" />
            Logout
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      {/* FIXED: min-w-0 ensures content doesn't break out of the flex container */}
      <main className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* Mobile Header (Added shrink-0 so it never squishes) */}
        <header className="lg:hidden shrink-0 h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950/50 backdrop-blur-md z-20">
           <div className="flex items-center gap-2">
             <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-950">
                <Wallet className="w-4 h-4" />
             </div>
             <span className="font-bold">SmartChama</span>
           </div>
           <button className="p-2 text-slate-400"><Menu className="w-6 h-6" /></button>
        </header>

        {/* The Page Content - This is the ONLY part that will scroll now */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>

        {/* --- MOBILE BOTTOM NAV --- */}
        {/* FIXED: Removed 'fixed bottom-0'. Now it sits naturally at the bottom of the flex column */}
        <div className="lg:hidden shrink-0 bg-slate-950 border-t border-slate-800 z-30 relative">
          <div className="flex justify-around items-center p-2 pb-safe">
            <MobileNavItem href="/dashboard" icon={<LayoutDashboard />} label="Home" />
            <MobileNavItem href="/dashboard/savings" icon={<Wallet />} label="Save" />
            
            <div className="relative -top-6">
              <Link href="/dashboard/smartgrow">
                <div className="h-14 w-14 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30 border-4 border-slate-950">
                  <PieChart className="w-6 h-6" />
                </div>
              </Link>
            </div>
            
            <MobileNavItem href="/dashboard/groups" icon={<Users />} label="Groups" />
            <MobileNavItem href="/dashboard/profile" icon={<User />} label="Profile" />
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper Components
function NavItem({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-emerald-400 font-medium transition-all hover:pl-5">
      <div className="w-5 h-5">{icon}</div>
      <span className="text-sm">{label}</span>
    </Link>
  )
}

function MobileNavItem({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-emerald-400">
      <div className="w-5 h-5">{icon}</div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}
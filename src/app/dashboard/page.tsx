"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Plus, 
  Coins, 
  TrendingUp,
  UserPlus,
  Grid3X3,
  Bell,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  Users
} from "lucide-react";

// --- MOCK DATA ---
const dashboardData = {
  totalBalance: 1250000,
  monthlyGrowth: 12,
  monthlyGrowthAmount: 150000,
  activeLoans: 420000,
  currency: "KES"
};

const recentActivity = [
  { id: 1, member: "Sarah Mwangi", avatar: "SM", transaction: "Monthly Contribution", amount: 5000, status: "Paid", statusColor: "emerald", date: "Today" },
  { id: 2, member: "David Otieno", avatar: "DO", transaction: "Loan Repayment", amount: 12500, status: "Paid", statusColor: "emerald", date: "Yesterday" },
  { id: 3, member: "James Kamau", avatar: "JK", transaction: "Late Penalty", amount: 500, status: "Pending", statusColor: "orange", date: "Feb 5" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
}

// --- 1. THE CONTENT COMPONENT ---
function DashboardContent() {
  const searchParams = useSearchParams();
  const userName = searchParams.get("user") || "Member";
  const userRole = searchParams.get("role")?.toLowerCase() || "member"; // 'admin' or 'member'
  const isAdmin = userRole === "admin";

  return (
    <div className="space-y-6 lg:space-y-8 pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-white">Jambo, {userName}</h2>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-slate-400 text-sm">Welcome back to your dashboard.</p>
             {isAdmin && (
               <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                 Admin Mode
               </span>
             )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
          </button>
          <div className="size-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-slate-800 flex items-center justify-center font-bold text-slate-900 shadow-lg shadow-emerald-500/20">
             {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* --- HERO CARD (Total Balance) --- */}
      <div className="relative overflow-hidden rounded-3xl p-6 lg:p-8 group transition-all hover:scale-[1.01] duration-300"
           style={{ background: "linear-gradient(135deg, #064e3b 0%, #10b77f 100%)" }}>
        
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <p className="text-emerald-100/80 text-sm font-medium uppercase tracking-wider">
              {isAdmin ? "Total Group Assets" : "My Total Savings"}
            </p>
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Encrypted
            </div>
          </div>
          
          <h3 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-6">
            {isAdmin ? formatCurrency(dashboardData.totalBalance) : formatCurrency(45000)}
          </h3>
          
          <div className="flex gap-8 border-t border-white/10 pt-4">
             <div>
               <p className="text-xs text-emerald-100/60 mb-1">Monthly Growth</p>
               <p className="font-bold text-white flex items-center gap-1">
                 <TrendingUp className="w-4 h-4" /> +{dashboardData.monthlyGrowth}%
               </p>
             </div>
             <div>
               <p className="text-xs text-emerald-100/60 mb-1">Active Loans</p>
               <p className="font-bold text-white">
                 {isAdmin ? formatCurrency(dashboardData.activeLoans) : formatCurrency(0)}
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* --- QUICK ACTIONS (Dynamic based on Role) --- */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. DEPOSIT (Everyone) */}
          <button className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-3 hover:border-emerald-500/30 hover:bg-slate-800/80 transition-all group">
            <div className="size-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-200">Deposit</span>
          </button>

          {/* 2. ADMIN: Invite / MEMBER: Borrow */}
          {isAdmin ? (
             <Link href="/dashboard/create" className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-3 hover:border-emerald-500/30 hover:bg-slate-800/80 transition-all group">
               <div className="size-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <UserPlus className="w-6 h-6" />
               </div>
               <span className="text-sm font-bold text-slate-200">Invite Member</span>
             </Link>
          ) : (
             <button className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-3 hover:border-emerald-500/30 hover:bg-slate-800/80 transition-all group">
               <div className="size-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Coins className="w-6 h-6" />
               </div>
               <span className="text-sm font-bold text-slate-200">Request Loan</span>
             </button>
          )}

          {/* 3. ADMIN: Settings / MEMBER: Status */}
          <button className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-3 hover:border-emerald-500/30 hover:bg-slate-800/80 transition-all group">
            <div className="size-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              {isAdmin ? <Users className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
            </div>
            <span className="text-sm font-bold text-slate-200">{isAdmin ? "Manage Users" : "My Wallet"}</span>
          </button>

          {/* 4. USSD MENU (Everyone) */}
          <Link href="/ussd-demo" className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-3 hover:border-emerald-500/30 hover:bg-slate-800/80 transition-all group">
            <div className="size-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center group-hover:bg-slate-700 group-hover:text-white transition-colors">
              <Grid3X3 className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-200">USSD Demo</span>
          </Link>
        </div>
      </div>

       {/* --- RECENT ACTIVITY --- */}
       <div>
         <div className="flex items-center justify-between mb-4">
           <h3 className="text-lg font-bold text-white">Recent Activity</h3>
           <button className="text-xs text-emerald-400 font-bold hover:text-emerald-300 flex items-center gap-1">
             View All <ArrowUpRight className="w-3 h-3" />
           </button>
         </div>
         
         <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
            {recentActivity.map((activity, index) => (
               <div key={activity.id} className={`flex items-center justify-between p-4 ${index !== recentActivity.length - 1 ? 'border-b border-slate-800' : ''} hover:bg-slate-800/50 transition-colors`}>
                  <div className="flex items-center gap-3">
                     <div className="size-10 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-700">
                       {activity.avatar}
                     </div>
                     <div>
                        <p className="text-white font-bold text-sm">{activity.member}</p>
                        <p className="text-slate-500 text-xs">{activity.transaction}</p>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-sm">{formatCurrency(activity.amount)}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${activity.status === 'Paid' ? 'text-emerald-500' : 'text-orange-500'}`}>
                      {activity.status}
                    </p>
                  </div>
               </div>
            ))}
         </div>
       </div>

    </div>
  );
}

// --- 2. THE MAIN EXPORT (Wraps in Suspense) ---
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-emerald-500 font-bold text-sm animate-pulse">Loading SmartChama...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
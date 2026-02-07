"use client"; // <--- Now a Client Component to read the URL

import { useSearchParams } from "next/navigation";
import { 
  ArrowUpRight, 
  Plus, 
  Coins, 
  TrendingUp,
  UserPlus,
  Grid3X3,
  Bell
} from "lucide-react";

// ... (Keep your mock data, but we can skip pasting it all here for brevity. 
// Just ensure 'dashboardData' and 'recentActivity' objects are defined inside or outside component) ...

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
];

const quickActions = [
  { name: "Record Pay", icon: Plus, color: "bg-emerald-500/20 text-emerald-400" },
  { name: "Borrow", icon: Coins, color: "bg-slate-800 text-slate-400" },
  { name: "Invite", icon: UserPlus, color: "bg-slate-800 text-slate-400" },
  { name: "USSD Menu", icon: Grid3X3, color: "bg-slate-800 text-slate-400" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const userName = searchParams.get("user") || "Member"; // Gets "Lenny" from URL or defaults to "Member"

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* DYNAMIC NAME HERE */}
          <h2 className="text-2xl lg:text-3xl font-black text-white">Jambo, {userName}</h2>
          <p className="text-slate-400 text-sm mt-1">Welcome back to your group dashboard.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <div className="size-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-slate-800 flex items-center justify-center font-bold text-slate-900">
             {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 lg:p-8"
           style={{ background: "linear-gradient(135deg, #064e3b 0%, #10b77f 100%)" }}>
        <div className="relative z-10">
          <p className="text-emerald-100/80 text-sm font-medium uppercase tracking-wider mb-2">Total Group Assets</p>
          <h3 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
            {formatCurrency(dashboardData.totalBalance)}
          </h3>
          <div className="mt-6 flex gap-8">
             <div>
               <p className="text-xs text-white/60 mb-1">Monthly Growth</p>
               <p className="font-bold text-white flex items-center gap-1">
                 <TrendingUp className="w-4 h-4" /> +{dashboardData.monthlyGrowth}%
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button key={action.name} className="group bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-3 hover:border-emerald-500/30 transition-all">
              <div className={`size-14 rounded-full ${action.color} flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors`}>
                <action.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-white">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

       {/* Recent Activity Table (Simplified for brevity) */}
       <div>
         <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
         <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-4">
            {recentActivity.map((activity) => (
               <div key={activity.id} className="flex justify-between py-3 border-b border-slate-800 last:border-0">
                  <div className="flex gap-3">
                     <div className="size-10 bg-slate-800 rounded-full flex items-center justify-center text-xs text-white">{activity.avatar}</div>
                     <div>
                        <p className="text-white font-bold text-sm">{activity.member}</p>
                        <p className="text-slate-500 text-xs">{activity.transaction}</p>
                     </div>
                  </div>
                  <p className="text-white font-bold text-sm">{formatCurrency(activity.amount)}</p>
               </div>
            ))}
         </div>
       </div>

    </div>
  );
}
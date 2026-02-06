// app/dashboard/page.tsx
import { 
    ArrowUpRight, 
    Plus, 
    Minus, 
    HandCoins, 
    TrendingUp,
    UserPlus,
    Grid3X3,
    Bell,
    MoreHorizontal
  } from "lucide-react";
  
  const dashboardData = {
    totalBalance: 1250000,
    monthlyGrowth: 12,
    monthlyGrowthAmount: 150000,
    activeLoans: 420000,
    currency: "KES"
  };
  
  const recentActivity = [
    {
      id: 1,
      member: "Sarah Mwangi",
      avatar: "SM",
      transaction: "Monthly Contribution",
      amount: 5000,
      status: "Paid",
      statusColor: "emerald",
      date: "Today, 10:45 AM"
    },
    {
      id: 2,
      member: "David Otieno",
      avatar: "DO",
      transaction: "Loan Repayment",
      amount: 12500,
      status: "Paid",
      statusColor: "emerald",
      date: "Yesterday"
    },
    {
      id: 3,
      member: "Amina Juma",
      avatar: "AJ",
      transaction: "Monthly Contribution",
      amount: 5000,
      status: "Late",
      statusColor: "rose",
      date: "2 days ago"
    },
    {
      id: 4,
      member: "Brian Kimani",
      avatar: "BK",
      transaction: "Loan Disbursement",
      amount: 50000,
      status: "Paid",
      statusColor: "blue",
      date: "3 days ago"
    }
  ];
  
  const quickActions = [
    { name: "Record Pay", icon: Plus, color: "bg-emerald-500/20 text-emerald-400" },
    { name: "Borrow", icon: HandCoins, color: "bg-slate-800 text-slate-400" },
    { name: "Invite", icon: UserPlus, color: "bg-slate-800 text-slate-400" },
    { name: "USSD Menu", icon: Grid3X3, color: "bg-slate-800 text-slate-400" },
  ];
  
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  
  export default function DashboardPage() {
    return (
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-white">Jambo, Kwesi</h2>
            <p className="text-slate-400 text-sm mt-1">Welcome back to your group dashboard.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="size-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-slate-800" />
          </div>
        </div>
  
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl p-6 lg:p-8"
             style={{ background: "linear-gradient(135deg, #064e3b 0%, #10b77f 100%)" }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-black/10 rounded-full -mr-10 -mb-10 blur-2xl"></div>
          
          <div className="relative z-10">
            <p className="text-emerald-100/80 text-sm font-medium uppercase tracking-wider mb-2">Total Group Assets</p>
            <div className="flex items-center gap-4 flex-wrap">
              <h3 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
                {formatCurrency(dashboardData.totalBalance)}
              </h3>
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">+{dashboardData.monthlyGrowth}%</span>
              </div>
            </div>
            
            <div className="mt-6 flex gap-8">
              <div>
                <p className="text-xs text-white/60 mb-1">Monthly Growth</p>
                <p className="font-bold text-white">{formatCurrency(dashboardData.monthlyGrowthAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Active Loans</p>
                <p className="font-bold text-white">{formatCurrency(dashboardData.activeLoans)}</p>
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
              <button 
                key={action.name}
                className="group bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-3 hover:border-emerald-500/30 transition-all"
              >
                <div className={`size-14 rounded-full ${action.color} flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-white">{action.name}</span>
              </button>
            ))}
          </div>
        </div>
  
        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
              Recent Activity
            </h3>
            <button className="text-emerald-400 text-sm font-semibold hover:underline">View All</button>
          </div>
          
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 uppercase">Member</th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 uppercase hidden sm:table-cell">Transaction</th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentActivity.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold">
                          {activity.avatar}
                        </div>
                        <span className="font-medium text-sm text-white">{activity.member}</span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-slate-300 hidden sm:table-cell">{activity.transaction}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm font-bold text-white">{formatCurrency(activity.amount)}</td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        activity.statusColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                        activity.statusColor === 'rose' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-slate-500 hidden md:table-cell">{activity.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
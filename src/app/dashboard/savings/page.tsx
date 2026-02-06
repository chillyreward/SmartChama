// app/dashboard/savings/page.tsx
import { 
    Download, 
    Filter, 
    TrendingUp,
    Calendar
  } from "lucide-react";
  
  const stats = [
    { label: "Total Personal Savings", value: "KES 450,000", change: "+5.2% from last month", positive: true },
    { label: "Interest Earned", value: "KES 12,450", change: "+1.8% accrued", positive: true },
    { label: "Next Contribution Due", value: "KES 15,000", subtext: "Due in 4 days: Sept 25, 2023", highlight: true }
  ];
  
  const transactions = [
    { date: "Sep 20, 2023", member: "Jane Doe", avatar: "JD", description: "Monthly Contribution", amount: 15000, status: "Successful" },
    { date: "Sep 18, 2023", member: "Mark Otieno", avatar: "MO", description: "Late Fee Penalty", amount: 500, status: "Successful" },
    { date: "Sep 15, 2023", member: "Sarah Chen", avatar: "SC", description: "Emergency Loan Repayment", amount: 22500, status: "Successful" },
    { date: "Sep 12, 2023", member: "David Kim", avatar: "DK", description: "Monthly Contribution", amount: 15000, status: "Pending" },
    { date: "Sep 10, 2023", member: "Alice Njoki", avatar: "AN", description: "Annual Membership Fee", amount: 2000, status: "Successful" },
  ];
  
  export default function SavingsPage() {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Savings & Transaction History</h1>
          <p className="text-slate-400 mt-2">Track your personal growth and collective group contributions in real-time.</p>
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Stats */}
          <div className="space-y-4">
            {stats.map((stat, idx) => (
              <div 
                key={idx} 
                className={`rounded-2xl p-6 ${stat.highlight ? 'bg-emerald-500 text-white' : 'bg-slate-900/50 border border-slate-800'}`}
              >
                <p className={`text-sm font-medium mb-1 ${stat.highlight ? 'text-white/80' : 'text-slate-400'}`}>
                  {stat.label}
                </p>
                <p className="text-3xl font-black mb-2">{stat.value}</p>
                {stat.change && (
                  <div className="flex items-center gap-1 text-sm text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-bold">{stat.change}</span>
                  </div>
                )}
                {stat.subtext && <p className="text-sm text-white/90">{stat.subtext}</p>}
              </div>
            ))}
          </div>
  
          {/* Right Column - Transaction History */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-white text-xl font-bold">Transaction History</h2>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <Filter className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
  
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-500 text-xs font-bold uppercase">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Description</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {transactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">{tx.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold">
                            {tx.avatar}
                          </div>
                          <span className="text-sm font-medium text-white">{tx.member}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 hidden sm:table-cell">{tx.description}</td>
                      <td className="px-6 py-4 text-sm font-bold text-white">KES {tx.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.status === 'Successful' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
  
            <div className="p-6 border-t border-slate-800 flex items-center justify-between">
              <p className="text-sm text-slate-500">Showing 5 of 128 transactions</p>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-lg border border-slate-700 text-sm font-medium text-slate-400 hover:bg-slate-800 transition-colors" disabled>
                  Previous
                </button>
                <button className="px-4 py-2 rounded-lg border border-slate-700 text-sm font-medium text-white hover:bg-slate-800 transition-colors">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
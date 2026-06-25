'use client';

import { Download, Filter, TrendingUp } from "lucide-react";
import { useAuth } from '@/components/AuthProvider';

export default function SavingsPage() {
  const { member, group } = useAuth();
  
  const stats = [
    { label: "Total Personal Savings", value: "KES 450,000", change: "+5.2% from last month", positive: true, accent: "border-t-[#22C55E]" },
    { label: "Interest Earned", value: "KES 12,450", change: "+1.8% accrued", positive: true, accent: "border-t-blue-400" },
    { label: "Next Contribution Due", value: "KES 15,000", subtext: "Due in 4 days: Sept 25, 2026", highlight: true, accent: "border-t-amber-400" }
  ];
  
  const transactions = [
    { date: "Sep 20, 2026", member: "Jane Doe", avatar: "JD", description: "Monthly Contribution", amount: 15000, status: "Successful" },
    { date: "Sep 18, 2026", member: "Mark Otieno", avatar: "MO", description: "Late Fee Penalty", amount: 500, status: "Successful" },
    { date: "Sep 15, 2026", member: "Sarah Chen", avatar: "SC", description: "Emergency Loan Repayment", amount: 22500, status: "Successful" },
    { date: "Sep 12, 2026", member: "David Kim", avatar: "DK", description: "Monthly Contribution", amount: 15000, status: "Pending" },
    { date: "Sep 10, 2026", member: "Alice Njoki", avatar: "AN", description: "Annual Membership Fee", amount: 2000, status: "Successful" },
  ];

  const chamaName = group?.name || 'Group';

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full font-inter text-[var(--text-main)]">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Savings</span>
        </p>
        
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
              Savings & History
            </h1>
            <p className="text-[14px] text-[var(--text-muted)] mt-1">
              {chamaName} — Track your personal growth and collective group contributions in real-time.
            </p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-lg text-sm font-semibold hover:bg-[#006e2f] transition-all">
              <Download className="w-4 h-4" />
              Export Statement
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 md:gap-6 lg:gap-6">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className={`card-bg border border-[var(--border)] border-t-2 ${stat.accent} rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 last:col-span-2 lg:last:col-span-1`}
            >
              <p className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">
                {stat.label}
              </p>
              <p className="text-[22px] md:text-3xl font-bold text-[var(--text-main)] mb-2 font-geist">{stat.value}</p>
              {stat.change && (
                <div className="flex items-center gap-1 text-sm text-[var(--brand-green)]">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold">{stat.change}</span>
                </div>
              )}
              {stat.subtext && <p className="text-sm text-[var(--text-muted)] mt-1">{stat.subtext}</p>}
            </div>
          ))}
        </div>

        {/* Right Column - Transaction History */}
        <div className="lg:col-span-2 card-bg border border-[var(--border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
          <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--text-main)]">Transaction History</h2>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-[#F5F5F5] dark:bg-[#1a2218] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[#edf6ea] dark:hover:bg-[#1a3a1a] transition-all">
                <Filter className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg bg-[#F5F5F5] dark:bg-[#1a2218] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[#edf6ea] dark:hover:bg-[#1a3a1a] transition-all">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            {/* Mobile Card List */}
            <div className="md:hidden flex flex-col divide-y divide-[#E5E7EB] dark:divide-[#2d3d2d]">
              {transactions.map((tx, idx) => (
                <div key={idx} className="py-4 px-4 active:bg-[#f5f5f5] dark:active:bg-[#1f2a1f] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] flex items-center justify-center text-xs font-bold shadow-sm">
                        {tx.avatar}
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-main)]">{tx.member}</span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      tx.status === 'Successful' 
                        ? 'bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176]' 
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-850 dark:text-orange-400'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#E5E7EB]/50 dark:border-[#2d3d2d]/50">
                    <span className="text-[12px] text-[var(--text-muted)]">{tx.description}</span>
                    <span className="text-[14px] font-bold text-[var(--text-main)] font-mono">KES {tx.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-[#0f1410] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Description</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
                  {transactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                      <td className="px-6 py-4 text-sm text-[var(--text-muted)] whitespace-nowrap">{tx.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] flex items-center justify-center text-xs font-bold shadow-sm">
                            {tx.avatar}
                          </div>
                          <span className="text-sm font-semibold text-[var(--text-main)]">{tx.member}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-muted)] hidden sm:table-cell">{tx.description}</td>
                      <td className="px-6 py-4 text-sm font-bold text-[var(--text-main)] font-mono">KES {tx.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          tx.status === 'Successful' 
                            ? 'bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176]' 
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-850 dark:text-orange-400'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-6 border-t border-[var(--border)] flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">Showing 5 of 128 transactions</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-semibold text-[var(--text-muted)] bg-[#F5F5F5] dark:bg-[#1a2218] opacity-60 cursor-not-allowed" disabled>
                Previous
              </button>
              <button className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-semibold text-[var(--text-main)] hover:bg-[#F5F5F5] dark:hover:bg-[#1f2a1f] transition-colors bg-transparent">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function TransactionsPage() {
  const { session, member, group, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalIn: 0,
    totalOut: 0,
    netBalance: 0
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");
  
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';

  const fetchData = async () => {
    if (!member || !group) return;
    try {
      setLoading(true);
      setError("");

      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .select(`*, members(full_name)`)
        .eq('group_id', member.group_id)
        .order('created_at', { ascending: false });

      if (txErr) throw txErr;

      const today = new Date();
      let totalIn = 0;
      let totalOut = 0;
      let netBalance = 0;
      
      const enrichedTxs = (txData || []).map((tx, idx) => {
        const amt = Number(tx.amount);
        const txDate = new Date(tx.created_at);
        const isThisMonth = txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
        
        const isIncoming = ['contribution', 'repayment', 'penalty', 'interest'].includes(tx.type);

        if (isIncoming) {
          netBalance += amt;
          if (isThisMonth) totalIn += amt;
        } else {
          netBalance -= amt;
          if (isThisMonth) totalOut += amt;
        }

        const colors = [
          "bg-green-100 text-green-700",
          "bg-blue-100 text-blue-700",
          "bg-purple-100 text-purple-700",
          "bg-teal-100 text-teal-700",
          "bg-indigo-100 text-indigo-700",
          "bg-orange-100 text-orange-700"
        ];
        const colorClass = colors[idx % colors.length];

        return {
          ...tx,
          isIncoming,
          member_name: tx.members?.full_name || 'System',
          initials: tx.members?.full_name ? getInitials(tx.members.full_name) : 'SYS',
          colorClass,
          displayDate: txDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          displayTime: txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          ref: `SC-${txDate.getFullYear()}${String(txDate.getMonth()+1).padStart(2,'0')}${String(txDate.getDate()).padStart(2,'0')}-${tx.id.substring(0,4).toUpperCase()}`
        };
      });

      setStats({
        totalIn,
        totalOut,
        netBalance
      });
      setTransactions(enrichedTxs);

    } catch (err) {
      console.error(err);
      setError("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && member && group) {
      fetchData();
    }
  }, [authLoading, member, group]);

  const filteredTransactions = transactions.filter(tx => {
    if (searchQuery && !tx.member_name.toLowerCase().includes(searchQuery.toLowerCase()) && !tx.ref.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filter !== "All") {
      const filterToType: Record<string, string[]> = {
        "Contributions": ["contribution"],
        "Loans": ["loan"],
        "Repayments": ["repayment"],
        "Penalties": ["penalty"],
        "Withdrawals": ["withdrawal"]
      };
      const allowedTypes = filterToType[filter];
      if (allowedTypes && !allowedTypes.includes(tx.type)) {
        return false;
      }
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-[#22C55E]/10 text-[#005321] border border-[#4ae176] rounded px-2 py-0.5 text-label-caps">Confirmed</span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 border border-yellow-300 rounded px-2 py-0.5 text-label-caps">Pending</span>;
      case 'failed':
        return <span className="bg-red-100 text-red-800 border border-red-300 rounded px-2 py-0.5 text-label-caps">Failed</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 rounded px-2 py-0.5 text-label-caps capitalize">{status}</span>;
    }
  };

  const getTypeStyle = (type: string) => {
    switch(type) {
      case 'contribution': return 'bg-[#22C55E]/10 text-[#005321] border border-[#4ae176]';
      case 'repayment': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'loan': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'penalty': return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'interest': return 'bg-teal-50 text-teal-700 border border-teal-200';
      case 'withdrawal': return 'bg-gray-100 text-gray-600 border border-[#E5E7EB]';
      default: return 'bg-gray-100 text-gray-600 border border-[#E5E7EB]';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1,2,3].map(i => <div key={i} className="bg-white border border-[#E5E7EB] rounded-lg p-6 h-32 animate-pulse shadow-sm"></div>)}
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-lg h-96 animate-pulse shadow-sm"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <span className="material-symbols-outlined text-error text-5xl mb-4">error_outline</span>
        <p className="text-body-sm text-error">{error}</p>
        <button onClick={fetchData} className="mt-4 text-primary hover:underline font-medium">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-8 font-inter relative min-h-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-headline-lg font-semibold text-on-surface font-geist">Transactions</h1>
          <p className="text-body-sm text-secondary mt-1">All group financial activity</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-[#E5E7EB] text-on-surface rounded px-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span className="text-body-sm font-medium">This Month</span>
          </button>
          <button className="bg-[#22C55E] text-white rounded px-4 py-2 flex items-center gap-2 hover:bg-[#006e2f] transition-colors shadow-sm">
            <span className="material-symbols-outlined text-sm">download</span>
            <span className="text-body-sm font-medium">Export CSV</span>
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#22C55E] text-[20px]">arrow_downward</span>
            <div className="text-label-caps text-secondary uppercase">TOTAL IN THIS MONTH</div>
          </div>
          <div className="text-display-sm font-geist font-bold text-[#22C55E]">KSh {formatCurrency(stats.totalIn)}</div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-error text-[20px]">arrow_upward</span>
            <div className="text-label-caps text-secondary uppercase">TOTAL OUT THIS MONTH</div>
          </div>
          <div className="text-display-sm font-geist font-bold text-error">KSh {formatCurrency(stats.totalOut)}</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-label-caps text-secondary mb-2 uppercase">NET BALANCE</div>
          <div className="flex items-end gap-3">
            <div className="text-display-sm font-geist font-bold text-on-surface">KSh {formatCurrency(stats.netBalance)}</div>
            {stats.netBalance >= 0 ? (
              <div className="bg-[#22C55E]/10 text-[#005321] border border-[#4ae176] rounded px-2 py-0.5 text-label-caps mb-1 font-medium">
                Positive
              </div>
            ) : (
              <div className="bg-red-100 text-red-800 border border-red-300 rounded px-2 py-0.5 text-label-caps mb-1 font-medium">
                Negative
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH + FILTER BAR */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center shadow-sm">
        <div className="relative w-full lg:w-72 shrink-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search by name, amount, or reference..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-[#E5E7EB] rounded px-4 py-2.5 pl-10 text-body-sm outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] text-on-surface placeholder-secondary transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {["All", "Contributions", "Loans", "Repayments", "Penalties", "Withdrawals"].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-body-sm transition-colors border ${filter === f ? 'bg-[#0B0F0C] text-white border-[#0B0F0C]' : 'bg-white text-on-surface border-[#E5E7EB] hover:bg-gray-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="border-b border-[#E5E7EB]">
                <th className="px-6 py-4 text-label-caps text-secondary font-medium">DATE</th>
                <th className="px-6 py-4 text-label-caps text-secondary font-medium">MEMBER</th>
                <th className="px-6 py-4 text-label-caps text-secondary font-medium">TYPE</th>
                <th className="px-6 py-4 text-label-caps text-secondary font-medium">DESCRIPTION</th>
                <th className="px-6 py-4 text-label-caps text-secondary font-medium">REFERENCE</th>
                <th className="px-6 py-4 text-label-caps text-secondary font-medium">AMOUNT</th>
                <th className="px-6 py-4 text-label-caps text-secondary font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? filteredTransactions.map((txn, index) => (
                <tr 
                  key={txn.id} 
                  onClick={() => setSelectedTransaction(txn)}
                  className="border-b border-[#E5E7EB] last:border-0 hover:bg-surface-container-low cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 text-body-sm text-on-surface whitespace-nowrap">
                    <div>{txn.displayDate}</div>
                    <div className="text-secondary text-xs">{txn.displayTime}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${txn.colorClass}`}>
                        {txn.initials}
                      </div>
                      <div className="font-medium text-on-surface text-body-sm">
                        {txn.member_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`rounded px-2 py-0.5 text-label-caps capitalize ${getTypeStyle(txn.type)}`}>
                      {txn.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-on-surface whitespace-nowrap">
                    {txn.type === 'contribution' ? 'Monthly contribution' : 
                     txn.type === 'loan' ? 'Loan disbursement' : 
                     txn.type === 'repayment' ? 'Loan repayment' : 
                     txn.type === 'withdrawal' ? 'Group withdrawal' : 'System generated'}
                  </td>
                  <td className="px-6 py-4 text-body-sm text-secondary font-mono whitespace-nowrap">{txn.ref}</td>
                  <td className={`px-6 py-4 text-body-sm font-mono font-medium whitespace-nowrap ${txn.isIncoming ? 'text-[#22C55E]' : 'text-error'}`}>
                    {txn.isIncoming ? '+' : '-'}KSh {formatCurrency(Number(txn.amount))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(txn.status)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-body-sm text-secondary">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OVERLAY FOR SIDE DRAWER */}
      {selectedTransaction && (
        <div 
          className="fixed inset-0 bg-[#0B0F0C]/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSelectedTransaction(null)}
        />
      )}

      {/* TRANSACTION DETAIL DRAWER */}
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-sm sm:w-96 bg-white border-l border-[#E5E7EB] p-8 z-50 transition-transform duration-300 ease-in-out shadow-2xl overflow-y-auto ${
          selectedTransaction ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedTransaction && (
          <>
            {/* Top */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-label-caps text-secondary">#{selectedTransaction.id.substring(0,8).toUpperCase()}</div>
                <h2 className="text-headline-lg font-geist font-bold text-on-surface mt-1 capitalize">{selectedTransaction.type}</h2>
              </div>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="text-on-secondary-container hover:text-on-surface transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full -mr-2"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center py-6 bg-surface-container-low border border-[#E5E7EB] rounded-lg mb-8 shadow-sm">
              <div className={`text-[32px] font-geist font-bold font-mono ${selectedTransaction.isIncoming ? 'text-[#22C55E]' : 'text-error'}`}>
                {selectedTransaction.isIncoming ? '+' : '-'}KSh {formatCurrency(Number(selectedTransaction.amount))}
              </div>
              <div className="mt-2">
                {getStatusBadge(selectedTransaction.status)}
              </div>
            </div>

            {/* Details List */}
            <div className="flex flex-col divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]">
              <div className="flex justify-between py-4">
                <span className="text-body-sm text-secondary">Reference</span>
                <span className="text-body-sm font-mono text-on-surface font-medium">{selectedTransaction.ref}</span>
              </div>
              <div className="flex justify-between py-4">
                <span className="text-body-sm text-secondary">Date & Time</span>
                <span className="text-body-sm text-on-surface">{selectedTransaction.displayDate} {new Date().getFullYear()}, {selectedTransaction.displayTime}</span>
              </div>
              <div className="flex justify-between py-4 items-center">
                <span className="text-body-sm text-secondary">M-Pesa Code</span>
                <div className="flex items-center gap-2">
                  {selectedTransaction.status === "confirmed" && (
                    <span className="bg-[#22C55E]/10 text-[#005321] border border-[#4ae176] rounded px-1.5 text-[10px] uppercase font-bold tracking-wider">
                      Verified
                    </span>
                  )}
                  <span className="text-body-sm font-mono text-on-surface font-medium">
                    {selectedTransaction.status === "confirmed" ? `QHK8${selectedTransaction.id.substring(0,4).toUpperCase()}` : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between py-4">
                <span className="text-body-sm text-secondary">Member</span>
                <span className="text-body-sm text-on-surface font-medium">{selectedTransaction.member_name}</span>
              </div>
              <div className="flex justify-between py-4">
                <span className="text-body-sm text-secondary">Type</span>
                <span className="text-body-sm text-on-surface capitalize">{selectedTransaction.type}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-8">
              <button className="flex items-center justify-center gap-2 bg-[#22C55E] hover:bg-[#006e2f] text-white w-full rounded py-3 text-body-sm transition-colors font-medium shadow-sm">
                <span className="material-symbols-outlined text-[20px]">download</span>
                Download Receipt
              </button>
              {member?.role === 'admin' && (
                <button className="flex items-center justify-center gap-2 bg-white border border-[#E5E7EB] text-on-surface hover:bg-gray-50 w-full rounded py-3 text-body-sm transition-colors font-medium shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">flag</span>
                  Flag Transaction
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

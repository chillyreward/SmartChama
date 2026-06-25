"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function TransactionsPage() {
  const { member, group, isLoading: authLoading } = useAuth();
  
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
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;
  
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';

  const fetchData = async () => {
    if (!member || !group) return;
    try {
      setLoading(true);
      setError("");

      const { data: txData, error: txErr } = await supabase
        .from('transactions_v2')
        .select(`
          *,
          membership:chama_memberships (
            profile:profiles (
              full_name
            )
          )
        `)
        .eq('chama_id', member.chama_id)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

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
          "bg-green-150 text-green-700",
          "bg-blue-155 text-blue-700",
          "bg-purple-150 text-purple-700",
          "bg-teal-150 text-teal-700",
          "bg-indigo-150 text-indigo-700",
          "bg-orange-150 text-orange-700"
        ];
        const colorClass = colors[idx % colors.length];

        return {
          ...tx,
          isIncoming,
          member_name: tx.membership?.profile?.full_name || 'System',
          initials: tx.membership?.profile?.full_name ? getInitials(tx.membership.profile.full_name) : 'SYS',
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
      setHasMore(txData.length === PAGE_SIZE);

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
  }, [authLoading, member, group, page]);

  const filteredTransactions = transactions.filter(txn => {
    if (searchQuery && 
        !txn.member_name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !txn.ref.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !txn.amount.toString().includes(searchQuery)) {
      return false;
    }
    if (filter === "Contributions" && txn.type !== "contribution") return false;
    if (filter === "Loans" && txn.type !== "loan") return false;
    if (filter === "Repayments" && txn.type !== "repayment") return false;
    if (filter === "Penalties" && txn.type !== "penalty") return false;
    if (filter === "Withdrawals" && txn.type !== "withdrawal") return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176] px-2 py-0.5 rounded text-xs font-semibold">Confirmed</span>;
      case 'pending':
        return <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-850 dark:text-orange-400 px-2 py-0.5 rounded text-xs font-semibold">Pending</span>;
      case 'failed':
        return <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-2 py-0.5 rounded text-xs font-semibold">Failed</span>;
      default:
        return <span className="bg-gray-100 dark:bg-[#1f2a1f] text-gray-800 dark:text-[#8FA88F] px-2 py-0.5 rounded text-xs font-semibold capitalize">{status}</span>;
    }
  };

  const getTypeStyle = (type: string) => {
    switch(type) {
      case 'contribution': return 'bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176]';
      case 'repayment': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'loan': return 'bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      case 'penalty': return 'bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400';
      case 'interest': return 'bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-450';
      case 'withdrawal': return 'bg-gray-100 dark:bg-[#1f2a1f] text-gray-800 dark:text-[#8FA88F]';
      default: return 'bg-gray-100 dark:bg-[#1f2a1f] text-gray-800 dark:text-[#8FA88F]';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full text-[var(--text-main)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1,2,3].map(i => <div key={i} className="card-bg border border-[var(--border)] rounded-2xl p-6 h-32 animate-pulse shadow-sm"></div>)}
        </div>
        <div className="card-bg border border-[var(--border)] rounded-2xl h-96 animate-pulse shadow-sm"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20 text-[var(--text-main)]">
        <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error_outline</span>
        <p className="text-body-sm text-red-500">{error}</p>
        <button onClick={fetchData} className="mt-4 text-[var(--brand-green)] hover:underline font-medium">Retry</button>
      </div>
    );
  }

  const chamaName = group?.name || 'Group';

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full relative font-inter text-[var(--text-main)]">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Transactions</span>
        </p>
        
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
              Transactions
            </h1>
            <p className="text-[14px] text-[var(--text-muted)] mt-1">
              {chamaName} — Complete history of all financial transactions.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-initial bg-transparent border border-[var(--border)] text-[var(--text-main)] hover:bg-gray-50 dark:hover:bg-[#1f2a1f] rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-all shadow-sm font-semibold text-sm">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              This Month
            </button>
            <button className="flex-1 md:flex-initial bg-[#22C55E] hover:bg-[#006e2f] text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-all shadow-sm font-semibold text-sm">
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
        <div className="card-bg border border-[var(--border)] border-t-2 border-t-[#22C55E] rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[var(--brand-green)] text-[20px]">arrow_downward</span>
            <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">TOTAL IN THIS MONTH</div>
          </div>
          <div className="text-[22px] md:text-3xl font-bold text-[var(--brand-green)] font-geist">KSh {formatCurrency(stats.totalIn)}</div>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-red-400 rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-red-500 text-[20px]">arrow_upward</span>
            <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">TOTAL OUT THIS MONTH</div>
          </div>
          <div className="text-[22px] md:text-3xl font-bold text-red-500 font-geist">KSh {formatCurrency(stats.totalOut)}</div>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-[#22C55E] rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 last:col-span-2 md:last:col-span-1">
          <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">NET BALANCE</div>
          <div className="flex items-end gap-3">
            <div className="text-[22px] md:text-3xl font-bold text-[var(--text-main)] font-geist">KSh {formatCurrency(stats.netBalance)}</div>
            {stats.netBalance >= 0 ? (
              <div className="bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176] rounded px-2.5 py-0.5 text-xs font-semibold mb-1 hidden sm:block">
                Positive
              </div>
            ) : (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-805 dark:text-red-400 rounded px-2.5 py-0.5 text-xs font-semibold mb-1 hidden sm:block">
                Negative
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH + FILTER BAR */}
      <div className="card-bg border border-[var(--border)] rounded-2xl p-4 mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center shadow-sm hover:shadow-md transition-all duration-200">
        <div className="relative w-full lg:w-72 shrink-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search by name, amount, or reference..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 pl-10 text-sm outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] text-[var(--text-main)] bg-transparent placeholder:text-[#9CA3AF] dark:placeholder:text-[#4a5e4a] transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {["All", "Contributions", "Loans", "Repayments", "Penalties", "Withdrawals"].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                filter === f 
                  ? 'bg-[#22C55E] text-white dark:text-black border-[#22C55E]' 
                  : 'bg-transparent text-[var(--text-main)] border-[var(--border)] hover:bg-gray-50 dark:hover:bg-[#1f2a1f]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="card-bg border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
        <div>
          {/* Mobile Card List */}
          <div className="md:hidden flex flex-col divide-y divide-[#E5E7EB] dark:divide-[#2d3d2d]">
            {filteredTransactions.length > 0 ? filteredTransactions.map((txn) => (
              <div 
                key={txn.id} 
                onClick={() => setSelectedTransaction(txn)}
                className="py-4 px-4 active:bg-[#f5f5f5] dark:active:bg-[#1f2a1f] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      {txn.initials}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--text-main)]">{txn.member_name}</p>
                      <p className="text-[12px] text-[var(--text-muted)]">{txn.displayDate} • {txn.displayTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`rounded px-2.5 py-0.5 text-xs font-semibold capitalize ${getTypeStyle(txn.type)}`}>
                      {txn.type}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#E5E7EB]/50 dark:border-[#2d3d2d]/50">
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)] uppercase">Reference</p>
                    <p className="text-[13px] font-mono text-[var(--text-main)]">{txn.ref}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[15px] font-mono font-bold ${txn.isIncoming ? 'text-[var(--brand-green)]' : 'text-red-500'}`}>
                      {txn.isIncoming ? '+' : '-'} KSh {formatCurrency(Number(txn.amount))}
                    </p>
                    {getStatusBadge(txn.status)}
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                No transactions found.
              </div>
            )}
          </div>

          {/* Desktop table hidden on mobile */}
          <div className="hidden md:block overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-gray-50 dark:bg-[#0f1410] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10">
                <tr className="border-b border-[var(--border)]">
                  <th className="px-6 py-4">DATE</th>
                  <th className="px-6 py-4">MEMBER</th>
                  <th className="px-6 py-4">TYPE</th>
                  <th className="px-6 py-4">DESCRIPTION</th>
                  <th className="px-6 py-4">REFERENCE</th>
                  <th className="px-6 py-4">AMOUNT</th>
                  <th className="px-6 py-4">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
                {filteredTransactions.length > 0 ? filteredTransactions.map((txn) => (
                  <tr 
                    key={txn.id} 
                    onClick={() => setSelectedTransaction(txn)}
                    className="hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-[var(--text-main)] whitespace-nowrap">
                      <div>{txn.displayDate}</div>
                      <div className="text-secondary text-xs">{txn.displayTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {txn.initials}
                        </div>
                        <div className="font-semibold text-[var(--text-main)] text-sm">
                          {txn.member_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`rounded px-2.5 py-0.5 text-xs font-semibold capitalize ${getTypeStyle(txn.type)}`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-main)] whitespace-nowrap">
                      {txn.type === 'contribution' ? 'Monthly contribution' : 
                       txn.type === 'loan' ? 'Loan disbursement' : 
                       txn.type === 'repayment' ? 'Loan repayment' : 
                       txn.type === 'withdrawal' ? 'Group withdrawal' : 'System generated'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-muted)] font-mono whitespace-nowrap">{txn.ref}</td>
                    <td className={`px-6 py-4 text-sm font-mono font-bold whitespace-nowrap ${txn.isIncoming ? 'text-[var(--brand-green)]' : 'text-red-500'}`}>
                      {txn.isIncoming ? '+' : '-'} KSh {formatCurrency(Number(txn.amount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(txn.status)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-[var(--text-muted)]">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4 card-bg">
          <div className="text-sm text-[var(--text-muted)]">
            Showing Page {page + 1}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-[#F5F5F5] dark:hover:bg-[#1f2a1f] transition-all bg-transparent text-[var(--text-main)]"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-[#F5F5F5] dark:hover:bg-[#1f2a1f] transition-all bg-transparent text-[var(--text-main)]"
            >
              Next
            </button>
          </div>
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
        className={`fixed right-0 top-0 h-full w-full max-w-sm sm:w-96 card-bg border-l border-[var(--border)] p-8 z-50 transition-transform duration-300 ease-in-out shadow-2xl overflow-y-auto ${
          selectedTransaction ? "translate-x-0" : "translate-x-full"
        } text-[var(--text-main)]`}
      >
        {selectedTransaction && (
          <>
            {/* Top */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">#{selectedTransaction.id.substring(0,8).toUpperCase()}</div>
                <h2 className="text-2xl font-bold font-geist text-[var(--text-main)] mt-1 capitalize">{selectedTransaction.type}</h2>
              </div>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="text-[var(--text-muted)] hover:text-[#161d16] dark:hover:text-[#E8F0E4] bg-[#F5F5F5] dark:bg-[#1a2218] p-2 rounded-full -mr-2"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center py-6 bg-gray-50 dark:bg-[#1a2218] border border-[var(--border)] rounded-2xl mb-8 shadow-sm">
              <div className={`text-[32px] font-geist font-bold font-mono ${selectedTransaction.isIncoming ? 'text-[var(--brand-green)]' : 'text-red-500'}`}>
                {selectedTransaction.isIncoming ? '+' : '-'} KSh {formatCurrency(Number(selectedTransaction.amount))}
              </div>
              <div className="mt-2">
                {getStatusBadge(selectedTransaction.status)}
              </div>
            </div>

            {/* Details List */}
            <div className="flex flex-col divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f] border-t border-b border-[var(--border)]">
              <div className="flex justify-between py-4">
                <span className="text-sm text-[var(--text-muted)]">Reference</span>
                <span className="text-sm font-mono text-[var(--text-main)] font-semibold">{selectedTransaction.ref}</span>
              </div>
              <div className="flex justify-between py-4">
                <span className="text-sm text-[var(--text-muted)]">Date & Time</span>
                <span className="text-sm text-[var(--text-main)] font-semibold">{selectedTransaction.displayDate} {new Date().getFullYear()}, {selectedTransaction.displayTime}</span>
              </div>
              <div className="flex justify-between py-4 items-center">
                <span className="text-sm text-[var(--text-muted)]">M-Pesa Code</span>
                <div className="flex items-center gap-2">
                  {selectedTransaction.status === "confirmed" && (
                    <span className="bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176] border border-[#4ae176] dark:border-[#1a3a1a] text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                      Verified
                    </span>
                  )}
                  <span className="text-sm font-mono text-[var(--text-main)] font-semibold">
                    {selectedTransaction.status === "confirmed" ? `QHK8${selectedTransaction.id.substring(0,4).toUpperCase()}` : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between py-4">
                <span className="text-sm text-[var(--text-muted)]">Member</span>
                <span className="text-sm text-[var(--text-main)] font-semibold">{selectedTransaction.member_name}</span>
              </div>
              <div className="flex justify-between py-4">
                <span className="text-sm text-[var(--text-muted)]">Type</span>
                <span className="text-sm text-[var(--text-main)] capitalize font-semibold">{selectedTransaction.type}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-8">
              <button className="flex items-center justify-center gap-2 bg-[#22C55E] hover:bg-[#006e2f] text-white w-full rounded-lg py-3 text-sm font-bold transition-all shadow-sm">
                <span className="material-symbols-outlined text-[20px]">download</span>
                Download Receipt
              </button>
              {member?.role === 'admin' && (
                <button className="flex items-center justify-center gap-2 bg-transparent border border-[var(--border)] text-[var(--text-main)] hover:bg-gray-50 dark:hover:bg-[#1f2a1f] w-full rounded-lg py-3 text-sm font-semibold transition-all shadow-sm">
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

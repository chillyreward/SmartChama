"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function AdminTransactionsPage() {
  const { member: adminMember, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTx, setFilteredTx] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  useEffect(() => {
    if (!adminMember || !group) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('transactions_v2')
          .select(`
            *,
            membership:chama_memberships (
              profile:profiles (
                full_name
              )
            )
          `)
          .eq('chama_id', group.id)
          .order('created_at', { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          
        const { data } = await query;

        setTransactions(data || []);
        setFilteredTx(data || []);
        setHasMore((data?.length || 0) === PAGE_SIZE);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [adminMember, group, page]);

  useEffect(() => {
    let res = transactions;
    if (filter === 'Incoming') res = res.filter(t => ['contribution', 'repayment', 'penalty', 'interest', 'deposit'].includes(t.type));
    else if (filter === 'Outgoing') res = res.filter(t => ['loan_disbursement', 'withdrawal'].includes(t.type));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(t => 
        t.reference?.toLowerCase().includes(q) || 
        t.type?.toLowerCase().includes(q) || 
        t.membership?.profile?.full_name?.toLowerCase().includes(q)
      );
    }
    setFilteredTx(res);
  }, [searchQuery, filter, transactions]);

  if (loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full font-inter">
        <div className="card-bg border border-[var(--border)] rounded-2xl h-96 animate-pulse shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full font-inter min-h-full text-[var(--text-main)]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
            <span>Admin Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Transactions</span>
          </p>
          <h1 className="text-[24px] md:text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">All Transactions</h1>
          <p className="text-[13px] md:text-[14px] text-[var(--text-muted)] mt-1">Complete financial ledger for the group</p>
        </div>
        <div className="w-full md:w-auto">
          <button className="w-full md:w-auto bg-transparent border border-[var(--border)] text-[var(--text-main)] px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-all shadow-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card-bg border border-[var(--border)] rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between hover:shadow-md transition-all duration-200">
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search by ref, type or member..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-[var(--border)] bg-transparent text-[var(--text-main)] rounded-lg pl-10 pr-4 py-2 text-xs outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all placeholder:text-[#9CA3AF] dark:placeholder:text-[#4a5e4a]"
          />
        </div>
        
        <div className="bg-[#F5F5F5] dark:bg-[#1f2a1f] p-1 rounded-lg flex gap-1 text-sm font-semibold text-[var(--text-muted)] self-start md:self-auto overflow-x-auto w-full md:w-auto">
          {['All', 'Incoming', 'Outgoing'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md transition-all ${
                filter === f 
                  ? 'card-bg shadow-sm text-[var(--text-main)]' 
                  : 'hover:text-[#161d16] dark:hover:text-[#E8F0E4]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE / CARD LIST */}
      <div className="card-bg border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden min-h-[400px] hover:shadow-md transition-all duration-200">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0f1410] border-b border-[var(--border)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">TYPE</th>
                <th className="px-6 py-4">MEMBER</th>
                <th className="px-6 py-4">REFERENCE</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-right">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)] text-sm">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTx.map(tx => {
                  const isIncoming = Number(tx.amount) > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                      <td className="px-6 py-4 text-sm text-[var(--text-muted)] whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[16px] ${isIncoming ? 'text-[#22C55E]' : 'text-red-500'}`}>
                            {isIncoming ? 'arrow_downward' : 'arrow_upward'}
                          </span>
                          <span className="text-sm font-semibold text-[var(--text-main)] capitalize">
                            {tx.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-muted)] whitespace-nowrap font-medium">
                        {tx.membership?.profile?.full_name || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-[var(--text-muted)]">
                        {tx.reference || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${
                          tx.status === 'confirmed' ? 'bg-transparent text-[var(--brand-green)] text-[var(--brand-green)]' :
                          tx.status === 'pending' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-350' : 'bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-[#ffb4ab]'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-mono font-bold whitespace-nowrap ${isIncoming ? 'text-[var(--brand-green)]' : 'text-red-500'}`}>
                        {isIncoming ? '+' : ''}KSh {formatCurrency(Number(tx.amount))}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="md:hidden divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
          {filteredTx.length === 0 ? (
            <div className="p-6 text-center text-[var(--text-muted)] text-sm">
              No transactions found.
            </div>
          ) : (
            filteredTx.map(tx => {
              const isIncoming = Number(tx.amount) > 0;
              return (
                <div key={tx.id} className="p-4 flex flex-col gap-2 hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[14px] ${isIncoming ? 'text-[#22C55E]' : 'text-red-500'}`}>
                          {isIncoming ? 'arrow_downward' : 'arrow_upward'}
                        </span>
                        <span className="font-semibold text-sm text-[var(--text-main)] capitalize">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold text-sm ${isIncoming ? 'text-[var(--brand-green)]' : 'text-red-500'}`}>
                        {isIncoming ? '+' : ''}KSh {formatCurrency(Number(tx.amount))}
                      </div>
                      <div className="mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                          tx.status === 'confirmed' ? 'bg-transparent text-[var(--brand-green)] text-[var(--brand-green)]' :
                          tx.status === 'pending' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-350' : 'bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-[#ffb4ab]'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-[var(--text-muted)] border-t border-dashed border-[#f5f5f5] dark:border-[#2d3d2d] pt-1.5 mt-1">
                    <div>
                      <span className="font-medium">Member:</span> {tx.membership?.profile?.full_name || '—'}
                    </div>
                    {tx.reference && (
                      <div>
                        <span className="font-medium">Ref:</span> <span className="font-mono">{tx.reference}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4 card-bg">
          <div className="text-xs text-[var(--text-muted)]">
            Showing Page {page + 1}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 border border-[var(--border)] bg-transparent text-[var(--text-main)] rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-all shadow-sm"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 border border-[var(--border)] bg-transparent text-[var(--text-main)] rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

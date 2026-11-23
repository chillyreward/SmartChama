"use client";
import { MIcon } from '@/components/ui/MIcon';

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { exportToPDF, exportToExcel } from "@/lib/export";
import PageSkeleton from "@/components/PageSkeleton";

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

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  const handleExportPDF = () => {
    if (filteredTx.length === 0) return;
    const headers = ["Date", "Type", "Member", "Reference", "Status", "Amount (KSh)"];
    const rows = filteredTx.map(t => [
      new Date(t.created_at).toLocaleDateString('en-KE'),
      t.type,
      t.membership?.profile?.full_name || 'System',
      t.reference || 'N/A',
      t.status || 'confirmed',
      Number(t.amount || 0).toLocaleString('en-KE')
    ]);
    exportToPDF('Financial Ledger Report', group?.name || 'Akibora', headers, rows, 'transactions_report');
  };

  const handleExportExcel = () => {
    if (filteredTx.length === 0) return;
    const headers = ["Date", "Type", "Member", "Reference", "Status", "Amount (KSh)"];
    const rows = filteredTx.map(t => [
      new Date(t.created_at).toLocaleDateString('en-KE'),
      t.type,
      t.membership?.profile?.full_name || 'System',
      t.reference || 'N/A',
      t.status || 'confirmed',
      Number(t.amount || 0)
    ]);
    exportToExcel('Financial Ledger Report', group?.name || 'Akibora', headers, rows, 'transactions_report');
  };

  const handleExportCSV = () => {
    if (filteredTx.length === 0) return;
    const headers = ["Date", "Type", "Member", "Reference", "Amount", "Status"];
    const rows = filteredTx.map(t => [
      new Date(t.created_at).toLocaleString('en-GB'),
      t.type,
      t.membership?.profile?.full_name || 'System',
      t.reference || 'N/A',
      t.amount,
      t.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Chama_Ledger_Export_${group?.name || 'Group'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    else if (filter === 'Outgoing') res = res.filter(t => ['withdrawal'].includes(t.type));

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
    return <PageSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full font-inter min-h-full text-[var(--text-main)]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <p className="text-[12px] text-[var(--ak-text-3)] dark:text-[var(--ak-text-2)] font-medium mb-1 flex items-center gap-1">
            <span>Admin Dashboard</span>
            <MIcon name="chevron_right"  className="text-[14px]" />
            <span>Transactions</span>
          </p>
          <h1 className="text-[24px] md:text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">All Transactions</h1>
          <p className="text-[13px] md:text-[14px] text-[var(--text-muted)] mt-1">Complete financial ledger for the group</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button 
            onClick={handleExportPDF}
            className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--bg-muted)] px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <MIcon name="picture_as_pdf"  className="text-[16px] text-red-500" />
            Export PDF
          </button>
          <button 
            onClick={handleExportExcel}
            className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--bg-muted)] px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <MIcon name="table_chart"  className="text-[16px] text-green-600" />
            Export Excel
          </button>
          <button 
            onClick={handleExportCSV}
            className="bg-transparent border border-[var(--border)] text-[var(--text-main)] px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-[var(--ak-raised)] transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MIcon name="download"  className="text-[16px]" />
            CSV
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card-bg border border-[var(--border)] rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between hover:shadow-md transition-all duration-200">
        <div className="relative w-full md:w-72">
          <MIcon name="search"  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[20px]" />
          <input 
            type="text" 
            placeholder="Search by ref, type or member..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-[var(--border)] bg-transparent text-[var(--text-main)] rounded-lg pl-10 pr-4 py-2 text-xs outline-none focus:border-[var(--ak-brand-ink)] focus:ring-1 focus:ring-[var(--ak-brand-ink)] transition-all placeholder:text-[var(--ak-text-3)] dark:placeholder:text-[var(--ak-text-2)]"
          />
        </div>
        
        <div className="bg-[var(--ak-surface-2)] dark:bg-[var(--ak-raised)] p-1 rounded-lg flex gap-1 text-sm font-semibold text-[var(--text-muted)] self-start md:self-auto overflow-x-auto w-full md:w-auto">
          {['All', 'Incoming', 'Outgoing'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md transition-all ${
                filter === f 
                  ? 'card-bg shadow-sm text-[var(--text-main)]' 
                  : 'hover:text-[var(--ak-text)] dark:hover:text-[var(--ak-brand-ink)]'
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
              <tr className="bg-gray-50 dark:bg-[var(--ak-page)] border-b border-[var(--border)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">TYPE</th>
                <th className="px-6 py-4">MEMBER</th>
                <th className="px-6 py-4">REFERENCE</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-right">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ak-line)] dark:divide-[var(--ak-line)]">
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
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedTransaction({
                        ...tx,
                        isIncoming,
                        displayDate: new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                        displayTime: new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                        member_name: tx.membership?.profile?.full_name || 'System'
                      })}
                      className="hover:bg-[var(--ak-surface-2)] dark:hover:bg-[var(--ak-raised)] cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-[var(--text-muted)] whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MIcon name={isIncoming ? 'arrow_downward' : 'arrow_upward'} className={`text-[16px] ${isIncoming ? 'text-[var(--ak-brand-ink)]' : 'text-red-500'}`} />
                          <span className="text-sm font-semibold text-[var(--text-main)] capitalize">
                            {(tx.type === 'loan_repayment' ? 'repayment' : tx.type.startsWith('loan') ? 'payout' : tx.type).replace('_', ' ')}
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
        <div className="md:hidden divide-y divide-[var(--ak-line)] dark:divide-[var(--ak-line)]">
          {filteredTx.length === 0 ? (
            <div className="p-6 text-center text-[var(--text-muted)] text-sm">
              No transactions found.
            </div>
          ) : (
            filteredTx.map(tx => {
              const isIncoming = Number(tx.amount) > 0;
              return (
                <div 
                  key={tx.id} 
                  onClick={() => setSelectedTransaction({
                    ...tx,
                    isIncoming,
                    displayDate: new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                    displayTime: new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    member_name: tx.membership?.profile?.full_name || 'System'
                  })}
                  className="p-4 flex flex-col gap-2 hover:bg-[var(--ak-surface-2)] dark:hover:bg-[var(--ak-raised)] cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <MIcon name={isIncoming ? 'arrow_downward' : 'arrow_upward'} className={`text-[14px] ${isIncoming ? 'text-[var(--ak-brand-ink)]' : 'text-red-500'}`} />
                        <span className="font-semibold text-sm text-[var(--text-main)] capitalize">
                          {(tx.type === 'loan_repayment' ? 'repayment' : tx.type.startsWith('loan') ? 'payout' : tx.type).replace('_', ' ')}
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

                  <div className="flex justify-between items-center text-xs text-[var(--text-muted)] border-t border-dashed border-[var(--ak-line)] dark:border-[var(--ak-line)] pt-1.5 mt-1">
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
              className="px-4 py-2 border border-[var(--border)] bg-transparent text-[var(--text-main)] rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[var(--ak-raised)] transition-all shadow-sm"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 border border-[var(--border)] bg-transparent text-[var(--text-main)] rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[var(--ak-raised)] transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {/* OVERLAY FOR SIDE DRAWER */}
      {selectedTransaction && (
        <div 
          className="fixed inset-0 bg-[var(--ak-page)]/40 backdrop-blur-sm z-40 transition-opacity"
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
                className="text-[var(--text-muted)] hover:text-[var(--ak-text)] dark:hover:text-[var(--ak-brand-ink)] bg-[var(--ak-surface-2)] dark:bg-[var(--ak-surface)] p-2 rounded-full -mr-2"
              >
                <MIcon name="close"  className="text-[20px]" />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center py-6 bg-gray-50 dark:bg-[var(--ak-surface)] border border-[var(--border)] rounded-2xl mb-8 shadow-sm">
              <div className={`text-[32px] font-geist font-bold font-mono ${selectedTransaction.isIncoming ? 'text-[var(--brand-green)]' : 'text-red-500'}`}>
                {selectedTransaction.isIncoming ? '+' : '-'} KSh {formatCurrency(Number(selectedTransaction.amount))}
              </div>
              <div className="mt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${
                  selectedTransaction.status === 'confirmed' ? 'bg-transparent text-[var(--brand-green)] text-[var(--brand-green)]' :
                  selectedTransaction.status === 'pending' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-350' : 'bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-[#ffb4ab]'
                }`}>
                  {selectedTransaction.status}
                </span>
              </div>
            </div>

            {/* Details List */}
            <div className="flex flex-col divide-y divide-[var(--ak-line)] dark:divide-[var(--ak-line)] border-t border-b border-[var(--border)]">
              <div className="flex justify-between py-4">
                <span className="text-sm text-[var(--text-muted)]">Reference</span>
                <span className="text-sm font-mono text-[var(--text-main)] font-semibold">{selectedTransaction.reference || '—'}</span>
              </div>
              <div className="flex justify-between py-4">
                <span className="text-sm text-[var(--text-muted)]">Date & Time</span>
                <span className="text-sm text-[var(--text-main)] font-semibold">{selectedTransaction.displayDate} {new Date(selectedTransaction.created_at).getFullYear()}, {selectedTransaction.displayTime}</span>
              </div>
              <div className="flex justify-between py-4 items-center">
                <span className="text-sm text-[var(--text-muted)]">M-Pesa Code</span>
                <div className="flex items-center gap-2">
                  {selectedTransaction.status === "confirmed" && selectedTransaction.reference && (
                    <span className="bg-[var(--ak-tint)] dark:bg-[var(--ak-tint)] text-[var(--ak-brand-ink)] dark:text-[var(--ak-brand-ink)] border border-[var(--ak-brand-ink)] dark:border-[var(--ak-line)] text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                      Verified
                    </span>
                  )}
                  <span className="text-sm font-mono text-[var(--text-main)] font-semibold">
                    {selectedTransaction.reference || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between py-4">
                <span className="text-sm text-[var(--text-muted)]">Member</span>
                <span className="text-sm text-[var(--text-main)] font-semibold">{selectedTransaction.member_name}</span>
              </div>
              <div className="flex justify-between py-4">
                <span className="text-sm text-[var(--text-muted)]">Type</span>
                <span className="text-sm text-[var(--text-main)] capitalize font-semibold">{(selectedTransaction.type === 'loan_repayment' ? 'repayment' : selectedTransaction.type.startsWith('loan') ? 'payout' : selectedTransaction.type).replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-4">
                <span className="text-sm text-[var(--text-muted)]">Description</span>
                <span className="text-sm text-[var(--text-main)] font-semibold text-right max-w-[200px] truncate">{selectedTransaction.description || '—'}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-8">
              <button 
                onClick={() => {
                  const headers = ["ID", "Date", "Type", "Member", "Reference", "Amount", "Status", "Description"];
                  const row = [
                    selectedTransaction.id,
                    new Date(selectedTransaction.created_at).toLocaleString('en-GB'),
                    selectedTransaction.type,
                    selectedTransaction.member_name,
                    selectedTransaction.reference || '—',
                    selectedTransaction.amount,
                    selectedTransaction.status,
                    selectedTransaction.description || '—'
                  ];
                  const csv = [headers.join(","), row.map(val => `"${val}"`).join(",")].join("\n");
                  const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `Receipt_${selectedTransaction.id.substring(0,8).toUpperCase()}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center justify-center gap-2 bg-[var(--ak-solid)] hover:bg-[var(--ak-solid)] text-white w-full rounded-lg py-3 text-sm font-bold transition-all shadow-sm cursor-pointer"
              >
                <MIcon name="download"  className="text-[20px]" />
                Download Receipt
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
}

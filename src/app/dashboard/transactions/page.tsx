"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
import { Download, Search } from "lucide-react";
import { Avatar, Button, Chip, EmptyState, Modal, Notice, PageHeader, Panel, Skeleton, Stat, TableWrap, Tabs, cn, formatKsh, inputClass, tableClass, type ChipKind } from "@/components/ui";

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
        
        const isIncoming = ['contribution', 'repayment', 'loan_repayment', 'penalty', 'interest', 'deposit', 'smartgrow_return'].includes(tx.type);

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
          displayTime: txDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
          ref: tx.reference || `#${String(tx.id).slice(0, 8).toUpperCase()}`
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

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ["Date", "Member", "Type", "Reference", "Amount", "Status"];
    const rows = filteredTransactions.map(t => [
      new Date(t.created_at).toLocaleDateString('en-GB'),
      t.member_name,
      t.type,
      t.ref,
      t.amount,
      t.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Chama_Transactions_${chamaName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    if (filter === "Penalties" && txn.type !== "penalty") return false;
    if (filter === "Withdrawals" && txn.type !== "withdrawal") return false;
    return true;
  });

  const STATUS: Record<string, { kind: ChipKind; label: string }> = {
    confirmed: { kind: 'paid', label: 'Confirmed' },
    pending: { kind: 'pending', label: 'Waiting' },
    failed: { kind: 'failed', label: 'Failed' },
  };
  const TYPE: Record<string, string> = { contribution: 'Contribution', withdrawal: 'Withdrawal', deposit: 'Deposit', penalty: 'Penalty', interest: 'Interest', smartgrow_investment: 'SmartGrow investment', smartgrow_return: 'SmartGrow return', loan_disbursement: 'Payout', loan_repayment: 'Repayment', repayment: 'Repayment' };
  const chamaName = group?.name || 'Group';

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-60" />
        <div className="grid md:grid-cols-3 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return <Notice tone="danger" title="Transactions didn't load">{error} <button onClick={fetchData} className="underline font-semibold ml-1">Try again</button></Notice>;
  }

  const sel = selectedTransaction;

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`Every shilling in and out of ${chamaName}. All members see the same list.`}
        actions={<Button variant="outline" onClick={handleExportCSV} disabled={filteredTransactions.length === 0}><Download size={18} aria-hidden="true" />Download CSV</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Stat label="In this month" value={<span className="text-brand">+{formatKsh(stats.totalIn)}</span>} />
        <Stat label="Out this month" value={`−${formatKsh(stats.totalOut)}`} />
        <Stat tone="forest" label="Net of what's listed" value={formatKsh(stats.netBalance)} hint="money in minus money out on this page" />
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <Tabs
            label="Filter by type"
            value={filter}
            onChange={setFilter}
            items={['All', 'Contributions', 'Penalties', 'Withdrawals'].map((v) => ({ value: v, label: v }))}
          />
          <label className="relative w-full sm:w-[280px]">
            <span className="sr-only">Search</span>
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden="true" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search name, reference or amount" className={cn(inputClass, 'h-11 pl-10')} />
          </label>
        </div>

        {filteredTransactions.length === 0 ? (
          <EmptyState title={searchQuery || filter !== 'All' ? 'Nothing matches' : 'No transactions yet'}>
            {searchQuery || filter !== 'All' ? 'Try another search or filter.' : 'Contributions, payouts and penalties appear here as they happen.'}
          </EmptyState>
        ) : (
          <TableWrap className="mt-4">
            <table className={cn(tableClass, 'min-w-[680px]')}>
              <thead><tr><th>Date</th><th>Member</th><th>Type</th><th>Reference</th><th className="!text-right">Amount</th><th>Status</th></tr></thead>
              <tbody>
                {filteredTransactions.map((t) => {
                  const st = STATUS[t.status || 'confirmed'] || { kind: 'neutral' as ChipKind, label: t.status };
                  return (
                    <tr key={t.id} className="cursor-pointer hover:bg-surface-2" onClick={() => setSelectedTransaction(t)}>
                      <td className="whitespace-nowrap text-ink-2">{t.displayDate}<span className="block text-[12px] text-ink-3">{t.displayTime}</span></td>
                      <td>
                        <button type="button" onClick={() => setSelectedTransaction(t)} className="flex items-center gap-2.5 text-left">
                          <Avatar name={t.member_name} size={30} tone="sage" />
                          <span className="truncate max-w-[180px]">{t.member_name}</span>
                        </button>
                      </td>
                      <td className="text-ink-2">{TYPE[t.type] || t.type}</td>
                      <td className="font-mono text-[12px] text-ink-3">{t.ref}</td>
                      <td className={cn('text-right whitespace-nowrap font-money text-[17px]', t.isIncoming && 'text-brand')}>{t.isIncoming ? '+' : '−'}{formatKsh(Math.abs(Number(t.amount)))}</td>
                      <td><Chip kind={st.kind}>{st.label}</Chip></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}

        {(page > 0 || hasMore) && (
          <div className="flex items-center justify-between mt-4">
            <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Newer</Button>
            <span className="text-[13px] text-ink-3">Page {page + 1}</span>
            <Button variant="ghost" size="sm" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>Older</Button>
          </div>
        )}
      </Panel>

      <Modal open={!!sel} onClose={() => setSelectedTransaction(null)} title={sel ? TYPE[sel.type] || sel.type : ''}>
        {sel && (
          <div>
            <div className={cn('font-money text-[44px]', sel.isIncoming && 'text-brand')}>{sel.isIncoming ? '+' : '−'}{formatKsh(Math.abs(Number(sel.amount)))}</div>
            <dl className="mt-4 divide-y divide-line text-[15px]">
              {[
                ['Member', sel.member_name],
                ['Date', new Date(sel.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })],
                ['Reference', sel.ref],
                ['Status', STATUS[sel.status || 'confirmed']?.label || sel.status],
                ['Note', sel.description || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className={cn('text-right', k === 'Reference' && 'font-mono text-[13px]')}>{v}</dd>
                </div>
              ))}
            </dl>
            {sel.blockchain_tx_hash && (
              <p className="mt-4 text-[13px] text-ink-3">This entry also has an on-chain copy: <span className="font-mono break-all">{sel.blockchain_tx_hash}</span></p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

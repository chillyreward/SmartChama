"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function AdminWalletPage() {
  const { member: adminMember, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [walletLog, setWalletLog] = useState<any[]>([]);

  const [toastMsg, setToastMsg] = useState("");

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depAmount, setDepAmount] = useState("");
  const [depMethod, setDepMethod] = useState("Bank Transfer");
  const [depRef, setDepRef] = useState("");
  const [depNotes, setDepNotes] = useState("");

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withAmount, setWithAmount] = useState("");
  const [withReason, setWithReason] = useState("");

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  const fetchData = async () => {
    if (!adminMember || !group) return;
    try {
      setLoading(true);

      const { data: wData } = await supabase.from('wallets').select('*').eq('group_id', group.id).single();
      setWallet(wData);

      const { data: wReqs } = await supabase
        .from('withdrawal_requests')
        .select('*, members(full_name)')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false });
      setWithdrawals(wReqs || []);

      const { data: txs } = await supabase
        .from('transactions')
        .select('*, members(full_name)')
        .eq('group_id', group.id)
        .in('type', ['deposit', 'withdrawal', 'loan_disbursement', 'repayment', 'contribution', 'penalty', 'interest'])
        .order('created_at', { ascending: false })
        .limit(20);
      
      setWalletLog(txs || []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminMember, group]);

  const handleDeposit = async () => {
    try {
      const amt = Number(depAmount);
      await supabase.from('transactions').insert({
        group_id: group?.id,
        type: 'deposit',
        amount: amt,
        reference: depRef,
        notes: depNotes,
        recorded_by: adminMember?.id,
        status: 'confirmed',
        created_at: new Date().toISOString()
      });

      await supabase.from('wallets').update({
        balance: Number(wallet.balance) + amt
      }).eq('id', wallet.id);

      setToastMsg("Deposit recorded successfully");
      setTimeout(() => setToastMsg(""), 3000);
      setShowDepositModal(false);
      setDepAmount(""); setDepRef(""); setDepNotes("");
      fetchData();
    } catch (err: any) {
      alert("Error depositing: " + err.message);
    }
  };

  const handleWithdrawalRequest = async () => {
    try {
      const amt = Number(withAmount);
      if (amt > wallet.balance) {
        alert("Insufficient funds recorded");
        return;
      }
      
      await supabase.from('withdrawal_requests').insert({
        group_id: group?.id,
        requested_by: adminMember?.id,
        amount: amt,
        reason: withReason,
        status: 'pending'
      });

      setToastMsg("Withdrawal requested successfully");
      setTimeout(() => setToastMsg(""), 3000);
      setShowWithdrawModal(false);
      setWithAmount(""); setWithReason("");
      fetchData();
    } catch (err: any) {
      alert("Error requesting withdrawal: " + err.message);
    }
  };

  const handleApproveWithdrawal = async (req: any) => {
    if (wallet.balance < req.amount) {
      alert("Insufficient funds to approve this withdrawal");
      return;
    }
    if (confirm(`Approve withdrawal of KSh ${formatCurrency(req.amount)} requested by ${req.members?.full_name}?`)) {
      try {
        await supabase.from('withdrawal_requests').update({ status: 'approved' }).eq('id', req.id);
        
        await supabase.from('wallets').update({
          balance: Number(wallet.balance) - Number(req.amount)
        }).eq('id', wallet.id);

        await supabase.from('transactions').insert({
          group_id: group?.id,
          type: 'withdrawal',
          amount: -Number(req.amount),
          status: 'confirmed',
          reference: `WD-${Math.floor(Math.random()*10000)}`,
          created_at: new Date().toISOString()
        });

        setToastMsg("Withdrawal approved");
        setTimeout(() => setToastMsg(""), 3000);
        fetchData();
      } catch (err) {
        alert("Error approving withdrawal");
      }
    }
  };

  const handleRejectWithdrawal = async (req: any) => {
    try {
      await supabase.from('withdrawal_requests').update({ status: 'rejected' }).eq('id', req.id);
      setToastMsg("Withdrawal rejected");
      setTimeout(() => setToastMsg(""), 3000);
      fetchData();
    } catch (err) {
      alert("Error rejecting withdrawal");
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full font-inter">
        <div className="h-48 bg-[#0B0F0C] rounded-2xl animate-pulse mb-6 shadow-sm"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 card-bg border border-[var(--border)] rounded-2xl animate-pulse shadow-sm"></div>
          <div className="h-96 card-bg border border-[var(--border)] rounded-2xl animate-pulse shadow-sm"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full font-inter relative min-h-full text-[var(--text-main)]">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#161d16] dark:bg-[#E8F0E4] text-white dark:text-[#161d16] px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-fade-in-down">
          <span className="material-symbols-outlined text-[#22C55E]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6 md:mb-8">
        <div>
          <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
            <span>Admin Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Wallet</span>
          </p>
          <h1 className="text-[24px] md:text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">Total Recorded</h1>
          <p className="text-[14px] text-[var(--text-muted)] mt-1">Manage liquid funds, deposits, and withdrawals</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="bg-transparent border border-[var(--border)] text-[var(--text-main)] px-4 py-2.5 md:py-2 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
            Request Withdrawal
          </button>
          <button 
            onClick={() => setShowDepositModal(true)}
            className="bg-[#22C55E] hover:bg-[#006e2f] text-white px-4 py-2.5 md:py-2 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Deposit Funds
          </button>
        </div>
      </div>

      {/* HERO WALLET CARD */}
      <div className="w-full bg-[#0B0F0C] rounded-2xl p-6 md:p-8 mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 shadow-sm">
        <div className="flex-1">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">AVAILABLE BALANCE</div>
          <div className="text-[36px] md:text-[52px] font-geist font-bold text-white mt-2 leading-none">
            KSh {formatCurrency(wallet?.balance || 0)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-5">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">LOANS DISBURSED</div>
            <div className="text-lg md:text-xl font-bold text-white font-mono">
              KSh {formatCurrency(wallet?.loans_disbursed || 0)}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-5">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">EMERGENCY RESERVE</div>
            <div className="text-lg md:text-xl font-bold text-[#22C55E] font-mono">
              KSh {formatCurrency(wallet?.emergency_reserve || 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* WITHDRAWAL REQUESTS */}
        <div className="card-bg border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden flex flex-col h-[500px] hover:shadow-md transition-all duration-200">
          <div className="p-6 border-b border-[var(--border)] shrink-0">
            <h3 className="text-lg font-bold font-geist text-[var(--text-main)]">Withdrawal Requests</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            {/* Desktop Table View */}
            <table className="hidden md:table w-full text-left border-collapse min-w-[500px]">
              <thead className="sticky top-0 bg-gray-50 dark:bg-[#0f1410] border-b border-[var(--border)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">REQUESTED BY</th>
                  <th className="px-6 py-3">AMOUNT</th>
                  <th className="px-6 py-3">STATUS</th>
                  <th className="px-6 py-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
                {withdrawals.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-[var(--text-muted)] text-sm">No withdrawal requests found.</td></tr>
                ) : (
                  withdrawals.map(req => (
                    <tr key={req.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-[var(--text-main)]">{req.members?.full_name}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5 max-w-[150px] truncate">{req.reason}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[var(--text-main)]">
                        KSh {formatCurrency(Number(req.amount))}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${
                          req.status === 'approved' ? 'bg-transparent text-[var(--brand-green)] text-[var(--brand-green)]' :
                          req.status === 'pending' ? 'bg-orange-55 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300' : 'bg-red-50 dark:bg-red-950/20 text-[#ba1a1a] dark:text-[#ffb4ab]'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleRejectWithdrawal(req)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors">
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                            <button onClick={() => handleApproveWithdrawal(req)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#edf6ea] dark:hover:bg-[#1a2a1a] text-[var(--brand-green)] transition-colors">
                              <span className="material-symbols-outlined text-[18px]">check</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f] p-4">
              {withdrawals.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)] text-sm">No withdrawal requests found.</div>
              ) : (
                withdrawals.map(req => (
                  <div key={req.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-semibold text-[var(--text-main)]">{req.members?.full_name}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">{req.reason}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${
                        req.status === 'approved' ? 'bg-transparent text-[var(--brand-green)] text-[var(--brand-green)]' :
                        req.status === 'pending' ? 'bg-orange-55 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300' : 'bg-red-50 dark:bg-red-950/20 text-[#ba1a1a] dark:text-[#ffb4ab]'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="font-mono font-bold text-[var(--text-main)]">
                        KSh {formatCurrency(Number(req.amount))}
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleRejectWithdrawal(req)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors border border-red-200 dark:border-red-900/50">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                          <button onClick={() => handleApproveWithdrawal(req)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#edf6ea] dark:hover:bg-[#1a2a1a] text-[var(--brand-green)] transition-colors border border-green-200 dark:border-green-900/50">
                            <span className="material-symbols-outlined text-[18px]">check</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* WALLET AUDIT LOG */}
        <div className="card-bg border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden flex flex-col h-[500px] hover:shadow-md transition-all duration-200">
          <div className="p-6 border-b border-[var(--border)] shrink-0">
            <h3 className="text-lg font-bold font-geist text-[var(--text-main)]">Wallet Audit Log</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            {/* Desktop Table View */}
            <table className="hidden md:table w-full text-left border-collapse min-w-[500px]">
              <thead className="sticky top-0 bg-gray-50 dark:bg-[#0f1410] border-b border-[var(--border)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">DATE</th>
                  <th className="px-6 py-3">ACTION</th>
                  <th className="px-6 py-3 text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
                {walletLog.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-[var(--text-muted)] text-sm">No recent transactions.</td></tr>
                ) : (
                  walletLog.map(log => {
                    const isIncoming = Number(log.amount) > 0;
                    return (
                      <tr key={log.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                        <td className="px-6 py-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-[var(--text-main)] capitalize">
                            {log.type.replace('_', ' ')}
                          </div>
                          {log.members?.full_name && (
                            <div className="text-xs text-[#9CA3AF] dark:text-[#5a6e5a] mt-0.5">{log.members.full_name}</div>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-right font-mono font-bold ${isIncoming ? 'text-[var(--brand-green)]' : 'text-red-500'}`}>
                          {isIncoming ? '+' : ''}KSh {formatCurrency(Number(log.amount))}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f] p-4">
              {walletLog.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)] text-sm">No recent transactions.</div>
              ) : (
                walletLog.map(log => {
                  const isIncoming = Number(log.amount) > 0;
                  return (
                    <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-semibold text-[var(--text-main)] capitalize">
                          {log.type.replace('_', ' ')}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {new Date(log.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                          {log.members?.full_name && (
                            <>
                              <span className="text-[10px] text-gray-300">•</span>
                              <span className="text-[10px] text-[#9CA3AF] dark:text-[#5a6e5a]">{log.members.full_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className={`text-right font-mono font-bold ${isIncoming ? 'text-[var(--brand-green)]' : 'text-red-500'}`}>
                        {isIncoming ? '+' : ''}KSh {formatCurrency(Number(log.amount))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* DEPOSIT MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-[#0B0F0C]/50 dark:bg-[#0B0F0C]/75 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl text-[var(--text-main)]">
            <h2 className="text-headline-sm font-geist font-bold text-[var(--text-main)] mb-6">Deposit Funds</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Amount (KSh)</label>
                <input type="number" value={depAmount} onChange={e => setDepAmount(e.target.value)} className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-[#22C55E]" />
              </div>
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Payment Method</label>
                <select value={depMethod} onChange={e => setDepMethod(e.target.value)} className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-[#22C55E]">
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash Deposit">Cash Deposit</option>
                  <option value="M-Pesa">M-Pesa Paybill</option>
                </select>
              </div>
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Reference Code</label>
                <input type="text" value={depRef} onChange={e => setDepRef(e.target.value)} className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-[#22C55E] font-mono" />
              </div>
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Notes</label>
                <input type="text" value={depNotes} onChange={e => setDepNotes(e.target.value)} placeholder="Optional" className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-[#22C55E]" />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowDepositModal(false)} className="flex-1 bg-transparent border border-[var(--border)] rounded py-2 text-body-sm font-medium hover:bg-gray-50 dark:hover:bg-[#1f2a1f]">Cancel</button>
              <button onClick={handleDeposit} disabled={!depAmount || !depRef} className="flex-1 bg-[#22C55E] disabled:opacity-50 text-white rounded py-2 text-body-sm font-medium hover:bg-[#006e2f]">Deposit</button>
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAWAL MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-[#0B0F0C]/50 dark:bg-[#0B0F0C]/75 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl text-[var(--text-main)]">
            <h2 className="text-headline-sm font-geist font-bold text-[var(--text-main)] mb-6">Request Withdrawal</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Amount (KSh)</label>
                <input type="number" value={withAmount} onChange={e => setWithAmount(e.target.value)} className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-[#22C55E]" />
              </div>
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Reason for Withdrawal</label>
                <textarea 
                  rows={3} 
                  value={withReason} 
                  onChange={e => setWithReason(e.target.value)} 
                  placeholder="e.g. Member exit, project funding..."
                  className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-[#22C55E] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowWithdrawModal(false)} className="flex-1 bg-transparent border border-[var(--border)] rounded py-2 text-body-sm font-medium hover:bg-gray-50 dark:hover:bg-[#1f2a1f]">Cancel</button>
              <button onClick={handleWithdrawalRequest} disabled={!withAmount || !withReason} className="flex-1 bg-[#22C55E] disabled:opacity-50 text-white rounded py-2 text-body-sm font-medium hover:bg-[#006e2f]">Submit Request</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

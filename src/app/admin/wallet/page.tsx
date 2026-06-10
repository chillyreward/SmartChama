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
        alert("Insufficient funds in wallet");
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
      <div className="p-8">
        <div className="h-48 bg-[#0B0F0C] rounded-xl animate-pulse mb-6"></div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-96 bg-white border border-[#E5E7EB] rounded-lg animate-pulse"></div>
          <div className="h-96 bg-white border border-[#E5E7EB] rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 font-inter relative min-h-full">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#22C55E] text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-headline-lg font-semibold text-on-surface font-geist">Group Wallet</h1>
          <p className="text-body-sm text-secondary mt-1">Manage liquid funds, deposits, and withdrawals</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="bg-white border border-[#E5E7EB] text-on-surface px-4 py-2 rounded text-body-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
            Request Withdrawal
          </button>
          <button 
            onClick={() => setShowDepositModal(true)}
            className="bg-[#22C55E] hover:bg-[#006e2f] text-white px-4 py-2 rounded text-body-sm font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Deposit Funds
          </button>
        </div>
      </div>

      {/* HERO WALLET CARD */}
      <div className="w-full bg-[#0B0F0C] rounded-xl p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 shadow-sm">
        <div className="flex-1">
          <div className="text-label-caps text-gray-400">AVAILABLE BALANCE</div>
          <div className="text-[56px] font-geist font-bold text-white mt-2 leading-none">
            KSh {formatCurrency(wallet?.balance || 0)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <div className="text-label-caps text-gray-400 mb-1">LOANS DISBURSED</div>
            <div className="text-headline-sm font-bold text-white font-mono">
              KSh {formatCurrency(wallet?.loans_disbursed || 0)}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <div className="text-label-caps text-gray-400 mb-1">EMERGENCY RESERVE</div>
            <div className="text-headline-sm font-bold text-[#22C55E] font-mono">
              KSh {formatCurrency(wallet?.emergency_reserve || 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* WITHDRAWAL REQUESTS */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-[#E5E7EB] shrink-0">
            <h3 className="text-headline-sm font-geist text-on-surface">Withdrawal Requests</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3 text-label-caps text-secondary font-medium">REQUESTED BY</th>
                  <th className="px-6 py-3 text-label-caps text-secondary font-medium">AMOUNT</th>
                  <th className="px-6 py-3 text-label-caps text-secondary font-medium">STATUS</th>
                  <th className="px-6 py-3 text-label-caps text-secondary font-medium text-right">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-secondary text-body-sm">No withdrawal requests found.</td></tr>
                ) : (
                  withdrawals.map(req => (
                    <tr key={req.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-body-sm font-medium text-on-surface">{req.members?.full_name}</div>
                        <div className="text-label-caps text-secondary mt-0.5 max-w-[150px] truncate">{req.reason}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-on-surface">
                        KSh {formatCurrency(Number(req.amount))}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-label-caps font-medium capitalize ${
                          req.status === 'approved' ? 'bg-[#22C55E]/10 text-[#005321]' :
                          req.status === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleRejectWithdrawal(req)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-50 text-error transition-colors">
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                            <button onClick={() => handleApproveWithdrawal(req)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-green-50 text-[#22C55E] transition-colors">
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
          </div>
        </div>

        {/* WALLET AUDIT LOG */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-[#E5E7EB] shrink-0">
            <h3 className="text-headline-sm font-geist text-on-surface">Wallet Audit Log</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3 text-label-caps text-secondary font-medium">DATE</th>
                  <th className="px-6 py-3 text-label-caps text-secondary font-medium">ACTION</th>
                  <th className="px-6 py-3 text-label-caps text-secondary font-medium text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {walletLog.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-secondary text-body-sm">No recent transactions.</td></tr>
                ) : (
                  walletLog.map(log => {
                    const isIncoming = Number(log.amount) > 0;
                    return (
                      <tr key={log.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50">
                        <td className="px-6 py-4 text-body-sm text-secondary whitespace-nowrap">
                          {new Date(log.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-body-sm font-medium text-on-surface capitalize">
                            {log.type.replace('_', ' ')}
                          </div>
                          {log.members?.full_name && (
                            <div className="text-label-caps text-secondary">{log.members.full_name}</div>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-right font-mono font-bold ${isIncoming ? 'text-[#22C55E]' : 'text-on-surface'}`}>
                          {isIncoming ? '+' : ''}KSh {formatCurrency(Number(log.amount))}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* DEPOSIT MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-[#0B0F0C]/40 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-headline-sm font-geist font-bold text-on-surface mb-6">Deposit Funds</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-label-caps text-secondary mb-2">Amount (KSh)</label>
                <input type="number" value={depAmount} onChange={e => setDepAmount(e.target.value)} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E]" />
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">Payment Method</label>
                <select value={depMethod} onChange={e => setDepMethod(e.target.value)} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] bg-white">
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash Deposit">Cash Deposit</option>
                  <option value="M-Pesa">M-Pesa Paybill</option>
                </select>
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">Reference Code</label>
                <input type="text" value={depRef} onChange={e => setDepRef(e.target.value)} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] font-mono" />
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">Notes</label>
                <input type="text" value={depNotes} onChange={e => setDepNotes(e.target.value)} placeholder="Optional" className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E]" />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowDepositModal(false)} className="flex-1 bg-white border border-[#E5E7EB] rounded py-2 text-body-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleDeposit} disabled={!depAmount || !depRef} className="flex-1 bg-[#22C55E] disabled:opacity-50 text-white rounded py-2 text-body-sm font-medium hover:bg-[#006e2f]">Deposit</button>
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAWAL MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-[#0B0F0C]/40 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-headline-sm font-geist font-bold text-on-surface mb-6">Request Withdrawal</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-label-caps text-secondary mb-2">Amount (KSh)</label>
                <input type="number" value={withAmount} onChange={e => setWithAmount(e.target.value)} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E]" />
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">Reason for Withdrawal</label>
                <textarea 
                  rows={3} 
                  value={withReason} 
                  onChange={e => setWithReason(e.target.value)} 
                  placeholder="e.g. Member exit, project funding..."
                  className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowWithdrawModal(false)} className="flex-1 bg-white border border-[#E5E7EB] rounded py-2 text-body-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleWithdrawalRequest} disabled={!withAmount || !withReason} className="flex-1 bg-primary disabled:opacity-50 text-white rounded py-2 text-body-sm font-medium hover:bg-[#005321]">Submit Request</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

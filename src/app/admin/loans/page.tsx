"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function AdminLoansPage() {
  const { member: adminMember, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  
  const [toastMsg, setToastMsg] = useState("");

  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineLoan, setDeclineLoan] = useState<any>(null);
  const [declineReason, setDeclineReason] = useState("");

  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [repaymentLoan, setRepaymentLoan] = useState<any>(null);
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [repaymentRef, setRepaymentRef] = useState("");
  const [repaymentDate, setRepaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  const fetchData = async () => {
    if (!adminMember || !group) return;
    try {
      setLoading(true);

      const { data: wData } = await supabase.from('wallets').select('*').eq('group_id', group.id).single();
      setWallet(wData);

      const { data: lData } = await supabase
        .from('loans')
        .select(`
          *,
          members(full_name, trust_score, phone_number),
          loan_repayments(amount, created_at)
        `)
        .eq('group_id', group.id)
        .order('created_at', { ascending: false });

      const enhanced = lData?.map(l => {
        const totalRepaid = l.loan_repayments?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0;
        return { ...l, totalRepaid };
      }) || [];

      setLoans(enhanced);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminMember, group]);

  const handleApprove = async (loan: any) => {
    if (!wallet) return;
    if (wallet.balance < loan.amount) {
      alert("Insufficient wallet balance to approve this loan.");
      return;
    }
    if (confirm(`Approve loan of KSh ${formatCurrency(loan.amount)} for ${loan.members?.full_name}?`)) {
      try {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + loan.repayment_months);

        const { error } = await supabase.from('loans').update({
          status: 'active',
          approved_by: adminMember?.id,
          approved_at: new Date().toISOString(),
          due_date: dueDate.toISOString()
        }).eq('id', loan.id);
        
        if (error) throw error;

        // update wallet
        await supabase.from('wallets').update({
          balance: Number(wallet.balance) - Number(loan.amount),
          loans_disbursed: Number(wallet.loans_disbursed) + Number(loan.amount)
        }).eq('id', wallet.id);

        // create tx
        await supabase.from('transactions').insert({
          group_id: group?.id,
          member_id: loan.member_id,
          type: 'loan_disbursement',
          amount: -Number(loan.amount),
          status: 'confirmed',
          reference: `LOAN-${Math.floor(Math.random()*10000)}`,
          created_at: new Date().toISOString()
        });

        // notify
        await supabase.from('notifications').insert({
          group_id: group?.id,
          member_id: loan.member_id,
          type: 'loan_approved',
          message: `Your loan of KSh ${formatCurrency(loan.amount)} has been approved.`,
          read: false
        });

        setToastMsg("Loan approved and disbursed");
        setTimeout(() => setToastMsg(""), 3000);
        fetchData();
      } catch (err: any) {
        alert("Error approving loan: " + err.message);
      }
    }
  };

  const handleDecline = async () => {
    if (!declineLoan) return;
    try {
      await supabase.from('loans').update({
        status: 'declined',
        decline_reason: declineReason
      }).eq('id', declineLoan.id);

      await supabase.from('notifications').insert({
        group_id: group?.id,
        member_id: declineLoan.member_id,
        type: 'loan_declined',
        message: `Your loan request was declined. Reason: ${declineReason}`,
        read: false
      });

      setToastMsg("Loan declined");
      setTimeout(() => setToastMsg(""), 3000);
      setShowDeclineModal(false);
      setDeclineReason("");
      fetchData();
    } catch (err: any) {
      alert("Error declining loan");
    }
  };

  const handleRecordRepayment = async () => {
    if (!repaymentLoan || !repaymentAmount) return;
    try {
      const amt = Number(repaymentAmount);

      await supabase.from('loan_repayments').insert({
        loan_id: repaymentLoan.id,
        member_id: repaymentLoan.member_id,
        amount: amt,
        reference: repaymentRef,
        created_at: new Date(repaymentDate).toISOString()
      });

      // update wallet
      await supabase.from('wallets').update({
        balance: Number(wallet.balance) + amt
      }).eq('id', wallet.id);

      // tx
      await supabase.from('transactions').insert({
        group_id: group?.id,
        member_id: repaymentLoan.member_id,
        type: 'repayment',
        amount: amt,
        status: 'confirmed',
        reference: repaymentRef,
        created_at: new Date(repaymentDate).toISOString()
      });

      // check if fully repaid
      const newTotal = repaymentLoan.totalRepaid + amt;
      const totalDue = Number(repaymentLoan.amount) + (Number(repaymentLoan.amount) * (Number(repaymentLoan.interest_rate) / 100));

      if (newTotal >= totalDue) {
        await supabase.from('loans').update({ status: 'repaid' }).eq('id', repaymentLoan.id);
      } else if (repaymentLoan.status === 'overdue') {
        // if they made a partial repayment while overdue, it remains overdue unless we want logic to clear it
      }

      setToastMsg("Repayment recorded!");
      setTimeout(() => setToastMsg(""), 3000);
      setShowRepaymentModal(false);
      setRepaymentAmount("");
      setRepaymentRef("");
      fetchData();
    } catch (err: any) {
      alert("Error recording repayment: " + err.message);
    }
  };

  const handleMarkOverdue = async (loan: any) => {
    if (confirm('Mark this loan as overdue? The member will be flagged.')) {
      try {
        await supabase.from('loans').update({ status: 'overdue' }).eq('id', loan.id);
        // optional: auto-flag member
        setToastMsg("Loan marked as overdue");
        setTimeout(() => setToastMsg(""), 3000);
        fetchData();
      } catch (err) {
        alert("Error marking overdue");
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-96 bg-white border border-[#E5E7EB] rounded-lg animate-pulse shadow-sm"></div>
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
          <h1 className="text-headline-lg font-semibold text-on-surface font-geist">Loans Management</h1>
          <p className="text-body-sm text-secondary mt-1">Review requests, approve disbursements, and track repayments</p>
        </div>
        <div className="text-right">
          <div className="text-label-caps text-secondary mb-1">AVAILABLE IN WALLET</div>
          <div className="text-headline-sm font-bold font-mono text-[#22C55E]">
            KSh {formatCurrency(wallet?.balance || 0)}
          </div>
        </div>
      </div>

      {/* PENDING REQUESTS */}
      <div className="mb-8">
        <h2 className="text-headline-sm font-geist text-on-surface mb-4">Pending Requests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loans.filter(l => l.status === 'pending').length === 0 ? (
            <div className="col-span-full p-6 text-center text-body-sm text-secondary bg-surface-container-low border border-[#E5E7EB] rounded-lg">
              No pending loan requests.
            </div>
          ) : (
            loans.filter(l => l.status === 'pending').map(l => (
              <div key={l.id} className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-bold text-on-surface">{l.members?.full_name}</div>
                    <div className="text-body-sm text-secondary">Trust: {l.members?.trust_score}/100</div>
                  </div>
                  <span className="bg-orange-100 text-orange-800 text-label-caps px-2 py-0.5 rounded font-bold">Pending</span>
                </div>
                
                <div className="flex justify-between items-center mb-1">
                  <span className="text-secondary text-body-sm">Requested Amount:</span>
                  <span className="font-mono font-bold text-on-surface">KSh {formatCurrency(l.amount)}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-secondary text-body-sm">Duration:</span>
                  <span className="text-body-sm font-medium">{l.repayment_months} months @ {l.interest_rate}%</span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setDeclineLoan(l); setShowDeclineModal(true); }}
                    className="flex-1 bg-white border border-[#E5E7EB] text-error hover:bg-red-50 py-2 rounded text-body-sm font-medium transition-colors"
                  >
                    Decline
                  </button>
                  <button 
                    onClick={() => handleApprove(l)}
                    className="flex-1 bg-[#22C55E] text-white hover:bg-[#006e2f] py-2 rounded text-body-sm font-medium transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ACTIVE LOANS TABLE */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB]">
          <h2 className="text-headline-sm font-geist text-on-surface">Active & Overdue Loans</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#E5E7EB]">
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">MEMBER</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">PRINCIPAL</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">TOTAL DUE</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">REPAID</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">DUE DATE</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">STATUS</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loans.filter(l => l.status === 'active' || l.status === 'overdue').length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-secondary text-body-sm">
                    No active loans currently.
                  </td>
                </tr>
              ) : (
                loans.filter(l => l.status === 'active' || l.status === 'overdue').map(l => {
                  const totalDue = Number(l.amount) + (Number(l.amount) * (Number(l.interest_rate) / 100));
                  return (
                    <tr key={l.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-body-sm font-medium text-on-surface">{l.members?.full_name}</div>
                        <div className="text-label-caps text-secondary">{l.members?.phone_number}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-on-surface">
                        KSh {formatCurrency(l.amount)}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-on-surface">
                        KSh {formatCurrency(totalDue)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[#22C55E]">
                        KSh {formatCurrency(l.totalRepaid)}
                      </td>
                      <td className="px-6 py-4 text-body-sm text-secondary">
                        {l.due_date ? new Date(l.due_date).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-label-caps font-bold capitalize ${
                          l.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select 
                          className="bg-transparent text-secondary hover:text-on-surface outline-none cursor-pointer text-body-sm font-medium w-24"
                          onChange={(e) => {
                            const val = e.target.value;
                            e.target.value = "";
                            if (val === 'repay') { setRepaymentLoan(l); setShowRepaymentModal(true); }
                            if (val === 'overdue') handleMarkOverdue(l);
                          }}
                        >
                          <option value="">Actions</option>
                          <option value="repay">Record Repayment</option>
                          {l.status !== 'overdue' && <option value="overdue">Mark Overdue</option>}
                        </select>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPAYMENT MODAL */}
      {showRepaymentModal && repaymentLoan && (
        <div className="fixed inset-0 bg-[#0B0F0C]/40 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-headline-sm font-geist font-bold text-on-surface mb-2">Record Repayment</h2>
            <p className="text-body-sm text-secondary mb-6">For {repaymentLoan.members?.full_name}</p>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-label-caps text-secondary">Remaining Balance</span>
                  <span className="font-mono font-bold text-[#22C55E]">
                    KSh {formatCurrency((Number(repaymentLoan.amount) + (Number(repaymentLoan.amount) * (Number(repaymentLoan.interest_rate) / 100))) - repaymentLoan.totalRepaid)}
                  </span>
                </div>
                <input 
                  type="number" 
                  placeholder="Amount (KSh)"
                  value={repaymentAmount} 
                  onChange={e => setRepaymentAmount(e.target.value)} 
                  className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] mt-2" 
                />
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">M-Pesa Reference</label>
                <input type="text" value={repaymentRef} onChange={e => setRepaymentRef(e.target.value)} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] font-mono" />
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">Date</label>
                <input type="date" value={repaymentDate} onChange={e => setRepaymentDate(e.target.value)} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E]" />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowRepaymentModal(false)} className="flex-1 bg-white border border-[#E5E7EB] rounded py-2 text-body-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleRecordRepayment} disabled={!repaymentAmount} className="flex-1 bg-[#22C55E] disabled:opacity-50 text-white rounded py-2 text-body-sm font-medium hover:bg-[#006e2f]">Record</button>
            </div>
          </div>
        </div>
      )}

      {/* DECLINE MODAL */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-[#0B0F0C]/40 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-headline-sm font-geist font-bold text-error mb-2">Decline Loan</h2>
            <p className="text-body-sm text-secondary mb-6">Provide a reason for declining.</p>
            
            <textarea 
              rows={3} 
              value={declineReason} 
              onChange={e => setDeclineReason(e.target.value)} 
              placeholder="e.g. Trust score too low..."
              className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-error resize-none"
            />

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowDeclineModal(false)} className="flex-1 bg-white border border-[#E5E7EB] rounded py-2 text-body-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleDecline} disabled={!declineReason} className="flex-1 bg-error disabled:opacity-50 text-white rounded py-2 text-body-sm font-medium hover:bg-red-700">Decline</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

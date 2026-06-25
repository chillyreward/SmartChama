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

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

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
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      const enhanced = lData?.map(l => {
        const totalRepaid = l.loan_repayments?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0;
        return { ...l, totalRepaid };
      }) || [];

      setLoans(enhanced);
      setHasMore((lData?.length || 0) === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminMember, group, page]);

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
      <div className="p-6 max-w-[1280px] mx-auto w-full font-inter">
        <div className="h-28 card-bg border border-[var(--border)] rounded-2xl animate-pulse shadow-sm mb-6"></div>
        <div className="card-bg border border-[var(--border)] rounded-2xl h-96 animate-pulse shadow-sm"></div>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
            <span>Admin Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Loans</span>
          </p>
          <h1 className="text-[24px] md:text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">Loans Management</h1>
          <p className="text-[13px] md:text-[14px] text-[var(--text-muted)] mt-1">Review requests, approve disbursements, and track repayments</p>
        </div>
        <div className="card-bg border border-[var(--border)] border-t-2 border-t-[#22C55E] rounded-2xl p-4 md:p-5 shadow-sm text-center md:text-right w-full md:w-auto md:min-w-[180px]">
          <div className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-1">AVAILABLE RECORDED</div>
          <div className="text-2xl font-bold font-mono text-[var(--brand-green)]">
            KSh {formatCurrency(wallet?.balance || 0)}
          </div>
        </div>
      </div>

      {/* PENDING REQUESTS */}
      <div className="mb-8">
        <h2 className="text-xl font-bold font-geist text-[var(--text-main)] mb-4">Pending Requests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loans.filter(l => l.status === 'pending').length === 0 ? (
            <div className="col-span-full p-6 text-center text-sm text-[var(--text-muted)] bg-[#FAFAFA] dark:bg-[#0f1410] border border-[var(--border)] rounded-2xl">
              No pending loan requests.
            </div>
          ) : (
            loans.filter(l => l.status === 'pending').map(l => (
              <div key={l.id} className="card-bg border border-[var(--border)] border-t-2 border-t-amber-500 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-bold text-[var(--text-main)] text-sm">{l.members?.full_name}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">Trust: {l.members?.trust_score}/100</div>
                  </div>
                  <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-250 dark:border-amber-900/30 text-xs px-2 py-0.5 rounded font-bold">Pending</span>
                </div>
                
                <div className="flex justify-between items-center mb-1 text-sm">
                  <span className="text-[var(--text-muted)]">Requested Amount:</span>
                  <span className="font-mono font-bold text-[var(--text-main)]">KSh {formatCurrency(l.amount)}</span>
                </div>
                <div className="flex justify-between items-center mb-4 text-sm">
                  <span className="text-[var(--text-muted)]">Duration:</span>
                  <span className="text-xs font-semibold text-[var(--text-main)]">{l.repayment_months} months @ {l.interest_rate}%</span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setDeclineLoan(l); setShowDeclineModal(true); }}
                    className="flex-1 bg-transparent border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                  >
                    Decline
                  </button>
                  <button 
                    onClick={() => handleApprove(l)}
                    className="flex-1 bg-[#22C55E] text-white hover:bg-[#006e2f] py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ACTIVE LOANS TABLE / CARD LIST */}
      <div className="card-bg border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
        <div className="p-4 md:p-6 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold font-geist text-[var(--text-main)]">Active & Overdue Loans</h2>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0f1410] border-b border-[var(--border)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">MEMBER</th>
                <th className="px-6 py-4">PRINCIPAL</th>
                <th className="px-6 py-4">TOTAL DUE</th>
                <th className="px-6 py-4">REPAID</th>
                <th className="px-6 py-4">DUE DATE</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
              {loans.filter(l => l.status === 'active' || l.status === 'overdue').length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--text-muted)] text-sm">
                    No active loans currently.
                  </td>
                </tr>
              ) : (
                loans.filter(l => l.status === 'active' || l.status === 'overdue').map(l => {
                  const totalDue = Number(l.amount) + (Number(l.amount) * (Number(l.interest_rate) / 100));
                  return (
                    <tr key={l.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-[var(--text-main)]">{l.members?.full_name}</div>
                        <div className="text-xs text-[#9CA3AF] dark:text-[#5a6e5a]">{l.members?.phone_number}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[var(--text-main)]">
                        KSh {formatCurrency(l.amount)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[var(--text-main)]">
                        KSh {formatCurrency(totalDue)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[var(--brand-green)]">
                        KSh {formatCurrency(l.totalRepaid)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                        {l.due_date ? new Date(l.due_date).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold capitalize ${
                          l.status === 'active' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300' : 'bg-red-50 dark:bg-red-950/20 text-[#ba1a1a] dark:text-[#ffb4ab]'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select 
                          className="bg-transparent border border-[var(--border)] rounded px-2.5 py-1 text-xs font-semibold text-[var(--text-main)] outline-none cursor-pointer hover:border-[#22C55E]"
                          value=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'repay') { setRepaymentLoan(l); setShowRepaymentModal(true); }
                            if (val === 'overdue') handleMarkOverdue(l);
                            e.target.value = "";
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

        {/* Mobile Card List View */}
        <div className="md:hidden divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
          {loans.filter(l => l.status === 'active' || l.status === 'overdue').length === 0 ? (
            <div className="p-6 text-center text-[var(--text-muted)] text-sm">
              No active loans currently.
            </div>
          ) : (
            loans.filter(l => l.status === 'active' || l.status === 'overdue').map(l => {
              const totalDue = Number(l.amount) + (Number(l.amount) * (Number(l.interest_rate) / 100));
              return (
                <div key={l.id} className="p-4 flex flex-col gap-2 hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-[var(--text-main)] text-sm">
                        {l.members?.full_name}
                      </div>
                      <div className="text-xs text-[#9CA3AF] dark:text-[#5a6e5a] mt-0.5">
                        {l.members?.phone_number}
                      </div>
                    </div>
                    <div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold capitalize ${
                        l.status === 'active' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300' : 'bg-red-50 dark:bg-red-950/20 text-[#ba1a1a] dark:text-[#ffb4ab]'
                      }`}>
                        {l.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-b border-dashed border-[#f5f5f5] dark:border-[#2d3d2d] my-1">
                    <div>
                      <span className="text-[var(--text-muted)] block">Principal:</span>
                      <span className="font-mono font-bold text-[var(--text-main)]">KSh {formatCurrency(l.amount)}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block">Total Due:</span>
                      <span className="font-mono font-bold text-[var(--text-main)]">KSh {formatCurrency(totalDue)}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block">Repaid:</span>
                      <span className="font-mono font-bold text-[var(--brand-green)]">KSh {formatCurrency(l.totalRepaid)}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block">Due Date:</span>
                      <span className="font-semibold text-[var(--text-main)]">{l.due_date ? new Date(l.due_date).toLocaleDateString('en-GB') : '—'}</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <select 
                      className="bg-transparent border border-[var(--border)] rounded px-2.5 py-1 text-xs font-semibold text-[var(--text-main)] outline-none cursor-pointer hover:border-[#22C55E]"
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'repay') { setRepaymentLoan(l); setShowRepaymentModal(true); }
                        if (val === 'overdue') handleMarkOverdue(l);
                        e.target.value = "";
                      }}
                    >
                      <option value="">Actions</option>
                      <option value="repay">Record Repayment</option>
                      {l.status !== 'overdue' && <option value="overdue">Mark Overdue</option>}
                    </select>
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

      {/* REPAYMENT MODAL */}
      {showRepaymentModal && repaymentLoan && (
        <div className="fixed inset-0 bg-[#0B0F0C]/50 dark:bg-[#0B0F0C]/75 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl text-[var(--text-main)]">
            <h2 className="text-headline-sm font-geist font-bold text-[var(--text-main)] mb-2">Record Repayment</h2>
            <p className="text-body-sm text-[var(--text-muted)] mb-6">For {repaymentLoan.members?.full_name}</p>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-[var(--text-muted)]">Remaining Balance</span>
                  <span className="font-mono font-bold text-[var(--brand-green)]">
                    KSh {formatCurrency((Number(repaymentLoan.amount) + (Number(repaymentLoan.amount) * (Number(repaymentLoan.interest_rate) / 100))) - repaymentLoan.totalRepaid)}
                  </span>
                </div>
                <input 
                  type="number" 
                  placeholder="Amount (KSh)"
                  value={repaymentAmount} 
                  onChange={e => setRepaymentAmount(e.target.value)} 
                  className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-[#22C55E] mt-2" 
                />
              </div>
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">M-Pesa Reference</label>
                <input type="text" value={repaymentRef} onChange={e => setRepaymentRef(e.target.value)} className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-[#22C55E] font-mono" />
              </div>
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Date</label>
                <input type="date" value={repaymentDate} onChange={e => setRepaymentDate(e.target.value)} className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-[#22C55E]" />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowRepaymentModal(false)} className="flex-1 bg-transparent border border-[var(--border)] rounded py-2 text-body-sm font-medium hover:bg-gray-50 dark:hover:bg-[#1f2a1f]">Cancel</button>
              <button onClick={handleRecordRepayment} disabled={!repaymentAmount} className="flex-1 bg-[#22C55E] disabled:opacity-50 text-white rounded py-2 text-body-sm font-medium hover:bg-[#006e2f]">Record</button>
            </div>
          </div>
        </div>
      )}

      {/* DECLINE MODAL */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-[#0B0F0C]/50 dark:bg-[#0B0F0C]/75 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl text-[var(--text-main)]">
            <h2 className="text-headline-sm font-geist font-bold text-error mb-2">Decline Loan</h2>
            <p className="text-body-sm text-[var(--text-muted)] mb-6">Provide a reason for declining.</p>
            
            <textarea 
              rows={3} 
              value={declineReason} 
              onChange={e => setDeclineReason(e.target.value)} 
              placeholder="e.g. Trust score too low..."
              className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-error resize-none"
            />

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowDeclineModal(false)} className="flex-1 bg-transparent border border-[var(--border)] rounded py-2 text-body-sm font-medium hover:bg-gray-50 dark:hover:bg-[#1f2a1f]">Cancel</button>
              <button onClick={handleDecline} disabled={!declineReason} className="flex-1 bg-error disabled:opacity-50 text-white rounded py-2 text-body-sm font-medium hover:bg-red-700">Decline</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

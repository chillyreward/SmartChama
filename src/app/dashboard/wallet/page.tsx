"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function WalletPage() {
  const { session, member, group, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalReason, setWithdrawalReason] = useState("");
  
  const [walletStats, setWalletStats] = useState({
    balance: 0,
    inThisMonth: 0,
    outThisMonth: 0,
    savingsPool: 0,
    activeLoansTotal: 0,
    emergencyFund: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState("");

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  const fetchData = async () => {
    if (!member || !group) return;
    try {
      setLoading(true);
      setError("");

      const { data: txData } = await supabase
        .from('transactions')
        .select(`*, members(full_name)`)
        .eq('group_id', member.group_id)
        .order('created_at', { ascending: false });

      const today = new Date();
      let balance = 0;
      let inThisMonth = 0;
      let outThisMonth = 0;
      
      const recent = txData?.slice(0, 5) || [];

      txData?.forEach(tx => {
        const amt = Number(tx.amount);
        const txDate = new Date(tx.created_at);
        const isThisMonth = txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
        
        const isIncoming = ['contribution', 'repayment', 'penalty', 'interest'].includes(tx.type);

        if (isIncoming) {
          balance += amt;
          if (isThisMonth) inThisMonth += amt;
        } else {
          balance -= amt;
          if (isThisMonth) outThisMonth += amt;
        }
      });

      const { data: loansData } = await supabase
        .from('loans')
        .select('amount')
        .eq('group_id', member.group_id)
        .in('status', ['active', 'overdue']);

      const activeLoansTotal = loansData?.reduce((sum, l) => sum + Number(l.amount), 0) || 0;
      
      // Derived metrics
      const emergencyFund = balance * 0.05;
      const savingsPool = Math.max(0, balance - emergencyFund);

      setWalletStats({
        balance,
        inThisMonth,
        outThisMonth,
        savingsPool,
        activeLoansTotal,
        emergencyFund
      });

      setRecentActivity(recent);

    } catch (err) {
      console.error(err);
      setError("Failed to load wallet data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && member && group) {
      fetchData();
    }
  }, [authLoading, member, group]);

  const handleWithdrawalRequest = async () => {
    if (!member || !group) return;
    const amountVal = parseFloat(withdrawalAmount.replace(/,/g, ""));
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Invalid amount");
      return;
    }
    
    // Simulating withdrawal request
    setToastMsg("Withdrawal request submitted to Admins.");
    setTimeout(() => setToastMsg(""), 3000);
    setWithdrawalAmount("");
    setWithdrawalReason("");
  };

  if (authLoading || loading) {
    return (
      <div className="p-8">
        <div className="bg-[#0B0F0C] rounded-xl p-8 mb-6 h-64 animate-pulse shadow-sm"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1,2,3].map(i => <div key={i} className="bg-white border border-[#E5E7EB] rounded-lg p-6 h-32 animate-pulse shadow-sm"></div>)}
        </div>
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

  // Calculate percentages
  const totalAssets = walletStats.balance + walletStats.activeLoansTotal;
  const savingsPct = totalAssets > 0 ? Math.round((walletStats.savingsPool / totalAssets) * 100) : 0;
  const loansPct = totalAssets > 0 ? Math.round((walletStats.activeLoansTotal / totalAssets) * 100) : 0;
  const emergencyPct = totalAssets > 0 ? Math.round((walletStats.emergencyFund / totalAssets) * 100) : 0;

  return (
    <div className="p-8 font-inter relative min-h-full">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#22C55E] text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-headline-lg font-semibold text-on-surface font-geist">Wallet</h1>
        <p className="text-body-sm text-secondary mt-1">{group.name} Group Wallet</p>
      </div>

      {/* HERO WALLET CARD */}
      <div className="w-full bg-[#0B0F0C] rounded-xl p-8 mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 shadow-sm">
        {/* Left */}
        <div className="flex-1 w-full">
          <div className="text-label-caps text-gray-400">GROUP WALLET BALANCE</div>
          <div className="text-[56px] font-geist font-bold text-white mt-2 leading-none">KSh {formatCurrency(walletStats.balance)}</div>
          <div className="text-body-sm text-gray-400 mt-3">Available for loans and disbursements</div>
          
          <div className="flex flex-wrap gap-3 mt-8">
            <button className="bg-[#22C55E] hover:bg-[#006e2f] transition-colors text-white px-6 py-3 rounded text-headline-sm flex items-center gap-2 font-medium shadow-sm">
              <span className="material-symbols-outlined text-[20px]">payments</span>
              Deposit
            </button>
            <button className="bg-transparent hover:bg-white/5 transition-colors border border-white/30 text-white px-6 py-3 rounded text-headline-sm flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-[20px]">arrow_outward</span>
              Withdraw
            </button>
          </div>
        </div>

        {/* Right */}
        <div className="w-full lg:w-[340px] bg-white/5 border border-white/10 rounded-lg p-6 shrink-0">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#22C55E] text-[20px]">arrow_upward</span>
              <span className="text-body-sm text-white font-medium">KSh {formatCurrency(walletStats.inThisMonth)} in this month</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gray-400 text-[20px]">arrow_downward</span>
              <span className="text-body-sm text-gray-400 font-medium">KSh {formatCurrency(walletStats.outThisMonth)} out this month</span>
            </div>
          </div>
          <div className="border-t border-white/10 my-5"></div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#22C55E] text-[20px]">payments</span>
            <span className="text-body-sm text-[#22C55E] font-medium">M-Pesa Connected</span>
          </div>
        </div>
      </div>

      {/* WALLET BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
          <div className="text-label-caps text-secondary mb-2 uppercase">SAVINGS POOL</div>
          <div className="text-display-sm font-geist font-bold text-on-surface mb-1">KSh {formatCurrency(walletStats.savingsPool)}</div>
          <div className="text-label-caps text-secondary mb-5">Available to lend to members</div>
          <div className="bg-[#E5E7EB] h-2 rounded-full w-full overflow-hidden">
            <div className="bg-[#22C55E] h-full rounded-full transition-all" style={{ width: `${savingsPct}%` }}></div>
          </div>
          <div className="text-label-caps text-[#22C55E] mt-3 font-medium">{savingsPct}% of assets</div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
          <div className="text-label-caps text-secondary mb-2 uppercase">ACTIVE LOANS</div>
          <div className="text-display-sm font-geist font-bold text-on-surface mb-1">KSh {formatCurrency(walletStats.activeLoansTotal)}</div>
          <div className="text-label-caps text-secondary mb-5">Currently disbursed</div>
          <div className="bg-[#E5E7EB] h-2 rounded-full w-full overflow-hidden">
            <div className="bg-blue-400 h-full rounded-full transition-all" style={{ width: `${loansPct}%` }}></div>
          </div>
          <div className="text-label-caps text-blue-500 mt-3 font-medium">{loansPct}% of assets</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
          <div className="text-label-caps text-secondary mb-2 uppercase">EMERGENCY FUND</div>
          <div className="text-display-sm font-geist font-bold text-on-surface mb-1">KSh {formatCurrency(walletStats.emergencyFund)}</div>
          <div className="text-label-caps text-secondary mb-5">Reserved — not for lending</div>
          <div className="bg-[#E5E7EB] h-2 rounded-full w-full overflow-hidden">
            <div className="bg-gray-400 h-full rounded-full transition-all" style={{ width: `${emergencyPct}%` }}></div>
          </div>
          <div className="text-label-caps text-secondary mt-3 font-medium">{emergencyPct}% of assets</div>
        </div>
      </div>

      {/* TWO COLUMNS BOTTOM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Recent Activity */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
          <h2 className="text-headline-sm font-geist text-on-surface mb-2">Recent activity</h2>
          <div className="flex flex-col divide-y divide-[#E5E7EB] mt-2">
            {recentActivity.length > 0 ? recentActivity.map((tx) => {
              const date = new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
              const isIncoming = ['contribution', 'repayment', 'penalty', 'interest'].includes(tx.type);
              
              let desc = tx.type;
              if (tx.members?.full_name) desc += ` — ${tx.members.full_name}`;

              return (
                <div key={tx.id} className="flex items-center justify-between py-4 group hover:bg-gray-50 -mx-6 px-6 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isIncoming ? 'bg-[#22C55E]/10' : 'bg-red-50'}`}>
                      <span className={`material-symbols-outlined ${isIncoming ? 'text-[#22C55E]' : 'text-error'}`}>
                        {isIncoming ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                    </div>
                    <div>
                      <div className="text-body-sm text-on-surface font-medium group-hover:text-primary transition-colors capitalize">{desc}</div>
                      <div className="text-label-caps text-secondary mt-1">{date}</div>
                    </div>
                  </div>
                  <div className={`font-mono font-medium text-sm ${isIncoming ? 'text-[#22C55E]' : 'text-error'}`}>
                    {isIncoming ? '+' : '-'}KSh {formatCurrency(tx.amount)}
                  </div>
                </div>
              )
            }) : (
              <div className="py-6 text-center text-body-sm text-secondary">
                No recent activity.
              </div>
            )}
          </div>
        </div>

        {/* Right - Withdrawal Request */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm self-start">
          <h2 className="text-headline-sm font-geist text-on-surface">Request Withdrawal</h2>
          <p className="text-body-sm text-secondary mt-1 mb-6">Requires 2 of 3 admin approvals</p>

          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-label-caps text-secondary mb-2" htmlFor="amount">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-medium">KSh</span>
                <input 
                  type="number" 
                  id="amount"
                  name="amount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="0"
                  className="w-full border border-[#E5E7EB] rounded px-4 py-3 pl-14 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-label-caps text-secondary mb-2" htmlFor="reason">Reason</label>
              <select 
                id="reason"
                name="reason"
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                className="w-full border border-[#E5E7EB] rounded px-4 py-3 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all bg-white font-medium"
              >
                <option value="">Select a reason</option>
                <option value="payout">Member Payout</option>
                <option value="expense">Group Expense</option>
                <option value="investment">Investment</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div className="bg-surface-container-low border border-[#E5E7EB] rounded-lg p-4 flex items-start gap-3 mt-1 shadow-sm">
              <span className="material-symbols-outlined text-on-secondary-container mt-0.5">group</span>
              <span className="text-body-sm text-on-surface font-medium pt-0.5 leading-relaxed">2 admins must approve this withdrawal</span>
            </div>

            <button 
              onClick={handleWithdrawalRequest}
              disabled={!withdrawalAmount || !withdrawalReason}
              className="w-full bg-[#22C55E] hover:bg-[#006e2f] text-white rounded py-3 text-headline-sm font-medium transition-colors mt-2 disabled:opacity-50 shadow-sm"
            >
              Submit Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

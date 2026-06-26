'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { NewContributionModal } from "@/components/NewContributionModal";

export default function WalletPage() {
  const { member, group, isLoading: authLoading } = useAuth();
  
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
  const [consents, setConsents] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<any[]>([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  const fetchData = async () => {
    if (!member || !group) return;
    try {
      setLoading(true);
      setError("");

      // 1. Fetch wallet from wallets
      const { data: wData } = await supabase
        .from('wallets')
        .select('*')
        .eq('chama_id', member.chama_id)
        .maybeSingle();

      // 2. Fetch recent transactions
      const { data: txData } = await supabase
        .from('transactions_v2')
        .select(`*, chama_memberships(profiles(full_name))`)
        .eq('chama_id', member.chama_id)
        .order('created_at', { ascending: false });

      // 3. Fetch withdrawal consents
      const { data: consentsData } = await supabase
        .from('withdrawal_consents')
        .select('*, profiles(full_name)')
        .eq('chama_id', member.chama_id)
        .order('created_at', { ascending: false });

      // 4. Fetch user votes
      const { data: votesData } = await supabase
        .from('withdrawal_votes')
        .select('*')
        .eq('membership_id', member.id);

      setConsents(consentsData || []);
      setUserVotes(votesData || []);

      const today = new Date();
      let balance = wData?.balance || 0;
      let inThisMonth = 0;
      let outThisMonth = 0;
      
      const recent = txData?.slice(0, 5) || [];

      txData?.forEach(tx => {
        const amt = Number(tx.amount);
        const txDate = new Date(tx.created_at);
        const isThisMonth = txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
        
        const isIncoming = ['contribution', 'repayment', 'loan_repayment', 'penalty', 'interest', 'deposit'].includes(tx.type);

        if (isThisMonth) {
          if (isIncoming) {
            inThisMonth += amt;
          } else {
            outThisMonth += Math.abs(amt);
          }
        }
      });

      const activeLoansTotal = wData?.loans_disbursed || 0;
      const emergencyFund = wData?.emergency_reserve || 0;
      const savingsPool = wData?.savings_pool || 0;

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

  const castVote = async (consentId: string, voteType: 'approve' | 'reject') => {
    if (!member) return;
    try {
      const { error: voteErr } = await supabase
        .from('withdrawal_votes')
        .insert({
          consent_id: consentId,
          membership_id: member.id,
          vote: voteType
        });

      if (voteErr) {
        if (voteErr.code === '23505') {
          alert("You have already voted on this withdrawal request.");
        } else {
          throw voteErr;
        }
        return;
      }

      // Fetch all votes for this consent
      const { data: allVotes } = await supabase
        .from('withdrawal_votes')
        .select('vote')
        .eq('consent_id', consentId);

      const votesFor = allVotes?.filter(v => v.vote === 'approve').length || 0;
      const votesAgainst = allVotes?.filter(v => v.vote === 'reject').length || 0;

      // Get total eligible voters
      const { count: totalVoters } = await supabase
        .from('chama_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('chama_id', member.chama_id)
        .eq('status', 'active');

      const majority = Math.floor((totalVoters || 1) / 2) + 1;
      let newStatus = 'pending';
      if (votesFor >= majority) {
        newStatus = 'approved';
      } else if (votesAgainst >= majority) {
        newStatus = 'rejected';
      }

      await supabase
        .from('withdrawal_consents')
        .update({
          votes_for: votesFor,
          votes_against: votesAgainst,
          status: newStatus,
          total_eligible_voters: totalVoters
        })
        .eq('id', consentId);

      setToastMsg(`Vote recorded: ${voteType}!`);
      setTimeout(() => setToastMsg(""), 3000);
      fetchData();
    } catch (err: any) {
      alert("Error voting: " + err.message);
    }
  };

  const handleWithdrawalRequest = async () => {
    if (!member || !group) return;
    const amountVal = parseFloat(withdrawalAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (amountVal > walletStats.balance) {
      alert("Insufficient total recorded balance.");
      return;
    }

    const { error: insertErr } = await supabase
      .from('withdrawal_consents')
      .insert({
        chama_id: member.chama_id,
        requested_by: member.profile_id,
        amount: amountVal,
        reason: withdrawalReason,
        status: 'pending',
        votes_for: 0,
        votes_against: 0
      });

    if (insertErr) {
      alert("Failed to submit request: " + insertErr.message);
    } else {
      setWithdrawalAmount("");
      setWithdrawalReason("");
      setToastMsg("Withdrawal request submitted successfully!");
      setTimeout(() => setToastMsg(""), 3000);
      fetchData();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full text-[var(--text-main)]">
        <div className="bg-[#0B0F0C] rounded-2xl p-8 mb-6 h-64 animate-pulse shadow-sm"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1,2,3].map(i => <div key={i} className="card-bg border border-[var(--border)] rounded-2xl p-6 h-32 animate-pulse shadow-sm"></div>)}
        </div>
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

  const totalAssets = walletStats.balance + walletStats.activeLoansTotal;
  const savingsPct = totalAssets > 0 ? Math.round((walletStats.savingsPool / totalAssets) * 100) : 0;
  const loansPct = totalAssets > 0 ? Math.round((walletStats.activeLoansTotal / totalAssets) * 100) : 0;
  const emergencyPct = totalAssets > 0 ? Math.round((walletStats.emergencyFund / totalAssets) * 100) : 0;

  const chamaName = group?.name || 'Group';

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full relative font-inter text-[var(--text-main)]">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#22C55E] text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in animate-bounce">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="text-body-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Wallet</span>
        </p>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
              Wallet
            </h1>
            <p className="text-[14px] text-[var(--text-muted)] mt-1">
              {chamaName} — Manage group wallet funds, deposits and withdrawals.
            </p>
          </div>
        </div>
      </div>

      {/* LEDGER DISCLAIMER BANNER */}
      <div className="bg-[#EDF6EA] dark:bg-[#1a2a1a] border border-[#22C55E]/30 rounded-xl p-4 mb-6 flex gap-3 items-start shadow-sm">
        <span className="material-symbols-outlined text-[#006e2f] dark:text-[#4ae176] shrink-0 mt-0.5">info</span>
        <div>
          <h3 className="text-sm font-bold text-[#006e2f] dark:text-[#4ae176] mb-1">How SmartChama tracks money</h3>
          <p className="text-xs text-[#006e2f]/80 dark:text-[#4ae176]/80 leading-relaxed">
            SmartChama is a ledger app. We <strong>DO NOT</strong> hold money. The balances shown here are records of money you have saved in your group's bank account or mobile money paybill.
          </p>
        </div>
      </div>

      {/* HERO WALLET CARD */}
      <div className="w-full bg-[#0B0F0C] border border-[#163822] rounded-2xl p-4 md:p-8 mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 shadow-sm">
        {/* Left */}
        <div className="flex-1 w-full">
          <div className="text-[11px] font-bold tracking-wider text-gray-400">RECORDED CONTRIBUTIONS (TRACKED POOL)</div>
          <div className="text-[32px] md:text-[56px] font-geist font-bold text-white mt-2 leading-none">KSh {formatCurrency(walletStats.balance)}</div>
          <div className="text-body-sm text-gray-400 mt-3 flex items-center gap-1.5">
             <span className="material-symbols-outlined text-[16px]">security</span>
             SmartChama does not hold money. This is a record only.
          </div>
          
          <div className="flex flex-wrap gap-3 mt-8">
            <button 
              onClick={() => setShowDepositModal(true)}
              className="bg-[#22C55E] hover:bg-[#006e2f] transition-all text-white px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">payments</span>
              Deposit
            </button>
          </div>
        </div>

        {/* Right */}
        <div className="w-full lg:w-[340px] bg-white/5 border border-white/10 rounded-xl p-6 shrink-0">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#22C55E] text-[20px]">arrow_upward</span>
              <span className="text-body-sm text-white font-semibold">KSh {formatCurrency(walletStats.inThisMonth)} in this month</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gray-400 text-[20px]">arrow_downward</span>
              <span className="text-body-sm text-gray-400 font-semibold">KSh {formatCurrency(walletStats.outThisMonth)} out this month</span>
            </div>
          </div>
          <div className="border-t border-white/10 my-5"></div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#22C55E] text-[20px]">payments</span>
            <span className="text-body-sm text-[#22C55E] font-bold">M-Pesa Connected</span>
          </div>
        </div>
      </div>

      {/* WALLET BREAKDOWN */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
        <div className="card-bg border border-[var(--border)] rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">SAVINGS POOL</div>
          <div className="text-[18px] md:text-2xl font-bold text-[var(--text-main)] mb-1 font-geist">KSh {formatCurrency(walletStats.savingsPool)}</div>
          <div className="text-xs text-[var(--text-muted)] mb-5">Available to lend</div>
          <div className="bg-gray-100 dark:bg-[#1a2218] h-2 rounded-full w-full overflow-hidden">
            <div className="bg-[#22C55E] h-full rounded-full transition-all" style={{ width: `${savingsPct}%` }}></div>
          </div>
          <div className="text-[10px] font-bold text-[var(--brand-green)] mt-3 uppercase tracking-wider">{savingsPct}% of assets</div>
        </div>

        <div className="card-bg border border-[var(--border)] rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">ACTIVE LOANS</div>
          <div className="text-[18px] md:text-2xl font-bold text-[var(--text-main)] mb-1 font-geist">KSh {formatCurrency(walletStats.activeLoansTotal)}</div>
          <div className="text-xs text-[var(--text-muted)] mb-5">Currently disbursed</div>
          <div className="bg-gray-100 dark:bg-[#1a2218] h-2 rounded-full w-full overflow-hidden">
            <div className="bg-blue-400 h-full rounded-full transition-all" style={{ width: `${loansPct}%` }}></div>
          </div>
          <div className="text-[10px] font-bold text-blue-500 mt-3 uppercase tracking-wider">{loansPct}% of assets</div>
        </div>

        <div className="card-bg border border-[var(--border)] rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 last:col-span-2 md:last:col-span-1">
          <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">EMERGENCY FUND</div>
          <div className="text-[18px] md:text-2xl font-bold text-[var(--text-main)] mb-1 font-geist">KSh {formatCurrency(walletStats.emergencyFund)}</div>
          <div className="text-xs text-[var(--text-muted)] mb-5">Reserved fund</div>
          <div className="bg-gray-100 dark:bg-[#1a2218] h-2 rounded-full w-full overflow-hidden">
            <div className="bg-gray-400 dark:bg-[#2d3d2d] h-full rounded-full transition-all" style={{ width: `${emergencyPct}%` }}></div>
          </div>
          <div className="text-[10px] font-bold text-[var(--text-muted)] mt-3 uppercase tracking-wider">{emergencyPct}% of assets</div>
        </div>
      </div>

      {/* WITHDRAWAL CONSENT BOARD */}
      <div className="card-bg border border-[var(--border)] rounded-2xl p-6 mb-8 shadow-sm hover:shadow-md transition-all duration-200">
        <h2 className="text-xl font-bold font-geist text-[var(--text-main)] mb-2">Withdrawal Consent Board</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">Group approval required for all cash out transactions.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {consents.length === 0 ? (
            <div className="col-span-full p-6 text-center text-sm text-[var(--text-muted)] bg-gray-50 dark:bg-[#0f1410] border border-[var(--border)] rounded-xl">
              No active withdrawal requests awaiting consent.
            </div>
          ) : (
            consents.map((c) => {
              const hasVoted = userVotes.some(v => v.consent_id === c.id);
              const userVote = userVotes.find(v => v.consent_id === c.id)?.vote;
              const totalVoters = c.total_eligible_voters || 3;
              const threshold = Math.floor(totalVoters / 2) + 1;
              const progressPct = Math.min(100, Math.round((c.votes_for / threshold) * 100));

              return (
                <div key={c.id} className="border border-[var(--border)] rounded-xl p-5 flex flex-col justify-between card-bg">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs text-[var(--text-muted)] uppercase font-semibold">Requested By</span>
                        <p className="text-sm font-bold text-[var(--text-main)]">{c.profiles?.full_name || 'Admin / Member'}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold capitalize ${
                        c.status === 'pending' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-805 dark:text-amber-300' :
                        c.status === 'approved' ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300' :
                        c.status === 'executed' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300' :
                        'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <div className="mb-4">
                      <span className="text-xs text-[var(--text-muted)]">Amount</span>
                      <p className="text-xl font-bold font-mono text-[var(--text-main)]">KSh {c.amount.toLocaleString('en-KE')}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Reason: <span className="font-semibold text-[var(--text-main)]">{c.reason}</span></p>
                    </div>

                    <div className="mb-5">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-muted)]">Approvals: {c.votes_for} of {threshold} needed</span>
                        <span className="font-bold text-[var(--brand-green)]">{progressPct}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-[#1f2a1f] rounded-full overflow-hidden">
                        <div className="bg-[#22C55E] h-full rounded-full transition-all" style={{ width: `${progressPct}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {c.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        disabled={hasVoted}
                        onClick={() => castVote(c.id, 'reject')}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          hasVoted && userVote === 'reject' ? 'bg-red-50 dark:bg-red-950/20 text-red-500 border-red-200 dark:border-red-900/30' :
                          hasVoted ? 'opacity-40 cursor-not-allowed border-[var(--border)]' :
                          'bg-transparent hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 border-red-200 dark:border-red-900/30 active:scale-[0.98]'
                        }`}
                      >
                        Reject
                      </button>
                      <button
                        disabled={hasVoted}
                        onClick={() => castVote(c.id, 'approve')}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          hasVoted && userVote === 'approve' ? 'bg-green-50 dark:bg-green-950/20 text-green-550 border-green-200 dark:border-green-900/30' :
                          hasVoted ? 'opacity-40 cursor-not-allowed border-[var(--border)]' :
                          'bg-[#22C55E] hover:bg-[#006e2f] text-white border-transparent active:scale-[0.98]'
                        }`}
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* TWO COLUMNS BOTTOM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Recent Activity */}
        <div className="card-bg border border-[var(--border)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <h2 className="text-xl font-bold font-geist text-[var(--text-main)] mb-4">Recent activity</h2>
          <div className="flex flex-col divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
            {recentActivity.length > 0 ? recentActivity.map((tx) => {
              const date = new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
              const isIncoming = ['contribution', 'repayment', 'loan_repayment', 'penalty', 'interest', 'deposit'].includes(tx.type);
              
              let desc = tx.type.replace('_', ' ');
              if (tx.chama_memberships?.profiles?.full_name) desc += ` — ${tx.chama_memberships.profiles.full_name}`;

              return (
                <div key={tx.id} className="flex items-center justify-between py-4 hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isIncoming ? 'bg-transparent text-[var(--brand-green)]' : 'bg-red-50 dark:bg-red-950/20'}`}>
                      <span className={`material-symbols-outlined ${isIncoming ? 'text-[var(--brand-green)]' : 'text-red-500'}`}>
                        {isIncoming ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm text-[var(--text-main)] font-semibold capitalize">{desc}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">{date}</div>
                    </div>
                  </div>
                  <div className={`font-mono font-bold text-sm ${isIncoming ? 'text-[var(--brand-green)]' : 'text-red-500'}`}>
                    {isIncoming ? '+' : '-'} KSh {formatCurrency(tx.amount)}
                  </div>
                </div>
              );
            }) : (
              <div className="py-6 text-center text-sm text-[var(--text-muted)]">
                No recent activity.
              </div>
            )}
          </div>
        </div>

        {/* Right - Withdrawal Request */}
        <div className="card-bg border border-[var(--border)] rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 self-start">
          <h2 className="text-xl font-bold font-geist text-[var(--text-main)] mb-2">Request Withdrawal</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">Subject to group majority consent vote.</p>

          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2" htmlFor="amount">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-semibold">KSh</span>
                <input 
                  type="number" 
                  id="amount"
                  name="amount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="0"
                  className="w-full border border-[var(--border)] rounded-lg px-4 py-3 pl-14 text-[var(--text-main)] bg-transparent outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2" htmlFor="reason">Reason</label>
              <select 
                id="reason"
                name="reason"
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                className="w-full border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text-main)] bg-transparent outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-semibold"
              >
                <option value="">Select a reason</option>
                <option value="payout">Member Payout</option>
                <option value="expense">Group Expense</option>
                <option value="investment">Investment</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div className="bg-gray-50 dark:bg-[#1a2218] border border-[var(--border)] rounded-lg p-4 flex items-start gap-3 mt-1 shadow-sm">
              <span className="material-symbols-outlined text-[var(--text-muted)] mt-0.5">group</span>
              <span className="text-sm text-[var(--text-main)] font-semibold pt-0.5 leading-relaxed">Group majority must vote to approve this withdrawal</span>
            </div>

            <button 
              onClick={handleWithdrawalRequest}
              disabled={!withdrawalAmount || !withdrawalReason}
              className="w-full bg-[#22C55E] hover:bg-[#006e2f] text-white rounded-lg py-3 text-sm font-bold transition-all disabled:opacity-50 shadow-sm mt-2 cursor-pointer"
            >
              Submit Request
            </button>
          </div>
        </div>
      </div>

      {showDepositModal && (
        <NewContributionModal 
          chamaId={group.id} 
          chamaName={group.name} 
          defaultAmount={group.contribution_amount} 
          memberPhone={member.profiles?.phone_number || ''} 
          membershipId={member.id} 
          onClose={() => { setShowDepositModal(false); fetchData(); }} 
        />
      )}
    </div>
  );
}

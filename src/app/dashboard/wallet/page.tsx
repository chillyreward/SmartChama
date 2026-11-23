'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { toast } from '@/components/ui/Feedback';
import { Button, Chip, EmptyState, Field, Modal, Money, Notice, PageHeader, Panel, PanelTitle, Skeleton, Ticks, cn, formatKsh, inputClass, type ChipKind } from '@/components/ui';

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { NewContributionModal } from "@/components/NewContributionModal";
import CurrencyConverter from "@/components/CurrencyConverter";

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
    emergencyFund: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<any[]>([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);


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

      const emergencyFund = wData?.emergency_reserve || 0;
      const savingsPool = wData?.savings_pool || 0;

      setWalletStats({
        balance,
        inThisMonth,
        outThisMonth,
        savingsPool,
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
      // Vote and tally happen in one locked database call, so members can't
      // rewrite the vote counts or the request's status from the browser.
      const { data, error: voteErr } = await supabase.rpc('cast_withdrawal_vote', {
        p_consent_id: consentId,
        p_vote: voteType
      });

      if (voteErr || !data?.success) {
        if (data?.error === 'already_voted') {
          toast('You have already voted on this request.', 'info');
        } else {
          throw new Error(data?.error || voteErr?.message);
        }
        return;
      }


      setToastMsg(voteType === 'approve' ? 'Your yes vote is recorded.' : 'Your no vote is recorded.');
      setTimeout(() => setToastMsg(""), 3000);
      fetchData();
    } catch (err: any) {
      toast(`Your vote was not recorded. ${err.message}`, 'danger');
    }
  };

  const handleWithdrawalRequest = async () => {
    if (!member || !group) return;
    const amountVal = parseFloat(withdrawalAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast('Enter an amount.', 'danger');
      return;
    }

    if (amountVal > walletStats.balance) {
      toast('That is more than the group has recorded.', 'danger');
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
      toast(`Could not send the request. ${insertErr.message}`, 'danger');
    } else {
      setWithdrawalAmount("");
      setWithdrawalReason("");
      setToastMsg("Your request is open for the group to vote on.");
      setTimeout(() => setToastMsg(""), 3000);
      fetchData();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-60" />
        <Skeleton className="h-56 rounded-[28px]" />
        <div className="grid md:grid-cols-3 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      </div>
    );
  }

  if (error) {
    return <Notice tone="danger" title="The wallet didn't load">{error} <button onClick={fetchData} className="underline font-semibold ml-1">Try again</button></Notice>;
  }

  const CONSENT: Record<string, { kind: ChipKind; label: string }> = {
    pending: { kind: 'pending', label: 'Voting open' },
    approved: { kind: 'paid', label: 'Approved' },
    executed: { kind: 'info', label: 'Paid out' },
    rejected: { kind: 'failed', label: 'Turned down' },
  };
  const TXL: Record<string, string> = { contribution: 'Contribution', withdrawal: 'Withdrawal', deposit: 'Deposit', penalty: 'Penalty', interest: 'Interest', smartgrow_investment: 'SmartGrow investment', smartgrow_return: 'SmartGrow return', loan_disbursement: 'Payout', loan_repayment: 'Repayment' };
  const incoming = (t: string) => ['contribution', 'repayment', 'loan_repayment', 'penalty', 'interest', 'deposit', 'smartgrow_return'].includes(t);
  const open = consents.filter((c) => c.status === 'pending');
  const closed = consents.filter((c) => c.status !== 'pending');

  return (
    <div>
      <PageHeader
        title="Group wallet"
        subtitle={`The money ${group?.name || 'your group'} holds, and the votes that decide when any of it leaves.`}
        actions={
          <>
            <Button variant="outline" onClick={() => setShowWithdraw(true)}>Ask to withdraw</Button>
            <Button onClick={() => setShowDepositModal(true)}>Pay in</Button>
          </>
        }
      />

      {toastMsg && <Notice tone="ok" className="mb-4">{toastMsg}</Notice>}

      <Panel tone="forest" className="rounded-[28px] sm:p-8 mb-4">
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-8 items-end">
          <div>
            <div className="text-[14px] text-[#A9C2B3]">Recorded group balance</div>
            <Money value={walletStats.balance} className="block text-[48px] sm:text-[64px] leading-[1.02] mt-1" />
            <p className="text-[14px] text-[#A9C2B3] mt-3 max-w-[46ch]">
              Akibora keeps the record; the money itself sits in the group&apos;s own M-Pesa or bank account, held by your officials.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-[18px] bg-canopy p-4">
              <dt className="text-[13px] text-[#A9C2B3]">In this month</dt>
              <dd className="font-money text-[26px] text-mint mt-1">+{formatKsh(walletStats.inThisMonth)}</dd>
            </div>
            <div className="rounded-[18px] bg-canopy p-4">
              <dt className="text-[13px] text-[#A9C2B3]">Out this month</dt>
              <dd className="font-money text-[26px] mt-1">−{formatKsh(walletStats.outThisMonth)}</dd>
            </div>
            <div className="rounded-[18px] bg-canopy p-4">
              <dt className="text-[13px] text-[#A9C2B3]">Savings pool</dt>
              <dd className="font-money text-[22px] mt-1">{formatKsh(walletStats.savingsPool)}</dd>
            </div>
            <div className="rounded-[18px] bg-canopy p-4">
              <dt className="text-[13px] text-[#A9C2B3]">Emergency reserve</dt>
              <dd className="font-money text-[22px] mt-1">{formatKsh(walletStats.emergencyFund)}</dd>
            </div>
          </dl>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4 items-start">
        <Panel aria-labelledby="votes-h">
          <PanelTitle id="votes-h">Withdrawal votes</PanelTitle>
          <p className="text-[14px] text-ink-3 mt-1">Money only leaves the pot when most members agree.</p>
          {consents.length === 0 ? (
            <EmptyState title="No withdrawals requested">If anyone asks to take money out, you&apos;ll vote on it here.</EmptyState>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {[...open, ...closed].map((c) => {
                const hasVoted = userVotes.some((v) => v.consent_id === c.id);
                const userVote = userVotes.find((v) => v.consent_id === c.id)?.vote;
                const voters = Number(c.total_eligible_voters || 0);
                const st = CONSENT[c.status] || { kind: 'neutral' as ChipKind, label: c.status };
                return (
                  <li key={c.id} className={cn('rounded-[18px] p-4', c.status === 'pending' ? 'bg-surface-2 border border-line' : 'border border-line')}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Money value={Number(c.amount)} className="text-[26px]" />
                        <div className="text-[14px] text-ink-2 mt-0.5">{c.reason || 'No reason given'}</div>
                        <div className="text-[13px] text-ink-3 mt-0.5">Asked by {c.profiles?.full_name || 'a member'}</div>
                      </div>
                      <Chip kind={st.kind}>{st.label}</Chip>
                    </div>
                    {voters > 0 && (
                      <div className="mt-3">
                        <Ticks total={voters} done={Number(c.votes_for || 0)} />
                        <div className="text-[13px] text-ink-3 mt-1.5">{c.votes_for || 0} of {voters} members in favour</div>
                      </div>
                    )}
                    {c.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        {hasVoted ? (
                          <span className="text-[14px] text-ink-2">You voted {userVote === 'approve' ? 'yes' : 'no'}.</span>
                        ) : (
                          <>
                            <Button size="sm" onClick={() => castVote(c.id, 'approve')}>Vote yes</Button>
                            <Button size="sm" variant="outline" onClick={() => castVote(c.id, 'reject')}>Vote no</Button>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel aria-labelledby="recent-h">
            <PanelTitle id="recent-h">Latest movements</PanelTitle>
            {recentActivity.length === 0 ? (
              <EmptyState title="Nothing yet">Contributions and payouts will appear here.</EmptyState>
            ) : (
              <ul className="mt-2">
                {recentActivity.map((tx) => {
                  const inn = incoming(tx.type);
                  return (
                    <li key={tx.id} className="flex items-center gap-3 py-3 border-t border-line first:border-t-0">
                      <span className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', inn ? 'bg-mint text-forest' : 'bg-raised text-ink-2')}>
                        {inn ? <ArrowDownLeft size={16} aria-hidden="true" /> : <ArrowUpRight size={16} aria-hidden="true" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] truncate">{TXL[tx.type] || tx.type}</span>
                        <span className="block text-[12px] text-ink-3">{tx.chama_memberships?.profiles?.full_name || 'Group'} · {new Date(tx.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
                      </span>
                      <span className={cn('font-money text-[17px] whitespace-nowrap', inn && 'text-brand')}>{inn ? '+' : '−'}{formatKsh(Math.abs(Number(tx.amount)))}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
          <CurrencyConverter amountKES={walletStats.balance} />
        </div>
      </div>

      <Modal
        open={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        title="Ask to take money out"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowWithdraw(false)}>Cancel</Button>
            <Button onClick={async () => { await handleWithdrawalRequest(); setShowWithdraw(false); }} disabled={!withdrawalAmount || !withdrawalReason}>Start the vote</Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <Notice tone="info">Every member votes. The money is only released when most of the group says yes.</Notice>
          <Field label="Amount" hint={`The group has ${formatKsh(walletStats.balance)} recorded.`}>
            <input type="number" inputMode="numeric" min={1} value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} className={inputClass} />
          </Field>
          <Field label="What is it for?">
            <select value={withdrawalReason} onChange={(e) => setWithdrawalReason(e.target.value)} className={inputClass}>
              <option value="">Choose a reason</option>
              <option value="Member payout">Paying a member</option>
              <option value="Group expense">A group expense</option>
              <option value="Investment">An investment</option>
              <option value="Emergency">An emergency</option>
            </select>
          </Field>
        </div>
      </Modal>

      {showDepositModal && group && member && (
        <NewContributionModal
          onClose={() => { setShowDepositModal(false); fetchData(); }}
          defaultAmount={group.contribution_amount || 500}
          memberPhone={(member as any)?.profiles?.phone_number || ''}
          membershipId={member.id}
          chamaId={group.id}
          chamaName={group.name}
        />
      )}
    </div>
  );
}

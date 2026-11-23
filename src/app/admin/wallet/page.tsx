"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { Button, Chip, EmptyState, Field, Modal, Money, Notice, PageHeader, Panel, PanelTitle, Skeleton, Ticks, cn, formatKsh, inputClass, textareaClass, type ChipKind } from "@/components/ui";

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


  const fetchData = async () => {
    if (!adminMember || !group) return;
    try {
      setLoading(true);

      const { data: wData } = await supabase.from('wallets').select('*').eq('chama_id', group.id).maybeSingle();
      setWallet(wData);

      const { data: wReqs } = await supabase
        .from('withdrawal_consents')
        .select('*, profiles(full_name)')
        .eq('chama_id', group.id)
        .order('created_at', { ascending: false });
      setWithdrawals(wReqs || []);

      const { data: txs } = await supabase
        .from('transactions_v2')
        .select('*, chama_memberships(profiles(full_name))')
        .eq('chama_id', group.id)
        .in('type', ['deposit', 'withdrawal', 'loan_disbursement', 'repayment', 'loan_repayment', 'contribution', 'penalty', 'interest'])
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
      // Balance, transaction, ledger and audit log update together in the database
      const { data, error } = await supabase.rpc('record_manual_deposit', {
        p_chama_id: group?.id,
        p_amount: Number(depAmount),
        p_reference: depRef || null,
        p_notes: depNotes || null
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message);

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
      
      const { data: consentData, error: consentErr } = await supabase
        .from('withdrawal_consents')
        .insert({
          chama_id: group?.id,
          requested_by: adminMember?.profile_id,
          amount: amt,
          reason: withReason,
          status: 'pending',
          votes_for: 0,
          votes_against: 0
        })
        .select()
        .single();

      if (consentErr) throw consentErr;

      // Insert notification for members
      const { data: memberships } = await supabase
        .from('chama_memberships')
        .select('profile_id')
        .eq('chama_id', group?.id);

      if (memberships) {
        const notifs = memberships.map(m => ({
          chama_id: group?.id,
          profile_id: m.profile_id,
          type: 'withdrawal_consent_request',
          title: 'Withdrawal vote',
          message: `A new withdrawal consent request of KSh ${amt.toLocaleString()} has been initiated. Click to vote.`,
          read: false
        }));
        await supabase.from('notifications').insert(notifs);
      }

      setToastMsg("Withdrawal request submitted for vote");
      setTimeout(() => setToastMsg(""), 3000);
      setShowWithdrawModal(false);
      setWithAmount(""); setWithReason("");
      fetchData();
    } catch (err: any) {
      alert("Error requesting withdrawal: " + err.message);
    }
  };

  const handleExecuteWithdrawal = async (req: any) => {
    if (wallet.balance < req.amount) {
      alert("Insufficient funds to execute this withdrawal");
      return;
    }
    if (confirm(`Release ${formatKsh(req.amount)}? Only do this once you are sending the money from the group account.`)) {
      try {
        // Checks member approval and balance, then pays out under a wallet lock
        const { data, error } = await supabase.rpc('execute_withdrawal', { p_consent_id: req.id });
        if (error || !data?.success) throw new Error(data?.error || error?.message);

        setToastMsg("Released and recorded.");
        setTimeout(() => setToastMsg(""), 3000);
        fetchData();
      } catch (err: any) {
        alert("Error executing withdrawal: " + err.message);
      }
    }
  };

  const handleCancelConsent = async (req: any) => {
    if (confirm("Cancel this consent request?")) {
      try {
        await supabase
          .from('withdrawal_consents')
          .update({ status: 'rejected' })
          .eq('id', req.id);
        setToastMsg("Request cancelled.");
        setTimeout(() => setToastMsg(""), 3000);
        fetchData();
      } catch (err) {
        alert("Error cancelling request");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-60" />
        <Skeleton className="h-56 rounded-[28px]" />
        <div className="grid lg:grid-cols-2 gap-4"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>
      </div>
    );
  }

  const CONSENT: Record<string, { kind: ChipKind; label: string }> = {
    pending: { kind: 'pending', label: 'Voting open' },
    approved: { kind: 'paid', label: 'Approved, ready to pay' },
    executed: { kind: 'info', label: 'Paid out' },
    rejected: { kind: 'failed', label: 'Turned down' },
  };
  const TXL: Record<string, string> = { contribution: 'Contribution', withdrawal: 'Withdrawal', deposit: 'Deposit', penalty: 'Penalty', interest: 'Interest', loan_disbursement: 'Payout', loan_repayment: 'Repayment', repayment: 'Repayment' };
  const incoming = (t: string) => ['contribution', 'repayment', 'loan_repayment', 'penalty', 'interest', 'deposit'].includes(t);
  const balance = Number(wallet?.balance || 0);

  return (
    <div>
      <PageHeader
        title="Wallet and withdrawals"
        subtitle="The group's recorded balance. Money leaves only after members vote yes, and you then release it here."
        actions={
          <>
            <Button variant="outline" onClick={() => setShowDepositModal(true)}><Plus size={18} aria-hidden="true" />Record a deposit</Button>
            <Button onClick={() => setShowWithdrawModal(true)}>Start a withdrawal vote</Button>
          </>
        }
      />

      {toastMsg && <Notice tone="ok" className="mb-4">{toastMsg}</Notice>}

      <Panel tone="forest" className="rounded-[28px] sm:p-8 mb-4">
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-8 items-end">
          <div>
            <div className="text-[14px] text-[#A9C2B3]">Recorded balance</div>
            <Money value={balance} className="block text-[48px] sm:text-[64px] leading-[1.02] mt-1" />
            <p className="text-[14px] text-[#A9C2B3] mt-3 max-w-[48ch]">This should match the group&apos;s M-Pesa or bank account. If it doesn&apos;t, record the missing deposit or withdrawal.</p>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            {[
              ['Savings pool', wallet?.savings_pool],
              ['Emergency reserve', wallet?.emergency_reserve],
              ['Invested', wallet?.invested],
              ['Paid out', wallet?.loans_disbursed],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-[18px] bg-canopy p-4">
                <dt className="text-[13px] text-[#A9C2B3]">{k}</dt>
                <dd className="font-money text-[22px] mt-1">{formatKsh(Number(v || 0))}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4 items-start">
        <Panel>
          <PanelTitle>Withdrawal requests</PanelTitle>
          {withdrawals.length === 0 ? (
            <EmptyState title="No requests">Start a vote when the group needs to take money out.</EmptyState>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {withdrawals.map((req) => {
                const st = CONSENT[req.status] || { kind: 'neutral' as ChipKind, label: req.status };
                const voters = Number(req.total_eligible_voters || 0);
                return (
                  <li key={req.id} className="rounded-[18px] border border-line p-4">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div>
                        <Money value={Number(req.amount)} className="text-[26px]" />
                        <div className="text-[14px] text-ink-2">{req.reason || 'No reason given'}</div>
                        <div className="text-[13px] text-ink-3">Asked by {req.profiles?.full_name || 'an official'} · {new Date(req.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</div>
                      </div>
                      <Chip kind={st.kind}>{st.label}</Chip>
                    </div>
                    {voters > 0 && (
                      <div className="mt-3">
                        <Ticks total={voters} done={Number(req.votes_for || 0)} />
                        <div className="text-[13px] text-ink-3 mt-1.5">{req.votes_for || 0} yes, {req.votes_against || 0} no, of {voters} members</div>
                      </div>
                    )}
                    {(req.status === 'approved' || req.status === 'pending') && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {req.status === 'approved' && <Button size="sm" variant="forest" onClick={() => handleExecuteWithdrawal(req)} disabled={balance < Number(req.amount)}>Release the money</Button>}
                        <Button size="sm" variant="ghost" onClick={() => handleCancelConsent(req)}>Cancel request</Button>
                        {req.status === 'approved' && balance < Number(req.amount) && <span className="text-[13px] text-amber-ink self-center">More than the recorded balance</span>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelTitle>Latest movements</PanelTitle>
          {walletLog.length === 0 ? (
            <EmptyState title="Nothing yet" />
          ) : (
            <ul className="mt-2">
              {walletLog.map((tx) => {
                const inn = incoming(tx.type);
                return (
                  <li key={tx.id} className="flex items-center gap-3 py-3 border-t border-line first:border-t-0">
                    <span className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', inn ? 'bg-mint text-forest' : 'bg-raised text-ink-2')}>
                      {inn ? <ArrowDownLeft size={16} aria-hidden="true" /> : <ArrowUpRight size={16} aria-hidden="true" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] truncate">{tx.description || TXL[tx.type] || tx.type}</span>
                      <span className="block text-[12px] text-ink-3">{tx.chama_memberships?.profiles?.full_name || 'Group'} · {new Date(tx.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
                    </span>
                    <span className={cn('font-money text-[17px] whitespace-nowrap', inn && 'text-brand')}>{inn ? '+' : '−'}{formatKsh(Math.abs(Number(tx.amount)))}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Modal
        open={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        title="Record a deposit"
        footer={<><Button variant="ghost" onClick={() => setShowDepositModal(false)}>Cancel</Button><Button onClick={handleDeposit} disabled={!(Number(depAmount) > 0)}>Record deposit</Button></>}
      >
        <div className="flex flex-col gap-5">
          <p className="text-[14px] text-ink-2">For money that reached the group account outside a member&apos;s contribution, like interest or a refund. Your name is saved on it.</p>
          <Field label="Amount"><input type="number" inputMode="numeric" min={1} value={depAmount} onChange={(e) => setDepAmount(e.target.value)} className={inputClass} /></Field>
          <Field label="How it came in">
            <select value={depMethod} onChange={(e) => setDepMethod(e.target.value)} className={inputClass}>
              <option>Bank Transfer</option>
              <option>M-Pesa</option>
              <option>Cash</option>
            </select>
          </Field>
          <Field label="Reference" hint="Optional"><input value={depRef} onChange={(e) => setDepRef(e.target.value)} className={inputClass} /></Field>
          <Field label="Note" hint="Optional"><textarea rows={2} value={depNotes} onChange={(e) => setDepNotes(e.target.value)} className={textareaClass} /></Field>
        </div>
      </Modal>

      <Modal
        open={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Start a withdrawal vote"
        footer={<><Button variant="ghost" onClick={() => setShowWithdrawModal(false)}>Cancel</Button><Button onClick={handleWithdrawalRequest} disabled={!(Number(withAmount) > 0) || !withReason.trim()}>Ask members to vote</Button></>}
      >
        <div className="flex flex-col gap-5">
          <Notice tone="info">Every active member is notified and votes. Once most say yes, you can release the money here.</Notice>
          <Field label="Amount" hint={`Recorded balance: ${formatKsh(balance)}`}><input type="number" inputMode="numeric" min={1} value={withAmount} onChange={(e) => setWithAmount(e.target.value)} className={inputClass} /></Field>
          <Field label="What it's for" hint="Members see this when they vote."><textarea rows={3} value={withReason} onChange={(e) => setWithReason(e.target.value)} className={textareaClass} /></Field>
        </div>
      </Modal>
    </div>
  );
}

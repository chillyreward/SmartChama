'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped API rows */

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { HeartHandshake } from 'lucide-react';
import { Button, Chip, EmptyState, Field, Modal, Money, Notice, PageHeader, Panel, PanelTitle, Skeleton, Stat, formatKsh, inputClass, textareaClass, type ChipKind } from '@/components/ui';

export default function MemberWelfarePage() {
  const { member, group } = useAuth();
  const chamaId = group?.id;
  const memberId = member?.id;

  const [loading, setLoading] = useState(true);
  const [fund, setFund] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Form
  const [category, setCategory] = useState('bereavement');
  const [amount, setAmount] = useState('5000');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

  const fetchWelfare = async () => {
    if (!chamaId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/welfare/status?chama_id=${chamaId}`);
      const data = await res.json();
      if (data.success) {
        setFund(data.fund);
        setClaims(data.claims.filter((c: any) => c.membership_id === memberId));
      }
    } catch (err) {
      console.error('Error fetching welfare:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chamaId) fetchWelfare();
  }, [chamaId]);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chamaId || !memberId || !amount) return;
    setSubmitting(true);
    setMsg({ error: '', success: '' });

    try {
      const res = await fetch('/api/welfare/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chama_id: chamaId,
          membership_id: memberId,
          amount: Number(amount),
          reason: category,
          description
        })
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ error: '', success: 'Your request has gone to the officials. You\'ll be notified when they decide.' });
        setShowClaimModal(false);
        setDescription('');
        fetchWelfare();
      } else {
        setMsg({ error: data.error || 'Failed to submit claim.', success: '' });
      }
    } catch (err) {
      setMsg({ error: 'Network error. Please try again.', success: '' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-44 rounded-[28px]" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const REASONS: Record<string, string> = {
    bereavement: 'Bereavement',
    medical: 'Medical or hospital',
    wedding: 'Wedding',
    education: 'School fees',
    other: 'Another emergency',
  };
  const CLAIM: Record<string, { kind: ChipKind; label: string }> = {
    pending: { kind: 'pending', label: 'Waiting for officials' },
    approved: { kind: 'info', label: 'Approved' },
    paid: { kind: 'paid', label: 'Paid out' },
    rejected: { kind: 'failed', label: 'Declined' },
  };

  return (
    <div>
      <PageHeader
        title="Welfare fund"
        subtitle="Money the group keeps aside for hard days: a funeral, a hospital bill, school fees. Ask for help here and your officials decide together."
        actions={<Button onClick={() => setShowClaimModal(true)}><HeartHandshake size={18} aria-hidden="true" />Ask for help</Button>}
      />

      {msg.error && <Notice tone="danger" className="mb-4">{msg.error}</Notice>}
      {msg.success && <Notice tone="ok" className="mb-4">{msg.success}</Notice>}

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr] mb-4">
        <Panel tone="lavender" className="rounded-[28px] sm:p-7">
          <div className="text-[14px] text-[#3A3060]">In the welfare fund</div>
          <Money value={Number(fund?.balance || 0)} className="block text-[44px] sm:text-[52px] leading-[1.05] mt-1" />
          <p className="text-[14px] text-[#3A3060] mt-2">Shared by every member of {group?.name || 'the group'}.</p>
        </Panel>
        <Stat label="Each member adds" value={formatKsh(fund?.monthly_contribution || 0)} hint="every month" />
        <Stat label="Most you can ask for" value={formatKsh(fund?.max_claim_amount || 0)} hint="in one request" />
      </div>

      <Panel aria-labelledby="claims-h">
        <PanelTitle id="claims-h">Your requests</PanelTitle>
        {claims.length === 0 ? (
          <EmptyState title="You haven't asked for help yet" action={<Button variant="outline" onClick={() => setShowClaimModal(true)}>Ask for help</Button>}>
            If something happens, request support here. Your officials see it straight away.
          </EmptyState>
        ) : (
          <ul className="mt-3">
            {claims.map((c) => {
              const st = CLAIM[c.status] || { kind: 'neutral' as ChipKind, label: c.status };
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 py-4 border-t border-line first:border-t-0">
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-[16px] font-medium">{REASONS[c.reason] || c.reason}</div>
                    <div className="text-[14px] text-ink-3 mt-0.5">{c.description || 'No details added'}</div>
                  </div>
                  <Money value={Number(c.amount)} className="text-[20px]" />
                  <Chip kind={st.kind}>{st.label}</Chip>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Modal
        open={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        title="Ask the welfare fund for help"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowClaimModal(false)}>Cancel</Button>
            <Button type="submit" form="claim-form" disabled={submitting}>{submitting ? 'Sending…' : 'Send request'}</Button>
          </>
        }
      >
        <form id="claim-form" onSubmit={handleSubmitClaim} className="flex flex-col gap-5">
          <Field label="What is it for?">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {Object.entries(REASONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="How much do you need?" hint={`Up to ${formatKsh(fund?.max_claim_amount || 50000)}.`}>
            <input type="number" inputMode="numeric" required min="500" max={fund?.max_claim_amount || 50000} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Tell your officials what happened" hint="A sentence or two is enough.">
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={textareaClass} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}

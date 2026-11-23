'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped API rows */

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Chip, EmptyState, Money, Notice, PageHeader, Panel, PanelTitle, Skeleton, formatKsh, type ChipKind } from '@/components/ui';

export default function MemberPenaltiesPage() {
  const { member, group } = useAuth();
  const chamaId = group?.id;
  const memberId = member?.id;

  const [loading, setLoading] = useState(true);
  const [penalties, setPenalties] = useState<any[]>([]);
  const [msg, setMsg] = useState({ error: '', success: '' });

  const fetchPenalties = async () => {
    if (!chamaId || !memberId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/penalties/list?chama_id=${chamaId}&membership_id=${memberId}`);
      const data = await res.json();
      if (data.success) {
        setPenalties(data.penalties);
      }
    } catch (err) {
      console.error('Error fetching penalties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chamaId && memberId) fetchPenalties();
  }, [chamaId, memberId]);

  const handlePay = async (penaltyId: string) => {
    setMsg({ error: '', success: '' });
    try {
      const res = await fetch('/api/penalties/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ penalty_id: penaltyId, action: 'pay' })
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ error: '', success: 'Fine paid. It\'s cleared from your record.' });
        fetchPenalties();
      } else {
        setMsg({ error: data.error || 'Failed to settle fine.', success: '' });
      }
    } catch (err) {
      setMsg({ error: 'Error processing fine payment.', success: '' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-64" />
        <div className="grid md:grid-cols-2 gap-4"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const unpaid = penalties.filter((p) => p.status === 'unpaid');
  const unpaidTotal = unpaid.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const TYPE: Record<string, string> = { late_contribution: 'Late contribution', missed_meeting: 'Missed meeting', loan_default: 'Missed repayment', custom: 'Fine' };
  const ST: Record<string, { kind: ChipKind; label: string }> = { unpaid: { kind: 'late', label: 'Unpaid' }, paid: { kind: 'paid', label: 'Paid' }, waived: { kind: 'neutral', label: 'Waived' } };

  return (
    <div>
      <PageHeader title="Penalties" subtitle="Fines your group's rules apply, for example after a contribution is late. You can see the reason for each one." />

      {msg.error && <Notice tone="danger" className="mb-4">{msg.error}</Notice>}
      {msg.success && <Notice tone="ok" className="mb-4">{msg.success}</Notice>}

      <div className="grid gap-4 md:grid-cols-2 mb-4">
        {unpaid.length > 0 ? (
          <Panel className="bg-amber-soft border-transparent text-amber-ink rounded-[28px]">
            <div className="text-[14px]">You owe</div>
            <Money value={unpaidTotal} className="block text-[46px] leading-[1.05] mt-1" />
            <p className="text-[14px] mt-1">across {unpaid.length} {unpaid.length === 1 ? 'fine' : 'fines'}</p>
          </Panel>
        ) : (
          <Panel tone="sage" className="rounded-[28px]">
            <div className="text-[14px] text-[#2B4637]">You owe</div>
            <div className="font-display text-[40px] leading-[1.05] mt-1">Nothing</div>
            <p className="text-[14px] text-[#2B4637] mt-1">A clean record. Keep paying on time.</p>
          </Panel>
        )}
        <Panel>
          <div className="text-[14px] text-ink-2">How fines work in {group?.name || 'your group'}</div>
          <p className="text-[15px] mt-2 leading-relaxed">
            {group?.late_penalty_amount
              ? <>A late contribution adds <strong>{formatKsh(group.late_penalty_amount)}</strong> once the grace period of {group?.grace_period_days ?? 0} days has passed.</>
              : <>Your officials set fines in the group rules. Ask them if something looks wrong.</>}
          </p>
        </Panel>
      </div>

      <Panel aria-labelledby="fines-h">
        <PanelTitle id="fines-h">All fines</PanelTitle>
        {penalties.length === 0 ? (
          <EmptyState title="No fines, ever">Nothing has been charged to you in this group.</EmptyState>
        ) : (
          <ul className="mt-3">
            {penalties.map((p) => {
              const st = ST[p.status] || { kind: 'neutral' as ChipKind, label: p.status };
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-4 border-t border-line first:border-t-0">
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-[16px] font-medium">{TYPE[p.type] || String(p.type || 'Fine').replace('_', ' ')}</div>
                    <div className="text-[14px] text-ink-3 mt-0.5">
                      {p.reason || 'No reason recorded'}
                      {p.created_at && ` · ${new Date(p.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </div>
                  </div>
                  <Money value={Number(p.amount)} className="text-[20px]" />
                  <Chip kind={st.kind}>{st.label}</Chip>
                  {p.status === 'unpaid' && <Button size="sm" onClick={() => handlePay(p.id)}>Pay {formatKsh(p.amount)}</Button>}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

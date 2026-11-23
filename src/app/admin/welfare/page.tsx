'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped API rows */

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, Button, Chip, EmptyState, Money, Notice, PageHeader, Panel, PanelTitle, Stat, cn, formatKsh, type ChipKind } from '@/components/ui';
import PageSkeleton from '@/components/PageSkeleton';

export default function AdminWelfarePage() {
  const { group } = useAuth();
  const chamaId = group?.id;

  const [loading, setLoading] = useState(true);
  const [fund, setFund] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [msg, setMsg] = useState({ error: '', success: '' });

  const fetchWelfareStatus = async () => {
    if (!chamaId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/welfare/status?chama_id=${chamaId}`);
      const data = await res.json();
      if (data.success) {
        setFund(data.fund);
        setClaims(data.claims);
      }
    } catch (err) {
      console.error('Error fetching welfare status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chamaId) fetchWelfareStatus();
  }, [chamaId]);

  const handleAction = async (claimId: string, action: 'approve' | 'reject' | 'paid') => {
    setMsg({ error: '', success: '' });
    try {
      const res = await fetch('/api/welfare/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_id: claimId, action })
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ error: '', success: data.claim.status === 'paid' ? 'Marked as paid.' : data.claim.status === 'approved' ? 'Approved. Mark it paid once the money is sent.' : 'Request declined.' });
        fetchWelfareStatus();
      } else {
        setMsg({ error: data.error || 'Failed to update claim.', success: '' });
      }
    } catch (err) {
      setMsg({ error: 'Error updating welfare claim.', success: '' });
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const REASONS: Record<string, string> = { bereavement: 'Bereavement', medical: 'Medical or hospital', wedding: 'Wedding', education: 'School fees', other: 'Another emergency' };
  const ST: Record<string, { kind: ChipKind; label: string }> = {
    pending: { kind: 'pending', label: 'Waiting for a decision' },
    approved: { kind: 'info', label: 'Approved, not yet paid' },
    paid: { kind: 'paid', label: 'Paid out' },
    rejected: { kind: 'failed', label: 'Declined' },
  };
  const order = ['pending', 'approved', 'paid', 'rejected'];
  const sorted = [...claims].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  const pendingClaims = claims.filter((c) => c.status === 'pending');
  const paidTotal = claims.filter((c) => c.status === 'paid').reduce((s, c) => s + Number(c.amount || 0), 0);

  return (
    <div>
      <PageHeader title="Welfare fund" subtitle="Requests for help from members. Approve, decline, and mark as paid once the money has gone out." />
      {msg.error && <Notice tone="danger" className="mb-4">{msg.error}</Notice>}
      {msg.success && <Notice tone="ok" className="mb-4">{msg.success}</Notice>}

      <div className="grid gap-4 md:grid-cols-4 mb-4">
        <Stat tone="lavender" label="In the fund" value={formatKsh(fund?.balance || 0)} className="md:col-span-1" />
        <Stat label="Waiting for you" value={String(pendingClaims.length)} money={false} hint={pendingClaims.length === 1 ? 'request' : 'requests'} />
        <Stat label="Paid out so far" value={formatKsh(paidTotal)} />
        <Stat label="Limit per request" value={formatKsh(fund?.max_claim_amount || 0)} hint={`members add ${formatKsh(fund?.monthly_contribution || 0)} a month`} />
      </div>

      <Panel>
        <PanelTitle>Requests</PanelTitle>
        {sorted.length === 0 ? (
          <EmptyState title="No requests yet">When a member asks the fund for help, it appears here for officials to decide.</EmptyState>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {sorted.map((c) => {
              const st = ST[c.status] || { kind: 'neutral' as ChipKind, label: c.status };
              const name = c.chama_memberships?.profiles?.full_name || 'A member';
              return (
                <li key={c.id} className={cn('rounded-[18px] p-4 sm:p-5 border', c.status === 'pending' ? 'bg-surface-2 border-line-strong/40' : 'border-line')}>
                  <div className="flex flex-wrap items-start gap-4">
                    <Avatar name={name} size={40} tone="lavender" />
                    <div className="flex-1 min-w-[200px]">
                      <div className="text-[16px] font-semibold">{name}</div>
                      <div className="text-[14px] text-ink-2">{REASONS[c.reason] || c.reason}</div>
                      {c.description && <p className="text-[14px] text-ink-3 mt-1 max-w-[60ch]">&ldquo;{c.description}&rdquo;</p>}
                    </div>
                    <div className="text-right">
                      <Money value={Number(c.amount)} className="text-[24px]" />
                      <div className="mt-1"><Chip kind={st.kind}>{st.label}</Chip></div>
                    </div>
                  </div>
                  {(c.status === 'pending' || c.status === 'approved') && (
                    <div className="flex flex-wrap gap-2 mt-4 sm:pl-14">
                      {c.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => handleAction(c.id, 'approve')} disabled={Number(c.amount) > Number(fund?.balance || 0)}>Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => handleAction(c.id, 'reject')}>Decline</Button>
                          {Number(c.amount) > Number(fund?.balance || 0) && <span className="text-[13px] text-amber-ink self-center">More than the fund holds</span>}
                        </>
                      )}
                      {c.status === 'approved' && (
                        <Button size="sm" variant="forest" onClick={() => { if (confirm(`Mark ${formatKsh(c.amount)} as paid to ${name}? Do this once the money has been sent.`)) handleAction(c.id, 'paid'); }}>Mark as paid</Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

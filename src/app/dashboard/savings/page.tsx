'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { exportToPDF } from '@/lib/export';
import { Button, Chip, EmptyState, Money, PageHeader, Panel, PanelTitle, Skeleton, Stat, TableWrap, cn, formatKsh, tableClass, type ChipKind } from '@/components/ui';

type C = { id: string; amount: number; status: string; created_at: string; payment_method: string | null; mpesa_receipt: string | null; reference: string | null };

const ST: Record<string, { kind: ChipKind; label: string }> = {
  confirmed: { kind: 'paid', label: 'Confirmed' },
  pending: { kind: 'pending', label: 'Waiting' },
  failed: { kind: 'failed', label: 'Failed' },
  late: { kind: 'late', label: 'Late' },
  partial: { kind: 'info', label: 'Part paid' },
};

export default function SavingsPage() {
  const { member, group } = useAuth();
  const [rows, setRows] = useState<C[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!member?.id) return;
    supabase
      .from('contributions_v2')
      .select('id, amount, status, created_at, payment_method, mpesa_receipt, reference')
      .eq('membership_id', member.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setRows((data as C[]) || []));
  }, [member?.id]);

  const s = useMemo(() => {
    const list = rows || [];
    const confirmed = list.filter((c) => c.status === 'confirmed');
    const total = confirmed.reduce((a, c) => a + Number(c.amount), 0);
    const pending = list.filter((c) => c.status === 'pending').reduce((a, c) => a + Number(c.amount), 0);
    const byMonth = new Map<string, number>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      byMonth.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
    }
    confirmed.forEach((c) => {
      const d = new Date(c.created_at);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (byMonth.has(k)) byMonth.set(k, (byMonth.get(k) || 0) + Number(c.amount));
    });
    const chart = [...byMonth.entries()].map(([k, v]) => {
      const [y, m] = k.split('-').map(Number);
      return { label: new Date(y, m, 1).toLocaleDateString('en-KE', { month: 'short' }), amount: v };
    });
    const activeMonths = chart.filter((c) => c.amount > 0).length;
    return { total, pending, count: confirmed.length, chart, avg: activeMonths ? chart.reduce((a, c) => a + c.amount, 0) / activeMonths : 0 };
  }, [rows]);

  const download = async () => {
    if (!rows) return;
    setBusy(true);
    try {
      await exportToPDF(
        `Savings statement: ${member?.full_name || 'Member'}`,
        group?.name || '',
        ['Date', 'Amount (KSh)', 'Paid by', 'Receipt', 'Status'],
        rows.map((c) => [
          new Date(c.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }),
          Number(c.amount).toLocaleString('en-KE'),
          c.payment_method === 'cash' ? 'Cash' : c.payment_method === 'bank' ? 'Bank' : 'M-Pesa',
          c.mpesa_receipt || c.reference || '',
          ST[c.status]?.label || c.status,
        ]),
        'akibora_savings_statement',
      );
    } finally {
      setBusy(false);
    }
  };

  if (!rows) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-60" />
        <div className="grid md:grid-cols-3 gap-4"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Your savings"
        subtitle={`Everything you have put into ${group?.name || 'the group'}, confirmed payment by payment.`}
        actions={<Button variant="outline" onClick={download} disabled={busy || rows.length === 0}><Download size={18} aria-hidden="true" />{busy ? 'Preparing…' : 'Download statement'}</Button>}
      />

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr] mb-4">
        <Panel tone="forest" className="rounded-[28px] sm:p-7">
          <div className="text-[14px] text-[#A9C2B3]">Confirmed savings</div>
          <Money value={s.total} className="block text-[46px] sm:text-[56px] leading-[1.05] mt-1" />
          <div className="text-[14px] text-[#A9C2B3] mt-1">from {s.count} {s.count === 1 ? 'payment' : 'payments'}</div>
        </Panel>
        <Stat label="Usual month" value={formatKsh(s.avg)} hint="average over months you paid this year" />
        <Stat label="Waiting for M-Pesa" value={formatKsh(s.pending)} hint={s.pending ? 'shows as confirmed once Safaricom replies' : 'nothing outstanding'} />
      </div>

      <Panel aria-labelledby="yr-h" className="mb-4">
        <PanelTitle id="yr-h">The last twelve months</PanelTitle>
        <div className="h-[220px] mt-4 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={s.chart} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ak-text-3)' }} />
              <Tooltip cursor={{ fill: 'var(--ak-raised)' }} formatter={(v) => [formatKsh(Number(v)), 'Saved']} contentStyle={{ borderRadius: 12, background: 'var(--ak-surface)', border: '1px solid var(--ak-line)', color: 'var(--ak-text)' }} />
              <Bar dataKey="amount" fill="#3FA673" radius={[8, 8, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel aria-labelledby="all-h">
        <PanelTitle id="all-h" action={<span className="text-[13px] text-ink-3">{rows.length} records</span>}>Every payment</PanelTitle>
        {rows.length === 0 ? (
          <EmptyState title="No payments yet">Your first contribution will appear here with its M-Pesa receipt.</EmptyState>
        ) : (
          <TableWrap className="mt-3">
            <table className={cn(tableClass, 'min-w-[560px]')}>
              <thead><tr><th>Date</th><th className="!text-right">Amount</th><th>Paid by</th><th>Receipt</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="text-ink-2 whitespace-nowrap">{new Date(c.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="text-right"><Money value={Number(c.amount)} className="text-[17px]" /></td>
                    <td className="text-ink-2">{c.payment_method === 'cash' ? 'Cash' : c.payment_method === 'bank' ? 'Bank' : 'M-Pesa'}</td>
                    <td className="font-mono text-[12px] text-ink-3">{c.mpesa_receipt || c.reference || '—'}</td>
                    <td><Chip kind={(ST[c.status] || { kind: 'neutral' }).kind}>{ST[c.status]?.label || c.status}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}

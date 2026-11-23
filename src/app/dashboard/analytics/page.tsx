'use client';

import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { EmptyState, Notice, PageHeader, Panel, PanelTitle, Skeleton, Stat, Tabs, formatKsh } from '@/components/ui';

type C = { membership_id: string; amount: number; created_at: string };
type M = { id: string; joined_at: string | null; trust_score: number | null; status: string };

const RANGES = { '3M': 3, '6M': 6, '12M': 12 } as const;
type RangeKey = keyof typeof RANGES;
const tip = { borderRadius: 12, background: 'var(--ak-surface)', border: '1px solid var(--ak-line)', color: 'var(--ak-text)' };

export default function ProgressPage() {
  const { member, group, isLoading } = useAuth();
  const [contribs, setContribs] = useState<C[] | null>(null);
  const [members, setMembers] = useState<M[]>([]);
  const [error, setError] = useState('');
  const [range, setRange] = useState<RangeKey>('12M');

  useEffect(() => {
    if (!group?.id) return;
    Promise.all([
      supabase.from('contributions_v2').select('membership_id, amount, created_at').eq('chama_id', group.id).eq('status', 'confirmed').order('created_at'),
      supabase.from('chama_memberships').select('id, joined_at, trust_score, status').eq('chama_id', group.id),
    ]).then(([c, m]) => {
      if (c.error || m.error) setError('Some figures did not load. Refresh to try again.');
      setContribs((c.data as C[]) || []);
      setMembers((m.data as M[]) || []);
    });
  }, [group?.id]);

  const d = useMemo(() => {
    if (!contribs) return null;
    const months = RANGES[range];
    const now = new Date();
    const keys: { key: string; label: string; end: Date }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const s = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push({ key: `${s.getFullYear()}-${s.getMonth()}`, label: s.toLocaleDateString('en-KE', { month: 'short' }), end: new Date(s.getFullYear(), s.getMonth() + 1, 0, 23, 59) });
    }
    const first = keys[0];
    const startDate = new Date(Number(first.key.split('-')[0]), Number(first.key.split('-')[1]), 1);
    const active = members.filter((m) => m.status === 'active');

    let running = contribs.filter((c) => new Date(c.created_at) < startDate).reduce((s, c) => s + Number(c.amount), 0);
    const growth = keys.map((k) => {
      const inMonth = contribs.filter((c) => { const t = new Date(c.created_at); return `${t.getFullYear()}-${t.getMonth()}` === k.key; });
      running += inMonth.reduce((s, c) => s + Number(c.amount), 0);
      const payers = new Set(inMonth.map((c) => c.membership_id)).size;
      const eligible = active.filter((m) => !m.joined_at || new Date(m.joined_at) <= k.end).length;
      return { label: k.label, total: running, rate: eligible ? Math.round((payers / eligible) * 100) : 0, mine: inMonth.filter((c) => c.membership_id === member?.id).reduce((s, c) => s + Number(c.amount), 0) };
    });

    const totals = new Map<string, number>();
    contribs.forEach((c) => totals.set(c.membership_id, (totals.get(c.membership_id) || 0) + Number(c.amount)));
    const mine = totals.get(member?.id || '') || 0;
    const groupTotal = [...totals.values()].reduce((a, b) => a + b, 0);
    const avg = active.length ? groupTotal / active.length : 0;
    const ratesWithMembers = growth.filter((g) => g.rate > 0);
    const avgRate = ratesWithMembers.length ? Math.round(ratesWithMembers.reduce((s, g) => s + g.rate, 0) / ratesWithMembers.length) : 0;
    const bands = [
      { label: '80 to 100', n: active.filter((m) => (m.trust_score || 0) >= 80).length },
      { label: '60 to 79', n: active.filter((m) => (m.trust_score || 0) >= 60 && (m.trust_score || 0) < 80).length },
      { label: '40 to 59', n: active.filter((m) => (m.trust_score || 0) >= 40 && (m.trust_score || 0) < 60).length },
      { label: 'Under 40', n: active.filter((m) => (m.trust_score || 0) < 40).length },
    ];
    return { growth, mine, groupTotal, avg, avgRate, bands, activeCount: active.length };
  }, [contribs, members, range, member?.id]);

  if (isLoading || !d) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-64" />
        <div className="grid md:grid-cols-3 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Your progress"
        subtitle="How you and the group are doing over time. Every figure comes from confirmed contributions."
        actions={<Tabs label="Period" value={range} onChange={setRange} items={(Object.keys(RANGES) as RangeKey[]).map((k) => ({ value: k, label: k === '12M' ? '12 months' : k === '6M' ? '6 months' : '3 months' }))} />}
      />
      {error && <Notice tone="warn" className="mb-4">{error}</Notice>}

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Stat tone="forest" label="You have saved" value={formatKsh(d.mine)} hint={d.groupTotal ? `${Math.round((d.mine / d.groupTotal) * 100)}% of everything the group has saved` : undefined} />
        <Stat label="A typical member has saved" value={formatKsh(d.avg)} hint={`across ${d.activeCount} active members`} />
        <Stat label="Paying each month" value={<>{d.avgRate}<span className="text-[20px]">%</span></>} hint="of members, on average in this period" />
      </div>

      <Panel aria-labelledby="growth-h" className="mb-4">
        <PanelTitle id="growth-h">The group&apos;s savings</PanelTitle>
        <p className="text-[14px] text-ink-3 mt-1">Running total of confirmed contributions.</p>
        <div className="h-[260px] mt-4 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={d.growth} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs><linearGradient id="g-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7CE3A6" stopOpacity={0.3} /><stop offset="1" stopColor="#7CE3A6" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="var(--ak-line)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ak-text-3)' }} />
              <YAxis axisLine={false} tickLine={false} width={44} tick={{ fontSize: 11, fill: 'var(--ak-text-3)' }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip contentStyle={tip} formatter={(v) => [formatKsh(Number(v)), 'Saved']} />
              <Area type="monotone" dataKey="total" stroke="#3FA673" strokeWidth={2.5} fill="url(#g-fill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel aria-labelledby="rate-h">
          <PanelTitle id="rate-h">Members who paid each month</PanelTitle>
          {d.growth.every((g) => g.rate === 0) ? (
            <EmptyState title="No payments in this period" />
          ) : (
            <div className="h-[220px] mt-4 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.growth} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--ak-line)" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ak-text-3)' }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} width={36} tick={{ fontSize: 11, fill: 'var(--ak-text-3)' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={tip} cursor={{ fill: 'var(--ak-raised)' }} formatter={(v) => [`${v}%`, 'Paid']} />
                  <Bar dataKey="rate" fill="#3FA673" radius={[8, 8, 2, 2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel aria-labelledby="trust-dist-h">
          <PanelTitle id="trust-dist-h">Trust scores across the group</PanelTitle>
          <ul className="mt-4 flex flex-col gap-3.5">
            {d.bands.map((b) => (
              <li key={b.label}>
                <div className="flex justify-between text-[14px]"><span>{b.label}</span><span className="text-ink-2">{b.n} {b.n === 1 ? 'member' : 'members'}</span></div>
                <div className="h-3 rounded-full bg-raised mt-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-moss dark:bg-mint" style={{ width: `${d.activeCount ? (b.n / d.activeCount) * 100 : 0}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-ink-3 mt-5">Your own score: <span className="font-money text-[16px] text-ink">{member?.trust_score ?? 0}</span>.</p>
        </Panel>
      </div>
    </div>
  );
}

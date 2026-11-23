'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase rows are untyped here */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, Sparkles, X } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import NextContributionCard from '@/components/NextContributionCard';
import { OFFICIAL_ROLES } from '@/components/shell/nav';
import {
  ButtonLink, Chip, EmptyState, Meter, Money, Panel, PanelTitle, WovenRing, cn, formatKsh, initialsOf, type ChipKind, type Seat,
} from '@/components/ui';

type Contribution = { amount: number; created_at: string; status: string };
type Tx = { id: string; type: string; amount: number; description: string | null; reference: string | null; status: string | null; created_at: string; membership_id: string | null };
type Round = { round_number: number; scheduled_date: string | null; status: string; recipient_membership_id: string; name: string };

const RANGES = [
  { key: '3M', months: 3 },
  { key: '6M', months: 6 },
  { key: '1Y', months: 12 },
  { key: 'All', months: 0 },
] as const;

const TX_LABEL: Record<string, string> = {
  contribution: 'Contribution',
  withdrawal: 'Withdrawal',
  deposit: 'Deposit',
  penalty: 'Penalty',
  interest: 'Interest',
  smartgrow_investment: 'SmartGrow investment',
  smartgrow_return: 'SmartGrow return',
  loan_disbursement: 'Payout',
  loan_repayment: 'Repayment',
};

function greeting() {
  const h = Number(new Intl.DateTimeFormat('en-KE', { hour: 'numeric', hour12: false, timeZone: 'Africa/Nairobi' }).format(new Date()));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', timeZone: 'Africa/Nairobi' });
}

function txChip(tx: Tx): { kind: ChipKind; label: string } {
  const s = (tx.status || 'confirmed').toLowerCase();
  if (s === 'pending') return { kind: 'pending', label: 'Waiting' };
  if (s === 'failed') return { kind: 'failed', label: 'Failed' };
  if (tx.type === 'penalty') return { kind: 'late', label: 'Penalty' };
  return { kind: 'paid', label: 'Done' };
}

export default function MemberDashboard({
  member: initialMember,
  chama: initialChama,
  metrics: initialMetrics,
  initialTransactions,
}: {
  member?: any;
  chama?: any;
  metrics?: any;
  initialTransactions?: any[];
} = {}) {
  const { member: authMember, group: authChama } = useAuth();
  const member = initialMember || authMember;
  const chama = initialChama || authChama;
  const firstName = (member?.full_name || '').split(' ')[0];
  const isOfficial = OFFICIAL_ROLES.includes(member?.role);

  const [contribs, setContribs] = useState<Contribution[] | null>(null);
  const [txs, setTxs] = useState<Tx[]>(initialTransactions || []);
  const [names, setNames] = useState<Record<string, string>>({});
  const [wallet, setWallet] = useState<{ balance: number; invested: number } | null>(null);
  const [welfare, setWelfare] = useState<number | null>(null);
  const [rounds, setRounds] = useState<{ current: number; total: number; list: Round[] } | null>(null);
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('6M');
  const [insightHidden, setInsightHidden] = useState(() => {
    try { return typeof window !== 'undefined' && sessionStorage.getItem('ak_insight_hidden') === '1'; } catch { return false; }
  });

  useEffect(() => {
    if (!member?.id || !chama?.id) return;
    let cancelled = false;

    (async () => {
      const [c, t, w, wf, people, cyc] = await Promise.all([
        supabase.from('contributions_v2').select('amount, created_at, status').eq('membership_id', member.id).eq('status', 'confirmed').order('created_at', { ascending: true }),
        supabase.from('transactions_v2').select('id, type, amount, description, reference, status, created_at, membership_id').eq('chama_id', chama.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('wallets').select('balance, invested').eq('chama_id', chama.id).maybeSingle(),
        supabase.from('welfare_fund').select('balance').eq('chama_id', chama.id).maybeSingle(),
        supabase.from('chama_memberships').select('id, profiles(full_name)').eq('chama_id', chama.id),
        supabase.from('merry_go_round_cycles').select('id, current_round, total_rounds').eq('chama_id', chama.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (cancelled) return;

      setContribs((c.data as Contribution[]) || []);
      if (t.data) setTxs(t.data as Tx[]);
      if (w.data) setWallet({ balance: Number(w.data.balance || 0), invested: Number(w.data.invested || 0) });
      if (wf.data) setWelfare(Number(wf.data.balance || 0));

      const nameMap: Record<string, string> = {};
      (people.data || []).forEach((p: any) => { nameMap[p.id] = p.profiles?.full_name || 'Member'; });
      setNames(nameMap);

      if (cyc.data) {
        const { data: sched } = await supabase
          .from('merry_go_round_schedule')
          .select('round_number, scheduled_date, status, recipient_membership_id')
          .eq('cycle_id', cyc.data.id)
          .order('round_number');
        if (!cancelled) {
          setRounds({
            current: cyc.data.current_round,
            total: cyc.data.total_rounds,
            list: (sched || []).map((r: any) => ({ ...r, name: nameMap[r.recipient_membership_id] || 'Member' })),
          });
        }
      }
    })().catch(() => { if (!cancelled) setContribs([]); });

    const channel = supabase
      .channel(`dashboard-${member.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions_v2', filter: `membership_id=eq.${member.id}` }, async () => {
        const { data } = await supabase.from('contributions_v2').select('amount, created_at, status').eq('membership_id', member.id).eq('status', 'confirmed').order('created_at', { ascending: true });
        if (data) setContribs(data as Contribution[]);
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [member?.id, chama?.id]);

  const totalSaved = useMemo(() => {
    if (contribs) return contribs.reduce((s, c) => s + Number(c.amount || 0), 0);
    return Number(initialMetrics?.totalSaved || 0);
  }, [contribs, initialMetrics]);

  const thisMonth = useMemo(() => {
    const now = new Date();
    return (contribs || []).filter((c) => {
      const d = new Date(c.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, c) => s + Number(c.amount || 0), 0);
  }, [contribs]);

  // Running balance by month for the chart
  const series = useMemo(() => {
    if (!contribs || contribs.length === 0) return [];
    const byMonth = new Map<string, number>();
    contribs.forEach((c) => {
      const d = new Date(c.created_at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(k, (byMonth.get(k) || 0) + Number(c.amount || 0));
    });
    const first = new Date(contribs[0].created_at);
    const out: { key: string; label: string; total: number }[] = [];
    let running = 0;
    const cur = new Date(first.getFullYear(), first.getMonth(), 1);
    const end = new Date();
    while (cur <= end) {
      const k = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
      running += byMonth.get(k) || 0;
      out.push({ key: k, label: cur.toLocaleDateString('en-KE', { month: 'short' }), total: running });
      cur.setMonth(cur.getMonth() + 1);
    }
    const months = RANGES.find((r) => r.key === range)?.months || 0;
    return months ? out.slice(-months) : out;
  }, [contribs, range]);

  // Honest projection from the member's own last six months
  const insight = useMemo(() => {
    if (!contribs || contribs.length < 3) return null;
    const sixAgo = new Date();
    sixAgo.setMonth(sixAgo.getMonth() - 6);
    const recent = contribs.filter((c) => new Date(c.created_at) >= sixAgo);
    const perMonth = recent.reduce((s, c) => s + Number(c.amount || 0), 0) / 6;
    if (perMonth <= 0) return null;
    const step = totalSaved >= 100000 ? 50000 : 10000;
    const target = Math.ceil((totalSaved + 1) / step) * step;
    const months = Math.ceil((target - totalSaved) / perMonth);
    if (months > 24) return null;
    const when = new Date();
    when.setMonth(when.getMonth() + months);
    return { target, when: when.toLocaleDateString('en-KE', { month: 'long', year: when.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }), perMonth };
  }, [contribs, totalSaved]);

  const trust = Number(member?.trust_score || 0);
  const myRound = rounds?.list.find((r) => r.recipient_membership_id === member?.id);
  const currentRound = rounds?.list.find((r) => r.round_number === rounds.current);
  const seats: Seat[] = (rounds?.list || []).map((r) => ({
    initials: initialsOf(r.name),
    state: r.round_number === rounds!.current ? 'current' : r.status === 'paid' ? 'received' : r.recipient_membership_id === member?.id ? 'me' : 'upcoming',
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="font-display text-[30px] sm:text-[38px] leading-tight tracking-[-0.02em]">
            {greeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-[15px] text-ink-3 mt-1">{new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Nairobi' })}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Link href="/dashboard/notifications" aria-label="Notifications" className="w-11 h-11 rounded-full border border-line flex items-center justify-center text-ink-2 hover:bg-raised">
            <Bell size={18} aria-hidden="true" />
          </Link>
          <ButtonLink href="/dashboard/contributions?pay=1">Pay contribution</ButtonLink>
        </div>
      </div>

      {/* Savings + next payment */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Panel className="rounded-[28px] sm:p-7 overflow-hidden" aria-labelledby="savings-h">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h2 id="savings-h" className="text-[15px] text-ink-2">Your savings in {chama?.name || 'the group'}</h2>
              <Money value={totalSaved} className="block text-[46px] sm:text-[62px] leading-[1.05] mt-1.5" />
              {thisMonth > 0 ? (
                <p className="text-[14px] text-brand mt-1">{formatKsh(thisMonth)} added this month</p>
              ) : (
                <p className="text-[14px] text-ink-3 mt-1">Nothing added yet this month</p>
              )}
            </div>
            {series.length > 1 && (
              <div role="group" aria-label="Chart range" className="flex gap-1 self-start p-1 rounded-full bg-page">
                {RANGES.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    aria-pressed={range === r.key}
                    onClick={() => setRange(r.key)}
                    className={cn('h-8 min-w-11 px-3 rounded-full text-[13px] font-medium', range === r.key ? 'bg-raised text-ink' : 'text-ink-3 hover:text-ink')}
                  >
                    {r.key}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-[200px] mt-5 -mx-2">
            {contribs === null ? (
              <div className="h-full rounded-2xl bg-surface-2 animate-pulse" />
            ) : series.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <defs>
                    <linearGradient id="savings-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#7CE3A6" stopOpacity={0.3} />
                      <stop offset="1" stopColor="#7CE3A6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--ak-text-3)', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ stroke: 'var(--ak-line-strong)' }}
                    contentStyle={{ background: 'var(--ak-surface)', border: '1px solid var(--ak-line)', borderRadius: 12, color: 'var(--ak-text)' }}
                    formatter={(v) => [formatKsh(Number(v)), 'Saved']}
                  />
                  <Area type="monotone" dataKey="total" stroke="#3FA673" strokeWidth={2.5} fill="url(#savings-fill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Your chart starts with your first payment">
                Once a contribution is confirmed, you&apos;ll see your savings grow here month by month.
              </EmptyState>
            )}
          </div>
        </Panel>

        <NextContributionCard chamaId={chama?.id} isOfficial={false} />
      </div>

      {/* Round, trust, insight */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Panel aria-labelledby="round-h" className="flex items-center gap-5">
          {rounds && seats.length > 0 ? (
            <>
              <WovenRing size={150} seats={seats} seatSize={24} label={`Merry-go-round round ${rounds.current} of ${rounds.total}`}>
                <span className="font-money text-[28px] leading-none">{rounds.current}</span>
                <span className="text-[11px] text-[#A9C2B3]">of {rounds.total}</span>
              </WovenRing>
              <div className="min-w-0">
                <h2 id="round-h" className="text-[15px] text-ink-2">Merry-go-round</h2>
                {currentRound && (
                  <p className="text-[15px] mt-1">
                    {currentRound.recipient_membership_id === member?.id ? 'You receive this round' : `${currentRound.name.split(' ')[0]} receives this round`}
                    {currentRound.scheduled_date ? ` on ${shortDate(currentRound.scheduled_date)}` : ''}.
                  </p>
                )}
                {myRound && myRound.round_number !== rounds.current && (
                  <p className="font-display text-[19px] text-brand mt-2">
                    {myRound.status === 'paid' ? `You received in round ${myRound.round_number}` : `Your turn: round ${myRound.round_number}${myRound.scheduled_date ? `, ${shortDate(myRound.scheduled_date)}` : ''}`}
                  </p>
                )}
                <Link href="/dashboard/merry-go-round" className="inline-block mt-2 text-[14px] text-brand hover:underline">See the full order</Link>
              </div>
            </>
          ) : (
            <div>
              <h2 id="round-h" className="text-[15px] text-ink-2">Merry-go-round</h2>
              <p className="font-display text-[21px] mt-1.5 leading-snug">No round running right now.</p>
              <p className="text-[14px] text-ink-3 mt-1">When officials start one, your place in the order shows here.</p>
            </div>
          )}
        </Panel>

        <Panel aria-labelledby="trust-h">
          <div className="flex justify-between items-baseline">
            <h2 id="trust-h" className="text-[15px] text-ink-2">Trust score</h2>
            <span><span className="font-money text-[36px]">{trust}</span><span className="text-[13px] text-ink-3"> / 100</span></span>
          </div>
          <Meter value={trust} className="mt-3" label={`Trust score ${trust} of 100`} />
          <p className="text-[14px] text-ink-2 mt-3">
            {trust >= 80 ? 'Strong standing. Keep paying on time to hold it.' : trust >= 60 ? 'Good standing. Each on-time payment lifts it.' : trust > 0 ? 'Room to grow. On-time payments raise it fastest.' : 'Your score builds from your first on-time payment.'}
          </p>
          <Link href="/dashboard/trust-score" className="inline-block mt-2 text-[14px] text-brand hover:underline">How the score works</Link>
        </Panel>

        {insight && !insightHidden ? (
          <Panel tone="lavender" aria-labelledby="insight-h" className="flex flex-col gap-2 md:col-span-2 xl:col-span-1">
            <div className="flex justify-between items-center">
              <h2 id="insight-h" className="flex items-center gap-2 text-[14px] font-semibold"><Sparkles size={16} aria-hidden="true" />Akibora insight</h2>
              <button
                type="button"
                aria-label="Hide this insight"
                onClick={() => { setInsightHidden(true); try { sessionStorage.setItem('ak_insight_hidden', '1'); } catch {} }}
                className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center hover:bg-black/5"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <p className="font-display text-[23px] leading-tight">At this pace you pass {formatKsh(insight.target)} by {insight.when}.</p>
            <p className="text-[13px] text-[#3A3060]">Based on your average of {formatKsh(insight.perMonth)} a month over the last six months.</p>
          </Panel>
        ) : (
          <Panel aria-labelledby="pot-h" className="md:col-span-2 xl:col-span-1">
            <GroupMoney wallet={wallet} welfare={welfare} id="pot-h" />
          </Panel>
        )}
      </div>

      {/* Activity + group money */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Panel aria-labelledby="activity-h" className="min-w-0">
          <PanelTitle id="activity-h" action={<Link href="/dashboard/transactions" className="text-[14px] text-brand hover:underline">See all</Link>}>
            Recent activity
          </PanelTitle>
          {txs.length === 0 ? (
            <EmptyState title="Nothing here yet">Payments, payouts and penalties for the group will be listed here as they happen.</EmptyState>
          ) : (
            <div className="overflow-x-auto mt-3 -mx-2">
              <table className="w-full min-w-[560px] text-[14px]">
                <thead>
                  <tr className="text-left text-ink-3">
                    <th className="font-medium px-2 py-2.5">Date</th>
                    <th className="font-medium px-2 py-2.5">What</th>
                    <th className="font-medium px-2 py-2.5">Reference</th>
                    <th className="font-medium px-2 py-2.5 text-right">Amount</th>
                    <th className="font-medium px-2 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((tx) => {
                    const chip = txChip(tx);
                    const who = tx.membership_id ? (tx.membership_id === member?.id ? 'You' : names[tx.membership_id]?.split(' ')[0]) : null;
                    return (
                      <tr key={tx.id} className="border-t border-line">
                        <td className="px-2 py-3.5 text-ink-3 whitespace-nowrap">{shortDate(tx.created_at)}</td>
                        <td className="px-2 py-3.5">
                          {tx.description || TX_LABEL[tx.type] || tx.type}
                          {who && <span className="text-ink-3"> · {who}</span>}
                        </td>
                        <td className="px-2 py-3.5 font-mono text-[12px] text-ink-3">{tx.reference || '—'}</td>
                        <td className="px-2 py-3.5 text-right whitespace-nowrap"><Money value={tx.amount} className="text-[17px]" /></td>
                        <td className="px-2 py-3.5"><Chip kind={chip.kind}>{chip.label}</Chip></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {insight && !insightHidden ? (
          <Panel aria-labelledby="pot-h2">
            <GroupMoney wallet={wallet} welfare={welfare} id="pot-h2" />
          </Panel>
        ) : (
          <Panel tone="forest" aria-labelledby="quick-h" className="flex flex-col">
            <h2 id="quick-h" className="font-display text-[22px]">Quick actions</h2>
            <div className="mt-4 flex flex-col gap-2">
              {[
                ['/dashboard/contributions?pay=1', 'Pay a contribution'],
                ['/dashboard/welfare', 'Ask the welfare fund for help'],
                ['/dashboard/smartgrow', 'Vote on an investment'],
                ['/dashboard/chat', 'Message the group'],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="h-12 px-4 rounded-[14px] bg-canopy hover:bg-[#21402F] flex items-center text-[15px]">{label}</Link>
              ))}
            </div>
            {isOfficial && (
              <Link href="/admin/dashboard" className="mt-4 text-[14px] text-mint hover:underline">Open the officials view</Link>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}

function GroupMoney({ wallet, welfare, id }: { wallet: { balance: number; invested: number } | null; welfare: number | null; id: string }) {
  const pot = wallet?.balance || 0;
  const invested = wallet?.invested || 0;
  const wf = welfare || 0;
  const total = pot + invested + wf;
  return (
    <>
      <h2 id={id} className="text-[15px] text-ink-2">The group&apos;s money</h2>
      <Money value={total} className="block text-[40px] mt-1" />
      {total > 0 && (
        <div className="flex gap-1 h-3 mt-4" aria-hidden="true">
          {pot > 0 && <span className="rounded bg-mint" style={{ flex: pot }} />}
          {invested > 0 && <span className="rounded bg-sage" style={{ flex: invested }} />}
          {wf > 0 && <span className="rounded bg-lavender" style={{ flex: wf }} />}
        </div>
      )}
      <ul className="mt-4 flex flex-col gap-3 text-[14px]">
        <li className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-mint" aria-hidden="true" /><span className="flex-1">The pot</span><Money value={pot} className="text-[17px]" /></li>
        <li className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-sage" aria-hidden="true" /><span className="flex-1">Invested in SmartGrow</span><Money value={invested} className="text-[17px]" /></li>
        <li className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-lavender" aria-hidden="true" /><span className="flex-1">Welfare fund</span><Money value={wf} className="text-[17px]" /></li>
      </ul>
      <p className="mt-4 text-[13px] text-ink-3">Every member sees the same numbers.</p>
    </>
  );
}

'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import NextContributionCard from '@/components/NextContributionCard';
import { ROLE_LABEL } from '@/components/shell/nav';
import {
  Avatar, Button, ButtonLink, Chip, EmptyState, Money, Notice, PageHeader, Panel, PanelTitle, Ticks, cn, formatKsh,
} from '@/components/ui';

type Member = { id: string; profile_id: string; name: string; joined_at: string | null; status: string; role: string };
type Contribution = { membership_id: string; amount: number; created_at: string; status: string };

const MONTHS = 12;

export default function AdminDashboardPage({
  member: initialAdmin,
  chama: initialChama,
}: {
  member?: any;
  chama?: any;
  metrics?: any;
  initialTransactions?: any[];
} = {}) {
  const { member: authAdmin, group: authChama } = useAuth();
  const admin = initialAdmin || authAdmin;
  const chama = initialChama || authChama;
  const chamaId: string | undefined = chama?.id;

  const [members, setMembers] = useState<Member[] | null>(null);
  const [contribs, setContribs] = useState<Contribution[]>([]);
  const [wallet, setWallet] = useState<{ balance: number; invested: number } | null>(null);
  const [welfare, setWelfare] = useState<number>(0);
  const [penalties, setPenalties] = useState<{ total: number; people: number }>({ total: 0, people: 0 });
  const [claims, setClaims] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [rounds, setRounds] = useState<{ current: number; list: { round_number: number; name: string; status: string; scheduled_date: string | null }[] } | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!chamaId) return;
    const since = new Date();
    since.setMonth(since.getMonth() - (MONTHS - 1), 1);
    since.setHours(0, 0, 0, 0);
    const [m, c, w, wf, p, cl, wd, cyc] = await Promise.all([
      supabase.from('chama_memberships').select('id, profile_id, role, status, joined_at, profiles(full_name)').eq('chama_id', chamaId).in('status', ['active', 'pending']),
      supabase.from('contributions_v2').select('membership_id, amount, created_at, status').eq('chama_id', chamaId).gte('created_at', since.toISOString()),
      supabase.from('wallets').select('balance, invested').eq('chama_id', chamaId).maybeSingle(),
      supabase.from('welfare_fund').select('balance').eq('chama_id', chamaId).maybeSingle(),
      supabase.from('member_penalties').select('membership_id, amount').eq('chama_id', chamaId).eq('status', 'unpaid'),
      supabase.from('welfare_claims').select('id, amount, reason, description, status, membership_id').eq('chama_id', chamaId).eq('status', 'pending'),
      supabase.from('withdrawal_consents').select('id, amount, reason, votes_for, total_eligible_voters, status').eq('chama_id', chamaId).eq('status', 'pending'),
      supabase.from('merry_go_round_cycles').select('id, current_round').eq('chama_id', chamaId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (m.error) { setError('The group overview did not load. Refresh to try again.'); return; }
    const mem: Member[] = (m.data || []).map((r: any) => ({ id: r.id, profile_id: r.profile_id, role: r.role, status: r.status, joined_at: r.joined_at, name: r.profiles?.full_name || 'Member' }));
    setMembers(mem);
    setContribs((c.data as Contribution[]) || []);
    setWallet(w.data ? { balance: Number(w.data.balance || 0), invested: Number(w.data.invested || 0) } : { balance: 0, invested: 0 });
    setWelfare(Number(wf.data?.balance || 0));
    const pen = (p.data || []) as { membership_id: string; amount: number }[];
    setPenalties({ total: pen.reduce((s, x) => s + Number(x.amount), 0), people: new Set(pen.map((x) => x.membership_id)).size });
    setClaims(cl.data || []);
    setWithdrawals(wd.data || []);
    if (cyc.data) {
      const { data: sched } = await supabase.from('merry_go_round_schedule').select('round_number, status, scheduled_date, recipient_membership_id').eq('cycle_id', cyc.data.id).order('round_number');
      const names = Object.fromEntries(mem.map((x) => [x.id, x.name]));
      setRounds({ current: cyc.data.current_round, list: (sched || []).map((r: any) => ({ ...r, name: names[r.recipient_membership_id] || 'Member' })) });
    } else {
      setRounds(null);
    }
  }, [chamaId]);

  useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect -- loads remote data
  }, [load]);

  const active = useMemo(() => (members || []).filter((m) => m.status === 'active'), [members]);
  const pending = useMemo(() => (members || []).filter((m) => m.status === 'pending'), [members]);

  // This month
  const now = new Date();
  const thisKey = `${now.getFullYear()}-${now.getMonth()}`;
  const keyOf = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}`; };
  const confirmed = contribs.filter((c) => c.status === 'confirmed');
  const monthPaid = confirmed.filter((c) => keyOf(c.created_at) === thisKey);
  const collected = monthPaid.reduce((s, c) => s + Number(c.amount), 0);
  const paidIds = new Set(monthPaid.map((c) => c.membership_id));
  const expected = Number(chama?.contribution_amount || 0) * active.length;
  const unpaid = active.filter((m) => !paidIds.has(m.id));

  // Month-by-month grid
  const months = useMemo(() => {
    const out: { key: string; label: string; end: Date }[] = [];
    for (let i = MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-KE', { month: 'short' }), end: new Date(d.getFullYear(), d.getMonth() + 1, 0) });
    }
    return out;
  }, [now.getMonth(), now.getFullYear()]); // eslint-disable-line react-hooks/exhaustive-deps
  const dueDay = Number(chama?.contribution_due_day || 1) + Number(chama?.grace_period_days || 0);
  const cell = (m: Member, mo: { key: string; end: Date }) => {
    if (m.joined_at && new Date(m.joined_at) > mo.end) return 'before';
    const paid = confirmed.filter((c) => c.membership_id === m.id && keyOf(c.created_at) === mo.key);
    if (paid.length === 0) return mo.key === thisKey ? 'due' : 'missed';
    const late = paid.every((c) => new Date(c.created_at).getDate() > dueDay);
    return late ? 'late' : 'ok';
  };
  const CELL: Record<string, string> = {
    ok: 'bg-moss dark:bg-[#3FA673]',
    late: 'bg-amber',
    missed: 'bg-surface border-[1.5px] border-danger',
    due: 'bg-raised',
    before: 'bg-transparent border border-dashed border-line',
  };
  const CELL_LABEL: Record<string, string> = { ok: 'On time', late: 'Late', missed: 'Missed', due: 'Not paid yet', before: 'Not a member yet' };

  const decide = async (m: Member, approve: boolean) => {
    setBusy(m.id);
    const { error: err } = await supabase.from('chama_memberships').update({ status: approve ? 'active' : 'rejected' }).eq('id', m.id);
    setBusy(null);
    if (err) { setToast('That did not save. Try again from the Members page.'); return; }
    if (approve) {
      await supabase.from('notifications').insert({
        chama_id: chamaId,
        profile_id: m.profile_id,
        type: 'member_approved',
        title: `You're in ${chama?.name || 'the group'}`,
        message: 'An official approved your request. You can now see the group and pay contributions.',
      });
    }
    setToast(approve ? 'Member approved.' : 'Request declined.');
    load();
  };

  const remind = async () => {
    setBusy('remind');
    try {
      const { error: err } = await supabase.from('notifications').insert(unpaid.map((m) => ({
        chama_id: chamaId,
        profile_id: m.profile_id,
        type: 'reminder',
        title: 'Your contribution is due',
        message: `${chama?.name || 'Your group'} is waiting for this month's ${formatKsh(chama?.contribution_amount)}. Pay from the app with M-Pesa.`,
        read: false,
      })));
      if (err) throw err;
      setToast(`An in-app reminder went to ${unpaid.length} ${unpaid.length === 1 ? 'member' : 'members'}.`);
    } catch {
      setToast('Reminders could not be sent right now.');
    } finally {
      setBusy(null);
    }
  };

  if (!members && !error) {
    return (
      <div className="flex flex-col gap-4 animate-pulse" aria-busy="true">
        <div className="h-12 w-80 rounded-xl bg-raised" />
        <div className="grid md:grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-36 rounded-[22px] bg-surface border border-line" />)}</div>
        <div className="h-96 rounded-[24px] bg-surface border border-line" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        className="mb-2"
        title={chama?.name || 'Your group'}
        subtitle={<>{ROLE_LABEL[admin?.role] || 'Official'} view. Group code <span className="font-mono text-[14px] text-ink">{chama?.group_code || '—'}</span></>}
        actions={
          <>
            <ButtonLink href="/admin/contributions?record=1" variant="outline"><Plus size={18} aria-hidden="true" />Record cash payment</ButtonLink>
            {unpaid.length > 0 && (
              <Button onClick={remind} disabled={busy === 'remind'}><Bell size={18} aria-hidden="true" />Remind {unpaid.length} who {unpaid.length === 1 ? "hasn't" : "haven't"} paid</Button>
            )}
          </>
        }
      />

      {error && <Notice tone="danger">{error}</Notice>}
      {toast && <Notice tone="ok">{toast}</Notice>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Panel tone="forest" className="rounded-[22px]">
          <div className="text-[14px] text-[#A9C2B3]">Collected this month</div>
          <Money value={collected} className="block text-[36px] leading-tight mt-1" />
          <Ticks total={Math.max(active.length, 1)} done={paidIds.size} className="mt-3" />
          <div className="text-[13px] text-[#A9C2B3] mt-2">{paidIds.size} of {active.length} paid{expected > collected ? `, ${formatKsh(expected - collected)} to go` : ''}</div>
        </Panel>
        <Panel className="rounded-[22px]">
          <div className="text-[14px] text-ink-2">The pot</div>
          <Money value={wallet?.balance} className="block text-[36px] leading-tight mt-1" />
          <div className="text-[13px] text-ink-3 mt-2">{wallet?.invested ? `${formatKsh(wallet.invested)} more invested in SmartGrow` : 'Nothing invested yet'}</div>
        </Panel>
        <Panel className="rounded-[22px]">
          <div className="text-[14px] text-ink-2">Welfare fund</div>
          <Money value={welfare} className="block text-[36px] leading-tight mt-1" />
          <div className="text-[13px] text-ink-3 mt-2">{claims.length ? `${claims.length} ${claims.length === 1 ? 'claim' : 'claims'} waiting for you` : 'No claims waiting'}</div>
        </Panel>
        <Panel className="rounded-[22px]">
          <div className="text-[14px] text-ink-2">Unpaid penalties</div>
          <Money value={penalties.total} className="block text-[36px] leading-tight mt-1" />
          <div className={cn('text-[13px] mt-2', penalties.people ? 'text-amber-ink' : 'text-ink-3')}>{penalties.people ? `Owed by ${penalties.people} ${penalties.people === 1 ? 'member' : 'members'}` : 'Nothing owed'}</div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel aria-labelledby="grid-h" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="grid-h" className="font-display text-[24px]">Who paid, month by month</h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2">
              {(['ok', 'late', 'missed', 'due'] as const).map((k) => (
                <li key={k} className="flex items-center gap-1.5"><span className={cn('w-3 h-3 rounded-[3px] box-border', CELL[k])} aria-hidden="true" />{CELL_LABEL[k]}</li>
              ))}
            </ul>
          </div>
          {active.length === 0 ? (
            <EmptyState title="No members yet">Share the group code. As people join and pay, this grid fills in.</EmptyState>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full min-w-[620px] border-separate border-spacing-[5px] -mx-[5px] text-[13px]">
                <caption className="sr-only">Contributions by member for the last {MONTHS} months</caption>
                <thead>
                  <tr>
                    <th className="text-left font-medium text-ink-3 w-[150px]"><span className="sr-only">Member</span></th>
                    {months.map((mo) => <th key={mo.key} className="font-medium text-ink-3 text-[11px]">{mo.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {active.map((m) => (
                    <tr key={m.id}>
                      <th scope="row" className="text-left font-normal truncate max-w-[150px] pr-2">{m.name}</th>
                      {months.map((mo) => {
                        const st = cell(m, mo);
                        return (
                          <td key={mo.key} className="p-0">
                            <span className={cn('block h-[22px] rounded-[5px] box-border', CELL[st])} title={`${m.name}, ${mo.label}: ${CELL_LABEL[st]}`} aria-label={`${mo.label}: ${CELL_LABEL[st]}`} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel tone="sage" aria-labelledby="wait-h" className="flex flex-col gap-3">
          <h2 id="wait-h" className="font-display text-[24px]">Waiting for you</h2>
          {pending.length === 0 && claims.length === 0 && withdrawals.length === 0 && (
            <p className="text-[15px] text-[#2B4637]">Nothing needs a decision right now.</p>
          )}
          {pending.map((p) => (
            <div key={p.id} className="rounded-[18px] bg-white/80 dark:bg-white/90 p-4 text-sage-ink">
              <div className="text-[13px] text-[#44604F]">Join request</div>
              <div className="flex items-center gap-2.5 mt-1"><Avatar name={p.name} size={30} tone="mint" /><span className="text-[16px] font-semibold">{p.name}</span></div>
              <div className="flex gap-2 mt-3">
                <Button variant="forest" size="sm" className="flex-1" disabled={busy === p.id} onClick={() => decide(p, true)}>Approve</Button>
                <Button variant="outline" size="sm" className="flex-1 !text-sage-ink !border-sage-ink" disabled={busy === p.id} onClick={() => decide(p, false)}>Decline</Button>
              </div>
            </div>
          ))}
          {claims.map((c) => (
            <Link key={c.id} href="/admin/welfare" className="block rounded-[18px] bg-white/80 dark:bg-white/90 p-4 text-sage-ink hover:bg-white">
              <div className="flex justify-between text-[13px] text-[#44604F]"><span>Welfare claim</span><span>Open to decide</span></div>
              <div className="flex justify-between items-baseline mt-1 gap-3">
                <span className="text-[15px] font-semibold capitalize">{c.reason}</span>
                <Money value={c.amount} className="text-[20px]" />
              </div>
            </Link>
          ))}
          {withdrawals.map((w) => (
            <Link key={w.id} href="/admin/wallet" className="block rounded-[18px] bg-white/80 dark:bg-white/90 p-4 text-sage-ink hover:bg-white">
              <div className="flex justify-between text-[13px] text-[#44604F]"><span>Withdrawal vote</span><span>{w.votes_for || 0} of {w.total_eligible_voters || '?'} in favour</span></div>
              <div className="flex justify-between items-baseline mt-1 gap-3">
                <span className="text-[15px] font-semibold">{w.reason || 'Withdrawal'}</span>
                <Money value={w.amount} className="text-[20px]" />
              </div>
            </Link>
          ))}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel aria-labelledby="rot-h" className="min-w-0">
          <PanelTitle id="rot-h" action={<Link href="/admin/merry-go-round" className="text-[14px] text-brand hover:underline">{rounds ? 'Manage' : 'Start one'}</Link>}>Merry-go-round</PanelTitle>
          {!rounds || rounds.list.length === 0 ? (
            <EmptyState title="No round running">Start a merry-go-round to set who receives the pot each round.</EmptyState>
          ) : (
            <div className="overflow-x-auto mt-4">
              <ol className="grid gap-1.5 min-w-[720px]" style={{ gridTemplateColumns: `repeat(${rounds.list.length}, minmax(84px, 1fr))` }}>
                {rounds.list.map((r) => {
                  const now = r.round_number === rounds.current;
                  const past = r.status === 'paid';
                  return (
                    <li key={r.round_number} aria-current={now ? 'step' : undefined} className={cn('flex flex-col p-3 rounded-[14px]', now ? 'bg-mint text-forest' : past ? 'bg-forest text-[#EEF4EF]' : 'bg-surface-2 border border-dashed border-line-strong/60')}>
                      <span className="text-[12px] opacity-80">Round {r.round_number}</span>
                      <span className="text-[14px] font-semibold truncate mt-0.5">{r.name.split(' ')[0]}</span>
                      <span className="text-[12px] opacity-80 mt-0.5">{past ? 'Paid' : now ? 'This round' : r.scheduled_date ? new Date(r.scheduled_date + 'T00:00:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : '—'}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </Panel>
        <NextContributionCard chamaId={chamaId} isOfficial />
      </div>

      {unpaid.length > 0 && (
        <Panel aria-labelledby="unpaid-h">
          <PanelTitle id="unpaid-h">Not paid this month</PanelTitle>
          <ul className="mt-3 flex flex-wrap gap-2">
            {unpaid.map((m) => (
              <li key={m.id}>
                <Link href={`/admin/members/${m.id}`} className="inline-flex items-center gap-2 h-10 pl-1.5 pr-4 rounded-full bg-surface-2 border border-line hover:border-line-strong text-[14px]">
                  <Avatar name={m.name} size={28} tone="sage" />{m.name}
                </Link>
              </li>
            ))}
          </ul>
          <Chip kind="info" className="mt-4">Expected each: {formatKsh(chama?.contribution_amount)}</Chip>
        </Panel>
      )}
    </div>
  );
}

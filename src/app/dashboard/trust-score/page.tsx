'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { exportCreditPassport } from '@/lib/export';
import { Button, Meter, Money, Notice, PageHeader, Panel, PanelTitle, Skeleton, cn } from '@/components/ui';

type Row = { created_at: string; amount: number; payment_method: string | null; mpesa_receipt: string | null };

// Mirrors /api/trust-score/calculate so members can see exactly where their points come from.
function breakdown(rows: Row[], joinedAt: Date | null) {
  const now = new Date();
  const start = joinedAt || (rows[0] ? new Date(rows[0].created_at) : now);
  const monthsActive = Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1);
  const weights: Record<string, number> = {};
  rows.forEach((c) => {
    const d = new Date(c.created_at);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    const w = c.payment_method === 'mpesa' && c.mpesa_receipt ? 1 : 0.5;
    weights[k] = Math.max(weights[k] || 0, w);
  });
  const confirmed = Object.values(weights).reduce((a, b) => a + b, 0);
  let streak = 0;
  const cur = new Date(now.getFullYear(), now.getMonth(), 1);
  while (weights[`${cur.getFullYear()}-${cur.getMonth()}`] !== undefined) { streak++; cur.setMonth(cur.getMonth() - 1); }
  const contribution = Math.min(confirmed / monthsActive, 1) * 55;
  const tenure = Math.min(monthsActive / 24, 1) * 25;
  const participation = (Math.min(streak, 12) / 12) * 20;
  return {
    monthsActive, paidMonths: Object.keys(weights).length, streak,
    totalSaved: rows.reduce((s, r) => s + Number(r.amount || 0), 0),
    parts: [
      { label: 'Paying every month', points: Math.round(contribution), max: 55, detail: `Contributions in ${Object.keys(weights).length} of your ${monthsActive} months. M-Pesa payments count fully, cash counts half.` },
      { label: 'Time in the group', points: Math.round(tenure), max: 25, detail: `${monthsActive} ${monthsActive === 1 ? 'month' : 'months'} so far. Full marks at two years.` },
      { label: 'Unbroken streak', points: Math.round(participation), max: 20, detail: `${streak} ${streak === 1 ? 'month' : 'months'} in a row up to this month. Full marks at twelve.` },
    ],
  };
}

function standing(score: number) {
  if (score >= 80) return { label: 'Strong standing', note: 'You pay reliably and have done for a while. Keep it up and your passport shows it.' };
  if (score >= 60) return { label: 'Good standing', note: 'A solid record. A longer unbroken streak is the quickest way up.' };
  if (score >= 40) return { label: 'Building', note: 'Paying every month, on M-Pesa, moves this fastest.' };
  return { label: 'Just starting', note: 'Your score grows with each month you contribute.' };
}

export default function TrustScorePage() {
  const { member, group, isLoading } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [joinedAt, setJoinedAt] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!member?.id) return;
    Promise.all([
      supabase.from('contributions_v2').select('created_at, amount, payment_method, mpesa_receipt').eq('membership_id', member.id).eq('status', 'confirmed').order('created_at'),
      supabase.from('chama_memberships').select('joined_at').eq('id', member.id).maybeSingle(),
    ]).then(([c, m]) => {
      setRows((c.data as Row[]) || []);
      if (m.data?.joined_at) setJoinedAt(new Date(m.data.joined_at));
    });
  }, [member?.id]);

  const b = useMemo(() => (rows ? breakdown(rows, joinedAt) : null), [rows, joinedAt]);
  const score = Number(member?.trust_score || 0);
  const st = standing(score);

  const download = async () => {
    if (!b || !member) return;
    setBusy(true);
    try {
      await exportCreditPassport({
        name: member.full_name || 'Member',
        groupName: group?.name || 'their group',
        memberSince: joinedAt ? joinedAt.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }) : null,
        score,
        parts: b.parts,
        totalSaved: b.totalSaved,
        paidMonths: b.paidMonths,
        monthsActive: b.monthsActive,
        streak: b.streak,
      });
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || !b) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-60" />
        <Skeleton className="h-72 rounded-[28px]" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Trust score"
        subtitle="A number from 0 to 100 that shows how reliably you save in this group. Only you decide who else sees it."
        actions={<Button onClick={download} disabled={busy}><Download size={18} aria-hidden="true" />{busy ? 'Preparing…' : 'Download credit passport'}</Button>}
      />

      <Panel tone="forest" className="rounded-[28px] sm:p-8 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-[14px] text-[#A9C2B3]">{st.label}</div>
            <div className="font-display text-[30px] sm:text-[34px] mt-1">{member?.full_name}</div>
            <p className="text-[15px] text-[#C9DACF] mt-2 max-w-[48ch]">{st.note}</p>
          </div>
          <div className="text-right">
            <div className="font-money text-[84px] sm:text-[96px] leading-none text-mint">{score}</div>
            <div className="text-[13px] text-[#8FAA9B] mt-1">out of 100</div>
          </div>
        </div>
        <Meter value={score} segments={40} height={36} className="mt-7" offClass="bg-[#22402F]" label={`Trust score ${score} of 100`} />
        <dl className="grid grid-cols-3 gap-4 mt-7 pt-6 border-t border-[#234235]">
          <div><dd><Money value={b.totalSaved} compact className="text-[22px] sm:text-[28px]" /></dd><dt className="text-[13px] text-[#8FAA9B]">saved here</dt></div>
          <div><dd className="font-money text-[22px] sm:text-[28px]">{b.paidMonths} of {b.monthsActive}</dd><dt className="text-[13px] text-[#8FAA9B]">months paid</dt></div>
          <div><dd className="font-money text-[22px] sm:text-[28px]">{b.streak}</dd><dt className="text-[13px] text-[#8FAA9B]">month streak</dt></div>
        </dl>
      </Panel>

      {Math.abs(b.parts.reduce((s, p) => s + p.points, 0) - score) > 3 && (
        <Notice tone="info" className="mb-4">Your officials last recalculated your score before your newest payments. The parts below use your latest record.</Notice>
      )}

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
        <Panel aria-labelledby="parts-h">
          <PanelTitle id="parts-h">Where your points come from</PanelTitle>
          <ul className="mt-4 flex flex-col gap-5">
            {b.parts.map((p) => (
              <li key={p.label}>
                <div className="flex justify-between items-baseline gap-3">
                  <span className="text-[16px] font-medium">{p.label}</span>
                  <span className="text-[14px] text-ink-2"><span className="font-money text-[22px] text-ink">{p.points}</span> of {p.max}</span>
                </div>
                <div className="h-2.5 rounded-full bg-raised mt-2 overflow-hidden">
                  <div className="h-full rounded-full bg-moss dark:bg-mint" style={{ width: `${(p.points / p.max) * 100}%` }} />
                </div>
                <p className="text-[14px] text-ink-3 mt-2">{p.detail}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel tone="sage" aria-labelledby="passport-h" className="flex flex-col">
          <ShieldCheck size={26} aria-hidden="true" />
          <h2 id="passport-h" className="font-display text-[26px] mt-3">Your credit passport</h2>
          <p className="text-[15px] leading-relaxed text-[#2B4637] mt-2">
            A one-page PDF of your score and saving record in {group?.name || 'this group'}. Download it when a bank, SACCO or lender asks for proof that you save.
            Nothing is sent to anyone unless you send it yourself.
          </p>
          <Button variant="forest" className={cn('mt-auto self-start')} onClick={download} disabled={busy}>
            <Download size={18} aria-hidden="true" />{busy ? 'Preparing…' : 'Download PDF'}
          </Button>
        </Panel>
      </div>
    </div>
  );
}

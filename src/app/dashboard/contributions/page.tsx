"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { NewContributionModal } from "@/components/NewContributionModal";
import { Plus } from "lucide-react";
import { Avatar, Button, Chip, EmptyState, Money, Notice, PageHeader, Panel, PanelTitle, Skeleton, TableWrap, Ticks, cn, formatKsh, tableClass, type ChipKind } from "@/components/ui";

export default function ContributionsPage() {
  const { member, group, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  // /dashboard/contributions?pay=1 opens the payment sheet straight away
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pay') === '1') setShowModal(true);
  }, []);

  const [collectionStats, setCollectionStats] = useState({
    collected: 0, target: 0, progress: 0, membersPaid: 0, totalMembers: 0,
  });

  // My own contribution history
  const [myContributions, setMyContributions] = useState<any[]>([]);
  // All member statuses for this month
  const [memberStatuses, setMemberStatuses] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);


  const fetchData = async () => {
    if (!member || !group) return;
    setLoading(true);
    setError("");

    try {
      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      // 1. All confirmed contributions this month for this chama
      const { data: thisMonth } = await supabase
        .from('contributions_v2')
        .select('amount, status, membership_id, created_at, mpesa_receipt, confirmed_at')
        .eq('chama_id', group.id)
        .gte('created_at', firstOfMonth)
        .eq('status', 'confirmed');

      const collected = thisMonth?.reduce((s, c) => s + Number(c.amount), 0) || 0;

      // 2. All active members
      const { data: allMembers } = await supabase
        .from('chama_memberships')
        .select('id, profile_id, role, profiles(full_name)')
        .eq('chama_id', group.id)
        .eq('status', 'active');

      const totalMembers = allMembers?.length || 0;
      const groupAmount = group.contribution_amount || 0;
      const target = groupAmount * totalMembers;
      const progress = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
      const paidIds = new Set(thisMonth?.map(c => c.membership_id));

      setCollectionStats({ collected, target, progress, membersPaid: paidIds.size, totalMembers });

      // 3. Member status table
      const dueDay = group.contribution_due_day || 15;
      const isLate = today.getDate() > dueDay;

      const memberRows = (allMembers || []).map(m => {
        const paid = thisMonth?.filter(c => c.membership_id === m.id).reduce((s, c) => s + Number(c.amount), 0) || 0;
        let status = paid >= groupAmount ? 'Paid' : paid > 0 ? 'Partial' : isLate ? 'Late' : 'Pending';
        return { ...m, full_name: (m.profiles as any)?.full_name || 'Member', paid, status };
      });
      setMemberStatuses(memberRows);

      // 4. My own contributions (all time, last 20)
      const { data: mine } = await supabase
        .from('contributions_v2')
        .select('id, amount, status, mpesa_receipt, created_at, confirmed_at, payment_method')
        .eq('membership_id', member.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setMyContributions(mine || []);

      // 5. Chart — last 6 months
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString();
      const { data: last6 } = await supabase
        .from('contributions_v2')
        .select('amount, created_at')
        .eq('chama_id', group.id)
        .gte('created_at', sixMonthsAgo)
        .eq('status', 'confirmed');

      const monthMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        monthMap[d.toLocaleString('default', { month: 'short' })] = 0;
      }
      last6?.forEach(c => {
        const key = new Date(c.created_at).toLocaleString('default', { month: 'short' });
        if (monthMap[key] !== undefined) monthMap[key] += Number(c.amount);
      });
      setChartData(Object.entries(monthMap).map(([month, amount]) => ({ month, amount })));

    } catch (err) {
      console.error(err);
      setError("Failed to load contributions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && member && group) fetchData();
  }, [authLoading, member, group]);

  // Realtime: refresh when a contribution is confirmed
  useEffect(() => {
    if (!group) return;
    const channel = supabase
      .channel(`contributions-${group.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'contributions_v2',
        filter: `chama_id=eq.${group.id}`
      }, () => {
        fetchData();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'contributions_v2',
        filter: `chama_id=eq.${group.id}`
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [group]);

  const STATUS: Record<string, { kind: ChipKind; label: string }> = {
    Paid: { kind: 'paid', label: 'Paid' },
    Partial: { kind: 'info', label: 'Part paid' },
    Pending: { kind: 'pending', label: 'Not yet' },
    Late: { kind: 'late', label: 'Late' },
    confirmed: { kind: 'paid', label: 'Confirmed' },
    pending: { kind: 'pending', label: 'Waiting for M-Pesa' },
    failed: { kind: 'failed', label: 'Failed' },
    late: { kind: 'late', label: 'Late' },
    partial: { kind: 'info', label: 'Part paid' },
  };
  const badge = (s: string) => {
    const x = STATUS[s] || { kind: 'neutral' as ChipKind, label: s };
    return <Chip kind={x.kind}>{x.label}</Chip>;
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-44 rounded-[28px]" />
        <div className="grid lg:grid-cols-2 gap-4"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <Notice tone="danger" title="Contributions didn't load">
        {error} <button onClick={fetchData} className="underline font-semibold ml-1">Try again</button>
      </Notice>
    );
  }

  const myPaidThisMonth = memberStatuses.find((m) => m.id === member?.id);

  return (
    <div>
      <PageHeader
        title="Contributions"
        subtitle={`What ${group?.name || 'the group'} has collected this month, and your own payment history.`}
        actions={<Button onClick={() => setShowModal(true)}><Plus size={18} aria-hidden="true" />Pay a contribution</Button>}
      />

      <Panel tone="forest" className="rounded-[28px] sm:p-8 mb-4">
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-6 md:gap-10 items-end">
          <div>
            <div className="text-[14px] text-[#A9C2B3]">Collected this month</div>
            <Money value={collectionStats.collected} className="block text-[44px] sm:text-[56px] leading-[1.05] mt-1" />
            <div className="text-[14px] text-[#A9C2B3] mt-1">of {formatKsh(collectionStats.target)} expected</div>
          </div>
          <div>
            <Ticks total={Math.max(collectionStats.totalMembers, 1)} done={collectionStats.membersPaid} className="[&>span]:h-3" />
            <div className="flex justify-between text-[14px] mt-3">
              <span className="text-[#C9DACF]">{collectionStats.membersPaid} of {collectionStats.totalMembers} members have paid</span>
              <span className="font-money text-[20px] text-mint">{collectionStats.progress}%</span>
            </div>
            {myPaidThisMonth && (
              <p className="text-[14px] mt-3 text-[#EEF4EF]">
                {myPaidThisMonth.status === 'Paid' ? 'You have paid this month.' : myPaidThisMonth.paid > 0 ? `You have paid ${formatKsh(myPaidThisMonth.paid)} so far.` : 'You haven\'t paid this month yet.'}
              </p>
            )}
          </div>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Panel aria-labelledby="hist-h">
          <PanelTitle id="hist-h">The last six months</PanelTitle>
          <p className="text-[14px] text-ink-3 mt-1">Confirmed contributions from the whole group.</p>
          {chartData.some((d) => d.amount > 0) ? (
            <div className="h-[230px] mt-4 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--ak-line)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ak-text-3)' }} />
                  <YAxis axisLine={false} tickLine={false} width={40} tick={{ fontSize: 11, fill: 'var(--ak-text-3)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip cursor={{ fill: 'var(--ak-raised)' }} formatter={(v) => [formatKsh(Number(v)), 'Collected']} contentStyle={{ borderRadius: 12, background: 'var(--ak-surface)', border: '1px solid var(--ak-line)', color: 'var(--ak-text)' }} />
                  <Bar dataKey="amount" fill="#3FA673" radius={[8, 8, 2, 2]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No confirmed payments yet">The chart fills in as M-Pesa confirms each contribution.</EmptyState>
          )}
        </Panel>

        <Panel aria-labelledby="who-h" className="flex flex-col">
          <PanelTitle id="who-h">Who has paid this month</PanelTitle>
          <ul className="mt-3 flex-1 max-h-[280px] overflow-y-auto -mx-2">
            {memberStatuses.length === 0 ? (
              <li className="px-2 py-6 text-ink-3 text-[14px]">No active members yet.</li>
            ) : memberStatuses.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-2 py-2.5 border-t border-line first:border-t-0">
                <Avatar name={m.full_name} size={34} tone={m.id === member?.id ? 'lavender' : 'sage'} />
                <span className="flex-1 min-w-0 truncate text-[15px]">{m.id === member?.id ? 'You' : m.full_name}</span>
                <Money value={m.paid} className="text-[16px] text-ink-2" />
                {badge(m.status)}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel aria-labelledby="mine-h">
        <PanelTitle id="mine-h" action={<span className="text-[13px] text-ink-3">{myContributions.length} payments</span>}>Your payments</PanelTitle>
        {myContributions.length === 0 ? (
          <EmptyState title="No payments yet" action={<Button onClick={() => setShowModal(true)}>Make your first contribution</Button>}>
            When you pay, the M-Pesa receipt shows here so you never need to keep the SMS.
          </EmptyState>
        ) : (
          <TableWrap className="mt-3">
            <table className={cn(tableClass, 'min-w-[560px]')}>
              <thead><tr><th>Date</th><th className="!text-right">Amount</th><th>Paid by</th><th>Receipt</th><th>Status</th></tr></thead>
              <tbody>
                {myContributions.map((c) => (
                  <tr key={c.id}>
                    <td className="text-ink-2 whitespace-nowrap">{new Date(c.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="text-right whitespace-nowrap"><Money value={Number(c.amount)} className="text-[17px]" /></td>
                    <td className="text-ink-2">{c.payment_method === 'cash' ? 'Cash' : c.payment_method === 'bank' ? 'Bank' : 'M-Pesa'}</td>
                    <td className="font-mono text-[12px] text-ink-3">{c.mpesa_receipt || '—'}</td>
                    <td>{badge(c.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      {showModal && (
        <NewContributionModal
          onClose={() => {
            setShowModal(false);
            fetchData();
          }}
          defaultAmount={group?.contribution_amount || 500}
          memberPhone={(member as any)?.profile?.phone_number || (member as any)?.profiles?.phone_number || (member as any)?.phone_number || ''}
          membershipId={member?.id || ''}
          chamaId={group?.id || ''}
          chamaName={group?.name || ''}
        />
      )}
    </div>
  );
}

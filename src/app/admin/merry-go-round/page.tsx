'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped API rows */

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { Avatar, Button, Chip, Money, Notice, PageHeader, Panel, PanelTitle, Ticks, WovenRing, cn, formatKsh, initialsOf, type Seat } from '@/components/ui';
import PageSkeleton from '@/components/PageSkeleton';

export default function AdminMerryGoRoundPage() {
  const { group } = useAuth();
  const chamaId = group?.id;

  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Setup form
  const [name, setName] = useState('Merry-go-round');
  const [amount, setAmount] = useState('1000');
  const [frequency, setFrequency] = useState('monthly');
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchStatus = async () => {
    if (!chamaId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/merry-go-round/status?chama_id=${chamaId}`);
      const data = await res.json();
      if (data.success) {
        setCycle(data.cycle);
        setSchedule(data.schedule);
        setContributions(data.contributions);
      }

      // Fetch group members for setup
      const { data: memberData } = await supabase
        .from('chama_memberships')
        .select('id, profile_id, role, profiles(full_name)')
        .eq('chama_id', chamaId)
        .eq('status', 'active');

      if (memberData) {
        setMembers(memberData);
        if (selectedOrder.length === 0) {
          setSelectedOrder(memberData.map(m => m.id));
        }
      }
    } catch (err) {
      console.error('Error fetching MGR status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chamaId) fetchStatus();
  }, [chamaId]);

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chamaId || selectedOrder.length === 0) return;
    setCreating(true);
    setActionError('');

    try {
      const res = await fetch('/api/merry-go-round/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chama_id: chamaId,
          name,
          amount_per_member: Number(amount),
          frequency,
          recipient_member_ids: selectedOrder
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to create cycle.');
      } else {
        setActionSuccess('The merry-go-round has started. Members can see the order now.');
        fetchStatus();
      }
    } catch (err: any) {
      setActionError('Network error. Failed to create cycle.');
    } finally {
      setCreating(false);
    }
  };

  const handlePayout = async (roundNum: number) => {
    if (!cycle) return;
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch('/api/merry-go-round/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycle_id: cycle.id,
          round_number: roundNum
        })
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Round ${roundNum} is marked as paid out.`);
        fetchStatus();
      } else {
        setActionError(data.error || 'Failed to process payout.');
      }
    } catch (err) {
      setActionError('Error processing payout.');
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const nameOfMember = (id: string) => (members.find((m) => m.id === id)?.profiles as any)?.full_name || 'Member';
  const nameOf = (s: any) => s?.chama_memberships?.profiles?.full_name || nameOfMember(s?.recipient_membership_id);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= selectedOrder.length) return;
    const next = [...selectedOrder];
    [next[i], next[j]] = [next[j], next[i]];
    setSelectedOrder(next);
  };
  const toggle = (id: string) => setSelectedOrder((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const active = cycle && cycle.status === 'active';
  const seats: Seat[] = schedule.map((s: any) => ({
    initials: initialsOf(nameOf(s)),
    state: s.round_number === cycle?.current_round ? 'current' : s.status === 'paid' ? 'received' : 'upcoming',
  }));
  const paidThisRound = new Set(contributions.map((c: any) => c.membership_id));

  return (
    <div>
      <PageHeader title="Merry-go-round" subtitle="Set the order once. Each round everyone pays in, and you release the pot to that round's member." />

      {actionError && <Notice tone="danger" className="mb-4">{actionError}</Notice>}
      {actionSuccess && <Notice tone="ok" className="mb-4">{actionSuccess}</Notice>}

      {!active ? (
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-4 items-start">
          <Panel tone="forest" className="rounded-[28px] sm:p-8">
            <h2 className="font-display text-[28px]">Start a new round</h2>
            <p className="text-[15px] text-[#A9C2B3] mt-1">Members see their place in the order as soon as you start.</p>
            <form onSubmit={handleCreateCycle} className="flex flex-col gap-5 mt-6">
              <label className="flex flex-col gap-2 text-[14px]">
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} className="h-12 px-4 rounded-[14px] bg-canopy border border-[#2F5A45] text-[16px] focus:outline-none focus:border-mint" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-2 text-[14px]">
                  Each member pays
                  <input type="number" inputMode="numeric" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 px-4 rounded-[14px] bg-canopy border border-[#2F5A45] text-[16px] focus:outline-none focus:border-mint" />
                </label>
                <label className="flex flex-col gap-2 text-[14px]">
                  How often
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="h-12 px-4 rounded-[14px] bg-canopy border border-[#2F5A45] text-[16px] focus:outline-none focus:border-mint">
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Every two weeks</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
              </div>
              <div className="rounded-[18px] bg-canopy p-4">
                <div className="text-[13px] text-[#A9C2B3]">Each round&apos;s pot</div>
                <div className="font-money text-[32px]">{formatKsh(Number(amount || 0) * selectedOrder.length)}</div>
                <div className="text-[13px] text-[#A9C2B3]">{selectedOrder.length} members, {selectedOrder.length} rounds</div>
              </div>
              <Button type="submit" variant="mint" size="lg" disabled={creating || selectedOrder.length < 2}>{creating ? 'Starting…' : 'Start the merry-go-round'}</Button>
            </form>
          </Panel>

          <Panel>
            <PanelTitle>The order</PanelTitle>
            <p className="text-[14px] text-ink-3 mt-1">Round 1 receives first. Use the arrows to reorder; untick anyone who is sitting this one out.</p>
            <ol className="mt-4 flex flex-col gap-1.5">
              {selectedOrder.map((id, i) => (
                <li key={id} className="flex items-center gap-3 px-3 py-2 rounded-[14px] bg-surface-2">
                  <span className="w-16 text-[13px] text-ink-3">Round {i + 1}</span>
                  <Avatar name={nameOfMember(id)} size={30} tone="sage" />
                  <span className="flex-1 min-w-0 truncate text-[15px]">{nameOfMember(id)}</span>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${nameOfMember(id)} earlier`} className="w-9 h-9 rounded-full hover:bg-raised disabled:opacity-30 flex items-center justify-center"><ChevronUp size={16} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === selectedOrder.length - 1} aria-label={`Move ${nameOfMember(id)} later`} className="w-9 h-9 rounded-full hover:bg-raised disabled:opacity-30 flex items-center justify-center"><ChevronDown size={16} /></button>
                  <button type="button" onClick={() => toggle(id)} aria-label={`Leave ${nameOfMember(id)} out`} className="w-9 h-9 rounded-full hover:bg-raised flex items-center justify-center text-ink-3"><X size={16} /></button>
                </li>
              ))}
            </ol>
            {members.filter((m) => !selectedOrder.includes(m.id)).length > 0 && (
              <div className="mt-4">
                <div className="text-[13px] text-ink-3 mb-2">Left out</div>
                <div className="flex flex-wrap gap-2">
                  {members.filter((m) => !selectedOrder.includes(m.id)).map((m) => (
                    <button key={m.id} type="button" onClick={() => toggle(m.id)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-dashed border-line-strong text-[13px] hover:bg-raised">
                      <Plus size={14} aria-hidden="true" />{(m.profiles as any)?.full_name || 'Member'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Panel>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4 items-start">
          <Panel tone="forest" className="rounded-[28px] flex flex-col items-center text-center sm:p-8">
            <div className="text-[14px] text-[#A9C2B3]">{cycle.name}</div>
            <WovenRing size={300} seats={seats} seatSize={36} className="mt-4" label={`Round ${cycle.current_round} of ${cycle.total_rounds}`}>
              <span className="text-[13px] text-[#8FAA9B]">Round {cycle.current_round} of {cycle.total_rounds}</span>
              <Money value={Number(cycle.amount_per_member) * schedule.length} className="text-[32px] leading-tight mt-1" />
            </WovenRing>
            <div className="w-full mt-6">
              <Ticks total={Math.max(schedule.length, 1)} done={paidThisRound.size} />
              <p className="text-[14px] text-[#C9DACF] mt-2">{paidThisRound.size} of {schedule.length} have paid into this round</p>
            </div>
          </Panel>

          <Panel>
            <PanelTitle>Rounds</PanelTitle>
            <ol className="mt-3 flex flex-col gap-1.5">
              {schedule.map((item: any) => {
                const isCurrent = item.round_number === cycle.current_round;
                return (
                  <li key={item.id} className={cn('flex flex-wrap items-center gap-3 px-3 py-2.5 rounded-[14px]', isCurrent ? 'bg-mint text-forest' : item.status === 'paid' ? 'bg-surface-2' : 'border border-dashed border-line-strong/60')}>
                    <span className="w-16 text-[13px] opacity-80">Round {item.round_number}</span>
                    <span className="flex-1 min-w-[120px] truncate text-[15px] font-medium">{nameOf(item)}</span>
                    <span className="text-[13px] opacity-80">{item.scheduled_date ? new Date(item.scheduled_date + 'T00:00:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : ''}</span>
                    {item.status === 'paid' ? (
                      <Chip kind="paid">Paid out</Chip>
                    ) : isCurrent ? (
                      <Button size="sm" variant="forest" onClick={() => { if (confirm(`Mark round ${item.round_number} as paid out to ${nameOf(item)}? Only do this once the money has been sent.`)) handlePayout(item.round_number); }}>Mark paid out</Button>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </Panel>
        </div>
      )}
    </div>
  );
}

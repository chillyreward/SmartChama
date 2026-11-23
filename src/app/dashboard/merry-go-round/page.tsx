'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped API rows */

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Check, RefreshCw } from 'lucide-react';
import { Button, Money, Notice, PageHeader, Panel, PanelTitle, Skeleton, Ticks, WovenRing, cn, formatKsh, initialsOf, type Seat } from '@/components/ui';

export default function MemberMerryGoRoundPage() {
  const { member, group } = useAuth();
  const chamaId = group?.id;
  const memberId = member?.id;

  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [contributing, setContributing] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

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
    } catch (err) {
      console.error('Error fetching MGR status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chamaId) fetchStatus();
  }, [chamaId]);

  const handleContribute = async () => {
    if (!cycle || !memberId) return;
    setContributing(true);
    setMsg({ error: '', success: '' });

    try {
      const res = await fetch('/api/merry-go-round/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycle_id: cycle.id,
          round_number: cycle.current_round,
          membership_id: memberId,
          amount: cycle.amount_per_member
        })
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ error: '', success: `${formatKsh(cycle.amount_per_member)} recorded for round ${cycle.current_round}.` });
        fetchStatus();
      } else {
        setMsg({ error: data.error || 'Failed to record contribution.', success: '' });
      }
    } catch (err) {
      setMsg({ error: 'Network error. Please try again.', success: '' });
    } finally {
      setContributing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-64" />
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-4"><Skeleton className="h-[440px] rounded-[28px]" /><Skeleton className="h-[440px]" /></div>
      </div>
    );
  }

  const myRoundItem = schedule.find((s: any) => s.recipient_membership_id === memberId);
  const currentRecipient = schedule.find((s: any) => s.round_number === cycle?.current_round);
  const hasContributedCurrentRound = contributions.some((c: any) => c.membership_id === memberId);
  const nameOf = (s: any) => s?.chama_memberships?.profiles?.full_name || 'Member';
  const when = (d?: string | null) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Date to be set');
  const seats: Seat[] = schedule.map((s: any) => ({
    initials: initialsOf(nameOf(s)),
    state: s.round_number === cycle?.current_round ? 'current' : s.status === 'paid' ? 'received' : s.recipient_membership_id === memberId ? 'me' : 'upcoming',
  }));
  const pot = cycle ? Number(cycle.amount_per_member) * schedule.length : 0;

  return (
    <div>
      <PageHeader title="Merry-go-round" subtitle="Each round, everyone pays in and one member takes the whole pot. The order is set by your officials." />

      {msg.error && <Notice tone="danger" className="mb-4">{msg.error}</Notice>}
      {msg.success && <Notice tone="ok" className="mb-4">{msg.success}</Notice>}

      {!cycle || cycle.status !== 'active' ? (
        <Panel className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <WovenRing size={140} seatSize={22} label="No round is running">
            <RefreshCw size={26} className="text-mint" aria-hidden="true" />
          </WovenRing>
          <div>
            <h2 className="font-display text-[26px]">No round is running right now</h2>
            <p className="text-[15px] text-ink-2 mt-1 max-w-[52ch]">When your officials start a merry-go-round, you&apos;ll see the order, your turn and the pot here, and you&apos;ll get a notification.</p>
          </div>
        </Panel>
      ) : (
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-4 items-start">
          <Panel tone="forest" className="rounded-[28px] flex flex-col items-center text-center sm:p-8">
            <div className="text-[14px] text-[#A9C2B3]">{cycle.name}</div>
            <WovenRing
              size={300}
              seats={seats}
              seatSize={36}
              className="mt-4 max-w-full"
              label={`Round ${cycle.current_round} of ${cycle.total_rounds}. ${currentRecipient ? nameOf(currentRecipient) + ' receives this round.' : ''}`}
            >
              <span className="text-[13px] text-[#8FAA9B]">Round {cycle.current_round} of {cycle.total_rounds}</span>
              <Money value={pot} className="text-[34px] leading-tight mt-1" />
              {currentRecipient && (
                <span className="text-[14px] text-[#C9DACF] mt-1 max-w-[18ch]">
                  to {currentRecipient.recipient_membership_id === memberId ? 'you' : nameOf(currentRecipient).split(' ')[0]}, {when(currentRecipient.scheduled_date)}
                </span>
              )}
            </WovenRing>

            <div className="w-full mt-6">
              <Ticks total={Math.max(schedule.length, 1)} done={contributions.length} />
              <p className="text-[14px] text-[#C9DACF] mt-2">{contributions.length} of {schedule.length} have paid into this round</p>
            </div>

            <div className="w-full mt-5">
              {hasContributedCurrentRound ? (
                <div className="h-[52px] rounded-full bg-canopy flex items-center justify-center gap-2 text-[15px] text-mint font-semibold">
                  <Check size={18} aria-hidden="true" /> You&apos;ve paid round {cycle.current_round}
                </div>
              ) : (
                <Button variant="mint" size="lg" className="w-full" onClick={handleContribute} disabled={contributing}>
                  {contributing ? 'Recording…' : `Pay ${formatKsh(cycle.amount_per_member)} for round ${cycle.current_round}`}
                </Button>
              )}
            </div>
            {myRoundItem && (
              <p className="mt-4 font-display text-[20px] text-[#EEF4EF]">
                {myRoundItem.status === 'paid' ? `You received in round ${myRoundItem.round_number}` : `Your turn: round ${myRoundItem.round_number}, ${when(myRoundItem.scheduled_date)}`}
              </p>
            )}
          </Panel>

          <Panel aria-labelledby="order-h">
            <PanelTitle id="order-h">The order</PanelTitle>
            <ol className="mt-3 flex flex-col gap-1.5">
              {schedule.map((item: any) => {
                const isMe = item.recipient_membership_id === memberId;
                const isCurrent = item.round_number === cycle.current_round;
                return (
                  <li
                    key={item.id}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-[14px]',
                      isCurrent ? 'bg-mint text-forest' : isMe ? 'bg-lavender text-lavender-ink' : item.status === 'paid' ? 'bg-surface-2' : 'border border-dashed border-line-strong/60',
                    )}
                  >
                    <span className="w-16 text-[13px] opacity-80">Round {item.round_number}</span>
                    <span className="flex-1 min-w-0 truncate text-[15px] font-medium">{isMe ? 'You' : nameOf(item)}</span>
                    <span className="text-[13px] opacity-80 whitespace-nowrap">
                      {item.status === 'paid' ? 'Received' : isCurrent ? 'This round' : when(item.scheduled_date)}
                    </span>
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

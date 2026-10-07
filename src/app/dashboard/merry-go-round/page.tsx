'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { RefreshCw, CheckCircle, Clock, Calendar, Gift, AlertCircle } from 'lucide-react';

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
        setMsg({ error: '', success: `KSh ${Number(cycle.amount_per_member).toLocaleString('en-KE')} recorded for Round ${cycle.current_round}!` });
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
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  // Find user's scheduled round
  const myRoundItem = schedule.find((s: any) => s.recipient_membership_id === memberId);
  const currentRecipient = schedule.find((s: any) => s.round_number === cycle?.current_round);
  const hasContributedCurrentRound = contributions.some((c: any) => c.membership_id === memberId);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-geist flex items-center gap-2 text-[var(--text-primary)]">
          <RefreshCw className="w-7 h-7 text-[#22C55E]" />
          Merry-Go-Round
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Rotating group savings. Every round, one member receives the accumulated pool.
        </p>
      </div>

      {msg.error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {msg.error}
        </div>
      )}

      {msg.success && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {msg.success}
        </div>
      )}

      {!cycle || cycle.status !== 'active' ? (
        <div className="sc-card p-8 rounded-2xl border text-center space-y-3">
          <Gift className="w-12 h-12 text-[var(--text-muted)] mx-auto" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">No Active Cycle</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            There is currently no active Merry-Go-Round cycle running in your Chama. Your admin will notify you when a new round starts.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="sc-card p-6 md:p-8 rounded-2xl border bg-gradient-to-br from-green-500/10 via-transparent to-transparent space-y-6 border-[#22C55E]/20">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <span className="text-xs font-bold text-[#22C55E] uppercase tracking-wider">Round {cycle.current_round} of {cycle.total_rounds}</span>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{cycle.name}</h2>
              </div>
              {myRoundItem && (
                <div className="text-right bg-[var(--bg-card)] border border-[var(--border)] px-4 py-2 rounded-xl">
                  <p className="text-xs text-[var(--text-muted)]">Your Turn</p>
                  <p className="text-sm font-bold text-[#22C55E]">Round {myRoundItem.round_number} ({myRoundItem.scheduled_date || 'TBD'})</p>
                </div>
              )}
            </div>

            {/* Current Round Recipient */}
            {currentRecipient && (
              <div className="p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center font-bold">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Current Round Recipient</p>
                    <p className="text-base font-bold text-[var(--text-primary)]">
                      {currentRecipient.chama_memberships?.profiles?.full_name || 'Member'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {hasContributedCurrentRound ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs font-bold w-full sm:w-auto justify-center">
                      <CheckCircle className="w-4 h-4" /> You Paid Round {cycle.current_round}
                    </span>
                  ) : (
                    <button
                      onClick={handleContribute}
                      disabled={contributing}
                      className="px-6 py-2.5 rounded-xl font-bold bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors disabled:opacity-50 w-full sm:w-auto text-sm">
                      {contributing ? 'Recording...' : `Pay KSh ${Number(cycle.amount_per_member).toLocaleString('en-KE')}`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Full Schedule List */}
          <div className="sc-card p-6 rounded-2xl border space-y-4">
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#22C55E]" />
              Payout Schedule
            </h3>
            <div className="divide-y divide-[var(--border)]">
              {schedule.map((item: any) => {
                const isMe = item.recipient_membership_id === memberId;
                const isCurrent = item.round_number === cycle.current_round;

                return (
                  <div key={item.id} className={`py-3.5 px-2 flex justify-between items-center ${isMe ? 'font-bold' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.status === 'paid' 
                          ? 'bg-green-100 dark:bg-green-950/30 text-[#22C55E]' 
                          : isCurrent 
                          ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600' 
                          : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                      }`}>
                        R{item.round_number}
                      </div>
                      <div>
                        <p className="text-sm text-[var(--text-primary)] flex items-center gap-2">
                          {item.chama_memberships?.profiles?.full_name || 'Member'}
                          {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E]">You</span>}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">{item.scheduled_date || 'TBD'}</p>
                      </div>
                    </div>

                    <div>
                      {item.status === 'paid' ? (
                        <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Disbursed
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Scheduled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

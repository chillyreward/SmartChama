'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Plus, CheckCircle, Clock, Send, Users, AlertCircle } from 'lucide-react';
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
  const [name, setName] = useState('Merry-Go-Round Cycle');
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
        setActionSuccess('Merry-Go-Round cycle created successfully!');
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
        setActionSuccess(`Payout for Round ${roundNum} marked as completed.`);
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

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-geist flex items-center gap-2 text-[var(--text-primary)]">
            <RefreshCw className="w-7 h-7 text-[#22C55E]" />
            Merry-Go-Round (Rotating Savings)
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage revolving payouts and member rotation schedules for your Chama.
          </p>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* Active Cycle View or Setup Form */}
      {cycle && cycle.status === 'active' ? (
        <div className="space-y-6">
          {/* Active Cycle Overview Card */}
          <div className="sc-card p-6 rounded-2xl border space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b pb-4 border-[var(--border)]">
              <div>
                <span className="text-xs font-semibold text-[#22C55E] uppercase tracking-wider">Active Cycle</span>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{cycle.name}</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-950/30 text-[#22C55E]">
                  Round {cycle.current_round} of {cycle.total_rounds}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] capitalize">
                  {cycle.frequency}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Amount per Member</p>
                <p className="text-xl font-bold text-[var(--text-primary)] mt-1">KSh {Number(cycle.amount_per_member).toLocaleString('en-KE')}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Total Pot / Round</p>
                <p className="text-xl font-bold text-[#22C55E] mt-1">KSh {(Number(cycle.amount_per_member) * cycle.total_rounds).toLocaleString('en-KE')}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Current Round Status</p>
                <p className="text-xl font-bold text-[var(--text-primary)] mt-1">{contributions.length} / {cycle.total_rounds} Paid</p>
              </div>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="sc-card p-6 rounded-2xl border space-y-4">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Payout Rotation Schedule</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm sc-table">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-3 px-4">Round</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Scheduled Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {schedule.map((item: any) => {
                    const isCurrent = item.round_number === cycle.current_round;
                    const recipientName = item.chama_memberships?.profiles?.full_name || 'Member';

                    return (
                      <tr key={item.id} className={isCurrent ? 'bg-green-50/50 dark:bg-green-950/10 font-medium' : ''}>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5">
                            Round {item.round_number}
                            {isCurrent && <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">{recipientName}</td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">{item.scheduled_date || 'TBD'}</td>
                        <td className="py-3 px-4">
                          {item.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-bold">
                              <CheckCircle className="w-3.5 h-3.5" /> Disbursed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                              <Clock className="w-3.5 h-3.5" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {item.status !== 'paid' && (
                            <button
                              onClick={() => handlePayout(item.round_number)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors">
                              Release Payout
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Setup Form for New Cycle */
        <div className="sc-card p-6 md:p-8 rounded-2xl border max-w-2xl mx-auto space-y-6">
          <div className="border-b pb-4 border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#22C55E]" />
              Start New Merry-Go-Round Cycle
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Configure contribution amounts and member rotation sequence.
            </p>
          </div>

          <form onSubmit={handleCreateCycle} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Cycle Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. 2026 Round 1"
                className="w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:border-[#22C55E]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Contribution per Member (KSh)</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:border-[#22C55E]">
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Payout Sequence ({selectedOrder.length} Members)
              </label>
              <div className="space-y-2 border rounded-xl p-3 max-h-60 overflow-y-auto border-[var(--border)] bg-[var(--bg-muted)]">
                {members.map((m, idx) => (
                  <div key={m.id} className="flex justify-between items-center p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm">
                    <span className="font-medium text-[var(--text-primary)]">{idx + 1}. {m.profiles?.full_name || 'Member'}</span>
                    <span className="text-xs text-[var(--text-muted)] capitalize">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3.5 rounded-xl font-bold bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {creating ? 'Launching...' : 'Launch Cycle'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

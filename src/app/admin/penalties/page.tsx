'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/../components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, Plus, CheckCircle, XCircle, AlertCircle, Search, Filter } from 'lucide-react';
import PageSkeleton from '@/components/PageSkeleton';

export default function AdminPenaltiesPage() {
  const { group } = useAuth();
  const chamaId = group?.id;

  const [loading, setLoading] = useState(true);
  const [penalties, setPenalties] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [showImposeModal, setShowImposeModal] = useState(false);

  // Impose Form
  const [selectedMember, setSelectedMember] = useState('');
  const [penaltyType, setPenaltyType] = useState('late_contribution');
  const [amount, setAmount] = useState('200');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

  const fetchPenalties = async () => {
    if (!chamaId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/penalties/list?chama_id=${chamaId}`);
      const data = await res.json();
      if (data.success) {
        setPenalties(data.penalties);
      }

      const { data: memberData } = await supabase
        .from('chama_memberships')
        .select('id, profile_id, role, profiles(full_name)')
        .eq('chama_id', chamaId)
        .eq('status', 'active');

      if (memberData) {
        setMembers(memberData);
        if (!selectedMember && memberData.length > 0) {
          setSelectedMember(memberData[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching penalties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chamaId) fetchPenalties();
  }, [chamaId]);

  const handleImpose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chamaId || !selectedMember || !amount) return;
    setSubmitting(true);
    setMsg({ error: '', success: '' });

    try {
      const res = await fetch('/api/penalties/impose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chama_id: chamaId,
          membership_id: selectedMember,
          type: penaltyType,
          amount: Number(amount),
          reason
        })
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ error: '', success: 'Penalty imposed successfully!' });
        setShowImposeModal(false);
        setReason('');
        fetchPenalties();
      } else {
        setMsg({ error: data.error || 'Failed to impose penalty.', success: '' });
      }
    } catch (err) {
      setMsg({ error: 'Network error. Please try again.', success: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (penaltyId: string, action: 'pay' | 'waive') => {
    try {
      const res = await fetch('/api/penalties/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ penalty_id: penaltyId, action })
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ error: '', success: `Penalty marked as ${action === 'pay' ? 'paid' : 'waived'}.` });
        fetchPenalties();
      } else {
        setMsg({ error: data.error || 'Failed to update penalty status.', success: '' });
      }
    } catch (err) {
      setMsg({ error: 'Error updating penalty status.', success: '' });
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const unpaidTotal = penalties.filter(p => p.status === 'unpaid').reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-geist flex items-center gap-2 text-[var(--text-primary)]">
            <ShieldAlert className="w-7 h-7 text-[#22C55E]" />
            Member Penalties & Fines
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Enforce rules, track late contribution fines, and manage penalty settlements.
          </p>
        </div>
        <button
          onClick={() => setShowImposeModal(true)}
          className="px-4 py-2.5 rounded-xl font-bold bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors flex items-center gap-2 text-sm shadow-sm">
          <Plus className="w-4 h-4" /> Impose Penalty
        </button>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sc-card p-5 rounded-2xl border">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Total Penalties</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{penalties.length}</p>
        </div>
        <div className="sc-card p-5 rounded-2xl border">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Unpaid Fines Total</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">KSh {unpaidTotal.toLocaleString('en-KE')}</p>
        </div>
        <div className="sc-card p-5 rounded-2xl border">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Settled & Waived</p>
          <p className="text-2xl font-bold text-[#22C55E] mt-1">{penalties.filter(p => p.status !== 'unpaid').length}</p>
        </div>
      </div>

      {/* Penalties List Table */}
      <div className="sc-card p-6 rounded-2xl border space-y-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Penalties Log</h3>
        
        {penalties.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-6 text-center">No penalties recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm sc-table">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {penalties.map(p => {
                  const memberName = p.chama_memberships?.profiles?.full_name || 'Member';
                  return (
                    <tr key={p.id}>
                      <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">{memberName}</td>
                      <td className="py-3 px-4 text-xs font-medium capitalize text-[var(--text-secondary)]">
                        {p.type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-xs text-[var(--text-muted)]">{p.reason || 'N/A'}</td>
                      <td className="py-3 px-4 font-bold text-[var(--text-primary)]">KSh {Number(p.amount).toLocaleString('en-KE')}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                          p.status === 'paid' 
                            ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' 
                            : p.status === 'waived' 
                            ? 'bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)]' 
                            : 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {p.status === 'unpaid' && (
                          <>
                            <button
                              onClick={() => handleAction(p.id, 'pay')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#22C55E] text-white hover:bg-[#16A34A]">
                              Mark Paid
                            </button>
                            <button
                              onClick={() => handleAction(p.id, 'waive')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]">
                              Waive
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Impose Penalty Modal */}
      {showImposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="sc-card w-full max-w-md p-6 rounded-2xl border space-y-4">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Impose Fine / Penalty</h3>

            <form onSubmit={handleImpose} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Select Member</label>
                <select
                  value={selectedMember}
                  onChange={e => setSelectedMember(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:border-[#22C55E]">
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.profiles?.full_name || 'Member'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Violation Type</label>
                <select
                  value={penaltyType}
                  onChange={e => setPenaltyType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:border-[#22C55E]">
                  <option value="late_contribution">Late Contribution</option>
                  <option value="missed_meeting">Missed Meeting</option>
                  <option value="loan_default">Loan Default</option>
                  <option value="custom">Custom Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Fine Amount (KSh)</label>
                <input
                  type="number"
                  required
                  min="10"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Reason / Description</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Late contribution for October"
                  className="w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImposeModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-secondary)]">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-[#22C55E] text-white hover:bg-[#16A34A]">
                  {submitting ? 'Imposing...' : 'Confirm Penalty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/../components/AuthProvider';
import { Heart, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function MemberWelfarePage() {
  const { member, group } = useAuth();
  const chamaId = group?.id;
  const memberId = member?.id;

  const [loading, setLoading] = useState(true);
  const [fund, setFund] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Form
  const [category, setCategory] = useState('bereavement');
  const [amount, setAmount] = useState('5000');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

  const fetchWelfare = async () => {
    if (!chamaId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/welfare/status?chama_id=${chamaId}`);
      const data = await res.json();
      if (data.success) {
        setFund(data.fund);
        setClaims(data.claims.filter((c: any) => c.membership_id === memberId));
      }
    } catch (err) {
      console.error('Error fetching welfare:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chamaId) fetchWelfare();
  }, [chamaId]);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chamaId || !memberId || !amount) return;
    setSubmitting(true);
    setMsg({ error: '', success: '' });

    try {
      const res = await fetch('/api/welfare/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chama_id: chamaId,
          membership_id: memberId,
          amount: Number(amount),
          reason: category,
          description
        })
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ error: '', success: 'Welfare claim submitted for admin review.' });
        setShowClaimModal(false);
        setDescription('');
        fetchWelfare();
      } else {
        setMsg({ error: data.error || 'Failed to submit claim.', success: '' });
      }
    } catch (err) {
      setMsg({ error: 'Network error. Please try again.', success: '' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-44 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-geist flex items-center gap-2 text-[var(--text-primary)]">
            <Heart className="w-7 h-7 text-[#22C55E]" />
            Welfare & Emergency Fund
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Access financial support for medical expenses, bereavement, and family emergencies.
          </p>
        </div>
        <button
          onClick={() => setShowClaimModal(true)}
          className="px-4 py-2.5 rounded-xl font-bold bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Request Emergency Claim
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

      {/* Welfare Overview Card */}
      <div className="sc-card p-6 md:p-8 rounded-2xl border bg-gradient-to-br from-green-500/10 via-transparent to-transparent border-[#22C55E]/20 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Group Welfare Balance</p>
            <p className="text-2xl font-bold text-[#22C55E] mt-1">KSh {Number(fund?.balance || 0).toLocaleString('en-KE')}</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Monthly Contribution</p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1">KSh {Number(fund?.monthly_contribution || 500).toLocaleString('en-KE')}</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Max Claim Limit</p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1">KSh {Number(fund?.max_claim_amount || 50000).toLocaleString('en-KE')}</p>
          </div>
        </div>
      </div>

      {/* My Claims List */}
      <div className="sc-card p-6 rounded-2xl border space-y-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">My Claims History</h3>

        {claims.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-6 text-center">You have not submitted any welfare claims.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {claims.map(c => (
              <div key={c.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[var(--text-primary)] capitalize">{c.reason}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                      c.status === 'paid' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                      c.status === 'approved' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' :
                      c.status === 'rejected' ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400' :
                      'bg-amber-100 dark:bg-amber-950/30 text-amber-600'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{c.description || 'Emergency assistance claim'}</p>
                </div>
                <span className="text-base font-bold text-[var(--text-primary)]">KSh {Number(c.amount).toLocaleString('en-KE')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="sc-card w-full max-w-md p-6 rounded-2xl border space-y-4">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Submit Welfare Claim</h3>

            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Claim Reason</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:border-[#22C55E]">
                  <option value="bereavement">Bereavement Support</option>
                  <option value="medical">Medical / Hospitalization</option>
                  <option value="wedding">Wedding Contribution</option>
                  <option value="education">Education Support</option>
                  <option value="other">Other Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Requested Amount (KSh)</label>
                <input
                  type="number"
                  required
                  min="500"
                  max={fund?.max_claim_amount || 50000}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Details / Supporting Context</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide context for your claim..."
                  className="w-full px-4 py-2.5 rounded-xl border bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-secondary)]">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-[#22C55E] text-white hover:bg-[#16A34A]">
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

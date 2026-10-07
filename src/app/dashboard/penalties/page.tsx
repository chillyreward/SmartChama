'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/../components/AuthProvider';
import { ShieldAlert, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function MemberPenaltiesPage() {
  const { member, group } = useAuth();
  const chamaId = group?.id;
  const memberId = member?.id;

  const [loading, setLoading] = useState(true);
  const [penalties, setPenalties] = useState<any[]>([]);
  const [msg, setMsg] = useState({ error: '', success: '' });

  const fetchPenalties = async () => {
    if (!chamaId || !memberId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/penalties/list?chama_id=${chamaId}&membership_id=${memberId}`);
      const data = await res.json();
      if (data.success) {
        setPenalties(data.penalties);
      }
    } catch (err) {
      console.error('Error fetching penalties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chamaId && memberId) fetchPenalties();
  }, [chamaId, memberId]);

  const handlePay = async (penaltyId: string) => {
    setMsg({ error: '', success: '' });
    try {
      const res = await fetch('/api/penalties/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ penalty_id: penaltyId, action: 'pay' })
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ error: '', success: 'Fine paid successfully!' });
        fetchPenalties();
      } else {
        setMsg({ error: data.error || 'Failed to settle fine.', success: '' });
      }
    } catch (err) {
      setMsg({ error: 'Error processing fine payment.', success: '' });
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

  const unpaidCount = penalties.filter(p => p.status === 'unpaid').length;
  const unpaidTotal = penalties.filter(p => p.status === 'unpaid').reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-geist flex items-center gap-2 text-[var(--text-primary)]">
          <ShieldAlert className="w-7 h-7 text-[#22C55E]" />
          My Fines & Penalties
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Track and settle any fines for late contributions or missed meetings.
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

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sc-card p-6 rounded-2xl border">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Unpaid Fines Count</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{unpaidCount}</p>
        </div>
        <div className="sc-card p-6 rounded-2xl border">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Total Outstanding Fine</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">KSh {unpaidTotal.toLocaleString('en-KE')}</p>
        </div>
      </div>

      {/* List */}
      <div className="sc-card p-6 rounded-2xl border space-y-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Penalty Records</h3>

        {penalties.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <CheckCircle className="w-10 h-10 text-[#22C55E] mx-auto" />
            <p className="text-base font-bold text-[var(--text-primary)]">Clean Record!</p>
            <p className="text-xs text-[var(--text-muted)]">You have no fines or penalties in this Chama.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {penalties.map(p => (
              <div key={p.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[var(--text-primary)] capitalize">{p.type.replace('_', ' ')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                      p.status === 'paid' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                      p.status === 'waived' ? 'bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)]' :
                      'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{p.reason || 'Fine imposed'}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                  <span className="text-base font-bold text-[var(--text-primary)]">KSh {Number(p.amount).toLocaleString('en-KE')}</span>
                  {p.status === 'unpaid' && (
                    <button
                      onClick={() => handlePay(p.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#22C55E] text-white hover:bg-[#16A34A]">
                      Pay Fine
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

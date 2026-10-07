'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/../components/AuthProvider';
import { Heart, CheckCircle, XCircle, AlertCircle, DollarSign, UserCheck } from 'lucide-react';
import PageSkeleton from '@/components/PageSkeleton';

export default function AdminWelfarePage() {
  const { group } = useAuth();
  const chamaId = group?.id;

  const [loading, setLoading] = useState(true);
  const [fund, setFund] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [msg, setMsg] = useState({ error: '', success: '' });

  const fetchWelfareStatus = async () => {
    if (!chamaId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/welfare/status?chama_id=${chamaId}`);
      const data = await res.json();
      if (data.success) {
        setFund(data.fund);
        setClaims(data.claims);
      }
    } catch (err) {
      console.error('Error fetching welfare status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chamaId) fetchWelfareStatus();
  }, [chamaId]);

  const handleAction = async (claimId: string, action: 'approve' | 'reject' | 'paid') => {
    setMsg({ error: '', success: '' });
    try {
      const res = await fetch('/api/welfare/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_id: claimId, action })
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ error: '', success: `Claim status updated to ${data.claim.status}.` });
        fetchWelfareStatus();
      } else {
        setMsg({ error: data.error || 'Failed to update claim.', success: '' });
      }
    } catch (err) {
      setMsg({ error: 'Error updating welfare claim.', success: '' });
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const pendingClaimsCount = claims.filter(c => c.status === 'pending').length;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-geist flex items-center gap-2 text-[var(--text-primary)]">
          <Heart className="w-7 h-7 text-[#22C55E]" />
          Welfare & Emergency Fund
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage emergency payouts, bereavement assistance, and member welfare claims.
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sc-card p-6 rounded-2xl border">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Welfare Pool Balance</p>
          <p className="text-3xl font-bold text-[#22C55E] mt-1">KSh {Number(fund?.balance || 0).toLocaleString('en-KE')}</p>
        </div>
        <div className="sc-card p-6 rounded-2xl border">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Monthly Contribution</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">KSh {Number(fund?.monthly_contribution || 500).toLocaleString('en-KE')}</p>
        </div>
        <div className="sc-card p-6 rounded-2xl border">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Pending Claims</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{pendingClaimsCount}</p>
        </div>
      </div>

      {/* Claims List Table */}
      <div className="sc-card p-6 rounded-2xl border space-y-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Welfare Claims Review</h3>

        {claims.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-6 text-center">No welfare claims submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm sc-table">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Claim Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {claims.map(c => {
                  const memberName = c.chama_memberships?.profiles?.full_name || 'Member';
                  return (
                    <tr key={c.id}>
                      <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">{memberName}</td>
                      <td className="py-3 px-4 text-xs font-medium capitalize text-[var(--text-secondary)]">{c.reason}</td>
                      <td className="py-3 px-4 text-xs text-[var(--text-muted)]">{c.description || 'N/A'}</td>
                      <td className="py-3 px-4 font-bold text-[var(--text-primary)]">KSh {Number(c.amount).toLocaleString('en-KE')}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                          c.status === 'paid' 
                            ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' 
                            : c.status === 'approved' 
                            ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                            : c.status === 'rejected'
                            ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                            : 'bg-amber-100 dark:bg-amber-950/30 text-amber-600'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {c.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction(c.id, 'approve')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#22C55E] text-white hover:bg-[#16A34A]">
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(c.id, 'reject')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700">
                              Reject
                            </button>
                          </>
                        )}
                        {c.status === 'approved' && (
                          <button
                            onClick={() => handleAction(c.id, 'paid')}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700">
                            Disburse Funds
                          </button>
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
    </div>
  );
}

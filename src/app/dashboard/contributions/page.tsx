"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { NewContributionModal } from "@/components/NewContributionModal";

export default function ContributionsPage() {
  const { member, group, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [collectionStats, setCollectionStats] = useState({
    collected: 0, target: 0, progress: 0, membersPaid: 0, totalMembers: 0,
  });

  // My own contribution history
  const [myContributions, setMyContributions] = useState<any[]>([]);
  // All member statuses for this month
  const [memberStatuses, setMemberStatuses] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const fmt = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

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

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      Paid: 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400',
      Partial: 'bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400',
      Pending: 'bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-400',
      Late: 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400',
      confirmed: 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400',
      pending: 'bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-400',
      failed: 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400',
      late: 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400',
    };
    return (
      <span className={`px-2.5 py-1 rounded text-xs font-semibold capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full space-y-6">
        <div className="card-bg border border-[var(--border)] rounded-2xl h-40 animate-pulse" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card-bg border border-[var(--border)] rounded-2xl h-72 animate-pulse" />
          <div className="card-bg border border-[var(--border)] rounded-2xl h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 text-[var(--text-main)]">
        <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error_outline</span>
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={fetchData} className="mt-4 text-[#22C55E] hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full font-inter text-[var(--text-main)]">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] text-[#9CA3AF] mb-1 flex items-center gap-1">
            <span>Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Contributions</span>
          </p>
          <h1 className="text-[26px] font-bold tracking-tight">Contributions</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">{group?.name} — Track your payments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#22C55E] text-white px-5 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-[#16A34A] transition-colors self-start">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Contribution
        </button>
      </div>

      {/* This month summary */}
      <div className="bg-[#0B0F0C] border border-[#163822] rounded-2xl p-6 md:p-8 mb-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-gray-400 mb-2">THIS MONTH'S COLLECTION</div>
            <div className="text-[32px] md:text-[40px] font-bold leading-tight">KSh {fmt(collectionStats.collected)}</div>
            <div className="text-[13px] text-gray-400 mt-1">Target: KSh {fmt(collectionStats.target)}</div>
          </div>
          <div className="w-full md:w-1/2">
            <div className="flex justify-between mb-2">
              <span className="text-[13px] text-gray-300">Progress</span>
              <span className="text-[13px] text-white font-medium">{collectionStats.progress}%</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-[#22C55E] transition-all duration-700" style={{ width: `${collectionStats.progress}%` }} />
            </div>
            <div className="text-[12px] text-gray-400 text-right">
              {collectionStats.membersPaid} of {collectionStats.totalMembers} members paid
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Chart */}
        <div className="card-bg border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <h2 className="text-[17px] font-bold mb-5">Collection History (6 months)</h2>
          {chartData.some(d => d.amount > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => [`KSh ${Number(v).toLocaleString('en-KE')}`, 'Collected']}
                  contentStyle={{ borderRadius: 12, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                <Bar dataKey="amount" fill="#22C55E" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[40px] text-[var(--text-muted)] mb-2">bar_chart</span>
              <p className="text-[13px] text-[var(--text-muted)]">No confirmed contributions yet</p>
            </div>
          )}
        </div>

        {/* Member status */}
        <div className="card-bg border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-[17px] font-bold mb-5">Member Status This Month</h2>
          <div className="overflow-y-auto flex-1 max-h-64 rounded-xl border border-[var(--border)]">
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-gray-50 dark:bg-[#0f1410] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Member</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Paid</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {memberStatuses.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-[var(--text-muted)]">No members found</td></tr>
                ) : memberStatuses.map(m => (
                  <tr key={m.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="px-4 py-3 font-medium">{m.full_name}</td>
                    <td className="px-4 py-3 font-mono">KSh {fmt(m.paid)}</td>
                    <td className="px-4 py-3 text-right">{getStatusBadge(m.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* My Contribution History — TABLE */}
      <div className="card-bg border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-[17px] font-bold">My Contribution History</h2>
          <span className="text-[12px] text-[var(--text-muted)]">{myContributions.length} records</span>
        </div>

        {myContributions.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-outlined text-[40px] text-[var(--text-muted)] block mb-2">receipt_long</span>
            <p className="text-[14px] text-[var(--text-muted)]">No contributions recorded yet.</p>
            <button onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-2 bg-[#22C55E] text-white px-4 py-2 rounded-lg text-[13px] font-semibold">
              <span className="material-symbols-outlined text-[16px]">add</span>Make First Contribution
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-gray-50 dark:bg-[#0f1410] border-b border-[var(--border)]">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Date</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Amount</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Method</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Receipt</th>
                  <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {myContributions.map(c => (
                  <tr key={c.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="px-5 py-3.5 text-[var(--text-main)]">
                      {new Date(c.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-[var(--text-main)]">
                      KSh {fmt(Number(c.amount))}
                    </td>
                    <td className="px-5 py-3.5 capitalize text-[var(--text-muted)]">
                      {c.payment_method || 'M-Pesa'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[var(--text-muted)] text-[12px]">
                      {c.mpesa_receipt || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {getStatusBadge(c.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <NewContributionModal
          onClose={() => {
            setShowModal(false);
            fetchData(); // Refresh table after closing
          }}
          defaultAmount={group?.contribution_amount || 500}
          memberPhone={member?.profile?.phone_number || (member as any)?.phone_number || ''}
          membershipId={member?.id || ''}
          chamaId={group?.id || ''}
          chamaName={group?.name || ''}
        />
      )}
    </div>
  );
}

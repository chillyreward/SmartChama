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
  
  const [collectionStats, setCollectionStats] = useState({
    collected: 0,
    target: 0,
    progress: 0,
    membersPaid: 0,
    totalMembers: 0,
  });
  
  const [memberStatuses, setMemberStatuses] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showContributionModal, setShowContributionModal] = useState(false);

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  const fetchData = async () => {
    if (!member || !group) return;
    try {
      setLoading(true);
      setError("");

      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // 1. This Month's Collection
      const { data: thisMonth } = await supabase
        .from('contributions')
        .select('amount, status, member_id')
        .eq('group_id', member.group_id)
        .gte('created_at', firstDayOfMonth.toISOString())
        .lte('created_at', today.toISOString())
        .eq('status', 'confirmed');

      const collected = thisMonth?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      
      const { data: allMembers } = await supabase
        .from('members')
        .select('id, full_name, phone')
        .eq('group_id', member.group_id);

      const totalMembers = allMembers?.length || 0;
      const groupAmount = group.contribution_amount || 5000;
      const target = groupAmount * totalMembers;
      const progress = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
      
      const uniquePaidIds = new Set(thisMonth?.map(c => c.member_id));
      const membersPaid = uniquePaidIds.size;

      setCollectionStats({
        collected,
        target,
        progress,
        membersPaid,
        totalMembers
      });

      // 2. Member Table with Status
      const dueAmount = groupAmount;
      const dueDate = group.due_date || 15;
      const isLate = today.getDate() > dueDate;

      const memberMap = new Map();
      allMembers?.forEach(m => {
        memberMap.set(m.id, {
          ...m,
          paidThisMonth: 0,
          status: ''
        });
      });

      thisMonth?.forEach(c => {
        if (memberMap.has(c.member_id)) {
          memberMap.get(c.member_id).paidThisMonth += Number(c.amount);
        }
      });

      const memberRows = Array.from(memberMap.values()).map(m => {
        let status = 'Pending';
        if (m.paidThisMonth >= dueAmount) {
          status = 'Paid';
        } else if (m.paidThisMonth > 0 && m.paidThisMonth < dueAmount) {
          status = 'Partial';
        } else if (m.paidThisMonth === 0 && isLate) {
          status = 'Late';
        }

        return { ...m, status };
      });

      setMemberStatuses(memberRows);

      // 3. Collection Chart (Last 6 Months)
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      const { data: last6M } = await supabase
        .from('contributions')
        .select('amount, created_at')
        .eq('group_id', member.group_id)
        .gte('created_at', sixMonthsAgo.toISOString())
        .eq('status', 'confirmed');

      const monthlyMap: Record<string, number> = {};
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        monthlyMap[d.toLocaleString('default', { month: 'short' })] = 0;
      }

      last6M?.forEach(c => {
        const d = new Date(c.created_at);
        const monthStr = d.toLocaleString('default', { month: 'short' });
        if (monthlyMap[monthStr] !== undefined) {
          monthlyMap[monthStr] += Number(c.amount);
        }
      });

      const barData = Object.keys(monthlyMap).map(month => ({
        month,
        amount: monthlyMap[month],
        target: target 
      }));
      setChartData(barData);

    } catch (err) {
      console.error(err);
      setError("Failed to load contributions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && member && group) {
      fetchData();
    }
  }, [authLoading, member, group]);

  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full text-[var(--text-main)]">
        <div className="card-bg border border-[var(--border)] rounded-2xl p-6 h-48 animate-pulse mb-6 shadow-sm"></div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 h-80 animate-pulse shadow-sm"></div>
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 h-80 animate-pulse shadow-sm"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20 text-[var(--text-main)]">
        <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error_outline</span>
        <p className="text-body-sm text-red-500">{error}</p>
        <button onClick={fetchData} className="mt-4 text-[var(--brand-green)] hover:underline font-medium">Retry</button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <span className="bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176] px-2.5 py-1 rounded text-xs font-semibold">Paid</span>;
      case 'Partial':
        return <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2.5 py-1 rounded text-xs font-semibold">Partial</span>;
      case 'Pending':
        return <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 px-2.5 py-1 rounded text-xs font-semibold">Pending</span>;
      case 'Late':
        return <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-2.5 py-1 rounded text-xs font-semibold">Late</span>;
      default:
        return null;
    }
  };

  const chamaName = group?.name || 'Group';

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full relative font-inter text-[var(--text-main)]">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Contributions</span>
        </p>
        
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
              Contributions
            </h1>
            <p className="text-[14px] text-[var(--text-muted)] mt-1">
              {chamaName} — Track monthly collections and member payments.
            </p>
          </div>
          <button 
            onClick={() => setShowContributionModal(true)}
            className="bg-[#22C55E] hover:bg-[#006e2f] transition-all text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm whitespace-nowrap self-start">
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Contribution
          </button>
        </div>
      </div>

      {/* THIS MONTH'S COLLECTION (Stays dark as requested) */}
      <div className="bg-[#0B0F0C] border border-[#163822] rounded-2xl p-4 md:p-8 mb-6 shadow-sm text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-gray-400 mb-2">THIS MONTH'S COLLECTION</div>
            <div className="text-[28px] md:text-[40px] font-geist font-bold leading-tight">
              KSh {formatCurrency(collectionStats.collected)}
            </div>
            <div className="text-body-sm text-gray-400 mt-1">
              Target: KSh {formatCurrency(collectionStats.target)}
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-body-sm text-gray-300">Progress</span>
              <span className="text-body-sm text-white font-medium">{collectionStats.progress}%</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-[#22C55E] transition-all duration-1000" 
                style={{ width: `${collectionStats.progress}%` }}
              ></div>
            </div>
            <div className="text-body-sm text-gray-400 text-right">
              {collectionStats.membersPaid} of {collectionStats.totalMembers} members paid
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* COLLECTION CHART */}
        <div className="card-bg border border-[var(--border)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <h2 className="text-xl font-bold font-geist text-[var(--text-main)] mb-6">Collection History (6 Mo)</h2>
          {chartData.length > 0 ? (
            <div className="w-full">
              <ResponsiveContainer width="100%" height={200} className="md:h-[300px]">
                <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-[#2d3d2d]" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#60645f' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#60645f' }} dx={-10} tickFormatter={(val) => `KSh ${val.toLocaleString()}`} />
                  <Tooltip 
                    formatter={(value: any) => [`KSh ${value.toLocaleString()}`, 'Collected']}
                    contentStyle={{ borderRadius: '12px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ color: 'var(--color-text-primary)' }}
                    cursor={{ fill: 'var(--color-bg-hover)' }}
                  />
                  <Bar dataKey="amount" fill="#22C55E" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 w-full flex flex-col items-center justify-center text-[var(--text-main)]">
              <span className="material-symbols-outlined text-gray-250 dark:text-[#5a6e5a] text-6xl mb-4">bar_chart</span>
              <p className="text-body-sm text-[var(--text-muted)]">No collection history available</p>
            </div>
          )}
        </div>

        {/* MEMBER TABLE */}
        <div className="card-bg border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[var(--text-main)]">Member Status</h2>
          </div>
          <div className="flex-1">
            {/* Mobile Card List */}
            <div className="md:hidden flex flex-col divide-y divide-[#E5E7EB] dark:divide-[#2d3d2d] border border-[var(--border)] rounded-xl overflow-hidden card-bg">
              {memberStatuses.length > 0 ? memberStatuses.map(m => (
                <div key={m.id} className="p-4 flex items-center justify-between active:bg-[#f5f5f5] dark:active:bg-[#1f2a1f] transition-colors">
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--text-main)]">{m.full_name}</p>
                    <p className="text-[12px] font-mono text-[var(--text-muted)] mt-0.5">KSh {formatCurrency(m.paidThisMonth)}</p>
                  </div>
                  <div>
                    {getStatusBadge(m.status)}
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-body-sm text-[var(--text-muted)]">
                  No members found in this group.
                </div>
              )}
            </div>

            {/* Desktop table hidden on mobile */}
            <div className="hidden md:block overflow-y-auto flex-1 max-h-72 border border-[var(--border)] rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-[#0f1410] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10">
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-4 py-3">MEMBER</th>
                    <th className="px-4 py-3">PAID</th>
                    <th className="px-4 py-3 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
                  {memberStatuses.length > 0 ? memberStatuses.map(m => (
                    <tr key={m.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                      <td className="px-4 py-3 text-sm text-[var(--text-main)] font-semibold">{m.full_name}</td>
                      <td className="px-4 py-3 text-sm text-[var(--text-main)] font-mono">KSh {formatCurrency(m.paidThisMonth)}</td>
                      <td className="px-4 py-3 text-right">
                        {getStatusBadge(m.status)}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-body-sm text-[var(--text-muted)]">
                        No members found in this group.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {showContributionModal && (
        <NewContributionModal
          onClose={() => setShowContributionModal(false)}
          defaultAmount={group?.contribution_amount || 500}
          memberPhone={member?.phone_number || ''}
          membershipId={member?.id || ''}
          chamaId={group?.id || ''}
          chamaName={group?.name || ''}
        />
      )}
    </div>
  );
}

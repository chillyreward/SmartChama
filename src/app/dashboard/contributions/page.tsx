"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ContributionsPage() {
  const { session, member, group, isLoading: authLoading } = useAuth();
  
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
      // Provide a fallback of 5000 if contribution_amount isn't set yet
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
      <div className="p-6 max-w-[1280px] mx-auto w-full">
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 h-48 animate-pulse mb-6 shadow-sm"></div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 h-80 animate-pulse shadow-sm"></div>
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 h-80 animate-pulse shadow-sm"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <span className="material-symbols-outlined text-error text-5xl mb-4">error_outline</span>
        <p className="text-body-sm text-error">{error}</p>
        <button onClick={fetchData} className="mt-4 text-primary hover:underline font-medium">Retry</button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <span className="bg-[#22C55E]/10 text-[#005321] border border-[#4ae176] px-2 py-0.5 rounded text-label-caps">Paid</span>;
      case 'Partial':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded text-label-caps">Partial</span>;
      case 'Pending':
        return <span className="bg-orange-100 text-orange-800 border border-orange-300 px-2 py-0.5 rounded text-label-caps">Pending</span>;
      case 'Late':
        return <span className="bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded text-label-caps">Late</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full relative">
      <div className="mb-8">
        <h1 className="text-headline-lg font-semibold text-on-surface font-geist">Contributions</h1>
        <p className="text-body-sm text-secondary mt-1">Track monthly collections and member payments</p>
      </div>

      {/* THIS MONTH'S COLLECTION */}
      <div className="bg-[#0B0F0C] rounded-xl p-8 mb-6 shadow-sm text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="text-label-caps text-gray-400 mb-2">THIS MONTH'S COLLECTION</div>
            <div className="text-[40px] font-geist font-bold leading-tight">
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
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
          <h2 className="text-headline-sm text-on-surface font-geist mb-6">Collection History (6 Mo)</h2>
          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} tickFormatter={(val) => `KSh ${val.toLocaleString()}`} />
                  <Tooltip 
                    formatter={(value: number) => [`KSh ${value.toLocaleString()}`, 'Collected']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                    cursor={{ fill: '#F3F4F6' }}
                  />
                  <Bar dataKey="amount" fill="#22C55E" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 w-full flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">bar_chart</span>
              <p className="text-body-sm text-secondary">No collection history available</p>
            </div>
          )}
        </div>

        {/* MEMBER TABLE */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-headline-sm text-on-surface font-geist">Member Status</h2>
          </div>
          
          <div className="overflow-y-auto flex-1 max-h-72 border border-[#E5E7EB] rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="border-b border-[#E5E7EB]">
                  <th className="px-4 py-3 text-label-caps text-secondary font-medium">MEMBER</th>
                  <th className="px-4 py-3 text-label-caps text-secondary font-medium">PAID</th>
                  <th className="px-4 py-3 text-label-caps text-secondary font-medium text-right">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {memberStatuses.length > 0 ? memberStatuses.map(m => (
                  <tr key={m.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-body-sm text-on-surface font-medium">{m.full_name}</td>
                    <td className="px-4 py-3 text-mono-data text-on-surface">KSh {formatCurrency(m.paidThisMonth)}</td>
                    <td className="px-4 py-3 text-right">
                      {getStatusBadge(m.status)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-body-sm text-secondary">
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
  );
}

"use client";
import { MIcon } from '@/components/ui/MIcon';

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import PageSkeleton from "@/components/PageSkeleton";

export default function AdminAnalyticsPage() {
  const { member: adminMember, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'30days' | '3months' | '12months'>('12months');

  const [rawContribs, setRawContribs] = useState<any[]>([]);

  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);
  const [contributionStats, setContributionStats] = useState({ total: 0, late: 0, confirmed: 0 });
  const [topMembers, setTopMembers] = useState<any[]>([]);
  
  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  const fetchData = async () => {
    if (!adminMember || !group) return;
    try {
      setLoading(true);

      // Fetch Contributions
      const { data: contribs, error: contribErr } = await supabase
        .from('contributions_v2')
        .select(`
          status, 
          amount, 
          membership_id, 
          created_at,
          membership:chama_memberships (
            profile:profiles (
              full_name
            )
          )
        `)
        .eq('chama_id', group.id);
      
      if (contribErr) throw contribErr;

      setRawContribs(contribs || []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminMember, group]);

  // Recalculate stats reactively when raw data or date filter changes
  useEffect(() => {
    const today = new Date();
    const filterDate = new Date();
    if (dateFilter === '30days') {
      filterDate.setDate(today.getDate() - 30);
    } else if (dateFilter === '3months') {
      filterDate.setMonth(today.getMonth() - 3);
    } else {
      filterDate.setFullYear(today.getFullYear() - 1);
    }

    const filteredContribs = rawContribs.filter(c => new Date(c.created_at) >= filterDate);

    const byStatus = { confirmed: 0, late: 0, pending: 0 };
    filteredContribs.forEach((c: any) => {
      if (c.status === 'confirmed') byStatus.confirmed += Number(c.amount);
      else if (c.status === 'late') byStatus.late += Number(c.amount);
      else if (c.status === 'pending') byStatus.pending += Number(c.amount);
    });

    setStatusBreakdown([
      { name: 'Confirmed', value: byStatus.confirmed, color: '#3FA673' },
      { name: 'Pending', value: byStatus.pending, color: '#3B82F6' },
      { name: 'Late', value: byStatus.late, color: '#EF4444' }
    ]);

    let total = 0, late = 0, confirmed = 0;
    const memberTotals: Record<string, {name: string, total: number}> = {};

    filteredContribs.forEach((c: any) => {
      const amt = Number(c.amount);
      total += amt;
      if (c.status === 'confirmed') confirmed += amt;
      if (c.status === 'late') late += amt;

      const memberName = c.membership?.profile?.full_name;
      if (c.status === 'confirmed' && memberName) {
        if (!memberTotals[c.membership_id]) {
          memberTotals[c.membership_id] = { name: memberName, total: 0 };
        }
        memberTotals[c.membership_id].total += amt;
      }
    });

    setContributionStats({ total, late, confirmed });

    const sortedMembers = Object.values(memberTotals).sort((a, b) => b.total - a.total).slice(0, 5);
    setTopMembers(sortedMembers);

  }, [rawContribs, dateFilter]);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="w-full text-[var(--text-main)] print-full-width">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print, header, nav, button, select, [class*="Sidebar"], [class*="sidebar"] {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
          }
          .card-bg {
            border: 1px solid #ccc !important;
            background: white !important;
            color: black !important;
            page-break-inside: avoid;
          }
        }
      ` }} />

      {/* Page Header */}
      <div className="mb-8 no-print">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-display font-normal text-[30px] sm:text-[38px] leading-tight tracking-[-0.02em]">
              Admin Analytics
            </h1>
            <p className="text-[15px] text-ink-2 mt-1.5">
              Deep dive into group financial health and member contribution compliance.
            </p>
          </div>
          <div className="flex gap-3 items-center w-full md:w-auto">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-white dark:bg-[var(--ak-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] outline-hidden cursor-pointer "
            >
              <option value="30days">Last 30 Days</option>
              <option value="3months">Last 3 Months</option>
              <option value="12months">Last 12 Months</option>
            </select>
            <button 
              onClick={() => window.print()}
              className="bg-primary text-on-primary rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all cursor-pointer"
            >
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* CONTRIBUTION STATUS */}
        <div className="card-bg border border-[var(--border)] border-t-2 border-t-blue-500 rounded-2xl hover:shadow-md transition-all duration-200 p-6 flex flex-col">
          <h2 className="font-display font-normal text-[22px] text-[var(--text-main)] mb-6">Contributions by Status</h2>
          <div className="flex-1 flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`KSh ${formatCurrency(value)}`, 'Amount']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 flex flex-col gap-4 mt-6 md:mt-0">
              {statusBreakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-[var(--text-muted)]">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-[var(--text-main)]">KSh {formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CONTRIBUTION STATS */}
        <div className="card-bg border border-[var(--border)] border-t-2 border-t-[var(--ak-brand-ink)] rounded-2xl hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-display font-normal text-[22px] text-[var(--text-main)] mb-6">Contribution Compliance</h2>
            
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <div className="text-3xl font-bold text-[var(--ak-brand-ink)] ">
                  {contributionStats.total > 0 ? Math.round((contributionStats.confirmed / contributionStats.total) * 100) : 0}%
                </div>
                <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">RECOVERY RATE IN PERIOD</div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-[var(--ak-surface)] rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-[var(--ak-solid)] h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${contributionStats.total > 0 ? (contributionStats.confirmed / contributionStats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-transparent text-[var(--brand-green)] border border-[var(--ak-brand-ink)]/20 dark:border-[var(--ak-brand-ink)]/10 rounded-xl">
              <div className="text-[11px] font-bold tracking-wider text-[var(--brand-green)] uppercase mb-1">CONFIRMED FUNDS</div>
              <div className="font-mono font-bold text-[var(--text-main)] text-lg">KSh {formatCurrency(contributionStats.confirmed)}</div>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/30 rounded-xl">
              <div className="text-[11px] font-bold tracking-wider text-red-800 dark:text-red-400 uppercase mb-1">OUTSTANDING (LATE)</div>
              <div className="font-mono font-bold text-red-800 dark:text-red-400 text-lg">KSh {formatCurrency(contributionStats.late)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-bg border border-[var(--border)] border-t-2 border-t-purple-500 rounded-2xl hover:shadow-md transition-all duration-200 p-6">
        <h2 className="font-display font-normal text-[22px] text-[var(--text-main)] mb-6">Top Contributors In Period</h2>
        <div className="flex flex-col gap-4">
          {topMembers.map((m, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 border border-[var(--border)] rounded-xl hover:bg-[var(--ak-surface-2)] dark:hover:bg-[var(--ak-raised)] transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-xs ${
                  idx === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                  idx === 1 ? 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300' :
                  idx === 2 ? 'bg-[#fff7ed] dark:bg-orange-950/30 text-[#9a3412] dark:text-orange-400' :
                  'bg-transparent text-[var(--brand-green)]'
                }`}>
                  #{idx + 1}
                </div>
                <div className="font-semibold text-[var(--text-main)]">{m.name}</div>
              </div>
              <div className="font-mono font-bold text-[var(--ak-brand-ink)] text-lg">KSh {formatCurrency(m.total)}</div>
            </div>
          ))}
          {topMembers.length === 0 && (
            <div className="text-center py-6 text-[var(--text-muted)]">No contributions found in this period.</div>
          )}
        </div>
      </div>

    </div>
  );
}

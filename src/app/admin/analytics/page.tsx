"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import PageSkeleton from "@/components/PageSkeleton";

export default function AdminAnalyticsPage() {
  const { member: adminMember, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'30days' | '3months' | '12months'>('12months');

  const [rawLoans, setRawLoans] = useState<any[]>([]);
  const [rawContribs, setRawContribs] = useState<any[]>([]);

  const [loanHealth, setLoanHealth] = useState<any[]>([]);
  const [contributionStats, setContributionStats] = useState({ total: 0, late: 0, confirmed: 0 });
  const [topMembers, setTopMembers] = useState<any[]>([]);
  
  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  const fetchData = async () => {
    if (!adminMember || !group) return;
    try {
      setLoading(true);

      // Fetch Loans
      const { data: loans, error: loanErr } = await supabase
        .from('loans_v2')
        .select('status, amount, created_at')
        .eq('chama_id', group.id);

      if (loanErr) throw loanErr;

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

      setRawLoans(loans || []);
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

    const filteredLoans = rawLoans.filter(l => new Date(l.created_at) >= filterDate);
    const filteredContribs = rawContribs.filter(c => new Date(c.created_at) >= filterDate);

    const lHealth = { active: 0, overdue: 0, repaid: 0 };
    filteredLoans.forEach(l => {
      if (l.status === 'active' || l.status === 'approved') lHealth.active += Number(l.amount);
      if (l.status === 'overdue' || l.status === 'defaulted') lHealth.overdue += Number(l.amount);
      if (l.status === 'repaid') lHealth.repaid += Number(l.amount);
    });

    setLoanHealth([
      { name: 'Healthy (Active)', value: lHealth.active, color: '#3B82F6' },
      { name: 'Overdue (Risk)', value: lHealth.overdue, color: '#EF4444' },
      { name: 'Repaid', value: lHealth.repaid, color: '#22C55E' }
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

  }, [rawLoans, rawContribs, dateFilter]);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full font-inter text-[var(--text-main)] print-full-width">
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
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Admin Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Analytics</span>
        </p>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
              Admin Analytics
            </h1>
            <p className="text-[14px] text-[var(--text-muted)] mt-1">
              Deep dive into group financial health and member contribution compliance.
            </p>
          </div>
          <div className="flex gap-3 items-center w-full md:w-auto">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-white dark:bg-[#111111] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] outline-hidden cursor-pointer shadow-sm"
            >
              <option value="30days">Last 30 Days</option>
              <option value="3months">Last 3 Months</option>
              <option value="12months">Last 12 Months</option>
            </select>
            <button 
              onClick={() => window.print()}
              className="bg-[#22C55E] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#006e2f] transition-all shadow-sm cursor-pointer"
            >
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* LOAN BOOK HEALTH */}
        <div className="card-bg border border-[var(--border)] border-t-2 border-t-blue-500 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col">
          <h2 className="text-xl font-bold text-[var(--text-main)] font-geist mb-6">Loan Book Health</h2>
          <div className="flex-1 flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={loanHealth}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {loanHealth.map((entry, index) => (
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
              {loanHealth.map((item, idx) => (
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
        <div className="card-bg border border-[var(--border)] border-t-2 border-t-[#22C55E] rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-main)] font-geist mb-6">Contribution Compliance</h2>
            
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <div className="text-3xl font-bold text-[#22C55E] font-geist">
                  {contributionStats.total > 0 ? Math.round((contributionStats.confirmed / contributionStats.total) * 100) : 0}%
                </div>
                <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">RECOVERY RATE IN PERIOD</div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-[#1a2218] rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-[#22C55E] h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${contributionStats.total > 0 ? (contributionStats.confirmed / contributionStats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-transparent text-[var(--brand-green)] border border-[#22C55E]/20 dark:border-[#22C55E]/10 rounded-xl">
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

      <div className="card-bg border border-[var(--border)] border-t-2 border-t-purple-500 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
        <h2 className="text-xl font-bold text-[var(--text-main)] font-geist mb-6">Top Contributors In Period</h2>
        <div className="flex flex-col gap-4">
          {topMembers.map((m, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 border border-[var(--border)] rounded-xl hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-all">
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
              <div className="font-mono font-bold text-[#22C55E] text-lg">KSh {formatCurrency(m.total)}</div>
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

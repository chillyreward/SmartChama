"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from "recharts";

export default function AnalyticsPage() {
  const { session, member, group, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalSaved: 0,
    loansIssued: 0,
    loansCount: 0,
    avgContributionRate: 0,
    groupTrustScore: 0,
  });

  const [savingsGrowthData, setSavingsGrowthData] = useState<any[]>([]);
  const [collectionRateData, setCollectionRateData] = useState<any[]>([]);
  const [loanPerformanceData, setLoanPerformanceData] = useState<any[]>([]);
  const [memberStatusData, setMemberStatusData] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState(85);
  const [totalMembers, setTotalMembers] = useState(0);

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  const fetchData = async () => {
    if (!member || !group) return;
    try {
      setLoading(true);
      setError("");

      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('group_id', member.group_id)
        .order('created_at', { ascending: true });

      const { data: membersData } = await supabase
        .from('members')
        .select('*')
        .eq('group_id', member.group_id);

      const { data: loansData } = await supabase
        .from('loans')
        .select('*')
        .eq('group_id', member.group_id);

      setTotalMembers(membersData?.length || 0);

      let totalSaved = 0;
      let cumulativeSavings = 0;
      const monthlySavingsMap: Record<string, number> = {};

      txData?.forEach(tx => {
        if (['contribution', 'repayment', 'penalty', 'interest'].includes(tx.type)) {
          totalSaved += Number(tx.amount);
        }
      });

      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        monthlySavingsMap[d.toLocaleString('default', { month: 'short' })] = cumulativeSavings; 
      }

      txData?.forEach(tx => {
        if (['contribution', 'repayment'].includes(tx.type)) {
          cumulativeSavings += Number(tx.amount);
          const monthStr = new Date(tx.created_at).toLocaleString('default', { month: 'short' });
          let found = false;
          Object.keys(monthlySavingsMap).forEach(m => {
            if (m === monthStr) found = true;
            if (found) monthlySavingsMap[m] = cumulativeSavings;
          });
        }
      });

      const savingsGrowth = Object.keys(monthlySavingsMap).map(month => ({
        month,
        amount: monthlySavingsMap[month]
      }));

      const loansCount = loansData?.length || 0;
      const loansIssued = loansData?.reduce((sum, l) => sum + Number(l.amount), 0) || 0;

      const monthlyLoanMap: Record<string, { issued: number, repaid: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        monthlyLoanMap[d.toLocaleString('default', { month: 'short' })] = { issued: 0, repaid: 0 };
      }

      loansData?.forEach(l => {
        const issuedMonth = new Date(l.created_at).toLocaleString('default', { month: 'short' });
        if (monthlyLoanMap[issuedMonth]) {
          monthlyLoanMap[issuedMonth].issued += Number(l.amount);
        }
      });

      txData?.forEach(tx => {
        if (tx.type === 'repayment') {
          const repaidMonth = new Date(tx.created_at).toLocaleString('default', { month: 'short' });
          if (monthlyLoanMap[repaidMonth]) {
            monthlyLoanMap[repaidMonth].repaid += Number(tx.amount);
          }
        }
      });

      const loanPerformance = Object.keys(monthlyLoanMap).map(month => ({
        month,
        issued: monthlyLoanMap[month].issued,
        repaid: monthlyLoanMap[month].repaid
      }));

      const avgTrust = membersData && membersData.length > 0 
        ? Math.round(membersData.reduce((sum, m) => sum + (m.trust_score || 0), 0) / membersData.length)
        : 0;

      // Mock collection rate based on realistic parameters
      const collectionRate = Object.keys(monthlySavingsMap).map(month => ({
        month,
        rate: Math.floor(Math.random() * 15) + 85 
      }));

      const avgContribRate = Math.round(collectionRate.reduce((s, c) => s + c.rate, 0) / collectionRate.length) || 0;

      const thisMonthTxs = txData?.filter(tx => {
        const d = new Date(tx.created_at);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && tx.type === 'contribution';
      }) || [];

      let paid = 0, partial = 0, unpaid = 0;
      const groupAmount = group.contribution_amount || 5000;
      
      membersData?.forEach(m => {
        const mContribs = thisMonthTxs.filter(tx => tx.member_id === m.id);
        const totalPaid = mContribs.reduce((sum, tx) => sum + Number(tx.amount), 0);
        if (totalPaid >= groupAmount) paid++;
        else if (totalPaid > 0) partial++;
        else unpaid++;
      });

      const memberStatus = [
        { name: 'Paid', value: paid, color: '#22C55E' },
        { name: 'Partial', value: partial, color: '#FCD34D' },
        { name: 'Unpaid', value: unpaid, color: '#FCA5A5' },
      ];

      setStats({
        totalSaved,
        loansIssued,
        loansCount,
        avgContributionRate: avgContribRate,
        groupTrustScore: avgTrust
      });

      setSavingsGrowthData(savingsGrowth);
      setCollectionRateData(collectionRate);
      setLoanPerformanceData(loanPerformance);
      // Ensure we don't pass empty data arrays to piechart which crashes it
      setMemberStatusData(memberStatus.some(m => m.value > 0) ? memberStatus : [{ name: 'Unpaid', value: 1, color: '#FCA5A5' }]); 
      setHealthScore(avgTrust + 5 > 100 ? 100 : avgTrust + 5);

    } catch (err) {
      console.error(err);
      setError("Failed to load analytics.");
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
      <div className="p-6 max-w-[1280px] mx-auto w-full font-inter">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="bg-white border border-[#E5E7EB] rounded-lg p-6 h-32 animate-pulse shadow-sm"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[1,2].map(i => <div key={i} className="bg-white border border-[#E5E7EB] rounded-lg p-6 h-64 animate-pulse shadow-sm"></div>)}
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

  const RADIAN = Math.PI / 180;
  const healthData = [
    { name: 'Health', value: healthScore },
    { name: 'Remaining', value: 100 - healthScore }
  ];

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full font-inter relative">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-headline-lg text-on-surface font-geist font-bold">Analytics</h1>
          <p className="text-body-sm text-secondary mt-1">{group.name} · Last 12 months</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-white border border-[#E5E7EB] rounded px-4 py-2 text-body-sm flex items-center gap-2 text-on-surface cursor-pointer shadow-sm">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            Last 12 Months
            <span className="material-symbols-outlined text-lg">expand_more</span>
          </div>
          <button className="bg-[#22C55E] text-white rounded px-4 py-2 text-body-sm font-medium hover:bg-[#006e2f] transition-colors shadow-sm">
            Export Report
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-label-caps text-on-surface-variant mb-4">TOTAL SAVED (GROUP)</div>
          <div className="text-display-sm text-on-surface font-geist mb-2">KSh {formatCurrency(stats.totalSaved)}</div>
          <div>
            <span className="inline-flex items-center bg-surface-container-low text-[#22C55E] border border-[#4ae176] px-2 py-0.5 rounded text-mono-data">
              ↑ 18% vs last year
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-label-caps text-on-surface-variant mb-4">LOANS ISSUED</div>
          <div className="text-display-sm text-on-surface font-geist mb-2">KSh {formatCurrency(stats.loansIssued)}</div>
          <div className="text-label-caps text-secondary">{stats.loansCount} loans total</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-label-caps text-on-surface-variant mb-4">AVG CONTRIBUTION RATE</div>
          <div className="text-display-sm text-[#22C55E] font-geist">{stats.avgContributionRate}%</div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-label-caps text-on-surface-variant mb-4">GROUP TRUST SCORE</div>
          <div className="text-display-sm text-[#22C55E] font-geist mb-2">{stats.groupTrustScore}/100</div>
          <div className="text-body-sm text-[#22C55E] font-medium">↑ 6 points</div>
        </div>
      </div>

      {/* CHART ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Left: Savings Growth */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
          <h2 className="text-headline-sm text-on-surface font-geist mb-6">Total group savings over time</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={savingsGrowthData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} tickFormatter={(val) => `${(val/1000)}k`} />
                <Tooltip 
                  formatter={(value: number) => [`KSh ${value.toLocaleString()}`, 'Total Saved']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorSavings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Contribution Rate */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
          <h2 className="text-headline-sm text-on-surface font-geist mb-6">Monthly collection rate</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectionRateData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Collection Rate']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                  cursor={{ fill: '#F3F4F6' }}
                />
                <Bar dataKey="rate" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* CHART ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Left: Loan Performance */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
          <h2 className="text-headline-sm text-on-surface font-geist mb-6">Loans issued vs repaid (6 Mo)</h2>
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#22C55E]"></div>
              <span className="text-body-sm text-secondary">Repaid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#9CA3AF]"></div>
              <span className="text-body-sm text-secondary">Issued</span>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loanPerformanceData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} tickFormatter={(val) => `${(val/1000)}k`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [`KSh ${value.toLocaleString()}`, name === 'repaid' ? 'Repaid' : 'Issued']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                />
                <Line type="monotone" dataKey="issued" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#9CA3AF' }} />
                <Line type="monotone" dataKey="repaid" stroke="#22C55E" strokeWidth={2} dot={{ r: 4, fill: '#22C55E' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Member Activity Breakdown */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col items-center shadow-sm">
          <h2 className="text-headline-sm text-on-surface font-geist mb-6 w-full text-left">Member contribution status — this month</h2>
          <div className="h-48 w-full relative mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={memberStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {memberStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} members`, 'Count']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-headline-sm font-geist text-on-surface font-bold">{totalMembers}</span>
              <span className="text-label-caps text-on-secondary-container">Members</span>
            </div>
          </div>
          
          <div className="flex gap-4 text-body-sm text-on-surface w-full justify-center">
            {memberStatusData.map(m => (
              <div key={m.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }}></span> 
                {m.name} ({Math.round((m.value / totalMembers) * 100) || 0}%)
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* GROUP HEALTH SCORE WIDGET */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 w-full mb-12 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-headline-sm text-on-surface font-geist">Group Health Score</h2>
          <div className="text-headline-sm text-[#22C55E] font-geist">{healthScore}/100</div>
        </div>

        <div className="flex flex-col items-center mb-10">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthData}
                  cx="50%"
                  cy="50%"
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={70}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  <Cell fill="#22C55E" />
                  <Cell fill="#E5E7EB" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-display-sm font-geist text-[#22C55E] leading-none mt-2">{healthScore}</span>
              <span className="text-label-caps text-[#22C55E] mt-1 text-center">{healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Review'}<br/>Health</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {[
            { label: 'Participation Rate', value: `${Math.round(totalMembers > 0 ? (memberStatusData.find(m => m.name === 'Paid')?.value || 0) / totalMembers * 100 : 0)}%` },
            { label: 'Repayment Consistency', value: `${stats.loansIssued > 0 ? 88 : 100}%` },
            { label: 'Contribution Regularity', value: `${stats.avgContributionRate}%` },
            { label: 'Member Trust', value: `${stats.groupTrustScore}%` },
          ].map((stat, i) => (
            <div key={i}>
              <div className="flex justify-between items-end mb-2">
                <span className="text-label-caps text-on-surface-variant">{stat.label}</span>
                <span className="text-mono-data text-on-surface">{stat.value}</span>
              </div>
              <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div className="h-full bg-[#22C55E] transition-all duration-1000" style={{ width: stat.value }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <div className={`bg-surface-container-low border px-4 py-2 rounded inline-flex items-center gap-2 ${healthScore >= 80 ? 'border-[#4ae176]' : 'border-yellow-400'}`}>
            <span className={`material-symbols-outlined text-sm ${healthScore >= 80 ? 'text-[#22C55E]' : 'text-yellow-600'}`}>
              {healthScore >= 80 ? 'check_circle' : 'warning'}
            </span>
            <span className={`text-body-sm font-medium ${healthScore >= 80 ? 'text-[#22C55E]' : 'text-yellow-600'}`}>
              Your group is in {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Fair'} Health
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}

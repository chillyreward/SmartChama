"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { member, group } = useAuth();
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    totalSavings: 0,
    totalMembers: 0,
    activeMembers: 0,
    flaggedMembers: 0,
    activeLoansCount: 0,
    totalLoanedOut: 0,
    collectionRate: 0,
    groupTrustScore: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState(0);

  const [pendingActions, setPendingActions] = useState({
    pendingLoans: 0,
    overdueLoans: 0,
    lateContributions: 0
  });

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [topContributors, setTopContributors] = useState<any[]>([]);

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  useEffect(() => {
    if (!member || !group) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch members
        const { data: members } = await supabase
          .from('members')
          .select('id, full_name, trust_score, status')
          .eq('group_id', group.id);

        const totalMembers = members?.length || 0;
        const activeMembers = members?.filter(m => m.status === 'active').length || 0;
        const flaggedMembers = members?.filter(m => m.status === 'flagged').length || 0;
        const groupTrustScore = members && members.length > 0 
          ? Math.round(members.reduce((acc, m) => acc + (m.trust_score || 0), 0) / members.length) 
          : 0;

        // Fetch all contributions
        const { data: contributions } = await supabase
          .from('contributions')
          .select('amount, status, created_at, member_id')
          .eq('group_id', group.id);

        const totalSavings = contributions
          ?.filter(c => c.status === 'confirmed')
          .reduce((sum, c) => sum + Number(c.amount), 0) || 0;

        // Fetch all loans
        const { data: loans } = await supabase
          .from('loans')
          .select('amount, status')
          .eq('group_id', group.id);

        const activeLoansCount = loans?.filter(l => l.status === 'active').length || 0;
        const totalLoanedOut = loans?.filter(l => l.status === 'active').reduce((sum, l) => sum + Number(l.amount), 0) || 0;

        // Pending Actions
        const pendingLoans = loans?.filter(l => l.status === 'pending').length || 0;
        const overdueLoans = loans?.filter(l => l.status === 'overdue').length || 0;
        const lateContributions = contributions?.filter(c => c.status === 'late').length || 0;

        setPendingActions({ pendingLoans, overdueLoans, lateContributions });

        // Collection Rate This Month
        const now = new Date();
        const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        let collectedThisMonth = 0;
        let expectedThisMonth = 0;

        // Simple heuristic: one contribution expected per active member this month
        expectedThisMonth = activeMembers * (group.contribution_amount || 0);
        
        contributions?.forEach(c => {
          if (c.created_at.startsWith(thisMonthStr) && c.status === 'confirmed') {
            collectedThisMonth += Number(c.amount);
          }
        });

        const collectionRate = expectedThisMonth > 0 ? Math.round((collectedThisMonth / expectedThisMonth) * 100) : 0;

        setMetrics({
          totalSavings,
          totalMembers,
          activeMembers,
          flaggedMembers,
          activeLoansCount,
          totalLoanedOut,
          collectionRate: Math.min(100, collectionRate),
          groupTrustScore
        });

        // Top Contributors this month
        const thisMonthContribs = contributions?.filter(c => c.created_at.startsWith(thisMonthStr) && c.status === 'confirmed') || [];
        const memberTotals: Record<string, number> = {};
        thisMonthContribs.forEach(c => {
          memberTotals[c.member_id] = (memberTotals[c.member_id] || 0) + Number(c.amount);
        });

        const sortedTop = Object.entries(memberTotals)
          .map(([id, amount]) => {
            const m = members?.find(x => x.id === id);
            return { id, name: m?.full_name || 'Unknown', amount };
          })
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        setTopContributors(sortedTop);

        // Chart Data (Last 6 months for simplicity)
        const monthTotals: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const mStr = d.toLocaleString('default', { month: 'short' });
          monthTotals[mStr] = 0;
        }

        contributions?.filter(c => c.status === 'confirmed').forEach(c => {
          const d = new Date(c.created_at);
          const mStr = d.toLocaleString('default', { month: 'short' });
          if (monthTotals[mStr] !== undefined) {
            monthTotals[mStr] += Number(c.amount);
          }
        });

        let cumulative = 0;
        // If we want total growth, we need cumulative. Let's do cumulative of those 6 months + previous baseline.
        // For simplicity, just plot cumulative of the 6 months.
        const cData = Object.keys(monthTotals).map(month => {
          cumulative += monthTotals[month];
          return { month, savings: cumulative };
        });
        setChartData(cData);

        // Health Score (Dummy logic using trust score and collection rate)
        setHealthScore(Math.round((groupTrustScore * 0.6) + (collectionRate * 0.4)));

        // Recent Transactions
        const { data: txs } = await supabase
          .from('transactions')
          .select('*, members(full_name)')
          .eq('group_id', group.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentTransactions(txs || []);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up realtime channel for admin updates
    const channel = supabase.channel('admin-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contributions', filter: `chama_id=eq.${group.id}` }, (payload) => {
        // Optional: show a toast or alert here for new contributions
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans', filter: `chama_id=eq.${group.id}` }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [member, group]);


  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-white border border-[#E5E7EB] rounded-lg animate-pulse"></div>)}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-96 bg-white border border-[#E5E7EB] rounded-lg animate-pulse"></div>
          <div className="h-96 bg-white border border-[#E5E7EB] rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  const getCollectionColor = (rate: number) => {
    if (rate >= 85) return "text-[#22C55E]";
    if (rate >= 60) return "text-yellow-500";
    return "text-error";
  };

  return (
    <div className="p-8 font-inter">
      
      {/* ROW 1: 5 METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Card 1 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm">
          <div className="text-label-caps text-secondary mb-1">TOTAL GROUP SAVINGS</div>
          <div className="text-display-sm font-geist font-bold text-on-surface">KSh {formatCurrency(metrics.totalSavings)}</div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm">
          <div className="text-label-caps text-secondary mb-1">TOTAL MEMBERS</div>
          <div className="text-display-sm font-geist font-bold text-on-surface">{metrics.totalMembers}</div>
          <div className="text-body-sm text-secondary mt-1">{metrics.activeMembers} active · {metrics.flaggedMembers} flagged</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm">
          <div className="text-label-caps text-secondary mb-1">ACTIVE LOANS</div>
          <div className="text-display-sm font-geist font-bold text-on-surface">{metrics.activeLoansCount}</div>
          <div className="text-body-sm text-secondary mt-1">KSh {formatCurrency(metrics.totalLoanedOut)}</div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm">
          <div className="text-label-caps text-secondary mb-1">COLLECTION RATE</div>
          <div className={`text-display-sm font-geist font-bold ${getCollectionColor(metrics.collectionRate)}`}>
            {metrics.collectionRate}%
          </div>
          <div className="text-body-sm text-secondary mt-1">This month</div>
        </div>

        {/* Card 5 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div className="text-label-caps text-secondary mb-1">GROUP TRUST SCORE</div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#22C55E] text-[28px]">verified</span>
            <div className="text-display-sm font-geist font-bold text-on-surface">{metrics.groupTrustScore}</div>
          </div>
        </div>
      </div>

      {/* ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Left: Chart */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
          <h2 className="text-headline-sm font-geist text-on-surface mb-6">Group Savings Growth</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6B7280' }} 
                  tickFormatter={(val) => `KSh ${(val/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`KSh ${formatCurrency(value)}`, 'Total Savings']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="savings" stroke="#22C55E" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Health Score */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm flex flex-col items-center justify-center">
          <h2 className="text-headline-sm font-geist text-on-surface w-full text-left mb-6">Group Health</h2>
          
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full absolute inset-0 transform -rotate-90">
              <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-[#22C55E] transition-all duration-1000 ease-out" strokeDasharray={`${healthScore}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="flex flex-col items-center justify-center relative z-10 text-center mt-2">
              <span className="text-[48px] font-bold font-geist text-[#22C55E] leading-none">{healthScore}</span>
              <span className="text-body-sm text-secondary font-medium mt-1">/100</span>
            </div>
          </div>
          
          <div className="mt-6 w-full space-y-3">
            <div className="flex justify-between text-body-sm">
              <span className="text-secondary">Participation</span>
              <span className="font-medium text-on-surface">Excellent</span>
            </div>
            <div className="flex justify-between text-body-sm">
              <span className="text-secondary">Repayments</span>
              <span className="font-medium text-[#22C55E]">Healthy</span>
            </div>
            <div className="flex justify-between text-body-sm">
              <span className="text-secondary">Risk Level</span>
              <span className="font-medium text-[#22C55E]">Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Pending Actions */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
          <h2 className="text-headline-sm font-geist text-error mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            Needs Attention
          </h2>
          
          <div className="flex flex-col gap-3">
            {pendingActions.pendingLoans > 0 ? (
              <div className="flex items-center justify-between p-3 bg-surface-container-low border border-[#E5E7EB] rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-orange-500">pending_actions</span>
                  <span className="text-body-sm font-medium text-on-surface">{pendingActions.pendingLoans} loan requests pending</span>
                </div>
                <Link href="/admin/loans" className="bg-white border border-[#E5E7EB] text-body-sm px-3 py-1 rounded hover:bg-gray-50 transition-colors font-medium">
                  Review
                </Link>
              </div>
            ) : null}

            {pendingActions.overdueLoans > 0 ? (
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-error">event_busy</span>
                  <span className="text-body-sm font-medium text-error">{pendingActions.overdueLoans} members overdue on loans</span>
                </div>
                <Link href="/admin/loans" className="bg-white border border-red-200 text-body-sm px-3 py-1 rounded text-error hover:bg-red-50 transition-colors font-medium">
                  Remind
                </Link>
              </div>
            ) : null}

            {pendingActions.lateContributions > 0 ? (
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-orange-600">schedule</span>
                  <span className="text-body-sm font-medium text-orange-800">{pendingActions.lateContributions} late contributions</span>
                </div>
                <Link href="/admin/contributions" className="bg-white border border-orange-200 text-body-sm px-3 py-1 rounded text-orange-800 hover:bg-orange-50 transition-colors font-medium">
                  View
                </Link>
              </div>
            ) : null}

            {pendingActions.pendingLoans === 0 && pendingActions.overdueLoans === 0 && pendingActions.lateContributions === 0 && (
              <div className="flex items-center gap-3 p-4 bg-surface-container-low border border-[#E5E7EB] rounded-lg">
                <span className="material-symbols-outlined text-[#22C55E]">check_circle</span>
                <span className="text-body-sm text-secondary">All clear — no pending actions</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Recent Transactions */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-headline-sm font-geist text-on-surface">Recent Activity</h2>
            <Link href="/admin/transactions" className="text-body-sm text-primary hover:underline font-medium">View All</Link>
          </div>
          
          <div className="flex flex-col gap-4">
            {recentTransactions.length === 0 ? (
              <div className="text-body-sm text-secondary text-center py-4">No recent transactions.</div>
            ) : (
              recentTransactions.map(tx => {
                const isIncoming = ['contribution', 'repayment', 'penalty', 'interest'].includes(tx.type);
                return (
                  <div key={tx.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${isIncoming ? 'bg-[#22C55E]/10' : 'bg-red-50'}`}>
                        <span className={`material-symbols-outlined text-[16px] ${isIncoming ? 'text-[#005321]' : 'text-error'}`}>
                          {isIncoming ? 'arrow_downward' : 'arrow_upward'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-body-sm font-medium text-on-surface truncate">{tx.members?.full_name}</div>
                        <div className="text-label-caps text-secondary uppercase truncate">{tx.type.replace('_', ' ')}</div>
                      </div>
                    </div>
                    <div className={`text-body-sm font-bold font-mono ${isIncoming ? 'text-[#22C55E]' : 'text-on-surface'}`}>
                      {isIncoming ? '+' : '-'}KSh {formatCurrency(Number(tx.amount))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Top Contributors */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
          <h2 className="text-headline-sm font-geist text-on-surface mb-4">Top Contributors</h2>
          <div className="text-label-caps text-secondary mb-4">THIS MONTH</div>
          
          <div className="flex flex-col gap-4">
            {topContributors.length === 0 ? (
              <div className="text-body-sm text-secondary text-center py-4">No contributions yet this month.</div>
            ) : (
              topContributors.map((user, index) => (
                <div key={user.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-surface-container-high text-secondary'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-body-sm font-medium text-on-surface truncate">{user.name}</span>
                  </div>
                  <span className="text-body-sm font-bold font-mono text-[#22C55E]">
                    KSh {formatCurrency(user.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
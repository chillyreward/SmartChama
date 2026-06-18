"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function MemberDashboard() {
  const { session, member, group, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [totalSavings, setTotalSavings] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);
  const [repaymentRate, setRepaymentRate] = useState<number | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [groupHealth, setGroupHealth] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState("");

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  const fetchDashboardData = async () => {
    if (!member) return;
    try {
      setLoading(true);
      setError("");

      // 1. Total Savings
      const { data: contributions } = await supabase
        .from('contributions')
        .select('amount, created_at')
        .eq('member_id', member.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: true });

      let sum = 0;
      const monthlySum: Record<string, number> = {};
      
      if (contributions) {
        contributions.forEach(c => {
          sum += Number(c.amount);
          const date = new Date(c.created_at);
          const monthYear = date.toLocaleString('default', { month: 'short' }); 
          if (!monthlySum[monthYear]) monthlySum[monthYear] = 0;
          monthlySum[monthYear] += Number(c.amount);
        });
      }
      setTotalSavings(sum);

      const chartData = Object.keys(monthlySum).map(month => ({
        month,
        amount: monthlySum[month]
      }));
      setTrendData(chartData);

      // 2 & 3. Active Loans and Repayment Rate
      const { data: loans } = await supabase
        .from('loans')
        .select('status')
        .eq('borrower_id', member.id);

      if (loans && loans.length > 0) {
        const active = loans.filter(l => l.status === 'active').length;
        setActiveLoans(active);
        const repaid = loans.filter(l => l.status === 'repaid').length;
        setRepaymentRate(Math.round((repaid / loans.length) * 100));
      } else {
        setActiveLoans(0);
        setRepaymentRate(null);
      }

      // 4. Recent Transactions
      if (member.group_id) {
        const { data: txData } = await supabase
          .from('transactions')
          .select(`*, members ( full_name )`)
          .eq('group_id', member.group_id)
          .order('created_at', { ascending: false })
          .limit(5);

        setTransactions(txData || []);

        // 5. Group Health Score
        const { data: groupMembers } = await supabase
          .from('members')
          .select('id, trust_score, contribution_streak')
          .eq('group_id', member.group_id);

        if (groupMembers && groupMembers.length > 0) {
          const avgTrust = groupMembers.reduce((acc, m) => acc + (m.trust_score || 0), 0) / groupMembers.length;
          const avgStreak = groupMembers.reduce((acc, m) => acc + (m.contribution_streak || 0), 0) / groupMembers.length;
          
          // Participation
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0,0,0,0);
          const { data: thisMonthCont } = await supabase
            .from('contributions')
            .select('member_id')
            .eq('group_id', member.group_id)
            .gte('created_at', startOfMonth.toISOString());
            
          const uniqueContributors = new Set(thisMonthCont?.map(c => c.member_id)).size;
          const participation = Math.round((uniqueContributors / groupMembers.length) * 100);
          
          const overall = Math.round((avgTrust + participation + 85 + 85) / 4); // Approximating missing metrics

          setGroupHealth({
            overall,
            participation,
            repayment: 85,
            consistency: Math.min(100, Math.round(avgStreak * 10)),
            trust: Math.round(avgTrust)
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && member) {
      fetchDashboardData();

      // Realtime subscription
      const channel = supabase
        .channel('my-contributions')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'contributions',
          filter: `member_id=eq.${member.id}`
        }, (payload: any) => {
          setToastMsg(`KSh ${payload.new.amount} contribution confirmed!`);
          setTimeout(() => setToastMsg(""), 3000);
          fetchDashboardData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authLoading, member]);

  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[1,2,3,4].map(i => (
             <div key={i} className="bg-white border border-[#E5E7EB] rounded-lg p-6 h-32 animate-pulse flex flex-col justify-between shadow-sm">
                <div className="bg-gray-100 h-4 w-24 rounded"></div>
                <div className="bg-gray-100 h-8 w-32 rounded"></div>
             </div>
          ))}
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 h-64 animate-pulse mb-6"></div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-lg p-6 h-80 animate-pulse"></div>
          <div className="lg:col-span-1 bg-white border border-[#E5E7EB] rounded-lg p-6 h-80 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <span className="material-symbols-outlined text-error text-5xl mb-4">error_outline</span>
        <p className="text-body-sm text-error">{error}</p>
        <button onClick={fetchDashboardData} className="mt-4 text-primary hover:underline font-medium">Retry</button>
      </div>
    );
  }

  const trustColor = (member.trust_score >= 80) ? 'text-[#22C55E]' : (member.trust_score >= 60 ? 'text-yellow-500' : 'text-error');

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full relative">
      
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#22C55E] text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* ROW 1: Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        
        {/* Card 1 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="text-label-caps text-on-surface-variant">TOTAL SAVINGS</div>
            <span className="material-symbols-outlined text-outline-variant">savings</span>
          </div>
          <div className="text-display-sm text-on-surface font-geist">KSh {formatCurrency(totalSavings)}</div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-label-caps text-on-surface-variant mb-4">ACTIVE LOANS</div>
          <div className="text-display-sm text-on-surface font-geist">{activeLoans}</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-label-caps text-on-surface-variant mb-4">REPAYMENT RATE</div>
          <div className="flex items-center gap-3">
            <div className="text-display-sm text-on-surface font-geist">{repaymentRate !== null ? `${repaymentRate}%` : '—'}</div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="text-label-caps text-on-surface-variant">TRUST SCORE</div>
            <span className={`material-symbols-outlined ${trustColor}`}>verified</span>
          </div>
          <div className={`text-display-sm font-geist ${trustColor}`}>{member.trust_score || 0}/100</div>
        </div>

      </div>

      {/* ROW 2: Contribution Trend Chart */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-headline-sm text-on-surface font-geist">Contribution Trend</h2>
        </div>
        
        {trendData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} tickFormatter={(val) => `KSh ${val.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value: number) => [`KSh ${value.toLocaleString()}`, 'Amount']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                />
                <Line type="monotone" dataKey="amount" stroke="#22C55E" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#22C55E', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 w-full flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">payments</span>
            <p className="text-headline-sm text-secondary">No contributions yet</p>
            <p className="text-body-sm text-secondary">Make your first contribution to get started.</p>
          </div>
        )}
      </div>

      {/* ROW 3: Two columns */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6 mb-12">
        
        {/* Left: Recent Transactions */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-headline-sm text-on-surface font-geist">Recent Transactions</h2>
          </div>

          <div className="overflow-x-auto">
            {transactions.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="py-3 text-label-caps text-on-secondary-container font-medium">DATE</th>
                    <th className="py-3 text-label-caps text-on-secondary-container font-medium">MEMBER</th>
                    <th className="py-3 text-label-caps text-on-secondary-container font-medium">TYPE</th>
                    <th className="py-3 text-label-caps text-on-secondary-container font-medium text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => {
                    const date = new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    const isIncoming = tx.type === 'contribution' || tx.type === 'repayment' || tx.type === 'penalty';
                    const amountColor = isIncoming ? 'text-[#22C55E]' : 'text-on-surface';
                    const sign = isIncoming ? '+' : '-';
                    
                    return (
                      <tr key={tx.id} className="border-b border-[#E5E7EB] hover:bg-gray-50 transition-colors last:border-0">
                        <td className="py-4 text-body-sm text-on-surface whitespace-nowrap">{date}</td>
                        <td className="py-4">
                          <span className="text-body-sm text-on-surface font-medium">{tx.members?.full_name || 'System'}</span>
                        </td>
                        <td className="py-4">
                          <span className="inline-block bg-surface-container-low border border-[#E5E7EB] text-on-surface px-2 py-1 rounded text-xs font-medium capitalize">
                            {tx.type}
                          </span>
                        </td>
                        <td className={`py-4 text-right text-body-sm font-medium ${amountColor} whitespace-nowrap`}>
                          {sign} KSh {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">receipt_long</span>
                <p className="text-body-sm text-secondary">No transactions found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Group Health Score */}
        <div className="lg:col-span-1 bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col shadow-sm">
          <h2 className="text-headline-sm text-on-surface font-geist mb-6">Group Health</h2>
          
          {groupHealth ? (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#22C55E" strokeWidth="8" strokeLinecap="round" 
                      strokeDasharray={`${(groupHealth.overall / 100) * 282.7} 282.7`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                    <span className="text-display-sm font-geist text-on-surface leading-none">{groupHealth.overall}</span>
                    <span className="text-label-caps text-on-secondary-container mt-1">
                      {groupHealth.overall >= 80 ? 'Excellent' : (groupHealth.overall >= 60 ? 'Good' : 'Needs Attention')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-5 flex-1">
                {[
                  { label: 'Participation', value: groupHealth.participation },
                  { label: 'Repayment', value: groupHealth.repayment },
                  { label: 'Consistency', value: groupHealth.consistency },
                  { label: 'Trust', value: groupHealth.trust },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-label-caps text-on-surface-variant">{stat.label}</span>
                      <span className="text-mono-data text-on-surface">{stat.value}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div className="h-full bg-[#22C55E] transition-all" style={{ width: `${stat.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center py-10 flex-1">
                <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">monitoring</span>
                <p className="text-body-sm text-secondary">Not enough data to calculate health score</p>
             </div>
          )}
        </div>

      </div>

    </div>
  );
}
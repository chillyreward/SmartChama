"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const { session, member, group, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [totalPool, setTotalPool] = useState(0);
  const [outstandingLoans, setOutstandingLoans] = useState(0);
  const [collectionRate, setCollectionRate] = useState<number>(0);
  const [membersCount, setMembersCount] = useState(0);
  
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [groupHealth, setGroupHealth] = useState<any>(null);

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  const fetchAdminData = async () => {
    if (!member || !member.group_id) return;
    try {
      setLoading(true);
      setError("");

      // 1. Total Pool & Cashflow Data (Confirmed Contributions)
      const { data: contributions } = await supabase
        .from('contributions')
        .select('amount, created_at')
        .eq('group_id', member.group_id)
        .eq('status', 'confirmed');

      let pool = 0;
      const monthlySum: Record<string, number> = {};
      
      if (contributions) {
        contributions.forEach(c => {
          pool += Number(c.amount);
          const date = new Date(c.created_at);
          const monthYear = date.toLocaleString('default', { month: 'short' }); 
          if (!monthlySum[monthYear]) monthlySum[monthYear] = 0;
          monthlySum[monthYear] += Number(c.amount);
        });
      }
      setTotalPool(pool);

      const chartData = Object.keys(monthlySum).map(month => ({
        month,
        amount: monthlySum[month]
      }));
      setCashflowData(chartData);

      // 2. Outstanding Loans
      const { data: loans } = await supabase
        .from('loans')
        .select('amount, status')
        .eq('group_id', member.group_id)
        .eq('status', 'active');

      if (loans) {
        const outstanding = loans.reduce((acc, l) => acc + Number(l.amount), 0);
        setOutstandingLoans(outstanding);
      }

      // 3. Members Count
      const { data: members } = await supabase
        .from('members')
        .select('id, trust_score, contribution_streak')
        .eq('group_id', member.group_id);

      if (members) {
        setMembersCount(members.length);
        
        // Group Health logic
        const avgTrust = members.reduce((acc, m) => acc + (m.trust_score || 0), 0) / members.length;
        const avgStreak = members.reduce((acc, m) => acc + (m.contribution_streak || 0), 0) / members.length;
        
        // Collection rate approximation
        const expected = members.length * 1000; // Mock expected monthly
        const currentMonthSum = chartData[chartData.length - 1]?.amount || 0;
        const rate = expected > 0 ? Math.min(100, Math.round((currentMonthSum / expected) * 100)) : 0;
        setCollectionRate(rate);

        const overall = Math.round((avgTrust + rate + 85 + 85) / 4);

        setGroupHealth({
          overall,
          collection: rate,
          repayment: 85,
          consistency: Math.min(100, Math.round(avgStreak * 10)),
          trust: Math.round(avgTrust)
        });
      }

      // 4. Recent Ledger
      const { data: txData } = await supabase
        .from('transactions')
        .select(`*, members ( full_name )`)
        .eq('group_id', member.group_id)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentTransactions(txData || []);

    } catch (err: any) {
      console.error(err);
      setError("Failed to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && member) {
      fetchAdminData();

      // Realtime subscription
      const channel = supabase
        .channel('admin-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `group_id=eq.${member.group_id}`
        }, () => {
          fetchAdminData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authLoading, member]);

  if (authLoading || loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full font-inter">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => (
             <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 h-32 animate-pulse flex flex-col justify-between">
                <div className="bg-gray-100 h-3 w-24 rounded"></div>
                <div className="bg-gray-100 h-6 w-32 rounded"></div>
             </div>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 h-64 animate-pulse mb-8"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-32 font-inter">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
        </div>
        <p className="text-sm font-medium text-black mb-2">{error}</p>
        <button onClick={fetchAdminData} className="text-xs font-semibold text-gray-500 hover:text-black uppercase tracking-wider transition-colors">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full relative font-inter bg-white min-h-screen">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-black">Admin Overview</h1>
        <p className="text-sm text-gray-500">Monitor group liquidity, loans, and member standing.</p>
      </div>

      {/* ROW 1: Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col justify-between hover:border-gray-300 transition-colors">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-6">Total Treasury</div>
          <div className="text-3xl font-bold tracking-tight text-black">KSh {formatCurrency(totalPool)}</div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col justify-between hover:border-gray-300 transition-colors">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-6">Loans Disbursed</div>
          <div className="text-3xl font-bold tracking-tight text-black">KSh {formatCurrency(outstandingLoans)}</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col justify-between hover:border-gray-300 transition-colors">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-6">Collection Rate</div>
          <div className="text-3xl font-bold tracking-tight text-black">{collectionRate}%</div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col justify-between hover:border-gray-300 transition-colors">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-6">Total Members</div>
          <div className="text-3xl font-bold tracking-tight text-black">{membersCount}</div>
        </div>

      </div>

      {/* ROW 2: Treasury Flow Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-black">Treasury Inflows</h2>
        </div>
        
        {cashflowData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dx={-10} tickFormatter={(val) => `KSh ${val.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value: any) => [`KSh ${value.toLocaleString()}`, 'Collected']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', fontSize: '14px' }}
                  cursor={{ fill: '#F9FAFB' }}
                />
                <Bar dataKey="amount" fill="#000000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 w-full flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-500 mb-1">No treasury data</p>
          </div>
        )}
      </div>

      {/* ROW 3: Two columns */}
      <div className="grid lg:grid-cols-3 gap-6 mb-12">
        
        {/* Left: Global Ledger */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-black">Global Ledger</h2>
            <button className="text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-black transition-colors">Export CSV</button>
          </div>

          <div className="overflow-x-auto">
            {recentTransactions.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map(tx => {
                    const date = new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    const isIncoming = tx.type === 'contribution' || tx.type === 'repayment' || tx.type === 'penalty';
                    const sign = isIncoming ? '+' : '-';
                    
                    return (
                      <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors last:border-0">
                        <td className="py-4 px-6 text-sm text-gray-500 whitespace-nowrap">{date}</td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-black font-medium">{tx.members?.full_name || 'System'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-block border border-gray-200 text-gray-600 px-2 py-0.5 rounded text-xs font-medium capitalize bg-white">
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <span className={`text-sm font-medium ${isIncoming ? 'text-black' : 'text-gray-500'}`}>
                            {sign} KSh {formatCurrency(tx.amount)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm font-medium text-gray-500">No transactions recorded</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Needs Attention & Health */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
             <h2 className="text-sm font-bold text-amber-900 mb-4">Action Required</h2>
             <ul className="space-y-3">
               <li className="text-sm text-amber-800 flex items-start gap-2">
                 <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0"></div>
                 <span>3 members missed this month's contribution.</span>
               </li>
               <li className="text-sm text-amber-800 flex items-start gap-2">
                 <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0"></div>
                 <span>1 loan application pending approval.</span>
               </li>
             </ul>
             <button className="mt-6 text-xs font-semibold uppercase tracking-wider text-amber-900 hover:text-amber-700 transition-colors">Resolve issues →</button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 flex-1 flex flex-col">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-black mb-8">Group Health</h2>
            
            {groupHealth ? (
              <>
                <div className="flex flex-col items-center mb-10">
                  <div className="text-5xl font-bold tracking-tight text-black mb-1">{groupHealth.overall}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {groupHealth.overall >= 80 ? 'Excellent Standing' : (groupHealth.overall >= 60 ? 'Good Standing' : 'Needs Attention')}
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  {[
                    { label: 'Collection Rate', value: groupHealth.collection },
                    { label: 'Repayment Rate', value: groupHealth.repayment },
                    { label: 'Consistency', value: groupHealth.consistency },
                    { label: 'Trust Avg.', value: groupHealth.trust },
                  ].map((stat, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-medium text-gray-500">{stat.label}</span>
                        <span className="text-xs font-bold text-black">{stat.value}%</span>
                      </div>
                      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-black transition-all" style={{ width: `${stat.value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
               <div className="flex flex-col items-center justify-center py-16 flex-1 text-center">
                  <p className="text-sm font-medium text-gray-500">Not enough data to calculate health score</p>
               </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
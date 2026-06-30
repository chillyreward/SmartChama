'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/components/AuthProvider';

export default function MemberDashboard() {
  const router = useRouter();
  const { session, member, group: chama, isLoading: authLoading } = useAuth();

  const [loadingSavings, setLoadingSavings] = useState(true);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [error, setError] = useState('');
  
  
  const [totalSavings, setTotalSavings] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);
  const [loanData, setLoanData] = useState<any[]>([]);
  const [repaymentRate, setRepaymentRate] = useState<number | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [groupHealth, setGroupHealth] = useState<any>(null);

  const formatCurrency = (val: number) => val.toLocaleString('en-KE', { maximumFractionDigits: 0 });

  const hasFetched = useRef(false);

  async function loadDashboardData() {
    if (!member || !chama) return;
    try {
      await Promise.all([
        loadSavingsData(member.id),
        loadLoanData(member.id),
        loadRecentTransactions(chama.id),
        loadGroupHealth(chama.id)
      ]);
    } catch (e) {
      console.error(e);
      setError('Failed to load dashboard data');
    } finally {
      setLoadingSavings(false);
      setLoadingLoans(false);
      setLoadingTransactions(false);
      setLoadingHealth(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    if (!member || !chama) {
      router.push('/onboarding');
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;
    
    loadDashboardData();

    const channel = supabase.channel(`dashboard-${member.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'contributions_v2',
        filter: `membership_id=eq.${member.id}`
      }, () => {
        loadSavingsData(member.id).catch(err => console.error(err));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authLoading, session, member, chama, router, supabase]);

  async function loadSavingsData(membershipId: string) {
    const { data, error } = await supabase
      .from('contributions_v2')
      .select('amount, created_at')
      .eq('membership_id', membershipId)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    
    const total = data?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    setTotalSavings(total);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const monthly: Record<string, number> = {};
    data?.forEach(c => {
      const cDate = new Date(c.created_at);
      if (cDate >= twelveMonthsAgo) {
        const month = cDate.toLocaleString('en-KE', { month: 'short', year: '2-digit' });
        monthly[month] = (monthly[month] || 0) + c.amount;
      }
    });
    
    const chartDataFormatted = Object.entries(monthly).map(([month, amount]) => ({ month, amount }));
    setChartData(chartDataFormatted);
  }

  async function loadLoanData(membershipId: string) {
    const { data: allLoans, error } = await supabase
      .from('loans_v2')
      .select('*')
      .eq('membership_id', membershipId);
      
    if (error) throw error;
    
    const active = allLoans?.filter(l => l.status === 'active' || l.status === 'overdue') || [];
    setActiveLoans(active.length);
    setLoanData(active);

    if (!allLoans || allLoans.length === 0) {
      setRepaymentRate(null);
      return;
    }
    
    const repaid = allLoans.filter(l => l.status === 'repaid').length;
    const rate = Math.round((repaid / allLoans.length) * 100);
    setRepaymentRate(rate);
  }

  async function loadRecentTransactions(chamaId: string) {
    const { data, error } = await supabase
      .from('transactions_v2')
      .select('*, chama_memberships(profiles(full_name))')
      .eq('chama_id', chamaId)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) throw error;
    setTransactions(data || []);
  }

  async function loadGroupHealth(chamaId: string) {
    const { data: groupMembers, error } = await supabase
      .from('chama_memberships')
      .select('trust_score')
      .eq('chama_id', chamaId)
      .eq('status', 'active');
      
    if (error) throw error;
    
    if (groupMembers && groupMembers.length > 0) {
      const avgTrust = groupMembers.reduce((acc, m) => acc + (m.trust_score || 0), 0) / groupMembers.length;
      setGroupHealth({
        overall: Math.round(avgTrust)
      });
    }
  }

  const retry = () => {
    setLoadingSavings(true);
    setLoadingLoans(true);
    setLoadingTransactions(true);
    setLoadingHealth(true);
    setError('');
    window.location.reload();
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const firstName = member?.full_name?.split(' ')[0] || 'Member';
  const chamaName = chama?.name || 'Group';

  // Loading states are now handled at the component level

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--text-main)]">
        <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error_outline</span>
        <p className="body-sm text-red-500">Something went wrong loading this data.</p>
        <button onClick={retry} className="mt-4 text-[var(--brand-green)] body-sm underline">Try again</button>
      </div>
    );
  }

  const trustColor = (member?.trust_score >= 80) ? 'text-[var(--brand-green)]' : (member?.trust_score >= 60 ? 'text-yellow-500' : 'text-red-500');

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full relative font-inter text-[var(--text-main)]">
      
      {/* Welcome Banner */}
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-bold text-[var(--text-main)] tracking-tight leading-none">
            Good morning, {firstName}.
          </h1>
          <p className="text-[15px] text-[var(--text-muted)] mt-2">
            {chamaName} — {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        <div className="hidden md:flex items-center gap-3">
          <Link href="/dashboard/notifications" className="w-10 h-10 rounded-lg bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] flex items-center justify-center hover:bg-[#22C55E]/10 transition-colors">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </Link>
          <Link href="/dashboard/profile" className="w-10 h-10 rounded-full bg-[#006e2f] dark:bg-[#22C55E] text-white flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm">
            {getInitials(member?.full_name)}
          </Link>
        </div>
      </div>

      {/* ROW 1: Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        
        <div className="bg-white dark:bg-[#161d16] border border-[#E5E7EB] dark:border-[#2d3d2d] border-t-2 border-t-[#22C55E] rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[11px] font-bold tracking-wider text-[#60645f] dark:text-[#8FA88F] uppercase">YOUR CONTRIBUTIONS</div>
            <span className="material-symbols-outlined text-gray-300 dark:text-[#5a6e5a]">savings</span>
          </div>
          <div className="text-[22px] md:text-[32px] text-[var(--text-main)] font-geist font-bold leading-tight">
            {loadingSavings ? <div className="h-8 w-32 bg-gray-200 dark:bg-[#2d3d2d] animate-pulse rounded"></div> : `KSh ${formatCurrency(totalSavings)}`}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-2 leading-tight">
            SmartChama does not hold money. This is a record only.
          </p>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-blue-400 rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">ACTIVE LOANS</div>
            <span className="material-symbols-outlined text-gray-300 dark:text-[#5a6e5a]">payments</span>
          </div>
          <div className="text-[22px] md:text-[32px] text-[var(--text-main)] font-geist font-bold leading-tight">
            {loadingLoans ? <div className="h-8 w-12 bg-gray-200 dark:bg-[#2d3d2d] animate-pulse rounded"></div> : activeLoans}
          </div>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-[#22C55E] rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">REPAYMENT RATE</div>
            <span className="material-symbols-outlined text-gray-300 dark:text-[#5a6e5a]">percent</span>
          </div>
          <div className="text-[22px] md:text-[32px] text-[var(--text-main)] font-geist font-bold leading-tight">
            {loadingLoans ? <div className="h-8 w-16 bg-gray-200 dark:bg-[#2d3d2d] animate-pulse rounded"></div> : (repaymentRate !== null ? `${repaymentRate}%` : <span className="text-body-sm text-gray-400 dark:text-[#5a6e5a] font-normal tracking-normal">No loans yet</span>)}
          </div>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-[#22C55E] rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">TRUST SCORE</div>
            <span className={`material-symbols-outlined ${trustColor}`}>verified</span>
          </div>
          <div className={`text-[22px] md:text-[32px] font-geist font-bold leading-tight ${trustColor}`}>{member?.trust_score || 0}/100</div>
        </div>
      </div>

      {/* ROW 2: Contribution Trend Chart */}
      <div className="card-bg border border-[var(--border)] rounded-2xl p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold font-geist text-[var(--text-main)]">Contribution Trend</h2>
        </div>
        
        {loadingSavings ? (
          <div className="w-full h-[200px] md:h-[300px] bg-gray-100 dark:bg-[#1a2218] animate-pulse rounded-lg"></div>
        ) : chartData.length > 0 ? (
          <div className="w-full">
            <ResponsiveContainer width="100%" height={200} className="md:h-[300px]">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSavingsMember" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-[#2d3d2d]" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#60645f' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#60645f' }} dx={-10} tickFormatter={(val) => `KSh ${val.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value: any) => [`KSh ${value.toLocaleString()}`, 'Amount']}
                  contentStyle={{ borderRadius: '12px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: 'var(--color-text-primary)' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#22C55E" strokeWidth={3} fillOpacity={1} fill="url(#colorSavingsMember)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--text-main)]">
            <span className="material-symbols-outlined text-gray-250 dark:text-[#5a6e5a] text-6xl mb-4">show_chart</span>
            <h3 className="text-xl font-bold font-geist">No contributions recorded yet.</h3>
            <p className="text-body-sm text-[var(--text-muted)] mt-2">Make your first contribution to see your savings trend.</p>
          </div>
        )}
      </div>

      {/* ROW 3 */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6 mb-12">
        <div className="lg:col-span-2 card-bg border border-[var(--border)] rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold font-geist text-[var(--text-main)]">Recent Transactions</h2>
          </div>

          <div>
            {loadingTransactions ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-[#1a2218] animate-pulse rounded-lg"></div>)}
              </div>
            ) : transactions.length > 0 ? (
              <>
                {/* Mobile card list shown on small screens only */}
                <div className="md:hidden flex flex-col divide-y divide-[#E5E7EB] dark:divide-[#2d3d2d]">
                  {transactions.map(tx => {
                    const date = new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    const isIncoming = tx.type === 'contribution' || tx.type === 'repayment' || tx.type === 'penalty';
                    const amountColor = isIncoming ? 'text-[var(--brand-green)]' : 'text-[var(--text-main)]';
                    const sign = isIncoming ? '+' : '-';
                    const name = tx.chama_memberships?.profiles?.full_name || 'System';
                    
                    return (
                      <div key={tx.id} className="py-4 px-2 active:bg-[#f5f5f5] dark:active:bg-[#1f2a1f] transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] flex items-center justify-center text-[12px] font-bold text-[var(--brand-green)] flex-shrink-0">
                              {getInitials(name)}
                            </div>
                            <div>
                              <p className="text-[14px] font-medium text-[var(--text-main)]">{name}</p>
                              <p className="text-[12px] text-[var(--text-muted)]">{date}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className={`text-[15px] font-semibold ${amountColor}`}>{sign} KSh {formatCurrency(tx.amount)}</p>
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-transparent text-[var(--brand-green)] text-[var(--brand-green)]">
                              {tx.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table hidden on mobile */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="py-3 text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase">DATE</th>
                        <th className="py-3 text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase">MEMBER</th>
                        <th className="py-3 text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase">TYPE</th>
                        <th className="py-3 text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase text-right">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
                      {transactions.map(tx => {
                        const date = new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                        const isIncoming = tx.type === 'contribution' || tx.type === 'repayment' || tx.type === 'penalty';
                        const amountColor = isIncoming ? 'text-[var(--brand-green)]' : 'text-[var(--text-main)]';
                        const sign = isIncoming ? '+' : '-';
                        
                        return (
                          <tr key={tx.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                            <td className="py-4 text-body-sm text-[var(--text-muted)] whitespace-nowrap">{date}</td>
                            <td className="py-4">
                              <span className="text-body-sm text-[var(--text-main)] font-medium">{tx.chama_memberships?.profiles?.full_name || 'System'}</span>
                            </td>
                            <td className="py-4">
                              <span className="inline-block bg-transparent text-[var(--brand-green)] border border-[var(--border)] text-[var(--brand-green)] px-2 py-1 rounded text-xs font-semibold capitalize">
                                {tx.type}
                              </span>
                            </td>
                            <td className={`py-4 text-right text-body-sm font-bold font-mono ${amountColor} whitespace-nowrap`}>
                              {sign} KSh {formatCurrency(tx.amount)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--text-main)]">
                <span className="material-symbols-outlined text-gray-250 dark:text-[#5a6e5a] text-6xl mb-4">receipt_long</span>
                <h3 className="text-xl font-bold font-geist">No transactions found</h3>
                <p className="text-body-sm text-[var(--text-muted)] mt-2">Transactions will appear here once recorded.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 card-bg border border-[var(--border)] rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-all duration-200">
          <h2 className="text-xl font-bold font-geist text-[var(--text-main)] mb-6">Group Health</h2>
          
          {loadingHealth ? (
             <div className="flex flex-col items-center py-10 flex-1">
                <div className="w-32 h-32 rounded-full border-8 border-gray-200 dark:border-[#2d3d2d] animate-pulse mb-6"></div>
                <div className="space-y-4 w-full">
                  {[1,2,3,4].map(i => <div key={i} className="h-2 w-full bg-gray-200 dark:bg-[#2d3d2d] animate-pulse rounded-full"></div>)}
                </div>
             </div>
          ) : groupHealth ? (
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" className="dark:stroke-[#2d3d2d]" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#22C55E" strokeWidth="8" strokeLinecap="round" 
                    strokeDasharray={`${(groupHealth.overall / 100) * 282.7} 282.7`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                  <span className="text-3xl font-geist font-bold text-[var(--text-main)] leading-none">{groupHealth.overall}</span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-wider">
                    {groupHealth.overall >= 80 ? 'Excellent' : (groupHealth.overall >= 60 ? 'Good' : 'Needs Attention')}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-4 mt-6">
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold text-[var(--text-muted)]">
                    <span>Contributions</span>
                    <span>40/40</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-[#1a2218] rounded-full overflow-hidden">
                    <div className="h-full bg-[#22C55E] w-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold text-[var(--text-muted)]">
                    <span>Loan Repayment</span>
                    <span>30/30</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-[#1a2218] rounded-full overflow-hidden">
                    <div className="h-full bg-[#22C55E] w-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold text-[var(--text-muted)]">
                    <span>Tenure</span>
                    <span>20/20</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-[#1a2218] rounded-full overflow-hidden">
                    <div className="h-full bg-[#22C55E] w-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold text-[var(--text-muted)]">
                    <span>Participation Streak</span>
                    <span>10/10</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-[#1a2218] rounded-full overflow-hidden">
                    <div className="h-full bg-[#22C55E] w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-10 flex-1 text-[var(--text-main)]">
                <span className="material-symbols-outlined text-gray-250 dark:text-[#5a6e5a] text-6xl mb-4">monitoring</span>
                <p className="text-body-sm text-[var(--text-muted)]">Not enough data to calculate health score</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

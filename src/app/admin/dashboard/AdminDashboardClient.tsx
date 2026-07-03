'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/components/AuthProvider';

export default function AdminDashboardPage({
  member: initialAdmin,
  chama: initialChama,
  metrics: initialMetrics,
  initialTransactions
}: {
  member?: any;
  chama?: any;
  metrics?: any;
  initialTransactions?: any[];
} = {}) {
  const router = useRouter();
  const { session, member: authAdmin, group: authChama, isLoading: authLoading } = useAuth();

  const admin = initialAdmin || authAdmin;
  const chama = initialChama || authChama;

  const [loading, setLoading] = useState(!initialMetrics);
  const [error, setError] = useState('');

  const [metrics, setMetrics] = useState({
    totalSavings: initialMetrics ? initialMetrics.totalSavings : 0,
    memberCount: initialMetrics ? initialMetrics.memberCount : 0,
    activeLoanCount: initialMetrics ? initialMetrics.activeLoanCount : 0,
    collectionRate: initialMetrics ? initialMetrics.collectionRate : 0,
    avgTrust: initialMetrics ? initialMetrics.avgTrust : 0
  });

  const [pendingActions, setPendingActions] = useState({
    loans: [] as any[],
    overdue: [] as any[],
    late: [] as any[]
  });

  const [recentTransactions, setRecentTransactions] = useState<any[]>(initialTransactions || []);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topContributors, setTopContributors] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState('');

  const formatCurrency = (val: number) => val.toLocaleString('en-KE', { maximumFractionDigits: 0 });

  const hasFetched = useRef(false);

  useEffect(() => {
    if (initialMetrics) {
      setMetrics({
        totalSavings: initialMetrics.totalSavings,
        memberCount: initialMetrics.memberCount,
        activeLoanCount: initialMetrics.activeLoanCount,
        collectionRate: initialMetrics.collectionRate,
        avgTrust: initialMetrics.avgTrust
      });
      
      if (initialMetrics.contributions) {
        const contribByMember: Record<string, { name: string; amount: number; count: number }> = {};
        initialMetrics.contributions.forEach((c: any) => {
          const mInfo = initialMetrics.members.find((m: any) => m.id === c.membership_id);
          const name = mInfo?.profiles?.full_name || 'Member';
          if (!contribByMember[c.membership_id]) {
            contribByMember[c.membership_id] = { name, amount: 0, count: 0 };
          }
          contribByMember[c.membership_id].amount += c.amount;
          contribByMember[c.membership_id].count += 1;
        });
        
        const formattedTop = Object.values(contribByMember)
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
        setTopContributors(formattedTop);

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        
        const monthly: Record<string, number> = {};
        initialMetrics.contributions.forEach((c: any) => {
          const cDate = new Date(c.created_at);
          if (cDate >= twelveMonthsAgo) {
            const month = cDate.toLocaleString('en-KE', { month: 'short', year: '2-digit' });
            monthly[month] = (monthly[month] || 0) + c.amount;
          }
        });
        
        const chartDataFormatted = Object.entries(monthly).map(([month, amount]) => ({ month, amount }));
        setChartData(chartDataFormatted);
      }

      if (initialMetrics.loans) {
        const pending = initialMetrics.loans.filter((l: any) => l.status === 'pending');
        const overdue = initialMetrics.loans.filter((l: any) => l.status === 'overdue');
        const late = initialMetrics.loans.filter((l: any) => l.status === 'late');
        setPendingActions({ loans: pending, overdue, late });
      }
    }
  }, [initialMetrics]);

  useEffect(() => {
    if (initialTransactions) {
      setRecentTransactions(initialTransactions);
    }
  }, [initialTransactions]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    const adminRoles = ['admin', 'chairlady', 'treasurer', 'secretary'];
    
    if (!admin || !chama || !adminRoles.includes(admin.role)) {
      if (initialAdmin && initialChama && admin && adminRoles.includes(admin.role)) {
        // Ok
      } else {
        router.push('/dashboard');
        return;
      }
    }

    if (initialAdmin && initialChama) {
      const channel = supabase
        .channel('admin_dashboard')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'contributions_v2', filter: `chama_id=eq.${chama.id}` },
          (payload) => {
            loadGroupMetrics(chama.id).catch(e => console.error(e));
            loadTopContributors(chama.id).catch(e => console.error(e));
            showToast('New contribution received!');
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'loans_v2', filter: `chama_id=eq.${chama.id}` },
          (payload) => {
            loadPendingActions(chama.id).catch(e => console.error(e));
            showToast('New loan request submitted!');
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    async function loadAdminDashboardData() {
      try {
        await Promise.all([
          loadGroupMetrics(chama!.id),
          loadPendingActions(chama!.id),
          loadRecentTransactions(chama!.id),
          loadGroupSavingsTrend(chama!.id),
          loadTopContributors(chama!.id)
        ]);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }
    
    loadAdminDashboardData();

    const channel = supabase
      .channel('admin_dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contributions_v2', filter: `chama_id=eq.${chama.id}` },
        (payload) => {
          loadGroupMetrics(chama.id).catch(e => console.error(e));
          loadTopContributors(chama.id).catch(e => console.error(e));
          showToast('New contribution received!');
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'loans_v2', filter: `chama_id=eq.${chama.id}` },
        (payload) => {
          loadPendingActions(chama.id).catch(e => console.error(e));
          showToast('New loan request submitted!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authLoading, session, admin, chama, router, initialAdmin, initialChama]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  async function loadTopContributors(chamaId: string) {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const { data, error } = await supabase
      .from('contributions_v2')
      .select('amount, chama_memberships(profiles(full_name))')
      .eq('chama_id', chamaId)
      .eq('status', 'confirmed')
      .gte('created_at', firstDay);
      
    if (error) throw error;
    
    const grouped = (data || []).reduce((acc: any, curr: any) => {
      const name = curr.chama_memberships?.profiles?.full_name || 'Unknown Member';
      acc[name] = (acc[name] || 0) + curr.amount;
      return acc;
    }, {});
    
    const sorted = Object.entries(grouped)
      .map(([name, amount]) => ({ name, amount: amount as number }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
      
    setTopContributors(sorted);
  }

  async function loadGroupMetrics(chamaId: string) {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [contribsRes, membersCountRes, loansCountRes, thisMonthRes, membersRes] = await Promise.all([
      supabase.from('contributions_v2').select('amount').eq('chama_id', chamaId).eq('status', 'confirmed'),
      supabase.from('chama_memberships').select('*', { count: 'exact' }).eq('chama_id', chamaId).eq('status', 'active'),
      supabase.from('loans_v2').select('*', { count: 'exact' }).eq('chama_id', chamaId).in('status', ['active', 'overdue']),
      supabase.from('contributions_v2').select('membership_id, amount, status').eq('chama_id', chamaId).gte('created_at', firstDay),
      supabase.from('chama_memberships').select('trust_score').eq('chama_id', chamaId)
    ]);

    if (contribsRes.error) throw contribsRes.error;
    if (membersCountRes.error) throw membersCountRes.error;
    if (loansCountRes.error) throw loansCountRes.error;
    if (thisMonthRes.error) throw thisMonthRes.error;
    if (membersRes.error) throw membersRes.error;

    const totalSavings = contribsRes.data?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const memberCount = membersCountRes.count || 0;
    const activeLoanCount = loansCountRes.count || 0;

    const paidCount = new Set(
      thisMonthRes.data?.filter(c => c.status === 'confirmed').map(c => c.membership_id)
    ).size;
    
    const collectionRate = (memberCount > 0)
      ? Math.round((paidCount / memberCount) * 100)
      : 0;

    const avgTrust = (membersRes.data && membersRes.data.length > 0)
      ? Math.round(membersRes.data.reduce((sum, m) => sum + (m.trust_score || 0), 0) / membersRes.data.length)
      : 0;
    
    setMetrics({
      totalSavings,
      memberCount,
      activeLoanCount,
      collectionRate,
      avgTrust
    });
  }

  async function loadPendingActions(chamaId: string) {
    const [pendingLoans, overdueLoans, lateContributors] = await Promise.all([
      supabase.from('loans_v2')
        .select('id, amount, chama_memberships(profiles(full_name))')
        .eq('chama_id', chamaId)
        .eq('status', 'pending'),
      
      supabase.from('loans_v2')
        .select('id, amount, chama_memberships(profiles(full_name))')
        .eq('chama_id', chamaId)
        .eq('status', 'overdue'),
      
      supabase.from('contributions_v2')
        .select('membership_id, chama_memberships(profiles(full_name))')
        .eq('chama_id', chamaId)
        .eq('status', 'late')
    ]);
    
    if (pendingLoans.error) throw pendingLoans.error;
    if (overdueLoans.error) throw overdueLoans.error;
    if (lateContributors.error) throw lateContributors.error;
    
    setPendingActions({
      loans: pendingLoans.data || [],
      overdue: overdueLoans.data || [],
      late: lateContributors.data || []
    });
  }

  async function loadRecentTransactions(chamaId: string) {
    const { data, error } = await supabase
      .from('transactions_v2')
      .select('*, chama_memberships(profiles(full_name))')
      .eq('chama_id', chamaId)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) throw error;
    setRecentTransactions(data || []);
  }

  async function loadGroupSavingsTrend(chamaId: string) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 6);
    
    const { data, error } = await supabase
      .from('contributions_v2')
      .select('amount, created_at')
      .eq('chama_id', chamaId)
      .eq('status', 'confirmed')
      .gte('created_at', twelveMonthsAgo.toISOString())
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    
    const monthly: Record<string, number> = {};
    data?.forEach(c => {
      const month = new Date(c.created_at).toLocaleString('en-KE', { month: 'short', year: '2-digit' });
      monthly[month] = (monthly[month] || 0) + c.amount;
    });
    
    const chartDataFormatted = Object.entries(monthly).map(([month, amount]) => ({ month, amount }));
    setChartData(chartDataFormatted);
  }

  const retry = () => {
    setLoading(true);
    setError('');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full font-inter">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 card-bg border border-[var(--border)] rounded-2xl animate-pulse shadow-sm"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 card-bg border border-[var(--border)] rounded-2xl animate-pulse shadow-sm"></div>
          <div className="h-96 card-bg border border-[var(--border)] rounded-2xl animate-pulse shadow-sm"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--text-main)]">
        <span className="material-symbols-outlined text-[#ba1a1a] text-5xl mb-4">error_outline</span>
        <p className="text-body-sm text-[#ba1a1a]">{error}</p>
        <button onClick={retry} className="mt-4 text-[var(--brand-green)] text-body-sm underline">Try again</button>
      </div>
    );
  }

  const getCollectionColor = (rate: number) => {
    if (rate >= 85) return "text-[var(--brand-green)]";
    if (rate >= 60) return "text-yellow-500";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full font-inter text-[var(--text-main)] relative">
      
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-[#161d16] text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-fade-in-down">
          <span className="material-symbols-outlined text-[#22C55E]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Admin Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Overview</span>
        </p>
        
        <h1 className="text-[24px] md:text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
          Admin Overview
        </h1>
        <p className="text-[13px] md:text-[14px] text-[var(--text-muted)] mt-1">
          {chama?.name || 'Group'} · Manage savings, loans, and system compliance status.
        </p>
      </div>
      
      {/* METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
        <div className="card-bg border border-[var(--border)] border-t-2 border-t-[#22C55E] rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-label-caps text-[var(--text-muted)] mb-1 text-[10px] md:text-[12px] font-bold">TOTAL SAVINGS</div>
          <div className="text-[20px] md:text-[28px] font-geist font-bold text-[var(--text-main)]">KSh {formatCurrency(metrics.totalSavings)}</div>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-blue-450 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-label-caps text-[var(--text-muted)] mb-1 text-[10px] md:text-[12px] font-bold">TOTAL MEMBERS</div>
          <div className="text-[20px] md:text-[28px] font-geist font-bold text-[var(--text-main)]">{metrics.memberCount}</div>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-red-450 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-label-caps text-[var(--text-muted)] mb-1 text-[10px] md:text-[12px] font-bold">ACTIVE LOANS</div>
          <div className="text-[20px] md:text-[28px] font-geist font-bold text-[var(--text-main)]">{metrics.activeLoanCount}</div>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-amber-450 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-label-caps text-[var(--text-muted)] mb-1 text-[10px] md:text-[12px] font-bold">COLLECTION RATE</div>
          <div className={`text-[20px] md:text-[28px] font-geist font-bold ${getCollectionColor(metrics.collectionRate)}`}>
            {metrics.collectionRate}%
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">This month</div>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-purple-450 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between col-span-2 md:col-span-2 lg:col-span-1">
          <div className="text-label-caps text-[var(--text-muted)] mb-1 text-[10px] md:text-[12px] font-bold">GROUP Credit Score</div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#22C55E] text-[24px] md:text-[28px]">verified</span>
            <div className="text-[20px] md:text-[28px] font-geist font-bold text-[var(--text-main)]">{metrics.avgTrust || 0}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card-bg border border-[var(--border)] rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <h2 className="text-xl font-bold text-[var(--text-main)] font-geist mb-6">Group Savings Growth</h2>
          {chartData.length > 0 ? (
            <div className="h-[200px] md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} 
                    tickFormatter={(val) => `KSh ${(val/1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`KSh ${formatCurrency(value)}`, 'Total Savings']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#22C55E" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-[#E5E7EB] dark:text-[#2d3d2d] text-6xl mb-4">show_chart</span>
              <h3 className="text-headline-sm text-[var(--text-main)] font-bold">No contributions recorded yet.</h3>
              <p className="text-body-sm text-[var(--text-muted)] mt-2">Charts will appear once members start contributing.</p>
            </div>
          )}
        </div>

        <div className="card-bg border border-[var(--border)] rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
          <h2 className="text-xl font-bold text-[var(--text-main)] font-geist mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-red-650">warning</span>
            Pending Actions
          </h2>
          
          <div className="flex flex-col gap-3">
            {pendingActions.loans.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-transparent border border-[var(--border)] rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-orange-550">pending_actions</span>
                  <span className="text-sm font-semibold text-[var(--text-main)]">{pendingActions.loans.length} loan requests pending</span>
                </div>
              </div>
            )}

            {pendingActions.overdue.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-800 dark:text-red-400">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">event_busy</span>
                  <span className="text-sm font-semibold">{pendingActions.overdue.length} members overdue on loans</span>
                </div>
              </div>
            )}

            {pendingActions.late.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl text-orange-800 dark:text-orange-400">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">schedule</span>
                  <span className="text-sm font-semibold">{pendingActions.late.length} late contributions</span>
                </div>
              </div>
            )}

            {pendingActions.loans.length === 0 && pendingActions.overdue.length === 0 && pendingActions.late.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <span className="material-symbols-outlined text-[#22C55E] text-4xl mb-2">check_circle</span>
                <span className="text-body-sm text-[var(--text-main)] font-medium">All clear!</span>
                <span className="text-xs text-[var(--text-muted)] mt-1">No pending actions require your attention.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-bg border border-[var(--border)] rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <h2 className="text-xl font-bold text-[var(--text-main)] font-geist mb-2">Top Contributors</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">Members with the highest confirmed contributions this month.</p>
          
          {topContributors.length > 0 ? (
            <div className="space-y-4">
              {topContributors.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-gray-100 dark:border-[#2d3d2d] last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] flex items-center justify-center font-bold text-sm">
                      {t.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--text-main)] text-sm">{t.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">Rank #{idx + 1}</div>
                    </div>
                  </div>
                  <div className="font-bold text-[var(--text-main)] font-mono">
                    KSh {formatCurrency(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-transparent rounded-xl border border-dashed border-[var(--border)]">
              <span className="material-symbols-outlined text-[#E5E7EB] dark:text-[#2d3d2d] text-4xl mb-2">stars</span>
              <span className="text-body-sm text-[var(--text-muted)]">No contributions recorded this month.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

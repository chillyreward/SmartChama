"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getTrustStatusLabel } from "@/lib/trust-score-display";

export default function LoansPage() {
  const { member, group, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [loans, setLoans] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalLoaned: 0,
    activeCount: 0,
    repaymentRate: 0,
    overdueCount: 0
  });

  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [loanPeriod, setLoanPeriod] = useState("1");
  const [loanPurpose, setLoanPurpose] = useState("");
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState("");

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';

  const fetchData = async () => {
    if (!member || !group) return;
    try {
      setLoading(true);
      setError("");

      const { data: loansData, error: loansErr } = await supabase
        .from('loans_v2')
        .select(`
          *, 
          borrower:chama_memberships(
            trust_score,
            profile:profiles(
              full_name
            )
          )
        `)
        .eq('chama_id', member.chama_id)
        .order('created_at', { ascending: false });

      if (loansErr) throw loansErr;

      let totalLoaned = 0;
      let activeCount = 0;
      let repaidCount = 0;
      let overdueCount = 0;

      const activeList: any[] = [];
      const pendingList: any[] = [];

      const enrichedLoans = (loansData || []).map((l: any) => {
        const fullName = l.borrower?.profile?.full_name || 'System';
        const trustScore = l.borrower?.trust_score || 0;
        return {
          ...l,
          borrower: {
            full_name: fullName,
            trust_score: trustScore
          },
          borrower_id: l.membership_id
        };
      });
      
      enrichedLoans.forEach(l => {
        if (l.status === 'active' || l.status === 'overdue') {
          totalLoaned += Number(l.amount);
          if (l.status === 'active') activeCount++;
          if (l.status === 'overdue') overdueCount++;
          activeList.push(l);
        } else if (l.status === 'repaid') {
          repaidCount++;
          activeList.push(l); 
        } else if (l.status === 'pending') {
          pendingList.push(l);
        }
      });

      const totalLoans = activeCount + overdueCount + repaidCount;
      const repaymentRate = totalLoans > 0 ? Math.round((repaidCount / totalLoans) * 100) : 0;

      setStats({
        totalLoaned,
        activeCount,
        repaymentRate,
        overdueCount
      });

      setLoans(activeList);
      setPendingRequests(pendingList);

      const monthlyData: Record<string, { expected: number, actual: number }> = {};
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        monthlyData[d.toLocaleString('default', { month: 'short' })] = { expected: 0, actual: 0 };
      }

      (loansData || []).forEach(l => {
        if (l.status === 'repaid') {
          const d = new Date(l.updated_at || l.created_at);
          const monthStr = d.toLocaleString('default', { month: 'short' });
          if (monthlyData[monthStr]) {
            monthlyData[monthStr].actual += Number(l.amount);
            monthlyData[monthStr].expected += Number(l.amount); 
          }
        } else if (l.status === 'active' || l.status === 'overdue') {
          const d = new Date(l.due_date || l.created_at);
          const monthStr = d.toLocaleString('default', { month: 'short' });
          if (monthlyData[monthStr]) {
            monthlyData[monthStr].expected += Number(l.amount);
          }
        }
      });

      setChartData(Object.keys(monthlyData).map(month => ({
        month,
        expected: monthlyData[month].expected,
        actual: monthlyData[month].actual
      })));

    } catch (err) {
      console.error(err);
      setError("Failed to load loans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && member && group) {
      fetchData();
    }
  }, [authLoading, member, group]);

  const handleRequestLoan = async () => {
    if (!member || !group) return;
    const amountVal = parseFloat(loanAmount.replace(/,/g, ""));
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + parseInt(loanPeriod));

    const { error: insertErr } = await supabase
      .from('loans_v2')
      .insert({
        chama_id: member.chama_id,
        membership_id: member.id,
        amount: amountVal,
        interest_rate: group.loan_interest_rate || 10,
        repayment_months: parseInt(loanPeriod),
        purpose: loanPurpose,
        status: 'pending',
        due_date: dueDate.toISOString(),
      });

    if (insertErr) {
      alert("Failed to submit request: " + insertErr.message);
    } else {
      setShowLoanModal(false);
      setLoanAmount("");
      setLoanPurpose("");
      setToastMsg("Loan request submitted successfully!");
      setTimeout(() => setToastMsg(""), 3000);
      fetchData();
    }
  };

  const handleAction = async (loanId: string, action: 'active' | 'declined') => {
    const { error: updateErr } = await supabase
      .from('loans_v2')
      .update({ status: action })
      .eq('id', loanId);

    if (updateErr) {
      alert("Action failed.");
    } else {
      setToastMsg(`Loan ${action === 'active' ? 'approved' : 'declined'}!`);
      setTimeout(() => setToastMsg(""), 3000);
      fetchData();
    }
  };

  const amountVal = parseFloat(loanAmount.replace(/,/g, "")) || 0;
  const interest = amountVal * ((group?.loan_interest_rate || 10) / 100);
  const totalRepayable = amountVal + interest;
  const periodVal = parseInt(loanPeriod) || 1;
  const monthly = totalRepayable / periodVal;

  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full text-[var(--text-main)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="card-bg border border-[var(--border)] rounded-2xl p-6 h-32 animate-pulse shadow-sm"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="card-bg border border-[var(--border)] rounded-2xl h-80 animate-pulse shadow-sm"></div>
          </div>
          <div className="lg:col-span-1 card-bg border border-[var(--border)] rounded-2xl h-80 animate-pulse shadow-sm"></div>
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
      case 'active':
        return <span className="bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176] px-2.5 py-1 rounded text-xs font-semibold">Active</span>;
      case 'overdue':
        return <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-2.5 py-1 rounded text-xs font-semibold">Overdue</span>;
      case 'repaid':
        return <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2.5 py-1 rounded text-xs font-semibold">Repaid</span>;
      case 'pending':
        return <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 px-2.5 py-1 rounded text-xs font-semibold">Pending</span>;
      case 'declined':
        return <span className="bg-gray-100 dark:bg-[#1f2a1f] text-gray-800 dark:text-[#8FA88F] px-2.5 py-1 rounded text-xs font-semibold">Declined</span>;
      default:
        return <span className="bg-gray-100 dark:bg-[#1f2a1f] text-gray-800 dark:text-[#8FA88F] px-2.5 py-1 rounded text-xs font-semibold">{status}</span>;
    }
  };

  const chamaName = group?.name || 'Group';

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full relative font-inter text-[var(--text-main)]">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#22C55E] text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="text-body-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Loans</span>
        </p>
        
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
              Loans
            </h1>
            <p className="text-[14px] text-[var(--text-muted)] mt-1">
              {chamaName} — Request loans and track group repayment status.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowLoanModal(true)}
              className="flex-1 md:flex-initial bg-[#22C55E] text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 hover:bg-[#006e2f] transition-all font-semibold text-sm shadow-sm"
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
              Request Loan
            </button>
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="card-bg border border-[var(--border)] border-t-2 border-t-[#22C55E] rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">TOTAL LOANED OUT</div>
          <div className="text-[22px] md:text-3xl font-bold text-[var(--text-main)] font-geist">KSh {formatCurrency(stats.totalLoaned)}</div>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-blue-400 rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">ACTIVE LOANS</div>
          <div className="text-[22px] md:text-3xl font-bold text-[var(--text-main)] font-geist">{stats.activeCount}</div>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-[#22C55E] rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">REPAYMENT RATE</div>
          <div className="flex items-center gap-3">
            <div className="text-[22px] md:text-3xl font-bold text-[#22C55E] font-geist">{stats.repaymentRate}%</div>
            <span className="material-symbols-outlined text-[#22C55E] hidden sm:inline">trending_up</span>
          </div>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-red-400 rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">OVERDUE LOANS</div>
          <div className="flex items-end gap-3">
            <div className="text-[22px] md:text-3xl font-bold text-red-500 font-geist">{stats.overdueCount}</div>
            {stats.overdueCount > 0 && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1 border border-red-300 dark:border-red-900/40 hidden sm:block">
                Needs action
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Table + Chart */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* ACTIVE LOANS TABLE */}
          <div className="card-bg border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
            <div className="p-6 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold font-geist text-[var(--text-main)]">Loan records</h2>
            </div>
            
            {/* Mobile Card List */}
            <div className="md:hidden flex flex-col divide-y divide-[#E5E7EB] dark:divide-[#2d3d2d]">
              {loans.length > 0 ? loans.map((loan) => {
                const name = loan.borrower.full_name;
                return (
                  <div key={loan.id} className="py-4 px-4 active:bg-[#f5f5f5] dark:active:bg-[#1f2a1f] transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] flex items-center justify-center text-[12px] font-bold text-[var(--brand-green)] flex-shrink-0">
                          {getInitials(name)}
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-[var(--text-main)]">{name}</p>
                          <p className="text-[12px] text-[var(--text-muted)]">
                            Issued: {new Date(loan.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[15px] font-semibold text-[var(--text-main)]">KSh {formatCurrency(loan.amount)}</p>
                        <span className="text-[11px] text-[var(--text-muted)]">Int: {loan.interest_rate}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#E5E7EB]/50 dark:border-[#2d3d2d]/50">
                      <span className="text-[12px] text-[var(--text-muted)]">
                        Due: {loan.due_date ? new Date(loan.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                      </span>
                      {getStatusBadge(loan.status)}
                    </div>
                  </div>
                );
              }) : (
                <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                  No active or repaid loans found.
                </div>
              )}
            </div>

            {/* Desktop table hidden on mobile */}
            <div className="hidden md:block overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-gray-50 dark:bg-[#0f1410] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10">
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-6 py-4">BORROWER</th>
                    <th className="px-6 py-4">AMOUNT</th>
                    <th className="px-6 py-4">DATE ISSUED</th>
                    <th className="px-6 py-4">DUE DATE</th>
                    <th className="px-6 py-4">INTEREST</th>
                    <th className="px-6 py-4">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
                  {loans.length > 0 ? loans.map((loan) => {
                    return (
                      <tr key={loan.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] shadow-sm`}>
                              {getInitials(loan.borrower.full_name)}
                            </div>
                            <div className="font-semibold text-[var(--text-main)] text-sm whitespace-nowrap">
                              {loan.borrower.full_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-main)] font-bold whitespace-nowrap">
                          KSh {formatCurrency(loan.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-muted)] whitespace-nowrap">
                          {new Date(loan.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-muted)] whitespace-nowrap">
                          {loan.due_date ? new Date(loan.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-muted)] whitespace-nowrap">{loan.interest_rate}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(loan.status)}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-[var(--text-muted)]">
                        No active or repaid loans found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* REPAYMENT CHART */}
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <h2 className="text-xl font-bold font-geist text-[var(--text-main)]">Repayment performance (6 Mo)</h2>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#22C55E]"></div>
                <span className="text-xs font-semibold text-[var(--text-muted)]">Actual Repayments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                <span className="text-xs font-semibold text-[var(--text-muted)]">Expected Schedule</span>
              </div>
            </div>
            
            <div className="mt-6 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200} className="md:h-[300px]">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-[#2d3d2d]" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#60645f' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#60645f' }} dx={-10} tickFormatter={(val) => `KSh ${val.toLocaleString()}`} />
                    <Tooltip 
                      formatter={(value: any, name: any) => [`KSh ${value.toLocaleString()}`, name === 'actual' ? 'Actual Repayments' : 'Expected']}
                      contentStyle={{ borderRadius: '12px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: 'var(--color-text-primary)' }}
                    />
                    <Area type="monotone" dataKey="expected" stroke="#9CA3AF" strokeDasharray="4 4" fillOpacity={1} fill="url(#colorExpected)" />
                    <Area type="monotone" dataKey="actual" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-main)]">
                  <span className="material-symbols-outlined text-gray-250 dark:text-[#5a6e5a] text-4xl mb-2">trending_up</span>
                  <p className="text-body-sm text-[var(--text-muted)]">No repayment data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Pending Requests */}
        <div className="lg:col-span-1">
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <h2 className="text-xl font-bold font-geist text-[var(--text-main)]">Pending loan requests</h2>
            <p className="text-body-sm text-[var(--text-muted)] mt-1 mb-6">{pendingRequests.length} requests awaiting approval</p>

            <div className="flex flex-col gap-4">
              {pendingRequests.length > 0 ? pendingRequests.map(req => {
                const trust = req.borrower?.trust_score || 0;
                return (
                  <div key={req.id} className="bg-gray-50 dark:bg-[#1a2218] border border-[var(--border)] rounded-xl p-5 flex flex-col justify-between items-start gap-4 shadow-sm">
                    <div className="w-full">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] flex items-center justify-center font-bold text-sm shrink-0">
                          {getInitials(req.borrower?.full_name)}
                        </div>
                        <div className="text-lg font-bold font-geist text-[var(--text-main)]">{req.borrower?.full_name}</div>
                      </div>
                      <div className="text-sm text-[var(--text-main)] font-semibold">Requested KSh {formatCurrency(req.amount)}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">Interest: {req.interest_rate}%</div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        {(() => {
                          const isAdmin = member && ['admin', 'chairlady', 'treasurer', 'secretary'].includes(member.role);
                          const isSelf = member && member.id === req.borrower_id;
                          
                          if (isAdmin || isSelf) {
                            return (
                              <>
                                {trust >= 80 && <span className="material-symbols-outlined text-[#22C55E] text-sm">verified</span>}
                                <span className="font-mono text-xs font-semibold text-[var(--text-main)]">CREDIT SCORE: {trust}</span>
                                {trust >= 80 ? (
                                   <span className="bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176] text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ml-2">Eligible</span>
                                ) : (
                                   <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-850 dark:text-yellow-400 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ml-2">Review</span>
                                )}
                              </>
                            );
                          } else {
                            const status = getTrustStatusLabel(trust);
                            return (
                              <span className="text-xs font-medium px-2 py-1 rounded card-bg border border-[var(--border)]" style={{ color: status.color }}>
                                CREDIT SCORE: {status.label}
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>
                    
                    {member?.role === 'admin' ? (
                      <div className="flex flex-col gap-2 w-full mt-2">
                        <button onClick={() => handleAction(req.id, 'active')} className="w-full bg-[#22C55E] hover:bg-[#006e2f] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm">
                          Approve
                        </button>
                        <button onClick={() => handleAction(req.id, 'declined')} className="w-full bg-transparent hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-500 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm">
                          Decline
                        </button>
                      </div>
                    ) : (
                       <div className="w-full mt-2 p-2 bg-[#F5F5F5] dark:bg-[#1f2a1f] border border-[var(--border)] rounded-lg text-center text-xs font-semibold text-[var(--text-muted)]">
                         Awaiting admin review
                       </div>
                    )}
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center py-10 text-[var(--text-main)]">
                  <span className="material-symbols-outlined text-gray-250 dark:text-[#5a6e5a] text-4xl mb-2">check_circle</span>
                  <p className="text-body-sm text-[var(--text-muted)]">No pending requests</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* REQUEST LOAN MODAL */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-[#0B0F0C]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="card-bg border border-[var(--border)] rounded-2xl p-8 w-full max-w-md shadow-2xl relative animate-fade-in text-[var(--text-main)]">
            <h2 className="text-2xl font-bold font-geist text-[var(--text-main)]">Request a Loan</h2>
            <p className="text-sm text-[var(--brand-green)] font-semibold mt-1 mb-6">
              Base interest rate: {group?.loan_interest_rate || 10}%
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2" htmlFor="amount">Loan Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-semibold">KSh</span>
                  <input 
                    type="number" 
                    id="amount"
                    name="amount"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="0"
                    className="w-full border border-[var(--border)] rounded-lg px-4 py-3 pl-12 text-[var(--text-main)] bg-transparent outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2" htmlFor="period">Repayment Period</label>
                <select 
                  id="period"
                  name="period"
                  value={loanPeriod}
                  onChange={(e) => setLoanPeriod(e.target.value)}
                  className="w-full border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text-main)] bg-transparent outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all"
                >
                  <option value="1">1 month</option>
                  <option value="2">2 months</option>
                  <option value="3">3 months</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2" htmlFor="purpose">Purpose</label>
                <textarea 
                  id="purpose"
                  name="purpose"
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  placeholder="Briefly describe loan purpose..."
                  rows={3}
                  className="w-full border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text-main)] bg-transparent outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all resize-none placeholder:text-[#9CA3AF] dark:placeholder:text-[#4a5e4a]"
                />
              </div>
            </div>

            {amountVal > 0 && (
              <div className="bg-gray-50 dark:bg-[#1a2218] border border-[var(--border)] rounded-xl p-4 mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Monthly Repayment:</span>
                  <span className="font-mono font-bold text-[var(--text-main)]">KSh {formatCurrency(monthly)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Interest ({group?.loan_interest_rate || 10}%):</span>
                  <span className="font-mono font-bold text-[var(--text-main)]">KSh {formatCurrency(interest)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-[var(--border)] mt-2">
                  <span className="text-[var(--text-main)]">Total Repayable:</span>
                  <span className="font-mono text-[var(--text-main)]">KSh {formatCurrency(totalRepayable)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowLoanModal(false)}
                className="flex-1 bg-transparent border border-[var(--border)] text-[var(--text-main)] hover:bg-gray-50 dark:hover:bg-[#1f2a1f] rounded-lg py-3 font-semibold transition-all shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleRequestLoan}
                disabled={amountVal <= 0}
                className="flex-[2] bg-[#22C55E] hover:bg-[#006e2f] text-white rounded-lg py-3 text-sm font-bold transition-all disabled:opacity-50 shadow-sm"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
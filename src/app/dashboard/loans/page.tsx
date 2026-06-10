"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function LoansPage() {
  const { session, member, group, isLoading: authLoading } = useAuth();
  
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
        .from('loans')
        .select(`*, borrower:members(full_name, trust_score)`)
        .eq('group_id', member.group_id)
        .order('created_at', { ascending: false });

      if (loansErr) throw loansErr;

      let totalLoaned = 0;
      let activeCount = 0;
      let repaidCount = 0;
      let overdueCount = 0;

      const activeList: any[] = [];
      const pendingList: any[] = [];

      (loansData || []).forEach(l => {
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

      // Generate mock chart data based on real loans (using dates)
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
      .from('loans')
      .insert({
        group_id: member.group_id,
        borrower_id: member.id,
        amount: amountVal,
        interest_rate: group.loan_interest_rate || 10,
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
      .from('loans')
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

  // Calculations for modal
  const amountVal = parseFloat(loanAmount.replace(/,/g, "")) || 0;
  const interest = amountVal * ((group?.loan_interest_rate || 10) / 100);
  const totalRepayable = amountVal + interest;
  const periodVal = parseInt(loanPeriod) || 1;
  const monthly = totalRepayable / periodVal;

  if (authLoading || loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="bg-white border border-[#E5E7EB] rounded-lg p-6 h-32 animate-pulse shadow-sm"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-[#E5E7EB] rounded-lg h-80 animate-pulse shadow-sm"></div>
          </div>
          <div className="lg:col-span-1 bg-white border border-[#E5E7EB] rounded-lg h-80 animate-pulse shadow-sm"></div>
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
      case 'active':
        return <span className="bg-[#22C55E]/10 text-[#005321] border border-[#4ae176] rounded px-2 py-0.5 text-label-caps">Active</span>;
      case 'overdue':
        return <span className="bg-red-100 text-red-800 border border-red-300 rounded px-2 py-0.5 text-label-caps">Overdue</span>;
      case 'repaid':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 rounded px-2 py-0.5 text-label-caps">Repaid</span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 border border-yellow-300 rounded px-2 py-0.5 text-label-caps">Pending</span>;
      case 'declined':
        return <span className="bg-gray-100 text-gray-800 border border-gray-300 rounded px-2 py-0.5 text-label-caps">Declined</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 rounded px-2 py-0.5 text-label-caps">{status}</span>;
    }
  };

  return (
    <div className="p-8 font-inter relative min-h-full">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#22C55E] text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-headline-lg font-semibold text-on-surface font-geist">Loans</h1>
          <p className="text-body-sm text-secondary mt-1">{group.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-[#E5E7EB] text-on-surface rounded px-4 py-2 text-body-sm hover:bg-gray-50 transition-colors font-medium shadow-sm">
            Loan Settings
          </button>
          <button 
            onClick={() => setShowLoanModal(true)}
            className="bg-[#22C55E] text-white rounded px-4 py-2 flex items-center gap-2 hover:bg-[#006e2f] transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="text-body-sm font-medium">Request Loan</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-label-caps text-secondary mb-2">TOTAL LOANED OUT</div>
          <div className="text-display-sm font-geist font-bold text-on-surface">KSh {formatCurrency(stats.totalLoaned)}</div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-label-caps text-secondary mb-2">ACTIVE LOANS</div>
          <div className="text-display-sm font-geist font-bold text-on-surface">{stats.activeCount}</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-label-caps text-secondary mb-2">REPAYMENT RATE</div>
          <div className="flex items-center gap-3">
            <div className="text-display-sm font-geist font-bold text-[#22C55E]">{stats.repaymentRate}%</div>
            <span className="material-symbols-outlined text-[#22C55E]">trending_up</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-label-caps text-secondary mb-2">OVERDUE LOANS</div>
          <div className="flex items-end gap-3">
            <div className="text-display-sm font-geist font-bold text-error">{stats.overdueCount}</div>
            {stats.overdueCount > 0 && (
              <div className="bg-red-100 text-red-800 rounded px-2 py-0.5 text-label-caps mb-1 border border-red-300">
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
          <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-headline-sm font-geist text-on-surface">Loan records</h2>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="px-6 py-4 text-label-caps text-secondary font-medium">BORROWER</th>
                    <th className="px-6 py-4 text-label-caps text-secondary font-medium">AMOUNT</th>
                    <th className="px-6 py-4 text-label-caps text-secondary font-medium">DATE ISSUED</th>
                    <th className="px-6 py-4 text-label-caps text-secondary font-medium">DUE DATE</th>
                    <th className="px-6 py-4 text-label-caps text-secondary font-medium">INTEREST</th>
                    <th className="px-6 py-4 text-label-caps text-secondary font-medium">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.length > 0 ? loans.map((loan) => {
                    // Random colors for avatar
                    const colors = ["bg-green-100 text-green-700", "bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700"];
                    const colorClass = colors[loan.borrower.full_name.length % colors.length];

                    return (
                      <tr key={loan.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${colorClass}`}>
                              {getInitials(loan.borrower.full_name)}
                            </div>
                            <div className="font-medium text-on-surface text-body-sm whitespace-nowrap">
                              {loan.borrower.full_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-body-sm text-on-surface font-medium whitespace-nowrap">
                          KSh {formatCurrency(loan.amount)}
                        </td>
                        <td className="px-6 py-4 text-body-sm text-secondary whitespace-nowrap">
                          {new Date(loan.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-6 py-4 text-body-sm text-secondary whitespace-nowrap">
                          {loan.due_date ? new Date(loan.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                        </td>
                        <td className="px-6 py-4 text-body-sm text-secondary whitespace-nowrap">{loan.interest_rate}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(loan.status)}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-body-sm text-secondary">
                        No active or repaid loans found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* REPAYMENT CHART */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
            <h2 className="text-headline-sm font-geist text-on-surface">Repayment performance (6 Mo)</h2>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#22C55E]"></div>
                <span className="text-body-sm text-secondary">Actual Repayments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-body-sm text-secondary">Expected Schedule</span>
              </div>
            </div>
            
            <div className="mt-6 w-full h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} tickFormatter={(val) => `KSh ${val.toLocaleString()}`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [`KSh ${value.toLocaleString()}`, name === 'actual' ? 'Actual Repayments' : 'Expected']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                    />
                    <Area type="monotone" dataKey="expected" stroke="#9CA3AF" strokeDasharray="4 4" fillOpacity={1} fill="url(#colorExpected)" />
                    <Area type="monotone" dataKey="actual" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">trending_up</span>
                  <p className="text-body-sm text-secondary">No repayment data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Pending Requests */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
            <h2 className="text-headline-sm font-geist text-on-surface">Pending loan requests</h2>
            <p className="text-body-sm text-secondary mt-1 mb-6">{pendingRequests.length} requests awaiting approval</p>

            <div className="flex flex-col gap-4">
              {pendingRequests.length > 0 ? pendingRequests.map(req => {
                const trust = req.borrower?.trust_score || 0;
                return (
                  <div key={req.id} className="bg-surface-container-low border border-[#E5E7EB] rounded-lg p-5 flex flex-col justify-between items-start gap-4 shadow-sm">
                    <div className="w-full">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {getInitials(req.borrower?.full_name)}
                        </div>
                        <div className="text-headline-sm font-geist text-on-surface">{req.borrower?.full_name}</div>
                      </div>
                      <div className="text-body-sm text-on-surface font-medium">Requested KSh {formatCurrency(req.amount)}</div>
                      <div className="text-body-sm text-secondary mt-1">Interest: {req.interest_rate}%</div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        {trust >= 80 && <span className="material-symbols-outlined text-[#22C55E] text-sm">verified</span>}
                        <span className="font-mono text-body-sm font-medium text-on-surface">Trust Score: {trust}</span>
                        {trust >= 80 ? (
                           <span className="bg-[#22C55E]/10 text-[#005321] border border-[#4ae176] text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ml-2">Eligible</span>
                        ) : (
                           <span className="bg-yellow-100 text-yellow-800 border border-yellow-300 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ml-2">Review</span>
                        )}
                      </div>
                    </div>
                    
                    {member?.role === 'admin' ? (
                      <div className="flex flex-col gap-2 w-full mt-2">
                        <button onClick={() => handleAction(req.id, 'active')} className="w-full bg-[#22C55E] hover:bg-[#006e2f] text-white px-4 py-2 rounded text-body-sm font-medium transition-colors shadow-sm">
                          Approve
                        </button>
                        <button onClick={() => handleAction(req.id, 'declined')} className="w-full bg-white hover:bg-red-50 border border-red-200 text-error px-4 py-2 rounded text-body-sm font-medium transition-colors shadow-sm">
                          Decline
                        </button>
                      </div>
                    ) : (
                       <div className="w-full mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-center text-body-sm text-secondary">
                         Awaiting admin review
                       </div>
                    )}
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">check_circle</span>
                  <p className="text-body-sm text-secondary">No pending requests</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* REQUEST LOAN MODAL */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-[#0B0F0C]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl relative animate-fade-in">
            <h2 className="text-headline-lg font-geist font-bold text-on-surface">Request a Loan</h2>
            <p className="text-body-sm text-[#22C55E] font-medium mt-1 mb-6">
              Base interest rate: {group.loan_interest_rate || 10}%
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-label-caps text-secondary mb-2" htmlFor="amount">Loan Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-medium">KSh</span>
                  <input 
                    type="number" 
                    id="amount"
                    name="amount"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="0"
                    className="w-full border border-[#E5E7EB] rounded px-4 py-3 pl-12 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-label-caps text-secondary mb-2" htmlFor="period">Repayment Period</label>
                <select 
                  id="period"
                  name="period"
                  value={loanPeriod}
                  onChange={(e) => setLoanPeriod(e.target.value)}
                  className="w-full border border-[#E5E7EB] rounded px-4 py-3 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all bg-white"
                >
                  <option value="1">1 month</option>
                  <option value="2">2 months</option>
                  <option value="3">3 months</option>
                </select>
              </div>

              <div>
                <label className="block text-label-caps text-secondary mb-2" htmlFor="purpose">Purpose</label>
                <textarea 
                  id="purpose"
                  name="purpose"
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  placeholder="Briefly describe loan purpose..."
                  rows={3}
                  className="w-full border border-[#E5E7EB] rounded px-4 py-3 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all resize-none"
                />
              </div>
            </div>

            {/* Auto-calculated box */}
            {amountVal > 0 && (
              <div className="bg-surface-container-low border border-[#E5E7EB] rounded p-4 mt-6 space-y-2">
                <div className="flex justify-between text-body-sm">
                  <span className="text-secondary">Monthly Repayment:</span>
                  <span className="font-mono font-medium text-on-surface">KSh {formatCurrency(monthly)}</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-secondary">Interest ({group?.loan_interest_rate || 10}%):</span>
                  <span className="font-mono font-medium text-on-surface">KSh {formatCurrency(interest)}</span>
                </div>
                <div className="flex justify-between text-body-sm font-bold pt-2 border-t border-[#E5E7EB] mt-2">
                  <span className="text-on-surface">Total Repayable:</span>
                  <span className="font-mono text-on-surface">KSh {formatCurrency(totalRepayable)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowLoanModal(false)}
                className="flex-1 bg-white border border-[#E5E7EB] text-on-surface hover:bg-gray-50 rounded py-3 font-medium transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleRequestLoan}
                disabled={amountVal <= 0}
                className="flex-[2] bg-[#22C55E] hover:bg-[#006e2f] text-white rounded py-3 text-headline-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
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
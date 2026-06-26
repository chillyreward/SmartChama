'use client';

import { useState, useEffect } from "react";
import { Download, Filter, TrendingUp } from "lucide-react";
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function SavingsPage() {
  const { member, group } = useAuth();
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    async function fetchSavings() {
      if (!member?.id) return;
      try {
        const { data, error } = await supabase
          .from('contributions_v2')
          .select('*, profiles(full_name)')
          .eq('membership_id', member.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setContributions(data);
          const total = data
            .filter((c: any) => c.status === 'confirmed')
            .reduce((sum: number, c: any) => sum + Number(c.amount), 0);
          setTotalSavings(total);
        }
      } catch (err) {
        console.error('Error fetching contributions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSavings();
  }, [member?.id]);

  const chamaName = group?.name || 'Group';

  const stats = [
    { 
      label: "Total Personal Savings", 
      value: `KES ${totalSavings.toLocaleString('en-KE')}`, 
      change: contributions.length > 0 ? `From ${contributions.filter(c => c.status === 'confirmed').length} contribution(s)` : "No entries", 
      positive: true, 
      accent: "border-t-[#22C55E]" 
    },
    { 
      label: "Interest Earned", 
      value: "KES 0", 
      change: "0% accrued", 
      positive: true, 
      accent: "border-t-blue-400" 
    },
    { 
      label: "Next Contribution Due", 
      value: `KES ${(group?.contribution_amount || 0).toLocaleString('en-KE')}`, 
      subtext: `Frequency: ${group?.contribution_frequency || 'monthly'}`, 
      highlight: true, 
      accent: "border-t-amber-400" 
    }
  ];

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full font-inter text-[var(--text-main)]">
      <style dangerouslySetInnerHTML={{ __html: `
        @media screen {
          .print-only {
            display: none !important;
          }
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
            color: #000000 !important;
            background: #ffffff !important;
          }
          body {
            color: #000000 !important;
            background: #ffffff !important;
          }
        }
      `}} />

      {/* PRINT-ONLY AREA */}
      <div className="print-only font-inter text-black bg-white p-8 w-full max-w-[800px] mx-auto">
        <div className="flex justify-between items-start border-b-2 border-green-600 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-700">SmartChama Financial Statement</h1>
            <p className="text-sm text-gray-500 mt-1">Generated on {new Date().toLocaleDateString('en-KE', { dateStyle: 'long' })}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-800">{chamaName}</h2>
            <p className="text-sm text-gray-500">Group Savings Summary</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded-xl">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Member Details</p>
            <p className="text-sm font-bold mt-1">{member?.profiles?.full_name || 'Member'}</p>
            <p className="text-sm text-gray-650">{member?.profiles?.phone_number || ''}</p>
            <p className="text-sm text-gray-650">{member?.profiles?.email || ''}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase font-semibold">Savings Stats</p>
            <p className="text-sm text-gray-500 mt-1">Total Personal Savings:</p>
            <p className="text-lg font-bold text-green-700">KES {totalSavings.toLocaleString('en-KE')}</p>
          </div>
        </div>

        <h3 className="text-md font-bold mb-3 text-gray-800 border-b pb-1">Contribution History</h3>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-gray-150">
              <th className="py-2 px-3">Date</th>
              <th className="py-2 px-3">Method</th>
              <th className="py-2 px-3">Reference/Receipt</th>
              <th className="py-2 px-3 text-right">Amount</th>
              <th className="py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {contributions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">No contributions recorded.</td>
              </tr>
            ) : (
              contributions.map((c, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2.5 px-3 text-gray-650">{new Date(c.created_at).toLocaleDateString('en-KE')}</td>
                  <td className="py-2.5 px-3 uppercase text-gray-650">{c.payment_method || 'mpesa'}</td>
                  <td className="py-2.5 px-3 font-mono text-gray-650">{c.mpesa_receipt || c.reference || '-'}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-gray-800">KES {Number(c.amount).toLocaleString('en-KE')}</td>
                  <td className="py-2.5 px-3 uppercase font-semibold text-gray-650">{c.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-12 text-center text-xs text-gray-450 border-t pt-4">
          Thank you for being a valued member of {chamaName}. Powered by SmartChama.
        </div>
      </div>

      {/* SCREEN UI */}
      <div className="no-print">
        {/* Page Header */}
        <div className="mb-8">
          <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
            <span>Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Savings</span>
          </p>
          
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
                Savings & History
              </h1>
              <p className="text-[14px] text-[var(--text-muted)] mt-1">
                {chamaName} — Track your personal growth and collective group contributions in real-time.
              </p>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => window.print()}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-lg text-sm font-semibold hover:bg-[#006e2f] transition-all">
                <Download className="w-4 h-4" />
                Export Statement
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 md:gap-6 lg:gap-6">
            {stats.map((stat, idx) => (
              <div 
                key={idx} 
                className={`card-bg border border-[var(--border)] border-t-2 ${stat.accent} rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 last:col-span-2 lg:last:col-span-1`}
              >
                <p className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">
                  {stat.label}
                </p>
                <p className="text-[22px] md:text-3xl font-bold text-[var(--text-main)] mb-2 font-geist">{stat.value}</p>
                {stat.change && (
                  <div className="flex items-center gap-1 text-sm text-[var(--brand-green)]">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">{stat.change}</span>
                  </div>
                )}
                {stat.subtext && <p className="text-sm text-[var(--text-muted)] mt-1">{stat.subtext}</p>}
              </div>
            ))}
          </div>

          {/* Right Column - Transaction History */}
          <div className="lg:col-span-2 card-bg border border-[var(--border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text-main)]">Transaction History</h2>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-[#F5F5F5] dark:bg-[#1a2218] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[#edf6ea] dark:hover:bg-[#1a3a1a] transition-all">
                  <Filter className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => window.print()}
                  className="p-2 rounded-lg bg-[#F5F5F5] dark:bg-[#1a2218] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[#edf6ea] dark:hover:bg-[#1a3a1a] transition-all">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              {loading ? (
                <div className="py-12 text-center text-[var(--text-muted)] text-sm">
                  Loading contribution records...
                </div>
              ) : contributions.length === 0 ? (
                <div className="py-12 text-center text-[var(--text-muted)] text-sm">
                  No contributions recorded yet.
                </div>
              ) : (
                <>
                  {/* Mobile Card List */}
                  <div className="md:hidden flex flex-col divide-y divide-[#E5E7EB] dark:divide-[#2d3d2d]">
                    {contributions.map((tx, idx) => (
                      <div key={idx} className="py-4 px-4 active:bg-[#f5f5f5] dark:active:bg-[#1f2a1f] transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-transparent text-[var(--brand-green)] flex items-center justify-center text-xs font-bold shadow-sm">
                              {member?.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'M'}
                            </div>
                            <span className="text-sm font-semibold text-[var(--text-main)]">You</span>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            tx.status === 'confirmed' 
                              ? 'bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176]' 
                              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-850 dark:text-orange-400'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#E5E7EB]/50 dark:border-[#2d3d2d]/50">
                          <span className="text-[12px] text-[var(--text-muted)]">
                            {tx.payment_method === 'mpesa' ? `M-Pesa STK (${tx.mpesa_receipt || 'No receipt'})` : `Cash/Manual Entry`}
                          </span>
                          <span className="text-[14px] font-bold text-[var(--text-main)] font-mono">KES {Number(tx.amount).toLocaleString('en-KE')}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 dark:bg-[#0f1410] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Method</th>
                          <th className="px-6 py-4 hidden sm:table-cell">Reference/Receipt</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
                        {contributions.map((tx, idx) => (
                          <tr key={idx} className="hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                            <td className="px-6 py-4 text-sm text-[var(--text-muted)] whitespace-nowrap">
                              {new Date(tx.created_at).toLocaleDateString('en-KE')}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-semibold text-[var(--text-main)] uppercase">{tx.payment_method || 'mpesa'}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-[var(--text-muted)] hidden sm:table-cell font-mono">{tx.mpesa_receipt || tx.reference || '-'}</td>
                            <td className="px-6 py-4 text-sm font-bold text-[var(--text-main)] font-mono">KES {Number(tx.amount).toLocaleString('en-KE')}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                tx.status === 'confirmed' 
                                  ? 'bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176]' 
                                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-850 dark:text-orange-400'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
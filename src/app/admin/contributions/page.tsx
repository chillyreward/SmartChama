"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { exportToPDF, exportToExcel } from "@/lib/export";
import PageSkeleton from "@/components/PageSkeleton";

export default function AdminContributionsPage() {
  const { member: adminMember, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState("");

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordMemberId, setRecordMemberId] = useState("");
  const [recordAmount, setRecordAmount] = useState("");
  const [recordMethod, setRecordMethod] = useState<'cash' | 'bank'>('cash');
  const [recordSaving, setRecordSaving] = useState(false);
  const [recordReference, setRecordReference] = useState("");
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
  const [recordDate, setRecordDate] = useState(today);

  const memberName = (c: any) => c.membership?.profile?.full_name || 'Member';

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  const fetchData = async () => {
    if (!adminMember || !group) return;
    try {
      setLoading(true);
      
      const { data: memData } = await supabase
        .from('chama_memberships')
        .select('id, profile_id, profile:profiles(full_name)')
        .eq('chama_id', group.id)
        .eq('status', 'active');
      setMembers((memData || []).map((m: any) => ({ id: m.id, profile_id: m.profile_id, full_name: m.profile?.full_name || 'Member' }))
        .sort((a: any, b: any) => a.full_name.localeCompare(b.full_name)));

      const { data: contribData } = await supabase
        .from('contributions_v2')
        .select('*, membership:chama_memberships(profile:profiles(full_name))')
        .eq('chama_id', group.id)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
      setContributions(contribData || []);
      setHasMore((contribData?.length || 0) === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminMember, group, page]);

  // Cash and bank payments are booked by record_cash_contribution (wallet,
  // ledger, transaction, audit log, confirmation SMS). M-Pesa payments are
  // recorded automatically when Safaricom confirms them.
  const handleRecord = async () => {
    setRecordSaving(true);
    try {
      const { data, error } = await supabase.rpc('record_cash_contribution', {
        p_membership_id: recordMemberId,
        p_amount: Number(recordAmount),
        p_method: recordMethod,
        p_reference: recordReference.trim() || null,
        p_paid_on: recordDate || null
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Could not record the contribution');

      setToastMsg("Contribution recorded!");
      setTimeout(() => setToastMsg(""), 3000);
      setShowRecordModal(false);
      setRecordMemberId(""); setRecordAmount(""); setRecordReference(""); setRecordDate(today);
      fetchData();
    } catch (err: any) {
      alert("Error recording contribution: " + err.message);
    } finally {
      setRecordSaving(false);
    }
  };

  const handleExportPDF = () => {
    const headers = ['Date', 'Member', 'Amount (KSh)', 'Method', 'Reference', 'Status'];
    const rows = contributions.map(c => [
      new Date(c.created_at || c.date).toLocaleDateString('en-KE'),
      memberName(c),
      Number(c.amount || 0).toLocaleString('en-KE'),
      c.payment_method || c.method || 'M-Pesa',
      c.mpesa_receipt || c.reference || 'N/A',
      c.status || 'confirmed'
    ]);
    exportToPDF('Contributions Report', group?.name || 'Akibora', headers, rows, 'contributions_report');
  };

  const handleExportExcel = () => {
    const headers = ['Date', 'Member', 'Amount (KSh)', 'Method', 'Reference', 'Status'];
    const rows = contributions.map(c => [
      new Date(c.created_at || c.date).toLocaleDateString('en-KE'),
      memberName(c),
      Number(c.amount || 0),
      c.payment_method || c.method || 'M-Pesa',
      c.mpesa_receipt || c.reference || 'N/A',
      c.status || 'confirmed'
    ]);
    exportToExcel('Contributions Report', group?.name || 'Akibora', headers, rows, 'contributions_report');
  };

  const handleBulkRemind = async () => {
    try {
      const lateMemberships = new Set(contributions.filter(c => c.status === 'late' || c.status === 'pending').map(c => c.membership_id));
      const targets = members.filter(m => lateMemberships.has(m.id) && m.profile_id);

      if (targets.length === 0) {
        alert("No members are currently late or pending.");
        return;
      }

      const { error } = await supabase.from('notifications').insert(targets.map(m => ({
        profile_id: m.profile_id,
        chama_id: group?.id,
        type: 'reminder',
        title: 'Contribution reminder',
        message: `Your contribution to ${group?.name || 'the group'} is due. Please make a payment.`
      })));
      if (error) throw error;
      setToastMsg(`Reminders sent to ${targets.length} member${targets.length === 1 ? '' : 's'}!`);
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err: any) {
      alert("Error sending reminders: " + err.message);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full font-inter relative min-h-full text-[var(--text-main)]">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#161d16] dark:bg-[#E8F0E4] text-white dark:text-[#161d16] px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-fade-in-down">
          <span className="material-symbols-outlined text-[#22C55E]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
            <span>Admin Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Contributions</span>
          </p>
          <h1 className="text-[24px] md:text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">Contributions</h1>
          <p className="text-[13px] md:text-[14px] text-[var(--text-muted)] mt-1">Manage all group contributions and payments</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button 
            onClick={handleExportPDF} 
            className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--bg-muted)] px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-red-500">picture_as_pdf</span>
            Export PDF
          </button>
          <button 
            onClick={handleExportExcel} 
            className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--bg-muted)] px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-green-600">table_chart</span>
            Export Excel
          </button>
          <button onClick={handleBulkRemind} className="bg-orange-50 dark:bg-orange-950/20 text-orange-850 dark:text-orange-355 border border-orange-200 dark:border-orange-900/30 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-all shadow-sm flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">notifications_active</span>
            Bulk Remind
          </button>
          <button 
            onClick={() => setShowRecordModal(true)}
            className="bg-[#22C55E] hover:bg-[#006e2f] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Record Contribution
          </button>
        </div>
      </div>

      {/* TABLE / CARD LIST */}
      <div className="card-bg border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 min-h-[400px]">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0f1410] border-b border-[var(--border)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">MEMBER</th>
                <th className="px-6 py-4">AMOUNT</th>
                <th className="px-6 py-4">METHOD</th>
                <th className="px-6 py-4">REFERENCE</th>
                <th className="px-6 py-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
              {contributions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)] text-sm">
                    No contributions found for this group.
                  </td>
                </tr>
              ) : (
                contributions.map(c => (
                  <tr key={c.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors group">
                    <td className="px-6 py-4 text-sm text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[var(--text-main)] whitespace-nowrap">
                      {memberName(c)}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-[var(--text-main)] whitespace-nowrap">
                      KSh {formatCurrency(Number(c.amount))}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                      {c.payment_method || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-[var(--text-muted)]">
                      {c.reference || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${
                        c.status === 'confirmed' ? 'bg-transparent text-[var(--brand-green)] text-[var(--brand-green)]' :
                        c.status === 'late' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="md:hidden divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
          {contributions.length === 0 ? (
            <div className="p-6 text-center text-[var(--text-muted)] text-sm">
              No contributions found for this group.
            </div>
          ) : (
            contributions.map(c => (
              <div key={c.id} className="p-4 flex flex-col gap-2 hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-[var(--text-main)] text-sm">
                      {memberName(c)}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-[var(--text-main)]">
                      KSh {formatCurrency(Number(c.amount))}
                    </div>
                    <div className="mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                        c.status === 'confirmed' ? 'bg-transparent text-[var(--brand-green)] text-[var(--brand-green)]' :
                        c.status === 'late' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-[var(--text-muted)] pt-1 border-t border-dashed border-[#f5f5f5] dark:border-[#2d3d2d] mt-1">
                  <div>
                    <span className="font-medium">Method:</span> {c.payment_method || '—'}
                    {c.reference && <span className="ml-3"><span className="font-medium">Ref:</span> <span className="font-mono">{c.reference}</span></span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4 card-bg">
          <div className="text-xs text-[var(--text-muted)]">
            Showing Page {page + 1}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 border border-[var(--border)] bg-transparent text-[var(--text-main)] rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-all shadow-sm"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 border border-[var(--border)] bg-transparent text-[var(--text-main)] rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* RECORD MODAL */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-[#0B0F0C]/50 dark:bg-[#0B0F0C]/75 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl text-[var(--text-main)]">
            <h2 className="text-headline-sm font-geist font-bold text-[var(--text-main)] mb-2">Record Cash or Bank Payment</h2>
            <p className="text-[13px] text-[var(--text-muted)] mb-6">M-Pesa payments are recorded automatically once Safaricom confirms them.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Member</label>
                <select 
                  value={recordMemberId} 
                  onChange={e => setRecordMemberId(e.target.value)} 
                  className="w-full border border-[var(--border)] rounded px-4 py-2 text-[var(--text-main)] bg-transparent outline-none focus:border-[#22C55E]"
                >
                  <option value="">Select Member...</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Amount (KSh)</label>
                <input 
                  type="number" 
                  value={recordAmount} 
                  onChange={e => setRecordAmount(e.target.value)} 
                  className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-[#22C55E]" 
                />
              </div>
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Payment Method</label>
                <select 
                  value={recordMethod} 
                  onChange={e => setRecordMethod(e.target.value as 'cash' | 'bank')} 
                  className="w-full border border-[var(--border)] rounded px-4 py-2 text-[var(--text-main)] bg-transparent outline-none focus:border-[#22C55E]"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Reference Code</label>
                <input 
                  type="text" 
                  value={recordReference} 
                  onChange={e => setRecordReference(e.target.value)} 
                  className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-[#22C55E] font-mono" 
                />
              </div>
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Date</label>
                <input 
                  type="date"
                  max={today}
                  value={recordDate} 
                  onChange={e => setRecordDate(e.target.value)} 
                  className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-[#22C55E]" 
                />
              </div>
            </div>
 
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowRecordModal(false)} className="flex-1 bg-transparent border border-[var(--border)] rounded py-2 text-body-sm font-medium hover:bg-gray-50 dark:hover:bg-[#1f2a1f]">Cancel</button>
              <button onClick={handleRecord} disabled={!recordMemberId || !recordAmount || recordSaving} className="flex-1 bg-[#22C55E] disabled:opacity-50 text-white rounded py-2 text-body-sm font-medium hover:bg-[#006e2f]">{recordSaving ? 'Saving...' : 'Save Record'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

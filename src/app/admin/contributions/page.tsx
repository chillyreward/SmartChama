"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

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
  const [recordMethod, setRecordMethod] = useState("M-Pesa");
  const [recordReference, setRecordReference] = useState("");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editContribution, setEditContribution] = useState<any>(null);

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  const fetchData = async () => {
    if (!adminMember || !group) return;
    try {
      setLoading(true);
      
      const { data: memData } = await supabase.from('members').select('id, full_name').eq('group_id', group.id);
      setMembers(memData || []);

      const { data: contribData } = await supabase
        .from('contributions')
        .select('*, members(full_name)')
        .eq('group_id', group.id)
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

  const handleRecord = async () => {
    try {
      const { error } = await supabase.from('contributions').insert({
        member_id: recordMemberId,
        group_id: group?.id,
        amount: Number(recordAmount),
        payment_method: recordMethod,
        reference: recordReference,
        status: 'confirmed',
        created_at: new Date(recordDate).toISOString()
      });
      if (error) throw error;
      
      setToastMsg("Contribution recorded!");
      setTimeout(() => setToastMsg(""), 3000);
      setShowRecordModal(false);
      fetchData();
    } catch (err: any) {
      alert("Error recording contribution: " + err.message);
    }
  };

  const handleEdit = async () => {
    if (!editContribution) return;
    try {
      const { error } = await supabase.from('contributions')
        .update({
          amount: editContribution.amount,
          status: editContribution.status,
          reference: editContribution.reference
        }).eq('id', editContribution.id);
      if (error) throw error;
      
      setToastMsg("Contribution updated!");
      setTimeout(() => setToastMsg(""), 3000);
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      alert("Error updating contribution: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmation = prompt('Type "DELETE" to confirm deletion of this contribution record:');
    if (confirmation === 'DELETE') {
      try {
        const { error } = await supabase.from('contributions').delete().eq('id', id);
        if (error) throw error;
        setToastMsg("Contribution deleted");
        setTimeout(() => setToastMsg(""), 3000);
        fetchData();
      } catch (err: any) {
        alert("Error deleting: " + err.message);
      }
    }
  };

  const handleBulkRemind = async () => {
    try {
      const lateContribs = contributions.filter(c => c.status === 'late' || c.status === 'pending');
      const uniqueMembers = Array.from(new Set(lateContribs.map(c => c.member_id)));

      if (uniqueMembers.length === 0) {
        alert("No members are currently late or pending.");
        return;
      }

      const notifications = uniqueMembers.map(memberId => ({
        group_id: group?.id,
        member_id: memberId,
        type: 'contribution_reminder',
        message: `Your contribution is due. Please make a payment.`,
        read: false
      }));

      await supabase.from('notifications').insert(notifications);
      setToastMsg(`Reminders sent to ${uniqueMembers.length} members!`);
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err: any) {
      alert("Error sending reminders: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full font-inter">
        <div className="card-bg border border-[var(--border)] rounded-2xl h-96 animate-pulse shadow-sm"></div>
      </div>
    );
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
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button onClick={handleBulkRemind} className="w-full sm:w-auto bg-orange-50 dark:bg-orange-950/20 text-orange-850 dark:text-orange-355 border border-orange-200 dark:border-orange-900/30 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-all shadow-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            Bulk Remind
          </button>
          <button 
            onClick={() => setShowRecordModal(true)}
            className="w-full sm:w-auto bg-[#22C55E] hover:bg-[#006e2f] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
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
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
              {contributions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--text-muted)] text-sm">
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
                      {c.members?.full_name || 'Unknown'}
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setEditContribution({...c}); setShowEditModal(true); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#1f2a1f] text-[var(--text-muted)] hover:text-[#161d16] dark:hover:text-[#E8F0E4] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
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
                      {c.members?.full_name || 'Unknown'}
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
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditContribution({...c}); setShowEditModal(true); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-[#1f2a1f] text-[var(--text-muted)] hover:text-[#161d16] dark:hover:text-[#E8F0E4] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(c.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
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
            <h2 className="text-headline-sm font-geist font-bold text-[var(--text-main)] mb-6">Record Contribution</h2>
            
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
                  onChange={e => setRecordMethod(e.target.value)} 
                  className="w-full border border-[var(--border)] rounded px-4 py-2 text-[var(--text-main)] bg-transparent outline-none focus:border-[#22C55E]"
                >
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
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
                  value={recordDate} 
                  onChange={e => setRecordDate(e.target.value)} 
                  className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-[#22C55E]" 
                />
              </div>
            </div>
 
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowRecordModal(false)} className="flex-1 bg-transparent border border-[var(--border)] rounded py-2 text-body-sm font-medium hover:bg-gray-50 dark:hover:bg-[#1f2a1f]">Cancel</button>
              <button onClick={handleRecord} disabled={!recordMemberId || !recordAmount} className="flex-1 bg-[#22C55E] disabled:opacity-50 text-white rounded py-2 text-body-sm font-medium hover:bg-[#006e2f]">Save Record</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editContribution && (
        <div className="fixed inset-0 bg-[#0B0F0C]/50 dark:bg-[#0B0F0C]/75 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl text-[var(--text-main)]">
            <h2 className="text-headline-sm font-geist font-bold text-[var(--text-main)] mb-6">Edit Contribution</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Amount (KSh)</label>
                <input 
                  type="number" 
                  value={editContribution.amount} 
                  onChange={e => setEditContribution({...editContribution, amount: e.target.value})} 
                  className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-[#22C55E]" 
                />
              </div>
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Status</label>
                <select 
                  value={editContribution.status} 
                  onChange={e => setEditContribution({...editContribution, status: e.target.value})} 
                  className="w-full border border-[var(--border)] rounded px-4 py-2 text-[var(--text-main)] bg-transparent outline-none focus:border-[#22C55E]"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Reference Code</label>
                <input 
                  type="text" 
                  value={editContribution.reference || ''} 
                  onChange={e => setEditContribution({...editContribution, reference: e.target.value})} 
                  className="w-full border border-[var(--border)] bg-transparent rounded px-4 py-2 text-[var(--text-main)] outline-none focus:border-[#22C55E] font-mono" 
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowEditModal(false)} className="flex-1 bg-transparent border border-[var(--border)] rounded py-2 text-body-sm font-medium hover:bg-gray-50 dark:hover:bg-[#1f2a1f]">Cancel</button>
              <button onClick={handleEdit} className="flex-1 bg-[#22C55E] text-white rounded py-2 text-body-sm font-medium hover:bg-[#006e2f]">Update</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

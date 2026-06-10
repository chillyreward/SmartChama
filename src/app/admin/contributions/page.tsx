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
        .order('created_at', { ascending: false });
      
      setContributions(contribData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminMember, group]);

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
      <div className="p-8">
        <div className="h-96 bg-white border border-[#E5E7EB] rounded-lg animate-pulse shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="p-8 font-inter relative min-h-full">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#22C55E] text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-headline-lg font-semibold text-on-surface font-geist">Contributions</h1>
          <p className="text-body-sm text-secondary mt-1">Manage all group contributions and payments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleBulkRemind} className="bg-orange-100 text-orange-800 border border-orange-200 px-4 py-2 rounded text-body-sm font-medium hover:bg-orange-200 transition-colors shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            Bulk Remind
          </button>
          <button 
            onClick={() => setShowRecordModal(true)}
            className="bg-[#22C55E] hover:bg-[#006e2f] text-white px-4 py-2 rounded text-body-sm font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Record Contribution
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#E5E7EB]">
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">DATE</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">MEMBER</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">AMOUNT</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">METHOD</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">REFERENCE</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">STATUS</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {contributions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-secondary text-body-sm">
                    No contributions found for this group.
                  </td>
                </tr>
              ) : (
                contributions.map(c => (
                  <tr key={c.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 text-body-sm text-secondary whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-body-sm font-medium text-on-surface whitespace-nowrap">
                      {c.members?.full_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-on-surface whitespace-nowrap">
                      KSh {formatCurrency(Number(c.amount))}
                    </td>
                    <td className="px-6 py-4 text-body-sm text-secondary">
                      {c.payment_method || '—'}
                    </td>
                    <td className="px-6 py-4 text-body-sm font-mono text-secondary">
                      {c.reference || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-label-caps font-medium capitalize ${
                        c.status === 'confirmed' ? 'bg-[#22C55E]/10 text-[#005321]' :
                        c.status === 'late' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setEditContribution({...c}); setShowEditModal(true); }}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 text-secondary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-50 text-error transition-colors"
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
      </div>

      {/* RECORD MODAL */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-[#0B0F0C]/40 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-headline-sm font-geist font-bold text-on-surface mb-6">Record Contribution</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-label-caps text-secondary mb-2">Member</label>
                <select value={recordMemberId} onChange={e => setRecordMemberId(e.target.value)} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] bg-white">
                  <option value="">Select Member...</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">Amount (KSh)</label>
                <input type="number" value={recordAmount} onChange={e => setRecordAmount(e.target.value)} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E]" />
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">Payment Method</label>
                <select value={recordMethod} onChange={e => setRecordMethod(e.target.value)} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] bg-white">
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">Reference Code</label>
                <input type="text" value={recordReference} onChange={e => setRecordReference(e.target.value)} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] font-mono" />
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">Date</label>
                <input type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E]" />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowRecordModal(false)} className="flex-1 bg-white border border-[#E5E7EB] rounded py-2 text-body-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleRecord} disabled={!recordMemberId || !recordAmount} className="flex-1 bg-[#22C55E] disabled:opacity-50 text-white rounded py-2 text-body-sm font-medium hover:bg-[#006e2f]">Save Record</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editContribution && (
        <div className="fixed inset-0 bg-[#0B0F0C]/40 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-headline-sm font-geist font-bold text-on-surface mb-6">Edit Contribution</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-label-caps text-secondary mb-2">Amount (KSh)</label>
                <input type="number" value={editContribution.amount} onChange={e => setEditContribution({...editContribution, amount: e.target.value})} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E]" />
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">Status</label>
                <select value={editContribution.status} onChange={e => setEditContribution({...editContribution, status: e.target.value})} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] bg-white">
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">Reference Code</label>
                <input type="text" value={editContribution.reference || ''} onChange={e => setEditContribution({...editContribution, reference: e.target.value})} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] font-mono" />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowEditModal(false)} className="flex-1 bg-white border border-[#E5E7EB] rounded py-2 text-body-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleEdit} className="flex-1 bg-[#22C55E] text-white rounded py-2 text-body-sm font-medium hover:bg-[#006e2f]">Update</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

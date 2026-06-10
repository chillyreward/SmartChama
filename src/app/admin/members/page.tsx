"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminMembersPage() {
  const { member: adminMember, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [toastMsg, setToastMsg] = useState("");

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [newRole, setNewRole] = useState("member");

  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState("");

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  const fetchData = async () => {
    if (!adminMember || !group) return;
    try {
      setLoading(true);
      const { data } = await supabase
        .from('members')
        .select(`
          *,
          contributions(amount, status),
          loans(amount, status)
        `)
        .eq('group_id', group.id)
        .order('created_at', { ascending: true });
      
      const enhanced = data?.map(m => {
        const totalSaved = m.contributions
          ?.filter((c: any) => c.status === 'confirmed')
          .reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0;
        return { ...m, totalSaved };
      }) || [];

      setMembers(enhanced);
      setFilteredMembers(enhanced);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminMember, group]);

  useEffect(() => {
    let result = members;
    if (filter === 'Active') result = result.filter(m => m.status === 'active');
    else if (filter === 'Admin') result = result.filter(m => ['admin', 'chairlady', 'treasurer', 'secretary'].includes(m.role));
    else if (filter === 'Pending') result = result.filter(m => m.status === 'pending');
    else if (filter === 'Flagged') result = result.filter(m => m.status === 'flagged');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => m.full_name?.toLowerCase().includes(q) || m.phone_number?.includes(q));
    }

    setFilteredMembers(result);
  }, [filter, searchQuery, members]);

  const handleInvite = async () => {
    try {
      await supabase.from('invitations').insert({
        group_id: group?.id,
        invited_by: adminMember?.id,
        email: inviteEmail,
        phone: invitePhone,
        status: 'pending'
      });
      setToastMsg("Invitation sent successfully!");
      setTimeout(() => setToastMsg(""), 3000);
      setShowInviteModal(false);
      setInviteEmail("");
      setInvitePhone("");
    } catch (err: any) {
      alert("Error inviting member: " + err.message);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedMember) return;
    try {
      await supabase.from('members').update({ role: newRole }).eq('id', selectedMember.id);
      setToastMsg("Role updated!");
      setTimeout(() => setToastMsg(""), 3000);
      setShowRoleModal(false);
      fetchData();
    } catch (err) {
      alert("Error updating role");
    }
  };

  const handleFlag = async () => {
    if (!selectedMember) return;
    try {
      await supabase.from('members').update({ status: 'flagged', flag_reason: flagReason }).eq('id', selectedMember.id);
      setToastMsg("Member flagged");
      setTimeout(() => setToastMsg(""), 3000);
      setShowFlagModal(false);
      setFlagReason("");
      fetchData();
    } catch (err) {
      alert("Error flagging member");
    }
  };

  const handleSendReminder = async (m: any) => {
    try {
      await supabase.from('notifications').insert({
        group_id: group?.id,
        member_id: m.id,
        type: 'reminder',
        message: 'Please review your pending actions in the dashboard.',
        read: false
      });
      setToastMsg(`Reminder sent to ${m.full_name}`);
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err) {
      alert("Error sending reminder");
    }
  };

  const handleRemove = async (m: any) => {
    if (confirm(`Are you sure you want to remove ${m.full_name}? This will set their status to inactive.`)) {
      try {
        await supabase.from('members').update({ status: 'inactive' }).eq('id', m.id);
        fetchData();
        setToastMsg(`${m.full_name} removed`);
        setTimeout(() => setToastMsg(""), 3000);
      } catch (err) {
        alert("Error removing member");
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-96 bg-white border border-[#E5E7EB] rounded-lg animate-pulse shadow-sm"></div>
      </div>
    );
  }

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';

  const roleColors: Record<string, string> = {
    'admin': 'bg-red-50 text-red-700 border-red-200',
    'chairlady': 'bg-[#22C55E]/10 text-[#005321] border-[#4ae176]',
    'treasurer': 'bg-blue-50 text-blue-700 border-blue-200',
    'secretary': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'member': 'bg-gray-100 text-gray-700 border-gray-200'
  };

  const statusColors: Record<string, string> = {
    'active': 'bg-[#22C55E]/10 text-[#005321]',
    'pending': 'bg-orange-100 text-orange-800',
    'flagged': 'bg-red-100 text-red-800',
    'inactive': 'bg-gray-100 text-gray-600'
  };

  return (
    <div className="p-8 font-inter">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#22C55E] text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-headline-lg font-semibold text-on-surface font-geist">Members</h1>
          <span className="bg-surface-container-high text-on-surface-variant text-body-sm font-medium px-2.5 py-0.5 rounded-full">
            {members.length}
          </span>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] text-on-surface px-4 py-2 rounded text-body-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="bg-[#22C55E] hover:bg-[#006e2f] text-white px-4 py-2 rounded text-body-sm font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Invite Member
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-[#E5E7EB] rounded pl-10 pr-4 py-2 text-body-sm outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['All', 'Active', 'Admin', 'Pending', 'Flagged'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-body-sm font-medium whitespace-nowrap transition-colors ${
                filter === f 
                  ? 'bg-surface-container-high text-on-surface' 
                  : 'text-secondary hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* MEMBERS TABLE */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#E5E7EB]">
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">MEMBER</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">ROLE</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">PHONE</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">JOINED</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">TOTAL SAVED</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">TRUST SCORE</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">STATUS</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-secondary text-body-sm">
                    No members found.
                  </td>
                </tr>
              ) : (
                filteredMembers.map(m => (
                  <tr key={m.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {getInitials(m.full_name)}
                        </div>
                        <span className="text-body-sm font-medium text-on-surface whitespace-nowrap">
                          {m.full_name || 'Unnamed Member'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-label-caps font-bold border capitalize ${roleColors[m.role] || roleColors['member']}`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-secondary whitespace-nowrap">
                      {m.phone_number || '—'}
                    </td>
                    <td className="px-6 py-4 text-body-sm text-secondary whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-on-surface whitespace-nowrap">
                      KSh {formatCurrency(m.totalSaved)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`material-symbols-outlined text-[16px] ${m.trust_score >= 80 ? 'text-[#22C55E]' : m.trust_score >= 50 ? 'text-yellow-500' : 'text-error'}`}>
                          verified
                        </span>
                        <span className="text-body-sm font-bold text-on-surface">{m.trust_score || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-label-caps font-medium capitalize ${statusColors[m.status] || statusColors['active']}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      {/* Using a simple native select as an action menu for simplicity in the prototype */}
                      <select 
                        className="bg-transparent text-secondary hover:text-on-surface outline-none cursor-pointer text-body-sm font-medium w-24"
                        onChange={(e) => {
                          const val = e.target.value;
                          e.target.value = ""; // reset
                          if (val === 'view') window.location.href = `/admin/members/${m.id}`;
                          if (val === 'role') { setSelectedMember(m); setNewRole(m.role); setShowRoleModal(true); }
                          if (val === 'remind') handleSendReminder(m);
                          if (val === 'flag') { setSelectedMember(m); setShowFlagModal(true); }
                          if (val === 'remove') handleRemove(m);
                        }}
                      >
                        <option value="">Actions</option>
                        <option value="view">View Profile</option>
                        <option value="role">Edit Role</option>
                        <option value="remind">Send Reminder</option>
                        <option value="flag">Flag Member</option>
                        <option value="remove">Remove</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-[#0B0F0C]/40 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-headline-sm font-geist font-bold text-on-surface mb-2">Invite Member</h2>
            <p className="text-body-sm text-secondary mb-6">Send an invitation link via email or SMS.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-label-caps text-secondary mb-2">Email Address</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E]" />
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">Phone Number</label>
                <input type="tel" value={invitePhone} onChange={e => setInvitePhone(e.target.value)} className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E]" />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowInviteModal(false)} className="flex-1 bg-white border border-[#E5E7EB] rounded py-2 text-body-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleInvite} className="flex-[2] bg-[#22C55E] text-white rounded py-2 text-body-sm font-medium hover:bg-[#006e2f]">Send Invite</button>
            </div>
          </div>
        </div>
      )}

      {showRoleModal && selectedMember && (
        <div className="fixed inset-0 bg-[#0B0F0C]/40 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-headline-sm font-geist font-bold text-on-surface mb-6">Edit Role for {selectedMember.full_name}</h2>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full border border-[#E5E7EB] rounded px-4 py-3 text-on-surface outline-none focus:border-[#22C55E] bg-white">
              <option value="member">Member</option>
              <option value="secretary">Secretary</option>
              <option value="treasurer">Treasurer</option>
              <option value="admin">Admin</option>
              <option value="chairlady">Chairlady</option>
            </select>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowRoleModal(false)} className="flex-1 bg-white border border-[#E5E7EB] rounded py-2 text-body-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdateRole} className="flex-1 bg-[#22C55E] text-white rounded py-2 text-body-sm font-medium hover:bg-[#006e2f]">Update</button>
            </div>
          </div>
        </div>
      )}

      {showFlagModal && selectedMember && (
        <div className="fixed inset-0 bg-[#0B0F0C]/40 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-headline-sm font-geist font-bold text-error mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined">flag</span> Flag Member
            </h2>
            <p className="text-body-sm text-secondary mb-6">Why are you flagging {selectedMember.full_name}?</p>
            
            <textarea 
              rows={3} 
              value={flagReason} 
              onChange={e => setFlagReason(e.target.value)} 
              placeholder="e.g. Consistently late on payments..."
              className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-error resize-none"
            />

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowFlagModal(false)} className="flex-1 bg-white border border-[#E5E7EB] rounded py-2 text-body-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleFlag} className="flex-1 bg-error text-white rounded py-2 text-body-sm font-medium hover:bg-red-700">Flag Member</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

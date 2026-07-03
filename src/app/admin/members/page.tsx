"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { InviteModal } from "@/components/InviteModal";

export default function AdminMembersPage() {
  const router = useRouter();
  const { session, member: adminMember, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  const [toastMsg, setToastMsg] = useState("");

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
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
      const { data, error } = await supabase
        .from('chama_memberships')
        .select(`
          *,
          profile:profiles (
            full_name,
            phone_number,
            email
          ),
          contributions:contributions_v2 (
            amount, 
            status
          ),
          loans:loans_v2 (
            amount, 
            status
          )
        `)
        .eq('chama_id', group.id)
        .order('created_at', { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
      if (error) throw error;

      const enhanced = data?.map(m => {
        const totalSaved = m.contributions
          ?.filter((c: any) => c.status === 'confirmed')
          .reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0;
        return { ...m, totalSaved };
      }) || [];

      setMembers(enhanced);
      setFilteredMembers(enhanced);
      setHasMore((data?.length || 0) === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminMember, group, page]);

  useEffect(() => {
    let result = members;
    if (filter === 'Active') result = result.filter(m => m.status === 'active');
    else if (filter === 'Admin') result = result.filter(m => ['admin', 'chairlady', 'treasurer', 'secretary'].includes(m.role));
    else if (filter === 'Pending') result = result.filter(m => m.status === 'pending');
    else if (filter === 'Flagged') result = result.filter(m => m.status === 'flagged');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.profile?.full_name?.toLowerCase().includes(q) || 
        m.profile?.phone_number?.includes(q)
      );
    }

    setFilteredMembers(result);
  }, [filter, searchQuery, members]);

  const handleUpdateRole = async () => {
    if (!selectedMember) return;
    try {
      const { error } = await supabase
        .from('chama_memberships')
        .update({ role: newRole })
        .eq('id', selectedMember.id);

      if (error) throw error;

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
      const { error } = await supabase
        .from('chama_memberships')
        .update({ status: 'flagged', flag_reason: flagReason })
        .eq('id', selectedMember.id);

      if (error) throw error;

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
      const { error } = await supabase
        .from('notifications')
        .insert({
          chama_id: group?.id,
          profile_id: m.profile_id,
          type: 'reminder',
          title: 'Contribution Reminder',
          message: 'Please review your pending actions in the dashboard.',
          read: false
        });

      if (error) throw error;

      setToastMsg(`Reminder sent to ${m.profile?.full_name}`);
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Error sending reminder");
    }
  };

  const handleRemove = async (m: any) => {
    if (confirm(`Are you sure you want to remove ${m.profile?.full_name}? This will set their status to inactive.`)) {
      try {
        const { error } = await supabase
          .from('chama_memberships')
          .update({ status: 'inactive' })
          .eq('id', m.id);

        if (error) throw error;

        fetchData();
        setToastMsg(`${m.profile?.full_name} removed`);
        setTimeout(() => setToastMsg(""), 3000);
      } catch (err) {
        alert("Error removing member");
      }
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const roleColors: Record<string, string> = {
    'admin': 'bg-red-50 dark:bg-red-950/20 text-[#ba1a1a] dark:text-[#ffb4ab] border-red-150 dark:border-red-900/30',
    'chairlady': 'bg-transparent text-[var(--brand-green)] border-[#edf6ea] dark:border-[#1a2a1a]',
    'treasurer': 'bg-blue-50 dark:bg-blue-950/20 text-blue-750 dark:text-blue-300 border-blue-150 dark:border-blue-900/30',
    'secretary': 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-755 dark:text-yellow-300 border-yellow-150 dark:border-yellow-900/30',
    'member': 'bg-gray-50 dark:bg-gray-800 text-[var(--text-muted)] border-gray-200 dark:border-gray-700'
  };

  const statusColors: Record<string, string> = {
    'active': 'bg-transparent text-[var(--brand-green)] border border-[#22C55E]',
    'flagged': 'bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-red-400 border border-red-200 dark:border-red-900/30',
    'pending': 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-250 dark:border-amber-900/30',
    'inactive': 'bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200'
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full font-inter">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 card-bg border border-[var(--border)] rounded-2xl animate-pulse shadow-sm"></div>
          ))}
        </div>
        <div className="card-bg border border-[var(--border)] rounded-2xl h-96 animate-pulse shadow-sm"></div>
      </div>
    );
  }

  const totalCount = members.length;
  const activeCount = members.filter(m => m.status === 'active').length;
  const flaggedCount = members.filter(m => m.status === 'flagged').length;

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full relative font-inter text-[var(--text-main)]">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#161d16] dark:bg-[#E8F0E4] text-white dark:text-[#161d16] px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-fade-in-down">
          <span className="material-symbols-outlined text-[#22C55E]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Admin Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Members</span>
        </p>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-[24px] md:text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
              Chama Members
            </h1>
            <p className="text-[13px] md:text-[14px] text-[var(--text-muted)] mt-1">
              {group?.name || "SmartChama"} · {totalCount} total registered members.
            </p>
          </div>
          <div className="w-full md:w-auto">
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-full md:w-auto bg-[#22C55E] text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 hover:bg-[#006e2f] transition-all font-semibold text-sm shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm font-bold">person_add</span>
              Invite Member
            </button>
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8">
        <div className="card-bg border border-[var(--border)] border-t-2 border-t-[#22C55E] rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-[10px] md:text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">TOTAL MEMBERS</div>
          <div className="flex items-center justify-between">
            <div className="text-[22px] md:text-3xl font-bold text-[var(--text-main)] font-geist">{totalCount}</div>
            <span className="material-symbols-outlined text-gray-300 dark:text-[#5a6e5a] text-2xl md:text-3xl">group</span>
          </div>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-blue-500 rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-[10px] md:text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">ACTIVE MEMBERS</div>
          <div className="flex items-center justify-between">
            <div className="text-[22px] md:text-3xl font-bold text-[var(--brand-green)] font-geist">{activeCount}</div>
            <span className="material-symbols-outlined text-gray-300 dark:text-[#5a6e5a] text-2xl md:text-3xl">how_to_reg</span>
          </div>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-red-500 rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 col-span-2 md:col-span-1">
          <div className="text-[10px] md:text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">FLAGGED MEMBERS</div>
          <div className="flex items-center justify-between">
            <div className="text-[22px] md:text-3xl font-bold text-[var(--text-main)] font-geist">{flaggedCount}</div>
            <span className="material-symbols-outlined text-red-300 dark:text-red-900/30 text-2xl md:text-3xl">flag</span>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="card-bg border border-[var(--border)] rounded-2xl p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="relative w-full md:w-auto">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-lg">search</span>
          <input 
            type="text" 
            placeholder="Search members by name or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-72 border border-[var(--border)] rounded-lg px-4 py-2 pl-10 text-sm outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] text-[var(--text-main)] bg-transparent placeholder:text-[#9CA3AF] dark:placeholder:text-[#4a5e4a] transition-all"
          />
        </div>
        
        <div className="bg-[#F5F5F5] dark:bg-[#1f2a1f] p-1 rounded-lg flex gap-1 text-sm font-semibold text-[var(--text-muted)] self-start md:self-auto overflow-x-auto w-full md:w-auto">
          {["All", "Active", "Admin", "Pending", "Flagged"].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md transition-all cursor-pointer ${filter === f ? 'card-bg shadow-sm text-[var(--text-main)] font-bold' : 'hover:text-[#161d16] dark:hover:text-[#E8F0E4]'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* MEMBERS TABLE / CARD LIST */}
      <div className="card-bg border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0f1410] border-b border-[var(--border)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">MEMBER</th>
                <th className="px-6 py-4">ROLE</th>
                <th className="px-6 py-4">PHONE</th>
                <th className="px-6 py-4">JOINED</th>
                <th className="px-6 py-4">TOTAL SAVED</th>
                <th className="px-6 py-4">Credit Score</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-transparent text-[var(--brand-green)] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-[#22C55E]/10">
                          {getInitials(m.profile?.full_name)}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--text-main)] text-sm whitespace-nowrap">
                            {m.profile?.full_name || 'Unnamed Member'}
                          </div>
                          <div className="text-xs text-[#9CA3AF] dark:text-[#5a6e5a]">{m.profile?.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-label-caps font-bold border capitalize ${roleColors[m.role] || roleColors['member']}`}>
                        {m.role || 'Member'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-[var(--text-muted)] whitespace-nowrap">
                      {m.profile?.phone_number || '—'}
                    </td>
                    <td className="px-6 py-4 text-body-sm text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-[var(--text-main)] whitespace-nowrap">
                      KSh {formatCurrency(m.totalSaved || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`material-symbols-outlined text-[16px] ${m.trust_score >= 80 ? 'text-[#22C55E]' : m.trust_score >= 50 ? 'text-yellow-500' : 'text-error'}`}>
                          verified
                        </span>
                        <span className="text-body-sm font-bold text-[var(--text-main)]">{m.trust_score || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-label-caps font-medium capitalize ${statusColors[m.status] || statusColors['active']}`}>
                        {m.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select 
                        className="bg-transparent border border-[var(--border)] rounded px-2.5 py-1 text-xs font-semibold text-[var(--text-main)] outline-none cursor-pointer hover:border-[#22C55E]"
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'view') router.push(`/admin/members/${m.id}`);
                          if (val === 'role') { setSelectedMember(m); setNewRole(m.role || "member"); setShowRoleModal(true); }
                          if (val === 'remind') handleSendReminder(m);
                          if (val === 'flag') { setSelectedMember(m); setShowFlagModal(true); }
                          if (val === 'remove') handleRemove(m);
                          e.target.value = ""; // Reset
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
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-[var(--text-muted)] text-body-sm">
                    No members found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="md:hidden divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((m) => (
              <div key={m.id} className="p-4 flex flex-col gap-2 hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-transparent text-[var(--brand-green)] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-[#22C55E]/10">
                      {getInitials(m.profile?.full_name)}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--text-main)] text-sm">
                        {m.profile?.full_name || 'Unnamed Member'}
                      </div>
                      <div className="text-xs text-[#9CA3AF] dark:text-[#5a6e5a]">{m.profile?.email || '—'}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${roleColors[m.role] || roleColors['member']}`}>
                    {m.role || 'Member'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-b border-dashed border-[#f5f5f5] dark:border-[#2d3d2d] my-1">
                  <div>
                    <span className="text-[var(--text-muted)] block">Phone:</span>
                    <span className="font-medium text-[var(--text-main)]">{m.profile?.phone_number || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">Total Saved:</span>
                    <span className="font-mono font-bold text-[var(--text-main)]">KSh {formatCurrency(m.totalSaved || 0)}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">CREDIT SCORE:</span>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-[#22C55E]">verified</span>
                      <span className="font-bold text-[var(--text-main)]">{m.trust_score || 0}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">Status:</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium capitalize ${statusColors[m.status] || statusColors['active']}`}>
                      {m.status || 'active'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-[var(--text-muted)] pt-1">
                  <span className="text-[11px]">Joined: {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <select 
                    className="bg-transparent border border-[var(--border)] rounded px-2.5 py-1 text-xs font-semibold text-[var(--text-main)] outline-none cursor-pointer hover:border-[#22C55E]"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'view') router.push(`/admin/members/${m.id}`);
                      if (val === 'role') { setSelectedMember(m); setNewRole(m.role || "member"); setShowRoleModal(true); }
                      if (val === 'remind') handleSendReminder(m);
                      if (val === 'flag') { setSelectedMember(m); setShowFlagModal(true); }
                      if (val === 'remove') handleRemove(m);
                      e.target.value = ""; // Reset
                    }}
                  >
                    <option value="">Actions</option>
                    <option value="view">View Profile</option>
                    <option value="role">Edit Role</option>
                    <option value="remind">Send Reminder</option>
                    <option value="flag">Flag Member</option>
                    <option value="remove">Remove</option>
                  </select>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-[var(--text-muted)] text-body-sm">
              No members found matching the filters.
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          chamaId={group?.id || ""}
          chamaName={group?.name || ""}
          adminId={session?.user?.id || ""}
        />
      )}

      {showRoleModal && selectedMember && (
        <div className="fixed inset-0 bg-[#0B0F0C]/50 dark:bg-[#0B0F0C]/75 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl text-[var(--text-main)]">
            <h2 className="text-headline-sm font-geist font-bold text-[var(--text-main)] mb-6">Edit Role for {selectedMember.profile?.full_name}</h2>
            <select 
              value={newRole} 
              onChange={e => setNewRole(e.target.value)} 
              className="w-full border border-[var(--border)] rounded px-4 py-3 text-[var(--text-main)] outline-none focus:border-[#22C55E] bg-transparent"
            >
              <option value="member">Member</option>
              <option value="secretary">Secretary</option>
              <option value="treasurer">Treasurer</option>
              <option value="admin">Admin</option>
              <option value="chairlady">Chairlady</option>
            </select>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowRoleModal(false)} className="flex-1 bg-transparent border border-[var(--border)] rounded py-2 text-body-sm font-medium hover:bg-gray-50 dark:hover:bg-[#1f2a1f]">Cancel</button>
              <button onClick={handleUpdateRole} className="flex-1 bg-[#22C55E] text-white rounded py-2 text-body-sm font-medium hover:bg-[#006e2f]">Update</button>
            </div>
          </div>
        </div>
      )}

      {showFlagModal && selectedMember && (
        <div className="fixed inset-0 bg-[#0B0F0C]/50 dark:bg-[#0B0F0C]/75 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl text-[var(--text-main)]">
            <h2 className="text-headline-sm font-geist font-bold text-error mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined">flag</span> Flag Member
            </h2>
            <p className="text-body-sm text-[var(--text-muted)] mb-6">Why are you flagging {selectedMember.profile?.full_name}?</p>
            
            <textarea 
              rows={3} 
              value={flagReason} 
              onChange={e => setFlagReason(e.target.value)} 
              placeholder="e.g. Consistently late on payments..."
              className="w-full border border-[var(--border)] rounded px-4 py-2 text-[var(--text-main)] bg-transparent outline-none focus:border-error resize-none"
            />

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowFlagModal(false)} className="flex-1 bg-transparent border border-[var(--border)] rounded py-2 text-body-sm font-medium hover:bg-gray-50 dark:hover:bg-[#1f2a1f]">Cancel</button>
              <button onClick={handleFlag} className="flex-1 bg-error text-white rounded py-2 text-body-sm font-medium hover:bg-red-700">Flag Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

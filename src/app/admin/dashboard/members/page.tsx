"use client";

import { useState, useEffect } from "react";
import { 
  Users, Search, UserPlus, Mail, Phone, Calendar, 
  MoreVertical, CheckCircle, XCircle, Crown, Plus, X
} from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import BlockchainBadge from "@/components/BlockchainBadge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UnassignedMember {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  phone_number: string;
  created_at: string;
}

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [unassignedMembers, setUnassignedMembers] = useState<UnassignedMember[]>([]);
  const [chamaMembers, setChamaMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<UnassignedMember | null>(null);
  const [adminChamas, setAdminChamas] = useState<any[]>([]);
  const [selectedChama, setSelectedChama] = useState("");
  const [adding, setAdding] = useState(false);
  const [viewMode, setViewMode] = useState<"unassigned" | "chama">("chama"); // Default to chama members
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [selectedMemberForInsights, setSelectedMemberForInsights] = useState<any>(null);

  // Fetch unassigned members and chama members on mount
  useEffect(() => {
    fetchUnassignedMembers();
    fetchChamaMembers();
    fetchAdminChamas();
  }, []);

  const fetchUnassignedMembers = async () => {
    try {
      setLoading(true);
      
      // Get members who are not in any chama (chama_id is null)
      const { data: members, error } = await supabase
        .from('members')
        .select('*')
        .is('chama_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUnassignedMembers(members || []);
    } catch (error) {
      console.error('Error fetching unassigned members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChamaMembers = async () => {
    try {
      setLoading(true);
      
      // Get current admin's email from session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get admin's ID
      const { data: admin } = await supabase
        .from('chama_admins')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!admin) return;

      // Get all chamas owned by this admin
      const { data: chamas } = await supabase
        .from('chamas')
        .select('id')
        .eq('admin_id', admin.id);

      if (!chamas || chamas.length === 0) {
        setChamaMembers([]);
        return;
      }

      const chamaIds = chamas.map(c => c.id);

      // Get all members in these chamas
      const { data: members, error } = await supabase
        .from('members')
        .select('*, chamas(name)')
        .in('chama_id', chamaIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setChamaMembers(members || []);
    } catch (error) {
      console.error('Error fetching chama members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminChamas = async () => {
    try {
      // Get current admin's email from session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get admin's chamas
      const { data: admin } = await supabase
        .from('chama_admins')
        .select('id')
        .eq('email', user.email)
        .single();

      if (admin) {
        const { data: chamas } = await supabase
          .from('chamas')
          .select('*')
          .eq('admin_id', admin.id);

        setAdminChamas(chamas || []);
      }
    } catch (error) {
      console.error('Error fetching admin chamas:', error);
    }
  };

  const handleAddToChama = async () => {
    if (!selectedMember || !selectedChama) {
      alert('Please select a chama');
      return;
    }

    try {
      setAdding(true);

      // Update member's chama_id
      const { error } = await supabase
        .from('members')
        .update({ chama_id: selectedChama })
        .eq('id', selectedMember.id);

      if (error) throw error;

      alert(`${selectedMember.full_name || selectedMember.name} has been added to the chama successfully!`);
      
      // Refresh both lists
      fetchUnassignedMembers();
      fetchChamaMembers();
      setShowAddModal(false);
      setSelectedMember(null);
      setSelectedChama("");
    } catch (error) {
      console.error('Error adding member to chama:', error);
      alert('Failed to add member to chama. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const filteredMembers = unassignedMembers.filter(member => {
    const name = member.name || member.full_name || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.phone_number.includes(searchQuery);
    return matchesSearch;
  });

  const filteredChamaMembers = chamaMembers.filter(member => {
    const name = member.full_name || member.name || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.phone_number?.includes(searchQuery);
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3">
            Members
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">
              {viewMode === "chama" ? chamaMembers.length : unassignedMembers.length} {viewMode === "chama" ? "In Chamas" : "Unassigned"}
            </span>
          </h1>
          <p className="text-slate-400 mt-1">
            {viewMode === "chama" 
              ? "Members in your chamas" 
              : "Members who have signed up but are not in any chama yet"}
          </p>
        </div>
      </div>

      {/* VIEW MODE TABS */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => setViewMode("chama")}
          className={`px-6 py-3 rounded-xl font-bold transition-all text-center w-full sm:w-auto ${
            viewMode === "chama"
              ? "bg-amber-500 text-black"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          My Chama Members ({chamaMembers.length})
        </button>
        <button
          onClick={() => setViewMode("unassigned")}
          className={`px-6 py-3 rounded-xl font-bold transition-all text-center w-full sm:w-auto ${
            viewMode === "unassigned"
              ? "bg-amber-500 text-black"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          Unassigned ({unassignedMembers.length})
        </button>
      </div>

      {/* SEARCH */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 mt-4">Loading members...</p>
        </div>
      )}

      {/* MEMBERS TABLE */}
      {!loading && viewMode === "unassigned" && filteredMembers.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden">
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="hidden md:table w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Member</th>
                  <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                  <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-bold text-black">
                          {(member.full_name || member.name || '?').charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{member.full_name || member.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Mail className="w-4 h-4" />
                          <span className="text-xs">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Phone className="w-4 h-4" />
                          <span className="text-xs">{member.phone_number}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {new Date(member.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        <Users className="w-3 h-3" />
                        Not in Chama
                      </span>
                    </td>
                    <td className="p-6">
                      <button 
                        onClick={() => {
                          setSelectedMember(member);
                          setShowAddModal(true);
                        }}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-lg transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Add to Chama
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-800 p-4">
              {filteredMembers.map((member) => (
                <div key={member.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-bold text-black shrink-0">
                      {(member.full_name || member.name || '?').charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white truncate">{member.full_name || member.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500 truncate">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="text-xs truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span className="text-xs">{member.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span className="text-xs">
                        Joined {new Date(member.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      <Users className="w-3 h-3" />
                      Not in Chama
                    </span>
                    <button 
                      onClick={() => {
                        setSelectedMember(member);
                        setShowAddModal(true);
                      }}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-lg transition-all text-xs"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CHAMA MEMBERS TABLE */}
      {!loading && viewMode === "chama" && filteredChamaMembers.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden">
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="hidden md:table w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Member</th>
                  <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Chama</th>
                  <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                  <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredChamaMembers.map((member) => (
                  <tr key={member.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-bold text-black">
                          {(member.full_name || member.name || '?').charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{member.full_name || member.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Mail className="w-4 h-4" />
                          <span className="text-xs">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Phone className="w-4 h-4" />
                          <span className="text-xs">{member.phone_number}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" />
                        {member.chamas?.name || 'Unknown Chama'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {new Date(member.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-800 p-4">
              {filteredChamaMembers.map((member) => (
                <div key={member.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-bold text-black shrink-0">
                      {(member.full_name || member.name || '?').charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white truncate">{member.full_name || member.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500 truncate">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="text-xs truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span className="text-xs">{member.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span className="text-xs">
                        Joined {new Date(member.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle className="w-3 h-3" />
                      {member.chamas?.name || 'Unknown Chama'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && viewMode === "unassigned" && filteredMembers.length === 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[32px] p-12 text-center">
          <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Unassigned Members</h3>
          <p className="text-slate-400">
            {searchQuery 
              ? "No members found matching your search criteria"
              : "All members have been assigned to chamas. Invite new members to see them here."}
          </p>
        </div>
      )}

      {/* EMPTY STATE - CHAMA MEMBERS */}
      {!loading && viewMode === "chama" && filteredChamaMembers.length === 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[32px] p-12 text-center">
          <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Members Yet</h3>
          <p className="text-slate-400">
            {searchQuery 
              ? "No members found matching your search criteria"
              : "Generate invite links to add members to your chamas."}
          </p>
        </div>
      )}

      {/* ADD TO CHAMA MODAL */}
      {showAddModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] w-full max-w-md rounded-[32px] p-8 relative shadow-2xl">
            
            <button 
              onClick={() => {
                setShowAddModal(false);
                setSelectedMember(null);
                setSelectedChama("");
              }}
              className="absolute top-6 right-6 text-slate-500 hover:text-[var(--text-primary)] bg-[var(--bg-page)] rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Add Member to Chama</h2>
              <p className="text-slate-400 text-sm">Select which chama to add this member to</p>
            </div>

            {/* Member Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-bold text-black text-lg">
                  {(selectedMember.full_name || selectedMember.name || '?').charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-white">{selectedMember.full_name || selectedMember.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">{selectedMember.email}</p>
                </div>
              </div>
            </div>

            {/* Chama Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-white mb-2">Select Chama</label>
              {adminChamas.length === 0 ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                  You don't have any chamas yet. Create a chama first.
                </div>
              ) : (
                <select
                  value={selectedChama}
                  onChange={(e) => setSelectedChama(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition-all"
                >
                  <option value="">-- Select a Chama --</option>
                  {adminChamas.map((chama) => (
                    <option key={chama.id} value={chama.id}>
                      {chama.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedMember(null);
                  setSelectedChama("");
                }}
                className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddToChama}
                disabled={!selectedChama || adding || adminChamas.length === 0}
                className="flex-[2] bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {adding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add to Chama
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

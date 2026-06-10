"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function MembersPage() {
  const { session, member: currentMember, group, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [members, setMembers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    newThisMonth: 0,
    flagged: 0,
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const [selectedMember, setSelectedMember] = useState<any>(null);
  
  // Formatters
  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';

  const fetchData = async () => {
    if (!currentMember || !group) return;
    try {
      setLoading(true);
      setError("");

      // 1. Fetch all members in group
      const { data: membersData, error: membersErr } = await supabase
        .from('members')
        .select('*')
        .eq('group_id', currentMember.group_id);

      if (membersErr) throw membersErr;

      // 2. Fetch sum of all contributions per member
      const { data: contributionsData } = await supabase
        .from('contributions')
        .select('member_id, amount')
        .eq('group_id', currentMember.group_id)
        .eq('status', 'confirmed');

      const savingsMap: Record<string, number> = {};
      contributionsData?.forEach(c => {
        if (!savingsMap[c.member_id]) savingsMap[c.member_id] = 0;
        savingsMap[c.member_id] += Number(c.amount);
      });

      // 3. Loans for drawer
      const { data: loansData } = await supabase
        .from('loans')
        .select('borrower_id, amount, status')
        .eq('group_id', currentMember.group_id);
        
      const loansMap: Record<string, any[]> = {};
      loansData?.forEach(l => {
        if (!loansMap[l.borrower_id]) loansMap[l.borrower_id] = [];
        loansMap[l.borrower_id].push(l);
      });

      const today = new Date();
      let activeCount = 0;
      let newCount = 0;
      let flaggedCount = 0;

      const enhancedMembers = (membersData || []).map((m: any, idx: number) => {
        const totalSaved = savingsMap[m.id] || 0;
        const joinedDate = new Date(m.created_at);
        const isNew = joinedDate.getMonth() === today.getMonth() && joinedDate.getFullYear() === today.getFullYear();
        const trustScore = m.trust_score || 0;
        const isFlagged = trustScore < 60;
        const status = isFlagged ? 'Flagged' : 'Active';

        activeCount++;
        if (isNew) newCount++;
        if (isFlagged) flaggedCount++;

        // Random colors for avatar
        const colors = [
          "bg-green-100 text-green-700",
          "bg-blue-100 text-blue-700",
          "bg-purple-100 text-purple-700",
          "bg-teal-100 text-teal-700",
          "bg-indigo-100 text-indigo-700",
          "bg-orange-100 text-orange-700"
        ];
        const colorClass = colors[idx % colors.length];
        
        const roleClass = m.role === 'admin' ? "bg-[#22C55E]/10 text-[#005321] border border-[#4ae176]" : "bg-gray-100 text-gray-600 border border-[#E5E7EB]";

        return {
          ...m,
          trust: trustScore,
          initials: getInitials(m.full_name),
          joined: joinedDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
          totalSaved,
          status,
          colorClass,
          roleClass,
          loans: loansMap[m.id] || []
        };
      });

      setMembers(enhancedMembers);
      setStats({
        active: activeCount,
        newThisMonth: newCount,
        flagged: flaggedCount
      });

    } catch (err) {
      console.error(err);
      setError("Failed to load members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && currentMember && group) {
      fetchData();
    }
  }, [authLoading, currentMember, group]);

  const filteredMembers = members.filter(m => {
    if (searchQuery && !m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) && !m.phone.includes(searchQuery)) {
      return false;
    }
    if (filter === "Active" && m.status !== "Active") return false;
    if (filter === "Admin" && m.role !== "admin") return false;
    if (filter === "Flagged" && m.status !== "Flagged") return false;
    return true;
  });

  const getTrustScoreStyles = (score: number) => {
    if (score >= 80) return { text: "text-[#22C55E]", bg: "bg-[#22C55E]" };
    if (score >= 60) return { text: "text-yellow-600", bg: "bg-yellow-400" };
    return { text: "text-error", bg: "bg-red-400" };
  };

  if (authLoading || loading) {
    return (
      <div className="p-8">
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 h-32 animate-pulse mb-6 shadow-sm"></div>
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 h-96 animate-pulse shadow-sm"></div>
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

  return (
    <div className="p-8 font-inter relative min-h-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-headline-lg font-semibold text-on-surface font-geist">Members</h1>
          <p className="text-body-sm text-secondary mt-1">{group.name} · {members.length} members</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-[#E5E7EB] text-on-surface rounded px-4 py-2 text-body-sm hover:bg-gray-50 transition-colors font-medium shadow-sm">
            Manage Roles
          </button>
          <button className="bg-[#22C55E] text-white rounded px-4 py-2 flex items-center gap-2 hover:bg-[#006e2f] transition-colors shadow-sm">
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span className="text-body-sm font-medium">Invite Member</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-label-caps text-secondary mb-2">ACTIVE MEMBERS</div>
          <div className="flex items-center justify-between">
            <div className="text-display-sm font-geist font-bold text-on-surface">{stats.active}</div>
            <span className="material-symbols-outlined text-outline-variant text-3xl">group</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-label-caps text-secondary mb-2">NEW THIS MONTH</div>
          <div className="flex items-end gap-3">
            <div className="text-display-sm font-geist font-bold text-[#22C55E]">{stats.newThisMonth}</div>
            {stats.newThisMonth > 0 && (
              <div className="bg-[#22C55E]/10 text-[#005321] border border-[#4ae176] rounded px-2 py-0.5 text-label-caps mb-1">
                +{stats.newThisMonth} joined
              </div>
            )}
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-label-caps text-secondary mb-2">FLAGGED MEMBERS</div>
          <div className="flex items-end gap-3">
            <div className="text-display-sm font-geist font-bold text-on-surface">{stats.flagged}</div>
            {stats.flagged > 0 && (
              <div className="bg-orange-100 text-orange-800 rounded px-2 py-0.5 text-label-caps mb-1">
                Needs review
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH + FILTER BAR */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="relative w-full md:w-auto">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">search</span>
          <input 
            type="text" 
            placeholder="Search members by name or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-72 border border-[#E5E7EB] rounded px-4 py-2 pl-10 text-body-sm outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] text-on-surface placeholder-secondary transition-all"
          />
        </div>
        
        <div className="bg-gray-100 p-1 rounded-md flex gap-1 text-body-sm font-medium text-secondary">
          {["All", "Active", "Admin", "Flagged"].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded transition-all ${filter === f ? 'bg-white shadow-sm text-on-surface' : 'hover:text-on-surface'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* MEMBERS TABLE */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b border-[#E5E7EB]">
              <th className="px-6 py-4 text-label-caps text-secondary font-medium">MEMBER</th>
              <th className="px-6 py-4 text-label-caps text-secondary font-medium">ROLE</th>
              <th className="px-6 py-4 text-label-caps text-secondary font-medium">PHONE</th>
              <th className="px-6 py-4 text-label-caps text-secondary font-medium">JOINED</th>
              <th className="px-6 py-4 text-label-caps text-secondary font-medium">TOTAL SAVED</th>
              <th className="px-6 py-4 text-label-caps text-secondary font-medium">TRUST SCORE</th>
              <th className="px-6 py-4 text-label-caps text-secondary font-medium">STATUS</th>
              <th className="px-6 py-4 text-label-caps text-secondary font-medium">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length > 0 ? filteredMembers.map((member) => {
              const trustStyles = getTrustScoreStyles(member.trust);
              const isFlagged = member.status === "Flagged";
              
              return (
                <tr key={member.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${member.colorClass}`}>
                        {member.initials}
                      </div>
                      <div className="font-medium text-on-surface text-body-sm whitespace-nowrap">
                        {member.full_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded px-2 py-0.5 text-label-caps ${member.roleClass} whitespace-nowrap capitalize`}>
                      {member.role || 'Member'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-secondary whitespace-nowrap">
                    {member.phone}
                  </td>
                  <td className="px-6 py-4 text-body-sm text-secondary whitespace-nowrap">
                    {member.joined}
                  </td>
                  <td className="px-6 py-4 text-body-sm text-on-surface font-medium whitespace-nowrap">
                    KSh {formatCurrency(member.totalSaved)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-body-sm font-mono font-medium ${trustStyles.text}`}>
                        {member.trust}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${trustStyles.bg}`}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isFlagged ? (
                      <span className="bg-orange-100 text-orange-800 rounded px-2 py-0.5 text-label-caps whitespace-nowrap border border-orange-300">
                        Flagged
                      </span>
                    ) : (
                      <span className="bg-[#22C55E]/10 text-[#005321] rounded px-2 py-0.5 text-label-caps whitespace-nowrap border border-[#4ae176]">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedMember(member)}
                      className={`text-body-sm font-medium hover:underline whitespace-nowrap ${isFlagged ? "text-error" : "text-primary"}`}
                    >
                      {isFlagged ? "Review" : "View"}
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-body-sm text-secondary">
                  No members match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* OVERLAY FOR SIDE DRAWER */}
      {selectedMember && (
        <div 
          className="fixed inset-0 bg-[#0B0F0C]/20 backdrop-blur-sm z-20 transition-opacity"
          onClick={() => setSelectedMember(null)}
        />
      )}

      {/* MEMBER DETAIL SIDE DRAWER */}
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-sm sm:w-96 bg-white border-l border-[#E5E7EB] p-8 z-30 transition-transform duration-300 ease-in-out shadow-2xl overflow-y-auto ${
          selectedMember ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedMember && (
          <>
            {/* Top */}
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setSelectedMember(null)}
                className="text-on-secondary-container hover:text-on-surface transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className={`w-20 h-20 text-2xl font-bold flex items-center justify-center rounded-full ${selectedMember.colorClass}`}>
                {selectedMember.initials}
              </div>
              <h2 className="text-headline-lg font-geist font-bold text-on-surface mt-4">
                {selectedMember.full_name}
              </h2>
              <span className={`mt-2 rounded px-2 py-0.5 text-label-caps ${selectedMember.roleClass} capitalize`}>
                {selectedMember.role || 'Member'}
              </span>
            </div>

            <div className="border-t border-[#E5E7EB] my-6"></div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <div className="text-label-caps text-secondary mb-1">Phone</div>
                <div className="text-body-sm font-medium text-on-surface">{selectedMember.phone}</div>
              </div>
              <div>
                <div className="text-label-caps text-secondary mb-1">Joined</div>
                <div className="text-body-sm font-medium text-on-surface">{selectedMember.joined}</div>
              </div>
              <div>
                <div className="text-label-caps text-secondary mb-1">Total Saved</div>
                <div className="text-body-sm font-medium text-on-surface">KSh {formatCurrency(selectedMember.totalSaved)}</div>
              </div>
              <div>
                <div className="text-label-caps text-secondary mb-1">Trust Score</div>
                <div className="text-body-sm font-medium text-on-surface">{selectedMember.trust}/100</div>
              </div>
            </div>

            {/* Trust arc */}
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-24 h-24 absolute inset-0 transform -rotate-90">
                  {/* Background Circle */}
                  <path
                    className="text-gray-100"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Progress Circle */}
                  <path
                    className={getTrustScoreStyles(selectedMember.trust).text}
                    strokeDasharray={`${selectedMember.trust}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className={`text-display-sm font-bold font-geist ${getTrustScoreStyles(selectedMember.trust).text} relative z-10`}>
                  {selectedMember.trust}
                </div>
              </div>
              <div className="text-label-caps text-secondary mt-2">
                {selectedMember.trust >= 80 ? "Excellent" : selectedMember.trust >= 60 ? "Good" : "Needs Review"}
              </div>
            </div>

            {/* Contribution streak */}
            <div className="bg-surface-container-low border border-[#E5E7EB] rounded-lg p-4 mb-6 flex items-start gap-3 shadow-sm">
              <span className="material-symbols-outlined text-[#22C55E]">local_fire_department</span>
              <div>
                <div className="text-body-sm text-on-surface font-medium mb-0.5">{selectedMember.contribution_streak || 0} consecutive months</div>
                <div className="text-body-sm text-secondary">Maintaining a steady saving habit</div>
              </div>
            </div>

            {/* Loan history */}
            <div className="mb-8">
              <div className="text-label-caps text-secondary mb-2">Loan History</div>
              <div className="flex flex-col gap-2">
                <div className="text-body-sm text-on-surface flex items-center justify-between">
                  <span>{selectedMember.loans?.length || 0} loans taken</span>
                  <span className="material-symbols-outlined text-[#22C55E] text-sm">info</span>
                </div>
                {selectedMember.loans?.some((l: any) => l.status === 'overdue') ? (
                  <div className="inline-block self-start bg-red-100 text-error border border-red-300 rounded px-2 py-0.5 text-label-caps mt-1">
                    Default Risk
                  </div>
                ) : (
                  <div className="inline-block self-start bg-[#22C55E]/10 text-[#005321] border border-[#4ae176] rounded px-2 py-0.5 text-label-caps mt-1">
                    Good standing
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-8">
              <button className="flex items-center justify-center gap-2 bg-white border border-[#E5E7EB] text-on-surface w-full rounded py-3 text-body-sm hover:bg-gray-50 transition-colors font-medium shadow-sm">
                <span className="material-symbols-outlined text-lg">chat</span>
                Send Message
              </button>
              {currentMember?.role === 'admin' && (
                <>
                  <button className="flex items-center justify-center gap-2 bg-white border border-[#E5E7EB] text-on-surface w-full rounded py-3 text-body-sm hover:bg-gray-50 transition-colors font-medium shadow-sm">
                    <span className="material-symbols-outlined text-lg">manage_accounts</span>
                    Edit Role
                  </button>
                  {selectedMember.status !== 'Flagged' && (
                    <button className="flex items-center justify-center gap-2 bg-white border border-red-200 text-error w-full rounded py-3 text-body-sm hover:bg-red-50 transition-colors font-medium mt-2 shadow-sm">
                      <span className="material-symbols-outlined text-lg">flag</span>
                      Flag Member
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

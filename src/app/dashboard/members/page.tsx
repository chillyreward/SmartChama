"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { getTrustStatusLabel } from "@/lib/trust-score-display";

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
  
  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';

  const fetchData = async () => {
    if (!currentMember || !group) return;
    try {
      setLoading(true);
      setError("");

      const { data: membersData, error: membersErr } = await supabase
        .from('members')
        .select('*')
        .eq('group_id', currentMember.group_id);

      if (membersErr) throw membersErr;

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

        const colors = [
          "bg-green-100 text-green-700",
          "bg-blue-100 text-blue-700",
          "bg-purple-100 text-purple-700",
          "bg-teal-100 text-teal-700",
          "bg-indigo-100 text-indigo-700",
          "bg-orange-100 text-orange-700"
        ];
        const colorClass = colors[idx % colors.length];
        
        const roleClass = m.role === 'admin' 
          ? "bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176]" 
          : "bg-gray-105 dark:bg-[#1a2218] text-[var(--text-muted)]";

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
    if (score >= 80) return { text: "text-[var(--brand-green)]", bg: "bg-[#22C55E]" };
    if (score >= 60) return { text: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-400" };
    return { text: "text-red-500", bg: "bg-red-500" };
  };

  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full text-[var(--text-main)]">
        <div className="card-bg border border-[var(--border)] rounded-2xl p-6 h-32 animate-pulse mb-6 shadow-sm"></div>
        <div className="card-bg border border-[var(--border)] rounded-2xl p-6 h-96 animate-pulse shadow-sm"></div>
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

  const chamaName = group?.name || 'Group';

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full relative font-inter text-[var(--text-main)]">
      
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Members</span>
        </p>
        
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
              Members
            </h1>
            <p className="text-[14px] text-[var(--text-muted)] mt-1">
              {chamaName} — {members.length} members
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-initial bg-transparent border border-[var(--border)] text-[var(--text-main)] hover:bg-gray-50 dark:hover:bg-[#1f2a1f] rounded-lg px-4 py-2 text-sm font-semibold transition-all">
              Manage Roles
            </button>
            <button className="flex-1 md:flex-initial bg-[#22C55E] text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 hover:bg-[#006e2f] transition-all font-semibold text-sm shadow-sm">
              <span className="material-symbols-outlined text-sm font-bold">person_add</span>
              Invite Member
            </button>
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
        <div className="card-bg border border-[var(--border)] border-t-2 border-t-[#22C55E] rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">ACTIVE MEMBERS</div>
          <div className="flex items-center justify-between">
            <div className="text-[22px] md:text-3xl font-bold text-[var(--text-main)] font-geist">{stats.active}</div>
            <span className="material-symbols-outlined text-gray-300 dark:text-[#5a6e5a] text-2xl hidden sm:inline">group</span>
          </div>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-blue-400 rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">NEW THIS MONTH</div>
          <div className="flex items-end gap-3">
            <div className="text-[22px] md:text-3xl font-bold text-[var(--brand-green)] font-geist">{stats.newThisMonth}</div>
            {stats.newThisMonth > 0 && (
              <div className="bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176] rounded-full px-3 py-0.5 text-xs font-semibold mb-1 hidden sm:block">
                +{stats.newThisMonth} joined
              </div>
            )}
          </div>
        </div>

        <div className="card-bg border border-[var(--border)] border-t-2 border-t-red-400 rounded-2xl p-4 md:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 last:col-span-2 md:last:col-span-1">
          <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-2">FLAGGED MEMBERS</div>
          <div className="flex items-end gap-3">
            <div className="text-[22px] md:text-3xl font-bold text-[var(--text-main)] font-geist">{stats.flagged}</div>
            {stats.flagged > 0 && (
              <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-850 dark:text-orange-400 rounded px-2.5 py-0.5 text-xs font-semibold mb-1 hidden sm:block">
                Needs review
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH + FILTER BAR */}
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
        
        <div className="bg-[#F5F5F5] dark:bg-[#1f2a1f] p-1 rounded-lg flex gap-1 text-sm font-semibold text-[var(--text-muted)]">
          {["All", "Active", "Admin", "Flagged"].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md transition-all ${filter === f ? 'card-bg shadow-sm text-[var(--text-main)]' : 'hover:text-[#161d16] dark:hover:text-[#E8F0E4]'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* MEMBERS TABLE */}
      <div className="card-bg border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
        
        {/* Mobile Card List */}
        <div className="md:hidden flex flex-col divide-y divide-[#E5E7EB] dark:divide-[#2d3d2d]">
          {filteredMembers.length > 0 ? filteredMembers.map((member) => {
            const trustStyles = getTrustScoreStyles(member.trust);
            const isFlagged = member.status === "Flagged";
            return (
              <div key={member.id} className="py-4 px-4 active:bg-[#f5f5f5] dark:active:bg-[#1f2a1f] transition-colors cursor-pointer" onClick={() => setSelectedMember(member)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      {member.initials}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--text-main)]">{member.full_name}</p>
                      <p className="text-[12px] text-[var(--text-muted)]">{member.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`rounded px-2.5 py-0.5 text-xs font-semibold ${member.roleClass} capitalize`}>
                      {member.role || 'Member'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#E5E7EB]/50 dark:border-[#2d3d2d]/50">
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)] uppercase">Saved</p>
                    <p className="text-[13px] font-bold text-[var(--text-main)] font-mono">KSh {formatCurrency(member.totalSaved)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)] uppercase text-right">Trust</p>
                    {(() => {
                      const isAdmin = currentMember && ['admin', 'chairlady', 'treasurer', 'secretary'].includes(currentMember.role);
                      const isSelf = currentMember && currentMember.id === member.id;
                      if (isAdmin || isSelf) {
                        return (
                          <span className={`text-[13px] font-mono font-bold ${trustStyles.text}`}>
                            {member.trust}/100
                          </span>
                        );
                      } else {
                        const status = getTrustStatusLabel(member.trust);
                        return (
                          <span className="text-[11px] font-semibold" style={{ color: status.color }}>
                            {status.label}
                          </span>
                        );
                      }
                    })()}
                  </div>
                  <div className="flex flex-col items-end">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedMember(member); }}
                      className={`text-[13px] font-semibold hover:underline ${isFlagged ? "text-red-500" : "text-[#22C55E] dark:text-[#4ae176]"}`}
                    >
                      {isFlagged ? "Review" : "View"}
                    </button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="py-8 text-center text-sm text-[var(--text-muted)]">
              No members match your search criteria.
            </div>
          )}
        </div>

        {/* Desktop table hidden on mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0f1410] border-b border-[var(--border)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">MEMBER</th>
                <th className="px-6 py-4">ROLE</th>
                <th className="px-6 py-4">PHONE</th>
                <th className="px-6 py-4">JOINED</th>
                <th className="px-6 py-4">TOTAL SAVED</th>
                <th className="px-6 py-4">TRUST SCORE</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
              {filteredMembers.length > 0 ? filteredMembers.map((member) => {
                const trustStyles = getTrustScoreStyles(member.trust);
                const isFlagged = member.status === "Flagged";
                
                return (
                  <tr key={member.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {member.initials}
                        </div>
                        <div className="font-semibold text-[var(--text-main)] text-sm whitespace-nowrap">
                          {member.full_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded px-2.5 py-0.5 text-xs font-semibold ${member.roleClass} whitespace-nowrap capitalize`}>
                        {member.role || 'Member'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-muted)] whitespace-nowrap">
                      {member.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-muted)] whitespace-nowrap">
                      {member.joined}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-main)] font-bold whitespace-nowrap font-mono">
                      KSh {formatCurrency(member.totalSaved)}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const isAdmin = currentMember && ['admin', 'chairlady', 'treasurer', 'secretary'].includes(currentMember.role);
                        const isSelf = currentMember && currentMember.id === member.id;
                        
                        if (isAdmin || isSelf) {
                          return (
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-mono font-bold ${trustStyles.text}`}>
                                {member.trust}
                              </span>
                              <div className={`w-2 h-2 rounded-full ${trustStyles.bg}`}></div>
                            </div>
                          );
                        } else {
                          const status = getTrustStatusLabel(member.trust);
                          return (
                            <span className="text-xs font-semibold px-2 py-1 rounded card-bg border border-[var(--border)]" style={{ color: status.color }}>
                              {status.label}
                            </span>
                          );
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      {isFlagged ? (
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-850 dark:text-orange-400 rounded px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap border border-orange-200 dark:border-orange-900/40">
                          Flagged
                        </span>
                      ) : (
                        <span className="bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176] rounded px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap border border-[#4ae176] dark:border-[#1a3a1a]">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedMember(member)}
                        className={`text-sm font-semibold hover:underline whitespace-nowrap ${isFlagged ? "text-red-500" : "text-[#22C55E] dark:text-[#4ae176]"}`}
                      >
                        {isFlagged ? "Review" : "View"}
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-[var(--text-muted)]">
                    No members match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OVERLAY FOR SIDE DRAWER */}
      {selectedMember && (
        <div 
          className="fixed inset-0 bg-[#0B0F0C]/40 backdrop-blur-sm z-20 transition-opacity"
          onClick={() => setSelectedMember(null)}
        />
      )}

      {/* MEMBER DETAIL SIDE DRAWER */}
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-sm sm:w-96 card-bg border-l border-[var(--border)] p-8 z-30 transition-transform duration-300 ease-in-out shadow-2xl overflow-y-auto ${
          selectedMember ? "translate-x-0" : "translate-x-full"
        } text-[var(--text-main)]`}
      >
        {selectedMember && (
          <>
            {/* Top */}
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setSelectedMember(null)}
                className="text-[var(--text-muted)] hover:text-[#161d16] dark:hover:text-[#E8F0E4] bg-[#F5F5F5] dark:bg-[#1a2218] p-2 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 text-2xl font-bold flex items-center justify-center rounded-full bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] shadow-sm">
                {selectedMember.initials}
              </div>
              <h2 className="text-2xl font-bold font-geist text-[var(--text-main)] mt-4">
                {selectedMember.full_name}
              </h2>
              <span className={`mt-2 rounded px-2.5 py-0.5 text-xs font-semibold ${selectedMember.roleClass} capitalize`}>
                {selectedMember.role || 'Member'}
              </span>
            </div>

            <div className="border-t border-[var(--border)] my-6"></div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Phone</div>
                <div className="text-sm font-semibold text-[var(--text-main)]">{selectedMember.phone}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Joined</div>
                <div className="text-sm font-semibold text-[var(--text-main)]">{selectedMember.joined}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Saved</div>
                <div className="text-sm font-bold text-[var(--text-main)] font-mono">KSh {formatCurrency(selectedMember.totalSaved)}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Trust Score</div>
                <div className="text-sm font-semibold text-[var(--text-main)]">
                  {currentMember && (['admin', 'chairlady', 'treasurer', 'secretary'].includes(currentMember.role) || currentMember.id === selectedMember.id) 
                    ? `${selectedMember.trust}/100` 
                    : 'Hidden'}
                </div>
              </div>
            </div>

            {/* Trust arc */}
            <div className="flex flex-col items-center justify-center mb-8">
              {(() => {
                const isAdmin = currentMember && ['admin', 'chairlady', 'treasurer', 'secretary'].includes(currentMember.role);
                const isSelf = currentMember && currentMember.id === selectedMember.id;
                
                if (isAdmin || isSelf) {
                  return (
                    <>
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg viewBox="0 0 36 36" className="w-24 h-24 absolute inset-0 transform -rotate-90">
                          {/* Background Circle */}
                          <path
                            className="text-gray-100 dark:text-[#2d3d2d]"
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
                        <div className={`text-2xl font-bold font-geist ${getTrustScoreStyles(selectedMember.trust).text} relative z-10`}>
                          {selectedMember.trust}
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-2">
                        {getTrustStatusLabel(selectedMember.trust).label}
                      </div>
                    </>
                  );
                } else {
                  const status = getTrustStatusLabel(selectedMember.trust);
                  return (
                    <div className="bg-transparent border border-[var(--border)] rounded-xl p-6 flex flex-col items-center justify-center w-full shadow-sm">
                      <span className="material-symbols-outlined text-4xl mb-2" style={{ color: status.color }}>verified_user</span>
                      <span className="text-lg font-bold" style={{ color: status.color }}>{status.label}</span>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Contribution streak */}
            <div className="bg-gray-50 dark:bg-[#1a2218] border border-[var(--border)] rounded-xl p-4 mb-6 flex items-start gap-3 shadow-sm">
              <span className="material-symbols-outlined text-[var(--brand-green)]">local_fire_department</span>
              <div>
                <div className="text-sm font-semibold text-[var(--text-main)] mb-0.5">{selectedMember.contribution_streak || 0} consecutive months</div>
                <div className="text-xs text-[var(--text-muted)]">Maintaining a steady saving habit</div>
              </div>
            </div>

            {/* Loan history */}
            <div className="mb-8">
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Loan History</div>
              <div className="flex flex-col gap-2">
                <div className="text-sm text-[var(--text-main)] flex items-center justify-between">
                  <span>{selectedMember.loans?.length || 0} loans taken</span>
                  <span className="material-symbols-outlined text-[var(--brand-green)] text-sm">info</span>
                </div>
                {selectedMember.loans?.some((l: any) => l.status === 'overdue') ? (
                  <div className="inline-block self-start bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded px-2.5 py-0.5 text-xs font-semibold mt-1">
                    Default Risk
                  </div>
                ) : (
                  <div className="inline-block self-start bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176] rounded px-2.5 py-0.5 text-xs font-semibold mt-1">
                    Good standing
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-8">
              <button className="flex items-center justify-center gap-2 bg-transparent border border-[var(--border)] text-[var(--text-main)] w-full rounded-lg py-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-all shadow-sm">
                <span className="material-symbols-outlined text-lg">chat</span>
                Send Message
              </button>
              {currentMember?.role === 'admin' && (
                <>
                  <button className="flex items-center justify-center gap-2 bg-transparent border border-[var(--border)] text-[var(--text-main)] w-full rounded-lg py-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-all shadow-sm">
                    <span className="material-symbols-outlined text-lg">manage_accounts</span>
                    Edit Role
                  </button>
                  {selectedMember.status !== 'Flagged' && (
                    <button className="flex items-center justify-center gap-2 bg-transparent border border-red-200 dark:border-red-900/40 text-red-500 w-full rounded-lg py-3 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-all mt-2 shadow-sm">
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

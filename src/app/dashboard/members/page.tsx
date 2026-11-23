"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
import { Search } from "lucide-react";
import { Avatar, EmptyState, Meter, Modal, Money, Notice, PageHeader, Panel, Skeleton, Tabs, cn, inputClass } from "@/components/ui";
import { ROLE_LABEL } from "@/components/shell/nav";

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
  
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';

  const fetchData = async () => {
    if (!currentMember || !group) return;
    try {
      setLoading(true);
      setError("");

      // Fetch all active members with profiles
      const { data: membersData, error: membersErr } = await supabase
        .from('chama_memberships')
        .select('id, profile_id, role, trust_score, status, joined_at, flag_reason, profiles(full_name, phone_number, email)')
        .eq('chama_id', group.id)
        .eq('status', 'active');

      if (membersErr) throw membersErr;

      // Fetch confirmed contributions for this chama
      const { data: contributionsData } = await supabase
        .from('contributions_v2')
        .select('membership_id, amount')
        .eq('chama_id', group.id)
        .eq('status', 'confirmed');

      const savingsMap: Record<string, number> = {};
      contributionsData?.forEach(c => {
        savingsMap[c.membership_id] = (savingsMap[c.membership_id] || 0) + Number(c.amount);
      });

      const today = new Date();
      let activeCount = 0;
      let newCount = 0;
      let flaggedCount = 0;

      const colors = [
        "bg-green-100 text-green-700", "bg-blue-100 text-blue-700",
        "bg-purple-100 text-purple-700", "bg-teal-100 text-teal-700",
        "bg-indigo-100 text-indigo-700", "bg-orange-100 text-orange-700"
      ];

      const enhancedMembers = (membersData || []).map((m: any, idx: number) => {
        const profile = m.profiles || {};
        const totalSaved = savingsMap[m.id] || 0;
        const joinedDate = new Date(m.joined_at);
        const isNew = joinedDate.getMonth() === today.getMonth() && joinedDate.getFullYear() === today.getFullYear();
        const trustScore = m.trust_score || 0;
        const isFlagged = trustScore < 60;
        const status = isFlagged ? 'Flagged' : 'Active';

        activeCount++;
        if (isNew) newCount++;
        if (isFlagged) flaggedCount++;

        const roleClass = ['admin', 'chairlady', 'treasurer', 'secretary'].includes(m.role)
          ? "bg-[var(--ak-tint)] dark:bg-[var(--ak-tint)] text-[var(--ak-brand-ink)] dark:text-[var(--ak-brand-ink)]"
          : "bg-gray-100 dark:bg-[var(--ak-surface)] text-[var(--text-muted)]";

        return {
          ...m,
          full_name: profile.full_name || 'Unknown',
          phone: profile.phone_number || '—',
          email: profile.email || '',
          trust: trustScore,
          initials: getInitials(profile.full_name || '?'),
          joined: joinedDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
          totalSaved,
          status,
          colorClass: colors[idx % colors.length],
          roleClass
        };
      });

      setMembers(enhancedMembers);
      setStats({ active: activeCount, newThisMonth: newCount, flagged: flaggedCount });

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


  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-60" />
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-40" />)}</div>
      </div>
    );
  }

  if (error) {
    return <Notice tone="danger" title="Members didn't load">{error} <button onClick={fetchData} className="underline font-semibold ml-1">Try again</button></Notice>;
  }

  const OFFICIAL = ['admin', 'chairlady', 'treasurer', 'secretary'];
  const shown = members
    .filter((m) => !searchQuery || m.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((m) => filter !== 'Officials' || OFFICIAL.includes(m.role))
    .filter((m) => filter !== 'New' || new Date(m.joined_at).getMonth() === new Date().getMonth() && new Date(m.joined_at).getFullYear() === new Date().getFullYear())
    .sort((a, b) => Number(OFFICIAL.includes(b.role)) - Number(OFFICIAL.includes(a.role)) || a.full_name.localeCompare(b.full_name));
  const sel = selectedMember;

  return (
    <div>
      <PageHeader title="Members" subtitle={`The ${stats.active} people saving together in ${group?.name || 'this group'}.`} />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Tabs label="Show" value={filter} onChange={setFilter} items={[{ value: 'All', label: 'Everyone', count: stats.active }, { value: 'Officials', label: 'Officials' }, { value: 'New', label: 'New this month', count: stats.newThisMonth }]} />
        <label className="relative w-full sm:w-[260px]">
          <span className="sr-only">Search members</span>
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden="true" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name" className={cn(inputClass, 'h-11 pl-10')} />
        </label>
      </div>

      {shown.length === 0 ? (
        <Panel><EmptyState title="No one matches">Try a different name or filter.</EmptyState></Panel>
      ) : (
        <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((m) => {
            const me = m.id === currentMember?.id;
            const official = OFFICIAL.includes(m.role);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelectedMember(m)}
                  className={cn('w-full text-left rounded-[24px] p-5 border transition-colors', me ? 'bg-lavender text-lavender-ink border-lavender' : 'bg-surface border-line hover:border-line-strong')}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={m.full_name} size={44} tone={me ? 'forest' : official ? 'mint' : 'sage'} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[16px] font-semibold truncate">{me ? `${m.full_name} (you)` : m.full_name}</div>
                      <div className={cn('text-[13px]', me ? 'text-[#3A3060]' : 'text-ink-3')}>{ROLE_LABEL[m.role] || 'Member'} · since {m.joined}</div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-3 mt-5">
                    <div>
                      <div className={cn('text-[12px]', me ? 'text-[#3A3060]' : 'text-ink-3')}>Saved</div>
                      <Money value={m.totalSaved} className="text-[22px]" />
                    </div>
                    <div className="text-right">
                      <div className={cn('text-[12px]', me ? 'text-[#3A3060]' : 'text-ink-3')}>Trust score</div>
                      <div className="font-money text-[22px]">{m.trust}</div>
                    </div>
                  </div>
                  <Meter value={m.trust} segments={20} height={8} className="mt-2" offClass={me ? 'bg-black/10' : 'bg-raised'} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={!!sel} onClose={() => setSelectedMember(null)} title={sel?.full_name || ''}>
        {sel && (
          <div>
            <div className="flex items-center gap-4">
              <Avatar name={sel.full_name} size={56} tone="sage" />
              <div>
                <div className="text-[15px] text-ink-2">{ROLE_LABEL[sel.role] || 'Member'}</div>
                <div className="text-[14px] text-ink-3">Member since {sel.joined}</div>
              </div>
            </div>
            <dl className="mt-5 divide-y divide-line text-[15px]">
              <div className="flex justify-between py-3"><dt className="text-ink-3">Saved in the group</dt><dd><Money value={sel.totalSaved} className="text-[18px]" /></dd></div>
              <div className="flex justify-between py-3"><dt className="text-ink-3">Trust score</dt><dd className="font-money text-[18px]">{sel.trust} / 100</dd></div>
              {sel.phone && sel.phone !== '—' && (
                <div className="flex justify-between py-3"><dt className="text-ink-3">Phone</dt><dd><a href={`tel:${sel.phone}`} className="text-brand hover:underline">{sel.phone}</a></dd></div>
              )}
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
}

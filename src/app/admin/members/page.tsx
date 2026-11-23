"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
import { Download, Search, UserPlus } from "lucide-react";
import { toast, ask } from '@/components/ui/Feedback';
import { Avatar, Button, Chip, EmptyState, Field, Meter, Modal, Money, Notice, PageHeader, Panel, Tabs, TableWrap, cn, inputClass, tableClass, textareaClass, type ChipKind } from "@/components/ui";
import { ROLE_LABEL } from "@/components/shell/nav";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { InviteModal } from "@/components/InviteModal";
import { exportToPDF, exportToExcel } from "@/lib/export";
import PageSkeleton from "@/components/PageSkeleton";

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
  const [processingId, setProcessingId] = useState<string | null>(null);


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

      setToastMsg("Role saved.");
      setTimeout(() => setToastMsg(""), 3000);
      setShowRoleModal(false);
      fetchData();
    } catch (err) {
      toast('Could not change the role. Try again.', 'danger');
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

      setToastMsg("Member flagged.");
      setTimeout(() => setToastMsg(""), 3000);
      setShowFlagModal(false);
      setFlagReason("");
      fetchData();
    } catch (err) {
      toast('Could not flag this member. Try again.', 'danger');
    }
  };

  const handleApprove = async (m: any) => {
    try {
      setProcessingId(m.id);
      const { error } = await supabase
        .from('chama_memberships')
        .update({ status: 'active' })
        .eq('id', m.id);

      if (error) throw error;

      await supabase.from('notifications').insert({
        chama_id: group?.id,
        profile_id: m.profile_id,
        type: 'member_approved',
        title: `You're in ${group?.name || 'the group'}`,
        message: 'An official approved your request. You can now see the group and pay contributions.'
      });

      setToastMsg("Member approved. They've been notified.");
      setTimeout(() => setToastMsg(""), 3000);
      fetchData();
    } catch (err) {
      toast('Could not approve. Try again.', 'danger');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (m: any) => {
    try {
      setProcessingId(m.id);
      const { error } = await supabase
        .from('chama_memberships')
        .update({ status: 'rejected' })
        .eq('id', m.id);

      if (error) throw error;

      setToastMsg("Member request rejected");
      setTimeout(() => setToastMsg(""), 3000);
      fetchData();
    } catch (err) {
      toast('Could not decline. Try again.', 'danger');
    } finally {
      setProcessingId(null);
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
          title: 'A reminder from your officials',
          message: `Please check ${group?.name || 'your group'} in Akibora. Your contribution may be due.`,
          read: false
        });

      if (error) throw error;

      setToastMsg(`Reminder sent to ${m.profile?.full_name}.`);
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err) {
      console.error(err);
      toast('Could not send the reminder. Try again.', 'danger');
    }
  };

  const handleRemove = async (m: any) => {
    if (await ask({ title: `Remove ${m.profile?.full_name || 'this member'}?`, body: 'Their payment history stays in the record.', confirmLabel: 'Remove', danger: true })) {
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
        toast('Could not remove this member. Try again.', 'danger');
      }
    }
  };

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      const headers = ['Full Name', 'Phone', 'Email', 'Role', 'Status', 'Total Saved (KSh)'];
      const rows = filteredMembers.map(m => [
        m.profile?.full_name || 'Member',
        m.profile?.phone_number || 'N/A',
        m.profile?.email || 'N/A',
        m.role,
        m.status,
        Number(m.totalSaved || 0).toLocaleString('en-KE')
      ]);
      exportToPDF('Members Roster Report', group?.name || 'Akibora', headers, rows, 'members_roster');
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = () => {
    const headers = ['Full Name', 'Phone', 'Email', 'Role', 'Status', 'Total Saved (KSh)'];
    const rows = filteredMembers.map(m => [
      m.profile?.full_name || 'Member',
      m.profile?.phone_number || 'N/A',
      m.profile?.email || 'N/A',
      m.role,
      m.status,
      Number(m.totalSaved || 0)
    ]);
    exportToExcel('Members Roster Report', group?.name || 'Akibora', headers, rows, 'members_roster');
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const OFFICIAL = ['admin', 'chairlady', 'treasurer', 'secretary'];
  const activeCount = members.filter((m) => m.status === 'active').length;
  const pendingList = members.filter((m) => m.status === 'pending');
  const flaggedCount = members.filter((m) => m.status === 'flagged').length;
  const STATUS: Record<string, { kind: ChipKind; label: string }> = {
    active: { kind: 'paid', label: 'Active' },
    pending: { kind: 'pending', label: 'Wants to join' },
    flagged: { kind: 'late', label: 'Flagged' },
    inactive: { kind: 'neutral', label: 'Removed' },
    rejected: { kind: 'neutral', label: 'Declined' },
    removed: { kind: 'neutral', label: 'Removed' },
  };
  const rows = filteredMembers.filter((m) => m.status !== 'pending' || filter === 'Pending');

  return (
    <div>
      <PageHeader
        title="Members"
        subtitle={`${activeCount} active in ${group?.name || 'the group'}${flaggedCount ? `, ${flaggedCount} flagged` : ''}.`}
        actions={
          <>
            <Button variant="outline" onClick={handleExportExcel}><Download size={18} aria-hidden="true" />Excel</Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={isExportingPDF}><Download size={18} aria-hidden="true" />PDF</Button>
            <Button onClick={() => setShowInviteModal(true)}><UserPlus size={18} aria-hidden="true" />Invite members</Button>
          </>
        }
      />

      {toastMsg && <Notice tone="ok" className="mb-4">{toastMsg}</Notice>}

      {pendingList.length > 0 && filter !== 'Pending' && (
        <Panel tone="sage" className="mb-4">
          <h2 className="font-display text-[24px]">{pendingList.length} {pendingList.length === 1 ? 'person wants' : 'people want'} to join</h2>
          <ul className="mt-3 grid md:grid-cols-2 gap-2">
            {pendingList.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-[16px] bg-white/80 p-3 text-sage-ink">
                <Avatar name={m.profile?.full_name} size={36} tone="mint" />
                <span className="flex-1 min-w-[120px]">
                  <span className="block text-[15px] font-semibold">{m.profile?.full_name || 'New member'}</span>
                  <span className="block text-[13px] text-[#44604F]">{m.profile?.phone_number || 'Phone verified'}</span>
                </span>
                <Button size="sm" variant="forest" disabled={processingId === m.id} onClick={() => handleApprove(m)}>Approve</Button>
                <Button size="sm" variant="outline" className="!text-sage-ink !border-sage-ink" disabled={processingId === m.id} onClick={() => handleReject(m)}>Decline</Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            label="Show"
            value={filter}
            onChange={setFilter}
            items={[
              { value: 'All', label: 'Everyone' },
              { value: 'Admin', label: 'Officials' },
              { value: 'Pending', label: 'Waiting', count: pendingList.length },
              { value: 'Flagged', label: 'Flagged', count: flaggedCount },
            ]}
          />
          <label className="relative w-full sm:w-[280px]">
            <span className="sr-only">Search members</span>
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden="true" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search name or phone" className={cn(inputClass, 'h-11 pl-10')} />
          </label>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No one here">Try another filter, or invite members with the group code.</EmptyState>
        ) : (
          <TableWrap className="mt-4">
            <table className={cn(tableClass, 'min-w-[760px]')}>
              <thead><tr><th>Member</th><th>Role</th><th className="!text-right">Saved</th><th>Trust</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {rows.map((m) => {
                  const st = STATUS[m.status] || { kind: 'neutral' as ChipKind, label: m.status };
                  return (
                    <tr key={m.id}>
                      <td>
                        <Link href={`/admin/members/${m.id}`} className="flex items-center gap-3 hover:underline underline-offset-4">
                          <Avatar name={m.profile?.full_name} size={34} tone={OFFICIAL.includes(m.role) ? 'mint' : 'sage'} />
                          <span>
                            <span className="block font-medium">{m.profile?.full_name || 'Member'}</span>
                            <span className="block text-[12px] text-ink-3">{m.profile?.phone_number || '—'}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="text-ink-2">{ROLE_LABEL[m.role] || m.role}</td>
                      <td className="text-right"><Money value={m.totalSaved} className="text-[17px]" /></td>
                      <td className="w-[140px]">
                        <div className="flex items-center gap-2"><span className="font-money text-[17px] w-7">{m.trust_score ?? 0}</span><Meter value={m.trust_score ?? 0} segments={12} height={8} className="flex-1" /></div>
                      </td>
                      <td>
                        <Chip kind={st.kind}>{st.label}</Chip>
                        {m.status === 'flagged' && m.flag_reason && <span className="block text-[12px] text-ink-3 mt-1 max-w-[200px] truncate" title={m.flag_reason}>{m.flag_reason}</span>}
                      </td>
                      <td className="text-right">
                        <select
                          aria-label={`Actions for ${m.profile?.full_name || 'member'}`}
                          value=""
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === 'role') { setSelectedMember(m); setNewRole(m.role); setShowRoleModal(true); }
                            if (v === 'flag') { setSelectedMember(m); setShowFlagModal(true); }
                            if (v === 'remind') handleSendReminder(m);
                            if (v === 'remove') handleRemove(m);
                            if (v === 'approve') handleApprove(m);
                            if (v === 'reject') handleReject(m);
                          }}
                          className="h-9 px-3 rounded-full bg-surface-2 border border-line text-[13px] cursor-pointer"
                        >
                          <option value="">Actions</option>
                          {m.status === 'pending' ? (
                            <>
                              <option value="approve">Approve</option>
                              <option value="reject">Decline</option>
                            </>
                          ) : (
                            <>
                              <option value="remind">Send a reminder</option>
                              <option value="role">Change role</option>
                              <option value="flag">Flag</option>
                              <option value="remove">Remove from group</option>
                            </>
                          )}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}

        {(page > 0 || hasMore) && (
          <div className="flex items-center justify-between mt-4">
            <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
            <span className="text-[13px] text-ink-3">Page {page + 1}</span>
            <Button variant="ghost" size="sm" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </Panel>

      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} chamaId={group?.id || ''} chamaName={group?.name || ''} adminId={session?.user?.id || ''} />
      )}

      <Modal
        open={showRoleModal && !!selectedMember}
        onClose={() => setShowRoleModal(false)}
        title={`Role for ${selectedMember?.profile?.full_name || 'this member'}`}
        footer={<><Button variant="ghost" onClick={() => setShowRoleModal(false)}>Cancel</Button><Button onClick={handleUpdateRole}>Save role</Button></>}
      >
        <Field label="Role" hint="Officials can approve members, record cash and see this view.">
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className={inputClass}>
            <option value="member">Member</option>
            <option value="secretary">Secretary</option>
            <option value="treasurer">Treasurer</option>
            <option value="chairlady">Chair</option>
            <option value="admin">Group admin</option>
          </select>
        </Field>
      </Modal>

      <Modal
        open={showFlagModal && !!selectedMember}
        onClose={() => setShowFlagModal(false)}
        title={`Flag ${selectedMember?.profile?.full_name || 'this member'}`}
        footer={<><Button variant="ghost" onClick={() => setShowFlagModal(false)}>Cancel</Button><Button variant="danger" onClick={handleFlag} disabled={!flagReason.trim()}>Flag member</Button></>}
      >
        <Field label="Why?" hint="Other officials will see this reason.">
          <textarea rows={3} value={flagReason} onChange={(e) => setFlagReason(e.target.value)} className={textareaClass} />
        </Field>
      </Modal>
    </div>
  );
}

"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
import { Bell, Download, Plus } from "lucide-react";
import { toast } from '@/components/ui/Feedback';
import { Avatar, Button, Chip, EmptyState, Field, Modal, Money, Notice, PageHeader, Panel, PanelTitle, Stat, TableWrap, cn, formatKsh, inputClass, tableClass, type ChipKind } from "@/components/ui";

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
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('record') === '1') setShowRecordModal(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);
  const [recordMemberId, setRecordMemberId] = useState("");
  const [recordAmount, setRecordAmount] = useState("");
  const [recordMethod, setRecordMethod] = useState<'cash' | 'bank'>('cash');
  const [recordSaving, setRecordSaving] = useState(false);
  const [recordReference, setRecordReference] = useState("");
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
  const [recordDate, setRecordDate] = useState(today);

  const memberName = (c: any) => c.membership?.profile?.full_name || 'Member';


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

      setToastMsg("Payment recorded. The member can see it now.");
      setTimeout(() => setToastMsg(""), 3000);
      setShowRecordModal(false);
      setRecordMemberId(""); setRecordAmount(""); setRecordReference(""); setRecordDate(today);
      fetchData();
    } catch (err: any) {
      toast(`Could not record the payment. ${err.message}`, 'danger');
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
        setToastMsg("Nobody is late or waiting right now.");
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
      setToastMsg(`Reminder sent to ${targets.length} member${targets.length === 1 ? '' : 's'}.`);
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err: any) {
      toast(`Could not send reminders. ${err.message}`, 'danger');
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const ST: Record<string, { kind: ChipKind; label: string }> = {
    confirmed: { kind: 'paid', label: 'Confirmed' },
    pending: { kind: 'pending', label: 'Waiting for M-Pesa' },
    failed: { kind: 'failed', label: 'Failed' },
    late: { kind: 'late', label: 'Late' },
    partial: { kind: 'info', label: 'Part paid' },
  };
  const now = new Date();
  const thisMonth = contributions.filter((c) => { const d = new Date(c.created_at); return c.status === 'confirmed' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const collected = thisMonth.reduce((s, c) => s + Number(c.amount), 0);
  const waiting = contributions.filter((c) => c.status === 'pending').length;
  const cash = thisMonth.filter((c) => c.payment_method === 'cash' || c.payment_method === 'bank').reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div>
      <PageHeader
        title="Contributions"
        subtitle="M-Pesa payments record themselves when Safaricom confirms them. Log cash and bank payments here."
        actions={
          <>
            <Button variant="outline" onClick={handleExportExcel}><Download size={18} aria-hidden="true" />Excel</Button>
            <Button variant="outline" onClick={handleExportPDF}><Download size={18} aria-hidden="true" />PDF</Button>
            <Button variant="outline" onClick={handleBulkRemind}><Bell size={18} aria-hidden="true" />Remind late payers</Button>
            <Button onClick={() => setShowRecordModal(true)}><Plus size={18} aria-hidden="true" />Record cash payment</Button>
          </>
        }
      />

      {toastMsg && <Notice tone="ok" className="mb-4">{toastMsg}</Notice>}

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Stat tone="forest" label="Confirmed this month" value={formatKsh(collected)} hint={`${new Set(thisMonth.map((c) => c.membership_id)).size} members`} />
        <Stat label="Of that, cash or bank" value={formatKsh(cash)} hint="logged by officials" />
        <Stat label="Waiting for M-Pesa" value={String(waiting)} money={false} hint="prompts sent, not yet confirmed" />
      </div>

      <Panel>
        <PanelTitle>All payments</PanelTitle>
        {contributions.length === 0 ? (
          <EmptyState title="No payments yet" action={<Button onClick={() => setShowRecordModal(true)}>Record the first one</Button>}>
            M-Pesa payments appear here automatically. Cash payments appear once you log them.
          </EmptyState>
        ) : (
          <TableWrap className="mt-3">
            <table className={cn(tableClass, 'min-w-[720px]')}>
              <thead><tr><th>Date</th><th>Member</th><th className="!text-right">Amount</th><th>Paid by</th><th>Receipt or reference</th><th>Status</th></tr></thead>
              <tbody>
                {contributions.map((c) => {
                  const st = ST[c.status] || { kind: 'neutral' as ChipKind, label: c.status };
                  return (
                    <tr key={c.id}>
                      <td className="text-ink-2 whitespace-nowrap">{new Date(c.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td><span className="flex items-center gap-2.5"><Avatar name={memberName(c)} size={28} tone="sage" />{memberName(c)}</span></td>
                      <td className="text-right"><Money value={Number(c.amount)} className="text-[17px]" /></td>
                      <td className="text-ink-2">{c.payment_method === 'cash' ? 'Cash' : c.payment_method === 'bank' ? 'Bank' : 'M-Pesa'}</td>
                      <td className="font-mono text-[12px] text-ink-3">{c.mpesa_receipt || c.reference || '—'}</td>
                      <td><Chip kind={st.kind}>{st.label}</Chip></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
        {(page > 0 || hasMore) && (
          <div className="flex items-center justify-between mt-4">
            <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Newer</Button>
            <span className="text-[13px] text-ink-3">Page {page + 1}</span>
            <Button variant="ghost" size="sm" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>Older</Button>
          </div>
        )}
      </Panel>

      <Modal
        open={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title="Record a cash or bank payment"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowRecordModal(false)}>Cancel</Button>
            <Button onClick={handleRecord} disabled={recordSaving || !recordMemberId || !(Number(recordAmount) > 0)}>{recordSaving ? 'Saving…' : 'Record payment'}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <Notice tone="info">Your name is saved on this entry. Cash counts half towards the member&apos;s trust score; M-Pesa counts fully.</Notice>
          <Field label="Who paid?">
            <select value={recordMemberId} onChange={(e) => setRecordMemberId(e.target.value)} className={inputClass}>
              <option value="">Choose a member</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Amount">
              <input type="number" inputMode="numeric" min={1} value={recordAmount} onChange={(e) => setRecordAmount(e.target.value)} placeholder={String(group?.contribution_amount || '')} className={inputClass} />
            </Field>
            <Field label="Paid on">
              <input type="date" value={recordDate} max={today} onChange={(e) => setRecordDate(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="How">
            <div role="radiogroup" className="flex gap-2">
              {(['cash', 'bank'] as const).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={recordMethod === m} onClick={() => setRecordMethod(m)} className={cn('flex-1 h-12 rounded-[14px] border text-[15px] font-medium', recordMethod === m ? 'bg-primary text-on-primary border-transparent' : 'border-line bg-surface-2')}>
                  {m === 'cash' ? 'Cash' : 'Bank deposit'}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Reference" hint="Optional: a receipt number or bank slip reference.">
            <input value={recordReference} onChange={(e) => setRecordReference(e.target.value)} className={inputClass} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
import { UserPlus } from "lucide-react";
import { toast, ask } from '@/components/ui/Feedback';
import { Button, EmptyState, Field, Notice, PageHeader, Panel, PanelTitle, Skeleton, TableWrap, Tabs, cn, inputClass, tableClass } from "@/components/ui";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { InviteModal } from "@/components/InviteModal";
import { MembersSettingsTab } from "@/components/settings/MembersSettingsTab";
import ContributionScheduleSettings from "@/components/settings/ContributionScheduleSettings";

export default function AdminSettingsPage() {
  const { session, member: adminMember, group, refreshMemberData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [activeTab, setActiveTab] = useState<'Chama Rules' | 'members' | 'Payment Configurations' | 'Member Invites'>('Chama Rules');

  const tabs = [
    { id: 'Chama Rules', name: 'Chama Rules', icon: 'tune' },
    { id: 'members', name: 'Members', icon: 'group' },
    { id: 'Payment Configurations', name: 'Payment Configurations', icon: 'payments' },
    { id: 'Member Invites', name: 'Member Invites', icon: 'person_add' }
  ] as const;

  // --- Chama Rules States ---
  const [chamaName, setChamaName] = useState("");
  const [county, setCounty] = useState("Nairobi");
  const [contributionAmount, setContributionAmount] = useState(500);
  const [gracePeriodDays, setGracePeriodDays] = useState(3);
  const [latePenaltyAmount, setLatePenaltyAmount] = useState(100);

  // --- Payment Configuration States ---
  const [paymentType, setPaymentType] = useState<'till' | 'paybill' | 'phone'>('till');
  const [tillNumber, setTillNumber] = useState("");
  const [paybillNumber, setPaybillNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  // --- Member Invites States ---
  const [invites, setInvites] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const countiesList = [
    "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado",
    "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia",
    "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi",
    "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita Taveta", "Tana River",
    "Tharaka Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
  ];

  const loadData = async () => {
    if (!group) return;
    try {
      setLoading(true);

      // 1. Load chama properties
      setChamaName(group.name || "");
      setCounty(group.county || "Nairobi");
      setContributionAmount(Number(group.contribution_amount || 0));
      setGracePeriodDays(Number(group.grace_period_days || 3));
      setLatePenaltyAmount(Number(group.late_penalty_amount || 0));

      // 2. Load payment config
      const { data: payConfig } = await supabase
        .from('chama_payment_config')
        .select('*')
        .eq('chama_id', group.id)
        .maybeSingle();

      if (payConfig) {
        setPaymentType(payConfig.payment_type || 'till');
        setTillNumber(payConfig.till_number || "");
        setPaybillNumber(payConfig.paybill_number || "");
        setAccountNumber(payConfig.account_number || "");
        setPhoneNumber(payConfig.phone_number || "");
        setAccountName(payConfig.account_name || "");
      }

      // 3. Load invites
      await fetchInvites();

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    if (!group?.id) return;
    const { data } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('chama_id', group.id)
      .order('created_at', { ascending: false });
    setInvites(data || []);
  };

  useEffect(() => {
    if (group) {
      loadData();
    }
  }, [group]);

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group?.id) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('chamas_v2')
        .update({
          name: chamaName,
          county,
          contribution_amount: Number(contributionAmount),
          grace_period_days: Number(gracePeriodDays),
          late_penalty_amount: Number(latePenaltyAmount),
          updated_at: new Date().toISOString()
        })
        .eq('id', group.id);

      if (error) throw error;

      setToastMsg("Rules saved.");
      setTimeout(() => setToastMsg(""), 3000);
      await refreshMemberData();
    } catch (err) {
      console.error(err);
      toast('Could not save the rules. Try again.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group?.id) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('chama_payment_config')
        .upsert({
          chama_id: group.id,
          payment_type: paymentType,
          till_number: paymentType === 'till' ? tillNumber : null,
          paybill_number: paymentType === 'paybill' ? paybillNumber : null,
          account_number: paymentType === 'paybill' ? accountNumber : null,
          phone_number: paymentType === 'phone' ? phoneNumber : null,
          account_name: accountName
        }, { onConflict: 'chama_id' });

      if (error) throw error;

      setToastMsg("Payment details saved. Members will see them before paying.");
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err) {
      console.error(err);
      toast('Could not save where payments go. Try again.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeInvite = async (token: string) => {
    if (!await ask({ title: 'Cancel this invite?', body: 'The link will stop working.', confirmLabel: 'Cancel invite', cancelLabel: 'Keep it', danger: true })) return;
    try {
      const { error } = await supabase
        .from('invite_tokens')
        .delete()
        .eq('token', token);

      if (error) throw error;

      setToastMsg("Invite cancelled.");
      setTimeout(() => setToastMsg(""), 3000);
      await fetchInvites();
    } catch (err) {
      console.error(err);
      toast('Could not cancel the invite. Try again.', 'danger');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-60" />
        <Skeleton className="h-11 w-[520px] max-w-full" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const PAY_TYPES = [
    { v: 'till' as const, label: 'Till number', hint: 'Buy Goods' },
    { v: 'paybill' as const, label: 'Paybill', hint: 'with an account number' },
    { v: 'phone' as const, label: 'Phone number', hint: 'Send Money' },
  ];

  return (
    <div>
      <PageHeader title="Group settings" subtitle={`The rules ${group?.name || 'your group'} runs by, where payments go, and who can join.`} />

      <Tabs
        label="Settings sections"
        value={activeTab}
        onChange={setActiveTab}
        className="mb-5"
        items={[
          { value: 'Chama Rules', label: 'Rules' },
          { value: 'Payment Configurations', label: 'Where payments go' },
          { value: 'members', label: 'Members' },
          { value: 'Member Invites', label: 'Invites' },
        ]}
      />

      {toastMsg && <Notice tone="ok" className="mb-4">{toastMsg}</Notice>}

      {activeTab === 'Chama Rules' && (
        <div className="flex flex-col gap-4 max-w-[860px]">
          <Panel>
            <PanelTitle>The basics</PanelTitle>
            <form onSubmit={handleSaveRules} className="grid sm:grid-cols-2 gap-5 mt-4">
              <Field label="Group name" className="sm:col-span-2">
                <input value={chamaName} onChange={(e) => setChamaName(e.target.value)} required className={inputClass} />
              </Field>
              <Field label="County">
                <select value={county} onChange={(e) => setCounty(e.target.value)} className={inputClass}>
                  {countiesList.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Each contribution" hint="What every member pays each time it's due.">
                <input type="number" inputMode="numeric" min={0} value={contributionAmount} onChange={(e) => setContributionAmount(Number(e.target.value))} className={inputClass} />
              </Field>
              <Field label="Grace period" hint="Days after the due date before a payment counts as late.">
                <input type="number" inputMode="numeric" min={0} max={30} value={gracePeriodDays} onChange={(e) => setGracePeriodDays(Number(e.target.value))} className={inputClass} />
              </Field>
              <Field label="Late fine" hint="Added once the grace period has passed. Use 0 for none.">
                <input type="number" inputMode="numeric" min={0} value={latePenaltyAmount} onChange={(e) => setLatePenaltyAmount(Number(e.target.value))} className={inputClass} />
              </Field>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save rules'}</Button>
              </div>
            </form>
          </Panel>
          {group?.id && <ContributionScheduleSettings chamaId={group.id} onSaved={refreshMemberData} />}
        </div>
      )}

      {activeTab === 'Payment Configurations' && (
        <Panel className="max-w-[760px]">
          <PanelTitle>Where members&apos; payments go</PanelTitle>
          <p className="text-[14px] text-ink-2 mt-1">Members see this before they pay. The money goes straight to this account; Akibora only records it.</p>
          <form onSubmit={handleSavePaymentConfig} className="flex flex-col gap-5 mt-5">
            <div role="radiogroup" aria-label="Account type" className="grid sm:grid-cols-3 gap-2">
              {PAY_TYPES.map((t) => (
                <button key={t.v} type="button" role="radio" aria-checked={paymentType === t.v} onClick={() => setPaymentType(t.v)} className={cn('rounded-[16px] border p-4 text-left', paymentType === t.v ? 'bg-primary text-on-primary border-transparent' : 'bg-surface-2 border-line hover:border-line-strong')}>
                  <div className="text-[15px] font-semibold">{t.label}</div>
                  <div className="text-[13px] opacity-75">{t.hint}</div>
                </button>
              ))}
            </div>
            {paymentType === 'till' && (
              <Field label="Till number"><input inputMode="numeric" value={tillNumber} onChange={(e) => setTillNumber(e.target.value)} required className={inputClass} /></Field>
            )}
            {paymentType === 'paybill' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Paybill number"><input inputMode="numeric" value={paybillNumber} onChange={(e) => setPaybillNumber(e.target.value)} required className={inputClass} /></Field>
                <Field label="Account number"><input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required className={inputClass} /></Field>
              </div>
            )}
            {paymentType === 'phone' && (
              <Field label="M-Pesa phone number"><input type="tel" inputMode="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0712 345 678" required className={inputClass} /></Field>
            )}
            <Field label="Name on the account" hint="So members can check it before paying.">
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} className={inputClass} />
            </Field>
            <Button type="submit" disabled={saving} className="self-end">{saving ? 'Saving…' : 'Save payment details'}</Button>
          </form>
        </Panel>
      )}

      {activeTab === 'members' && (
        <MembersSettingsTab chamaId={group?.id || ''} adminId={session?.user?.id || ''} chamaName={group?.name || ''} />
      )}

      {activeTab === 'Member Invites' && (
        <Panel className="max-w-[860px]">
          <PanelTitle action={<Button size="sm" onClick={() => setShowInviteModal(true)}><UserPlus size={16} aria-hidden="true" />Invite someone</Button>}>Invites</PanelTitle>
          <div className="mt-4 rounded-[18px] bg-sage text-sage-ink p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[13px] text-[#2B4637]">Group code anyone can join with</div>
              <div className="font-mono text-[22px] mt-0.5">{(group as any)?.group_code || '—'}</div>
            </div>
            <span className="text-[13px] text-[#2B4637] max-w-[34ch]">People who join with the code wait for an official to approve them.</span>
          </div>
          {invites.length === 0 ? (
            <EmptyState title="No personal invites waiting">Personal invites send a link by SMS or WhatsApp and skip the approval step.</EmptyState>
          ) : (
            <TableWrap className="mt-4">
              <table className={cn(tableClass, 'min-w-[520px]')}>
                <thead><tr><th>Invite code</th><th>Uses left</th><th>Expires</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {invites.map((invite) => (
                    <tr key={invite.token}>
                      <td className="font-mono text-[13px]">{invite.token}</td>
                      <td className="text-ink-2">{invite.max_uses ?? '—'}</td>
                      <td className="text-ink-2">{invite.expires_at ? new Date(invite.expires_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}</td>
                      <td className="text-right"><Button size="sm" variant="ghost" onClick={() => handleRevokeInvite(invite.token)}>Cancel invite</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Panel>
      )}

      {showInviteModal && (
        <InviteModal onClose={() => { setShowInviteModal(false); fetchInvites(); }} chamaId={group?.id || ''} chamaName={group?.name || ''} adminId={session?.user?.id || ''} />
      )}
    </div>
  );
}

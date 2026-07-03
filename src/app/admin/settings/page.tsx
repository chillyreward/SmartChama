"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { InviteModal } from "@/components/InviteModal";
import { MembersSettingsTab } from "@/components/settings/MembersSettingsTab";

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
  const [contributionFrequency, setContributionFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [contributionDueDay, setContributionDueDay] = useState(1);
  const [gracePeriodDays, setGracePeriodDays] = useState(3);
  const [latePenaltyAmount, setLatePenaltyAmount] = useState(100);
  const [maxLoanMultiplier, setMaxLoanMultiplier] = useState(2);
  const [loanInterestRate, setLoanInterestRate] = useState(10);
  const [maxRepaymentMonths, setMaxRepaymentMonths] = useState(3);
  const [minTrustScoreForLoan, setMinTrustScoreForLoan] = useState(60);

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
      setContributionFrequency(group.contribution_frequency || 'monthly');
      setContributionDueDay(Number(group.contribution_due_day || 1));
      setGracePeriodDays(Number(group.grace_period_days || 3));
      setLatePenaltyAmount(Number(group.late_penalty_amount || 0));
      setMaxLoanMultiplier(Number(group.max_loan_multiplier || 2));
      setLoanInterestRate(Number(group.loan_interest_rate || 10));
      setMaxRepaymentMonths(Number(group.max_repayment_months || 3));
      setMinTrustScoreForLoan(Number(group.min_trust_score_for_loan || 60));

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
          contribution_frequency: contributionFrequency,
          contribution_due_day: Number(contributionDueDay),
          grace_period_days: Number(gracePeriodDays),
          late_penalty_amount: Number(latePenaltyAmount),
          max_loan_multiplier: Number(maxLoanMultiplier),
          loan_interest_rate: Number(loanInterestRate),
          max_repayment_months: Number(maxRepaymentMonths),
          min_trust_score_for_loan: Number(minTrustScoreForLoan),
          updated_at: new Date().toISOString()
        })
        .eq('id', group.id);

      if (error) throw error;

      setToastMsg("Chama rules updated successfully!");
      setTimeout(() => setToastMsg(""), 3000);
      await refreshMemberData();
    } catch (err) {
      console.error(err);
      alert("Error saving chama rules");
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
          account_name: accountName,
          updated_at: new Date().toISOString()
        }, { onConflict: 'chama_id' });

      if (error) throw error;

      setToastMsg("Payment configuration saved successfully!");
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Error saving payment configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeInvite = async (token: string) => {
    if (!confirm("Are you sure you want to revoke this invitation code?")) return;
    try {
      const { error } = await supabase
        .from('invite_tokens')
        .delete()
        .eq('token', token);

      if (error) throw error;

      setToastMsg("Invite revoked successfully!");
      setTimeout(() => setToastMsg(""), 3000);
      await fetchInvites();
    } catch (err) {
      console.error(err);
      alert("Error revoking invite");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-96 bg-white dark:bg-[#111111] border border-[var(--border)] rounded-2xl animate-pulse shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full font-inter min-h-full text-[var(--text-main)]">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#22C55E] text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Admin Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Settings</span>
        </p>
        <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
          Chama Settings
        </h1>
        <p className="text-[14px] text-[var(--text-muted)] mt-1">Configure chama financial parameters, payment paths, and invitations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Tabs */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-colors text-left ${
                activeTab === t.id
                  ? 'bg-transparent text-[var(--brand-green)]'
                  : 'text-[#3d4a3d] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1f2a1f]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
              {t.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 card-bg border border-[var(--border)] p-6 rounded-2xl shadow-sm">
          {/* CHAMA RULES TAB */}
          {activeTab === 'Chama Rules' && (
            <form onSubmit={handleSaveRules} className="space-y-6">
              <h2 className="text-xl font-bold text-[var(--text-main)] font-geist mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">Chama Group Rules</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">Group Name</label>
                  <input
                    type="text"
                    required
                    value={chamaName}
                    onChange={e => setChamaName(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">County</label>
                  <select
                    value={county}
                    onChange={e => setCounty(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px]"
                  >
                    {countiesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">Standard Contribution Amount (KSh)</label>
                  <input
                    type="number"
                    required
                    value={contributionAmount}
                    onChange={e => setContributionAmount(Number(e.target.value))}
                    className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">Contribution Frequency</label>
                  <div className="flex gap-4 pt-1.5">
                    <label className="flex items-center gap-2 text-[14px] text-[var(--text-main)] cursor-pointer">
                      <input
                        type="radio"
                        checked={contributionFrequency === 'weekly'}
                        onChange={() => setContributionFrequency('weekly')}
                        className="accent-[#22C55E]"
                      />
                      Weekly
                    </label>
                    <label className="flex items-center gap-2 text-[14px] text-[var(--text-main)] cursor-pointer">
                      <input
                        type="radio"
                        checked={contributionFrequency === 'monthly'}
                        onChange={() => setContributionFrequency('monthly')}
                        className="accent-[#22C55E]"
                      />
                      Monthly
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">Due Day (1-28)</label>
                  <select
                    value={contributionDueDay}
                    onChange={e => setContributionDueDay(Number(e.target.value))}
                    className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px]"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>Day {d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">Grace Period (Days)</label>
                  <input
                    type="number"
                    value={gracePeriodDays}
                    onChange={e => setGracePeriodDays(Number(e.target.value))}
                    className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">Late Penalty Amount (KSh)</label>
                  <input
                    type="number"
                    value={latePenaltyAmount}
                    onChange={e => setLatePenaltyAmount(Number(e.target.value))}
                    className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">Max Loan Multiplier</label>
                  <select
                    value={maxLoanMultiplier}
                    onChange={e => setMaxLoanMultiplier(Number(e.target.value))}
                    className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px]"
                  >
                    <option value="1">1x Member Savings</option>
                    <option value="2">2x Member Savings</option>
                    <option value="3">3x Member Savings</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">Loan Interest Rate (%)</label>
                  <input
                    type="number"
                    value={loanInterestRate}
                    onChange={e => setLoanInterestRate(Number(e.target.value))}
                    className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">Max Repayment (Months)</label>
                  <select
                    value={maxRepaymentMonths}
                    onChange={e => setMaxRepaymentMonths(Number(e.target.value))}
                    className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px]"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-3">
                  Minimum CREDIT SCORE for Loan Approval ({minTrustScoreForLoan})
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minTrustScoreForLoan}
                  onChange={e => setMinTrustScoreForLoan(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#22C55E]"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#22C55E] text-white px-6 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#006e2f] transition-colors shadow-sm cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Chama Rules'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'members' && (
            <MembersSettingsTab
              chamaId={group?.id || ''}
              adminId={session?.user?.id || ''}
              chamaName={group?.name || ''}
            />
          )}

          {/* PAYMENT CONFIGURATIONS TAB */}
          {activeTab === 'Payment Configurations' && (
            <form onSubmit={handleSavePaymentConfig} className="space-y-6">
              <h2 className="text-xl font-bold text-[var(--text-main)] font-geist mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">Payment Configurations</h2>
              <p className="text-xs text-[var(--text-muted)] mb-4">Set up the M-Pesa account details where members' savings contributions will be sent. These credentials will be shown to members in the deposit warning card.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">Payment Method Type</label>
                  <select
                    value={paymentType}
                    onChange={e => setPaymentType(e.target.value as any)}
                    className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px]"
                  >
                    <option value="till">Lipa Na M-Pesa Till Number</option>
                    <option value="paybill">M-Pesa Paybill</option>
                    <option value="phone">Custodian Mobile Number</option>
                  </select>
                </div>

                {paymentType === 'till' && (
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">Till Number</label>
                    <input
                      type="text"
                      required
                      value={tillNumber}
                      onChange={e => setTillNumber(e.target.value)}
                      placeholder="e.g. 5432109"
                      className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px]"
                    />
                  </div>
                )}

                {paymentType === 'paybill' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">Paybill Business Number</label>
                      <input
                        type="text"
                        required
                        value={paybillNumber}
                        onChange={e => setPaybillNumber(e.target.value)}
                        placeholder="e.g. 247247"
                        className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">Account Reference / Number</label>
                      <input
                        type="text"
                        required
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value)}
                        placeholder="e.g. CHAMA001"
                        className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px]"
                      />
                    </div>
                  </div>
                )}

                {paymentType === 'phone' && (
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">Custodian Phone Number</label>
                    <input
                      type="text"
                      required
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 0712345678"
                      className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-1.5">Account / Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    placeholder="e.g. SmartChama Group Custody Account"
                    className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[14px]"
                  />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">This verifies to members that they are depositing to the correct group custody wallet.</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#22C55E] text-white px-6 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#006e2f] transition-colors shadow-sm cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Payment Config'}
                </button>
              </div>
            </form>
          )}

          {/* MEMBER INVITES TAB */}
          {activeTab === 'Member Invites' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-bold text-[var(--text-main)] font-geist">Chama Invitations</h2>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-[#22C55E] hover:bg-[#006e2f] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-md">person_add</span>
                  Invite Member
                </button>
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-[var(--text-main)] mb-4">Pending Invites</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--text-muted)]">
                        <th className="py-3 px-4 font-bold">Invite Code</th>
                        <th className="py-3 px-4 font-bold">Expires At</th>
                        <th className="py-3 px-4 font-bold">Max Uses</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {invites.map((invite) => {
                        const isExpired = new Date(invite.expires_at) < new Date();
                        return (
                          <tr key={invite.token} className="text-sm text-[var(--text-main)]">
                            <td className="py-3 px-4 font-mono font-bold text-[var(--brand-green)]">{invite.token}</td>
                            <td className="py-3 px-4 text-[var(--text-muted)]">{new Date(invite.expires_at).toLocaleString()}</td>
                            <td className="py-3 px-4">{invite.max_uses}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleRevokeInvite(invite.token)}
                                className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {invites.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-sm text-[var(--text-muted)]">No active invite tokens found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showInviteModal && (
        <InviteModal
          onClose={() => {
            setShowInviteModal(false);
            fetchInvites();
          }}
          chamaId={group.id}
          chamaName={group.name}
          adminId={session?.user?.id || ""}
        />
      )}
    </div>
  );
}

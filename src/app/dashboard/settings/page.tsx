"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { session, member, group, isLoading: authLoading, refreshMemberData } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const [activeTab, setActiveTab] = useState("Group Settings");
  const tabs = ["Group Settings", "Notifications", "Security", "Integrations", "Billing"];

  // Group Form states
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState("Table Banking");
  const [county, setCounty] = useState("Nairobi");
  const [description, setDescription] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [penalty, setPenalty] = useState("");
  const [gracePeriod, setGracePeriod] = useState("");
  const [maxLoan, setMaxLoan] = useState("2");
  const [interestRate, setInterestRate] = useState("");
  const [repaymentPeriod, setRepaymentPeriod] = useState("3");
  const [approvalsReq, setApprovalsReq] = useState("2");
  const [minTrust, setMinTrust] = useState("");

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    mpesa: true, bank: false, emergencyLoans: true, notifReminders: true, notifLate: true, notifLoan: true, notifReport: true, notifJoin: true, notifWhatsapp: true, notifSms: true, notifEmail: false,
  });

  const fetchData = async () => {
    if (!group) return;
    try {
      setLoading(true);
      setGroupName(group.name || "");
      setDescription(group.description || "");
      setContributionAmount(group.contribution_amount?.toString() || "");
      setDueDate(group.due_date?.toString() || "");
      setPenalty(group.late_penalty?.toString() || "");
      setGracePeriod(group.grace_period?.toString() || "");
      setInterestRate(group.loan_interest_rate?.toString() || "");
      setMaxLoan(group.max_loan_multiple?.toString() || "2");
      setMinTrust(group.min_trust_score?.toString() || "60");
    } catch (err) {
      setError("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && group) {
      fetchData();
    }
  }, [authLoading, group]);

  const handleUpdateGroup = async () => {
    if (!group) return;
    try {
      const updates = {
        name: groupName,
        description,
        contribution_amount: Number(contributionAmount),
        due_date: Number(dueDate),
        late_penalty: Number(penalty),
        grace_period: Number(gracePeriod),
        loan_interest_rate: Number(interestRate),
        max_loan_multiple: Number(maxLoan),
        min_trust_score: Number(minTrust)
      };

      const { error: updateErr } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', group.id);

      if (updateErr) throw updateErr;

      setToastMsg("Settings updated successfully!");
      setTimeout(() => setToastMsg(""), 3000);
      refreshUser();
    } catch (err: any) {
      alert("Error updating group: " + err.message);
    }
  };

  const handleToggle = (key: string) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

  const ToggleSwitch = ({ id, isOn }: { id: string; isOn: boolean }) => (
    <div 
      className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${isOn ? 'bg-[#22C55E]' : 'bg-gray-200'}`}
      onClick={() => handleToggle(id)}
    >
      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${isOn ? 'translate-x-4' : 'translate-x-0'}`}></div>
    </div>
  );

  if (authLoading || loading) {
    return (
      <div className="p-8">
        <div className="bg-white border border-[#E5E7EB] rounded-lg h-96 animate-pulse shadow-sm"></div>
      </div>
    );
  }

  const isAdmin = member?.role === 'admin';

  return (
    <div className="p-8 font-inter relative min-h-full">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#22C55E] text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-headline-lg font-semibold text-on-surface font-geist">Settings</h1>
        <p className="text-body-sm text-secondary mt-1">Manage your group and account preferences</p>
      </div>

      {/* SETTINGS LAYOUT */}
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* LEFT SUB-NAV */}
        <div className="w-full md:w-48 shrink-0">
          <div className="flex flex-row md:flex-col gap-1 sticky top-24 overflow-x-auto pb-2 md:pb-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 rounded text-body-sm text-left whitespace-nowrap transition-colors ${
                    isActive 
                      ? 'bg-[#22C55E]/10 text-[#005321] font-medium border-l-2 border-[#22C55E]' 
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-l-2 border-transparent'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* === GROUP SETTINGS TAB === */}
          {activeTab === "Group Settings" && (
            <>
              {/* Section 1 — Group Information */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-headline-sm font-geist text-on-surface">Group information</h2>
                    <p className="text-body-sm text-secondary mt-1">Basic details about your chama</p>
                  </div>
                  {isAdmin && (
                    <button onClick={handleUpdateGroup} className="bg-[#22C55E] hover:bg-[#006e2f] text-white px-4 py-2 rounded text-body-sm font-medium transition-colors shadow-sm">
                      Save Changes
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-caps text-secondary mb-2" htmlFor="group_name">Group Name</label>
                    <input 
                      type="text" 
                      id="group_name"
                      name="group_name"
                      value={groupName}
                      disabled={!isAdmin}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-medium disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-label-caps text-secondary mb-2" htmlFor="group_type">Group Type</label>
                    <select 
                      id="group_type"
                      name="group_type"
                      value={groupType}
                      disabled={!isAdmin}
                      onChange={(e) => setGroupType(e.target.value)}
                      className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all bg-white font-medium disabled:opacity-50"
                    >
                      <option value="Table Banking">Table Banking</option>
                      <option value="Investment">Investment</option>
                      <option value="Merry-Go-Round">Merry-Go-Round</option>
                      <option value="Welfare">Welfare</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-label-caps text-secondary mb-2" htmlFor="founded">Founded</label>
                    <input 
                      type="date" 
                      id="founded"
                      name="founded"
                      value={group.created_at ? new Date(group.created_at).toISOString().split('T')[0] : ''}
                      disabled
                      className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-medium opacity-50 bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-label-caps text-secondary mb-2" htmlFor="county">County</label>
                    <select 
                      id="county"
                      name="county"
                      value={county}
                      disabled={!isAdmin}
                      onChange={(e) => setCounty(e.target.value)}
                      className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all bg-white font-medium disabled:opacity-50"
                    >
                      <option value="Nairobi">Nairobi</option>
                      <option value="Mombasa">Mombasa</option>
                      <option value="Kisumu">Kisumu</option>
                      <option value="Nakuru">Nakuru</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-label-caps text-secondary mb-2" htmlFor="description">Group Description</label>
                    <textarea 
                      id="description"
                      name="description"
                      value={description}
                      disabled={!isAdmin}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell new members about your group..."
                      rows={3}
                      className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all resize-none font-medium disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2 — Contribution Rules */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h2 className="text-headline-sm font-geist text-on-surface">Contribution settings</h2>
                  {isAdmin && (
                    <button onClick={handleUpdateGroup} className="bg-white border border-[#E5E7EB] hover:bg-gray-50 text-on-surface px-4 py-2 rounded text-body-sm font-medium transition-colors shadow-sm">
                      Save Rules
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-caps text-secondary mb-2" htmlFor="contribution_amount">Monthly Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-medium">KSh</span>
                      <input 
                        type="number" 
                        id="contribution_amount"
                        name="contribution_amount"
                        value={contributionAmount}
                        disabled={!isAdmin}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        className="w-full border border-[#E5E7EB] rounded px-4 py-2 pl-12 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-medium disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-label-caps text-secondary mb-2" htmlFor="due_date">Due Date</label>
                    <select 
                      id="due_date"
                      name="due_date"
                      value={dueDate}
                      disabled={!isAdmin}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all bg-white font-medium disabled:opacity-50"
                    >
                      <option value="1">1st of every month</option>
                      <option value="5">5th of every month</option>
                      <option value="15">15th of every month</option>
                      <option value="31">Last day of month</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-label-caps text-secondary mb-2" htmlFor="penalty">Late Penalty</label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-medium">KSh</span>
                        <input 
                          type="number" 
                          id="penalty"
                          name="penalty"
                          value={penalty}
                          disabled={!isAdmin}
                          onChange={(e) => setPenalty(e.target.value)}
                          className="w-full border border-[#E5E7EB] rounded px-4 py-2 pl-12 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-medium disabled:opacity-50"
                        />
                      </div>
                      <span className="text-label-caps text-secondary shrink-0">per week</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-label-caps text-secondary mb-2" htmlFor="grace_period">Grace Period</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        id="grace_period"
                        name="grace_period"
                        value={gracePeriod}
                        disabled={!isAdmin}
                        onChange={(e) => setGracePeriod(e.target.value)}
                        className="w-full md:w-24 border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-medium text-center disabled:opacity-50"
                      />
                      <span className="text-body-sm text-on-surface">days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3 — Loan Policy */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h2 className="text-headline-sm font-geist text-on-surface">Loan policy</h2>
                  {isAdmin && (
                    <button onClick={handleUpdateGroup} className="bg-white border border-[#E5E7EB] hover:bg-gray-50 text-on-surface px-4 py-2 rounded text-body-sm font-medium transition-colors shadow-sm">
                      Save Policy
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-caps text-secondary mb-2" htmlFor="max_loan">Max Loan Amount</label>
                    <select 
                      id="max_loan"
                      name="max_loan"
                      value={maxLoan}
                      disabled={!isAdmin}
                      onChange={(e) => setMaxLoan(e.target.value)}
                      className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all bg-white font-medium disabled:opacity-50"
                    >
                      <option value="1">1× member savings</option>
                      <option value="2">2× member savings</option>
                      <option value="3">3× member savings</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-label-caps text-secondary mb-2" htmlFor="interest_rate">Interest Rate</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        id="interest_rate"
                        name="interest_rate"
                        value={interestRate}
                        disabled={!isAdmin}
                        onChange={(e) => setInterestRate(e.target.value)}
                        className="w-full md:w-24 border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-medium text-center disabled:opacity-50"
                      />
                      <span className="text-body-sm text-on-surface">% per month</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-label-caps text-secondary mb-2" htmlFor="min_trust">Min Trust Score</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        id="min_trust"
                        name="min_trust"
                        value={minTrust}
                        disabled={!isAdmin}
                        onChange={(e) => setMinTrust(e.target.value)}
                        className="w-full md:w-24 border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-medium text-center disabled:opacity-50"
                      />
                      <span className="text-body-sm text-on-surface">/ 100 minimum</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Fallbacks for Notifications, Security, Integrations, Billing */}
          {activeTab !== "Group Settings" && (
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-12 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="material-symbols-outlined text-gray-300 text-[48px] mb-4">
                construction
              </span>
              <h2 className="text-headline-sm font-geist text-on-surface">Coming Soon</h2>
              <p className="text-body-sm text-secondary mt-2 max-w-sm">
                The {activeTab} section is currently under development. Check back later!
              </p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
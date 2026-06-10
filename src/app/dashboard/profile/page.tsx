"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const { session, member, group, isLoading: authLoading, refreshUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const [activeTab, setActiveTab] = useState("Personal Info");
  const tabs = ["Personal Info", "Financial Identity", "Security", "Connected Apps"];

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [county, setCounty] = useState("Nairobi");
  const [occupation, setOccupation] = useState("Small business owner");

  // Auth/Security states
  const [newPassword, setNewPassword] = useState("");
  const [consentToggle, setConsentToggle] = useState(false);

  // Stats
  const [financialStats, setFinancialStats] = useState({
    totalContributed: 0,
    repaymentRate: 100,
    tenure: 1
  });

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';

  const fetchData = async () => {
    if (!member) return;
    try {
      setLoading(true);
      setFullName(member.full_name || "");
      setPhone(member.phone_number || "");
      setEmail(session?.user.email || "");

      const { data: txs } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('member_id', member.id)
        .eq('status', 'confirmed');

      const totalContrib = txs?.filter(t => t.type === 'contribution').reduce((s, t) => s + Number(t.amount), 0) || 0;
      
      const joinDate = member.joined_at ? new Date(member.joined_at) : new Date();
      const now = new Date();
      const months = (now.getFullYear() - joinDate.getFullYear()) * 12 + now.getMonth() - joinDate.getMonth();
      const tenure = Math.max(1, months);

      setFinancialStats({
        totalContributed: totalContrib,
        repaymentRate: 100,
        tenure
      });

    } catch (err) {
      console.error(err);
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && member) {
      fetchData();
    }
  }, [authLoading, member]);

  const handleSaveProfile = async () => {
    if (!member) return;
    try {
      const { error: updateErr } = await supabase
        .from('members')
        .update({
          full_name: fullName,
          phone_number: phone
        })
        .eq('id', member.id);

      if (updateErr) throw updateErr;

      setToastMsg("Profile updated successfully!");
      setTimeout(() => setToastMsg(""), 3000);
      refreshUser();
    } catch (err: any) {
      alert("Error updating profile: " + err.message);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) return;
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setToastMsg("Password updated successfully!");
      setTimeout(() => setToastMsg(""), 3000);
      setNewPassword("");
    } catch (err: any) {
      alert("Error updating password: " + err.message);
    }
  };

  const ToggleSwitch = ({ isOn, onToggle }: { isOn: boolean, onToggle: () => void }) => (
    <div 
      className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${isOn ? 'bg-[#22C55E]' : 'bg-gray-200'}`}
      onClick={onToggle}
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

  const trustScore = member?.trust_score || 0;

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
        <h1 className="text-headline-lg font-semibold text-on-surface font-geist">My Profile</h1>
        <p className="text-body-sm text-secondary mt-1">Manage your personal information and financial identity</p>
      </div>

      {/* SUB-TABS */}
      <div className="border-b border-[#E5E7EB] flex gap-6 mb-6 overflow-x-auto">
        {tabs.map(tab => {
          const isActive = activeTab === tab;
          return (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-body-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                isActive 
                  ? 'text-[#22C55E] border-[#22C55E]' 
                  : 'text-secondary hover:text-on-surface border-transparent'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* PROFILE HEADER CARD */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6 shadow-sm">
        {/* Left */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full">
          {/* Avatar Area */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-20 h-20 bg-[#22C55E] text-white text-[32px] font-bold flex items-center justify-center rounded-full shadow-sm">
              {getInitials(member?.full_name)}
            </div>
            <button className="text-body-sm text-primary mt-2 hover:underline transition-colors font-medium">
              Change photo
            </button>
          </div>
          
          {/* Info */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left mt-2 sm:mt-0">
            <h2 className="text-display-sm font-geist font-bold text-on-surface">{member?.full_name}</h2>
            <div className="bg-[#22C55E]/10 text-[#005321] border border-[#4ae176] text-label-caps px-3 py-1 rounded mt-2 font-bold tracking-wide capitalize">
              {member?.role} · {group?.name}
            </div>
            <div className="flex items-center gap-2 text-body-sm text-secondary mt-3">
              <span className="material-symbols-outlined text-[18px]">phone</span>
              {member?.phone_number || "No phone added"}
            </div>
            <div className="text-body-sm text-secondary mt-1">
              Member since {member?.joined_at ? new Date(member.joined_at).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'Unknown'}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="bg-surface-container-low border border-[#E5E7EB] rounded-lg p-5 text-center flex flex-col items-center w-full lg:w-auto shrink-0 shadow-sm">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-20 h-20 absolute inset-0 transform -rotate-90">
              <path
                className="text-gray-200"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#22C55E]"
                strokeDasharray={`${trustScore}, 100`}
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="flex items-baseline relative z-10">
              <span className="text-headline-lg font-bold font-geist text-[#22C55E]">{trustScore}</span>
              <span className="text-body-sm text-secondary font-medium">/100</span>
            </div>
          </div>
          <div className="text-label-caps text-[#22C55E] font-bold mt-3 uppercase tracking-wide">
            {trustScore >= 80 ? 'Excellent Standing' : trustScore >= 60 ? 'Good Standing' : 'Needs Improvement'}
          </div>
        </div>
      </div>

      {/* === PERSONAL INFO TAB === */}
      {activeTab === "Personal Info" && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-headline-sm font-geist text-on-surface">Personal details</h2>
            <button onClick={handleSaveProfile} className="bg-[#22C55E] hover:bg-[#006e2f] text-white px-4 py-2 rounded text-body-sm font-medium transition-colors shadow-sm">
              Save Changes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-label-caps text-secondary mb-2" htmlFor="fullName">Full Name</label>
              <input 
                type="text" 
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-[#E5E7EB] rounded px-4 py-2.5 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-medium"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-label-caps text-secondary" htmlFor="phone">Phone Number</label>
                {phone && (
                  <span className="bg-[#22C55E]/10 text-[#005321] text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-[#4ae176]">
                    Verified
                  </span>
                )}
              </div>
              <input 
                type="text" 
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-[#E5E7EB] rounded px-4 py-2.5 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-label-caps text-secondary mb-2" htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email"
                value={email}
                disabled
                className="w-full border border-[#E5E7EB] rounded px-4 py-2.5 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-medium bg-gray-50 opacity-70 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-label-caps text-secondary mb-2" htmlFor="county">County</label>
              <select 
                id="county"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full border border-[#E5E7EB] rounded px-4 py-2.5 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all bg-white font-medium"
              >
                <option value="Nairobi">Nairobi</option>
                <option value="Mombasa">Mombasa</option>
                <option value="Kisumu">Kisumu</option>
                <option value="Nakuru">Nakuru</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-label-caps text-secondary mb-2" htmlFor="occupation">Occupation</label>
              <input 
                type="text" 
                id="occupation"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full border border-[#E5E7EB] rounded px-4 py-2.5 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* === FINANCIAL IDENTITY TAB === */}
      {activeTab === "Financial Identity" && (
        <>
          {/* Hero Card */}
          <div className="w-full bg-[#0B0F0C] rounded-xl p-8 mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 shadow-sm">
            {/* Left */}
            <div className="flex-1 w-full max-w-xl">
              <div className="text-label-caps text-gray-400">FINANCIAL IDENTITY</div>
              <div className="text-[36px] font-geist font-bold text-white mt-2 leading-tight">
                Your verified financial passport.
              </div>
              <p className="text-body-lg text-gray-400 mt-4 leading-relaxed max-w-md">
                Built from {financialStats.tenure} months of consistent contribution history in SmartChama.
              </p>
              
              <div className="mt-8">
                <button className="bg-[#22C55E] hover:bg-[#006e2f] transition-colors text-white px-6 py-3 rounded text-headline-sm flex items-center gap-2 font-medium shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  Download Report
                </button>
                <div className="text-body-sm text-gray-400 mt-3 font-medium">
                  Share with banks, SACCOs, or lenders
                </div>
              </div>
            </div>

            {/* Right stats grid */}
            <div className="w-full lg:w-[360px] grid grid-cols-2 gap-4 shrink-0">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-label-caps text-gray-400 mb-1">Total Contributed</div>
                <div className="text-display-sm font-geist font-bold text-white">KSh {formatCurrency(financialStats.totalContributed)}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-label-caps text-gray-400 mb-1">Active Tenure</div>
                <div className="text-display-sm font-geist font-bold text-white">{financialStats.tenure} months</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-label-caps text-gray-400 mb-1">Repayment Rate</div>
                <div className="text-display-sm font-geist font-bold text-white">{financialStats.repaymentRate}%</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-label-caps text-gray-400 mb-1">Trust Score</div>
                <div className="text-display-sm font-geist font-bold text-[#22C55E]">{trustScore}/100</div>
              </div>
            </div>
          </div>

          {/* Consent Toggle */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
            <h2 className="text-headline-sm font-geist text-on-surface">Lender visibility</h2>
            <p className="text-body-sm text-secondary mt-1 mb-6">Control who can see your SmartChama financial record</p>

            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">verified</span>
                <span className="text-body-sm font-medium text-on-surface">Allow lenders to view my SmartChama record</span>
              </div>
              <ToggleSwitch isOn={consentToggle} onToggle={() => setConsentToggle(!consentToggle)} />
            </div>

            <div className="bg-surface-container-low border border-[#E5E7EB] rounded-lg p-4 flex items-start gap-3 mt-5">
              <span className="material-symbols-outlined text-secondary mt-0.5">info</span>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                Turning this on lets vetted financial institutions view your contribution 
                history with your permission. You can revoke access at any time.
              </p>
            </div>
          </div>
        </>
      )}

      {/* === SECURITY TAB === */}
      {activeTab === "Security" && (
        <div className="flex flex-col gap-6">
          {/* Section 1 — Change Password */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
            <h2 className="text-headline-sm font-geist text-on-surface mb-6">Change password</h2>
            <div className="flex flex-col gap-4 max-w-md">
              <div>
                <label className="block text-label-caps text-secondary mb-2" htmlFor="new_pwd">New Password</label>
                <input 
                  type="password" 
                  id="new_pwd"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full border border-[#E5E7EB] rounded px-4 py-2.5 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-medium"
                />
              </div>
              <button 
                onClick={handleUpdatePassword}
                disabled={!newPassword}
                className="bg-[#22C55E] hover:bg-[#006e2f] disabled:opacity-50 text-white rounded py-2.5 px-4 text-body-sm font-medium transition-colors mt-2 self-start shadow-sm"
              >
                Update Password
              </button>
            </div>
          </div>

          {/* Section 2 — Two-Factor Auth */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
            <h2 className="text-headline-sm font-geist text-on-surface">Two-factor authentication</h2>
            <p className="text-body-sm text-secondary mt-1 mb-6">Add extra security to your account</p>

            <div className="flex flex-col divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-lg overflow-hidden">
              <div className="flex justify-between items-center p-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-secondary-container">phone_android</span>
                  <span className="text-body-sm font-medium text-on-surface">SMS to {phone || '...'}</span>
                </div>
                <span className="bg-[#22C55E]/10 text-[#005321] rounded px-2 py-0.5 text-label-caps font-bold">
                  Enabled
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallbacks */}
      {activeTab === "Connected Apps" && (
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
  );
}
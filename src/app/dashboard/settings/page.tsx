"use client";

import { useState } from "react";
import { 
  User, Shield, Bell, Lock, Smartphone, LogOut, 
  Camera, Check, AlertTriangle, Save, ChevronRight 
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({
    name: "Lenny",
    email: "lenny@smartchama.com",
    phone: "+254 712 345 678",
    bio: "Computer Science Student @ CUEA | Aspiring MLE",
  });
  const [security, setSecurity] = useState({
    twoFactor: true,
    loginAlerts: true,
  });

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Changes saved to secure server.");
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* --- HEADER --- */}
      <div>
        <h1 className="text-3xl font-black text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* --- SIDEBAR NAVIGATION --- */}
        <div className="space-y-2">
          {["profile", "security", "notifications"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === tab 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              {tab === "profile" && <User className="w-5 h-5" />}
              {tab === "security" && <Shield className="w-5 h-5" />}
              {tab === "notifications" && <Bell className="w-5 h-5" />}
              <span className="capitalize">{tab}</span>
              {activeTab === tab && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
          
          <div className="pt-8">
            <Link href="/login" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut className="w-5 h-5" />
              Sign Out
            </Link>
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="lg:col-span-3">
          
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-white mb-6">Personal Information</h2>
              
              {/* Profile Pic Upload */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative group cursor-pointer">
                  <div className="size-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 border-4 border-slate-900 flex items-center justify-center text-3xl font-black text-black">
                    {user.name.charAt(0)}
                  </div>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{user.name}</h3>
                  <p className="text-slate-400 text-sm mb-2">Member since Dec 2025</p>
                  <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-full transition-colors">
                    Change Picture
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6 max-w-xl">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={user.name} 
                      onChange={(e) => setUser({...user, name: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone</label>
                    <input 
                      type="text" 
                      value={user.phone} 
                      onChange={(e) => setUser({...user, phone: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={user.email} 
                    onChange={(e) => setUser({...user, email: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bio</label>
                  <textarea 
                    value={user.bio} 
                    onChange={(e) => setUser({...user, bio: e.target.value})}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none resize-none"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-3 rounded-xl transition-all flex items-center gap-2"
                  >
                    {loading ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* 2FA Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      Two-Factor Authentication 
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">Recommended</span>
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Secure your account with OTP via SMS or Authenticator App.</p>
                  </div>
                  <div 
                    onClick={() => setSecurity({...security, twoFactor: !security.twoFactor})}
                    className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${security.twoFactor ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${security.twoFactor ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>
                
                {security.twoFactor && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <p className="text-sm text-emerald-200">
                      2FA is currently active. We will send a code to <strong>{user.phone}</strong> for every login attempt.
                    </p>
                  </div>
                )}
              </div>

              {/* Password Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8">
                <h2 className="text-xl font-bold text-white mb-6">Password & Authentication</h2>
                <button className="w-full flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors group mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-900 p-2 rounded-lg">
                      <Lock className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white">Change Password</p>
                      <p className="text-xs text-slate-500">Last changed 3 months ago</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Active Sessions */}
              <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8">
                 <h2 className="text-xl font-bold text-white mb-6">Active Sessions</h2>
                 <div className="flex items-center gap-4">
                    <div className="bg-slate-800 p-3 rounded-xl">
                      <Smartphone className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white">Safari on iPhone 15 Pro</p>
                      <p className="text-xs text-slate-400">Nairobi, Kenya • Active now</p>
                    </div>
                 </div>
              </div>

            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="text-center py-10">
                 <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Bell className="w-8 h-8 text-slate-500" />
                 </div>
                 <h2 className="text-xl font-bold text-white">Notification Preferences</h2>
                 <p className="text-slate-400 mb-6">Choose how you want to be alerted.</p>
                 
                 <div className="max-w-md mx-auto space-y-4 text-left">
                   {["Deposit Reminders", "Loan Approvals", "New Investment Alerts", "Marketing Emails"].map((item, i) => (
                     <div key={i} className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                       <span className="font-bold text-white">{item}</span>
                       <input type="checkbox" defaultChecked className="w-5 h-5 accent-emerald-500" />
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
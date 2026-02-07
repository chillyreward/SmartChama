"use client";

import { useState } from "react";
import { 
  Users, Lock, ArrowRight, ShieldCheck, Keypad, 
  Loader2, CheckCircle, Wallet 
} from "lucide-react";
import { useRouter } from "next/navigation";

// --- MOCK GROUPS DATA ---
const myGroups = [
  {
    id: "g1",
    name: "Family Savings",
    role: "Admin",
    balance: "KES 1,250,000",
    members: 12,
    color: "emerald",
    nextMeeting: "Friday, 8pm"
  },
  {
    id: "g2",
    name: "CUEA Tech Club",
    role: "Member",
    balance: "KES 45,000",
    members: 48,
    color: "blue",
    nextMeeting: "Feb 28th"
  },
  {
    id: "g3",
    name: "Rongai Investors",
    role: "Treasurer",
    balance: "KES 8,500,000",
    members: 5,
    color: "purple",
    nextMeeting: "Monthly"
  }
];

export default function MyGroupsPage() {
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [step, setStep] = useState(1); // 1=Prompt, 2=Verifying, 3=Success
  const [pin, setPin] = useState(["", "", "", ""]);

  const handleGroupClick = (group: any) => {
    setSelectedGroup(group);
    setStep(1); // Reset
    setPin(["", "", "", ""]);
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    // Auto-focus next
    if (value && index < 3) {
      document.getElementById(`pin-${index + 1}`)?.focus();
    }

    // Auto-submit on fill
    if (index === 3 && value) {
      verifyPin();
    }
  };

  const verifyPin = () => {
    setStep(2); // Loading
    setTimeout(() => {
      setStep(3); // Success
      setTimeout(() => {
        // Redirect to dashboard with new context
        router.push(`/dashboard?group=${selectedGroup.id}&role=${selectedGroup.role}`);
      }, 1000);
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* --- HEADER --- */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          My Chamas <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">{myGroups.length} Active</span>
        </h1>
        <p className="text-slate-400 mt-1">Select a group to access its dashboard. Security verification required.</p>
      </div>

      {/* --- GROUPS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* ADD NEW GROUP CARD */}
        <div className="border-2 border-dashed border-slate-800 rounded-[32px] p-6 flex flex-col items-center justify-center text-slate-500 hover:border-emerald-500/50 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer min-h-[250px] group">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <p className="font-bold">Create / Join Chama</p>
        </div>

        {/* ACTIVE GROUPS */}
        {myGroups.map((group) => (
          <div 
            key={group.id}
            onClick={() => handleGroupClick(group)}
            className="relative bg-slate-900 border border-slate-800 rounded-[32px] p-8 hover:border-emerald-500/50 transition-all cursor-pointer group overflow-hidden"
          >
            {/* Hover Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${group.color}-500/10 blur-[60px] group-hover:bg-${group.color}-500/20 transition-all`}></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${group.color}-500/10 text-${group.color}-400`}>
                  <Users className="w-6 h-6" />
                </div>
                <div className="bg-slate-950 px-3 py-1 rounded-full border border-slate-800 flex items-center gap-2">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Encrypted</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{group.name}</h3>
              <p className="text-sm text-slate-400 mb-6">{group.role}</p>

              <div className="flex justify-between items-end border-t border-slate-800 pt-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total Assets</p>
                  <p className="text-lg font-bold text-white blur-[4px] group-hover:blur-0 transition-all duration-500">
                    {group.balance}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- SECURITY CHALLENGE MODAL --- */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#020617] border border-slate-700 w-full max-w-md rounded-[32px] p-8 relative shadow-2xl text-center">
            
            <button 
              onClick={() => setSelectedGroup(null)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white"
            >
              x
            </button>

            {step === 1 && (
              <div className="animate-in slide-in-from-bottom-4 duration-300">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                  <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verify Identity</h2>
                <p className="text-slate-400 text-sm mb-8">
                  Enter your PIN to access <br />
                  <span className="text-white font-bold">{selectedGroup.name}</span>
                </p>

                <div className="flex justify-center gap-4 mb-8">
                  {pin.map((digit, i) => (
                    <input
                      key={i}
                      id={`pin-${i}`}
                      type="password"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(i, e.target.value)}
                      className="w-12 h-14 bg-slate-900 border border-slate-700 rounded-xl text-center text-2xl font-bold text-white focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.3)] outline-none transition-all"
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-600">Enter any 4 digits (Demo Mode)</p>
              </div>
            )}

            {step === 2 && (
              <div className="py-10">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
                <p className="text-white font-bold">Verifying Credentials...</p>
              </div>
            )}

            {step === 3 && (
              <div className="py-10">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
                <p className="text-white font-bold text-lg">Access Granted</p>
                <p className="text-emerald-400 text-sm">Entering Secure Vault...</p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
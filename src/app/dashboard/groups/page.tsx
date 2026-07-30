"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Users, Lock, ArrowRight, ShieldCheck, 
  Loader2, CheckCircle, Plus, X, Building2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function MyGroupsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userRole = searchParams.get("role")?.toLowerCase() || "member";
  const isAdmin = userRole === "admin";

  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState(["", "", "", ""]);
  
  // Chamas state
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  
  // Create Chama Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [chamaName, setChamaName] = useState("");
  const [investmentGoal, setInvestmentGoal] = useState("");
  const [monthlyGrowth, setMonthlyGrowth] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Fetch member's chamas on mount
  useEffect(() => {
    fetchMyChamas();
  }, []);

  const fetchMyChamas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoadingGroups(false);
        return;
      }

      // Fetch chamas where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('chama_id, chamas(id, name, total_balance, investment_goal, monthly_growth_pct)')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Error fetching chamas:', memberError);
        setLoadingGroups(false);
        return;
      }

      if (memberData && memberData.length > 0) {
        // Transform data to match component structure
        const chamas = memberData
          .filter((item: any) => item.chamas) // Filter out null chamas
          .map((item: any) => ({
            id: item.chamas.id,
            name: item.chamas.name,
            role: "Member",
            balance: `KES ${parseFloat(item.chamas.total_balance || 0).toLocaleString()}`,
            members: 0, // Will be fetched separately if needed
            color: "emerald",
            investmentGoal: item.chamas.investment_goal,
            monthlyGrowth: item.chamas.monthly_growth_pct
          }));
        
        setMyGroups(chamas);
      } else {
        setMyGroups([]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

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

  const handleCreateChama = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCreateError("You must be logged in to create a chama");
        setCreating(false);
        return;
      }

      // Create chama in database
      const { data: chama, error: chamaError } = await supabase
        .from('chamas')
        .insert({
          name: chamaName,
          investment_goal: parseFloat(investmentGoal) || 0,
          monthly_growth_pct: parseFloat(monthlyGrowth) || 0,
          created_by: user.id,
          total_balance: 0
        })
        .select()
        .single();

      if (chamaError) {
        console.error("Error creating chama:", chamaError);
        setCreateError("Failed to create chama. Please try again.");
        setCreating(false);
        return;
      }

      // Success - close modal and refresh
      setShowCreateModal(false);
      setChamaName("");
      setInvestmentGoal("");
      setMonthlyGrowth("");
      
      alert("Chama created successfully!");
      
    } catch (error) {
      console.error("Create chama error:", error);
      setCreateError("An error occurred. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* --- HEADER --- */}
      <div>
        <h1 className="text-3xl font-black font-geist flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          My Chamas 
          <span 
            className="text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            {myGroups.length} Active
          </span>
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Select a group to access its dashboard. Security verification required.</p>
      </div>

      {loadingGroups ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-[#22C55E] animate-spin mx-auto mb-4" />
          <p style={{ color: 'var(--text-secondary)' }}>Loading your chamas...</p>
        </div>
      ) : (
        <>
          {/* --- GROUPS GRID --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
            {/* ADD NEW GROUP CARD */}
            <div 
              onClick={() => isAdmin ? setShowCreateModal(true) : null}
              className="border-2 border-dashed rounded-[32px] p-6 flex flex-col items-center justify-center transition-all cursor-pointer min-h-[250px] group hover:border-[#22C55E]/50 hover:bg-[#22C55E]/5"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {isAdmin ? <Plus className="w-6 h-6 text-[#22C55E]" /> : <Users className="w-6 h-6 text-[#22C55E]" />}
              </div>
              <p className="font-bold">{isAdmin ? "Create Chama" : "Join Chama"}</p>
            </div>

            {/* ACTIVE GROUPS */}
            {myGroups.map((group) => (
              <div 
                key={group.id}
                onClick={() => handleGroupClick(group)}
                className="relative rounded-[32px] p-8 transition-all cursor-pointer group overflow-hidden hover:border-[#22C55E]/50 shadow-md"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-[#22C55E]">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="px-3 py-1 rounded-full flex items-center gap-2" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                      <Lock className="w-3 h-3 text-[#22C55E]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Encrypted</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold font-geist mb-1" style={{ color: 'var(--text-primary)' }}>{group.name}</h3>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{group.role}</p>

                  <div className="flex justify-between items-end pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <div>
                      <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Total Assets</p>
                      <p className="text-lg font-bold transition-all duration-500" style={{ color: 'var(--text-primary)' }}>
                        {group.balance}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all shadow-sm">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!loadingGroups && myGroups.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <p className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No chamas yet</p>
              <p className="text-sm">You haven't joined any chamas. Ask an admin for an invite link!</p>
            </div>
          )}
        </>
      )}

      {/* --- CREATE CHAMA MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[32px] p-8 relative shadow-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 rounded-full p-2 transition-colors"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <Building2 className="w-8 h-8 text-[#22C55E]" />
              </div>
              <h2 className="text-2xl font-bold mb-2 font-geist" style={{ color: 'var(--text-primary)' }}>Create New Chama</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Set up your investment group</p>
            </div>

            {createError && (
              <div className="mb-6 p-4 rounded-xl text-sm" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateChama} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-[#22C55E] uppercase tracking-widest mb-2 ml-1">
                  Chama Name
                </label>
                <input 
                  type="text" 
                  required
                  value={chamaName}
                  onChange={(e) => setChamaName(e.target.value)}
                  placeholder="e.g., Family Savings"
                  className="w-full rounded-xl px-4 py-4 outline-none focus:border-[#22C55E] transition-all"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', borderWidth: '1px', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#22C55E] uppercase tracking-widest mb-2 ml-1">
                  Investment Goal (KES)
                </label>
                <input 
                  type="number" 
                  value={investmentGoal}
                  onChange={(e) => setInvestmentGoal(e.target.value)}
                  placeholder="e.g., 1000000"
                  className="w-full rounded-xl px-4 py-4 outline-none focus:border-[#22C55E] transition-all"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', borderWidth: '1px', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#22C55E] uppercase tracking-widest mb-2 ml-1">
                  Monthly Growth Target (%)
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  value={monthlyGrowth}
                  onChange={(e) => setMonthlyGrowth(e.target.value)}
                  placeholder="e.g., 5.5"
                  className="w-full rounded-xl px-4 py-4 outline-none focus:border-[#22C55E] transition-all"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', borderWidth: '1px', color: 'var(--text-primary)' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={creating}
                className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Building2 className="w-5 h-5" />
                    Create Chama
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- SECURITY CHALLENGE MODAL --- */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[32px] p-8 relative shadow-2xl text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            
            <button 
              onClick={() => setSelectedGroup(null)}
              className="absolute top-6 right-6 font-bold"
              style={{ color: 'var(--text-secondary)' }}
            >
              ✕
            </button>

            {step === 1 && (
              <div className="animate-in slide-in-from-bottom-4 duration-300">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                  <ShieldCheck className="w-10 h-10 text-[#22C55E]" />
                </div>
                <h2 className="text-2xl font-bold mb-2 font-geist" style={{ color: 'var(--text-primary)' }}>Verify Identity</h2>
                <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                  Enter your PIN to access <br />
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{selectedGroup.name}</span>
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
                      className="w-12 h-14 rounded-xl text-center text-2xl font-bold focus:border-[#22C55E] outline-none transition-all"
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', borderWidth: '1px', color: 'var(--text-primary)' }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Enter any 4 digits (Demo Mode)</p>
              </div>
            )}

            {step === 2 && (
              <div className="py-10">
                <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin mx-auto mb-4" />
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Verifying Credentials...</p>
              </div>
            )}

            {step === 3 && (
              <div className="py-10">
                <CheckCircle className="w-16 h-16 text-[#22C55E] mx-auto mb-4 animate-bounce" />
                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Access Granted</p>
                <p className="text-[#22C55E] text-sm">Entering Secure Vault...</p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default function MyGroupsPage() {
  return (
    <Suspense fallback={<div className="text-[#22C55E] p-10">Loading Groups...</div>}>
      <MyGroupsContent />
    </Suspense>
  );
}
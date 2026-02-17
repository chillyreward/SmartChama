"use client";

import { Suspense, useState, useEffect } from "react";
import { 
  Users, Lock, ArrowRight, ShieldCheck, 
  Loader2, CheckCircle, Plus, X, Building2,
  CreditCard, Settings, Receipt, TrendingUp, Crown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BlockchainBadge from "@/components/BlockchainBadge";
import PredictiveInsights from "@/components/PredictiveInsights";

function MyChamasContent() {
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState(["", "", "", ""]);
  
  // Chamas state
  const [chamas, setChamas] = useState<any[]>([]);
  const [loadingChamas, setLoadingChamas] = useState(true);
  const [chamaMemberCounts, setChamaMemberCounts] = useState<{[key: string]: number}>({});
  
  // Create Chama Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [chamaName, setChamaName] = useState("");
  const [investmentGoal, setInvestmentGoal] = useState("");
  const [monthlyGrowth, setMonthlyGrowth] = useState("");
  const [chamaRules, setChamaRules] = useState<string[]>([""]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Invite modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteChama, setInviteChama] = useState<any>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  // Ledger/Transactions state
  const [chamaTransactions, setChamaTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Fetch chamas on mount
  useEffect(() => {
    fetchChamas();
  }, []);

  const fetchChamas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoadingChamas(false);
        return;
      }

      // Get admin ID first
      const { data: admin } = await supabase
        .from('chama_admins')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!admin) {
        setLoadingChamas(false);
        return;
      }

      // Fetch chamas created by this admin
      const { data: chamasData, error } = await supabase
        .from('chamas')
        .select('*')
        .eq('admin_id', admin.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching chamas:', error);
      } else {
        setChamas(chamasData || []);
        
        // Fetch member counts for each chama
        if (chamasData && chamasData.length > 0) {
          const counts: {[key: string]: number} = {};
          
          for (const chama of chamasData) {
            const { count } = await supabase
              .from('members')
              .select('*', { count: 'exact', head: true })
              .eq('chama_id', chama.id);
            
            counts[chama.id] = count || 0;
          }
          
          setChamaMemberCounts(counts);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingChamas(false);
    }
  };

  const handleGroupClick = async (group: any) => {
    setSelectedGroup(group);
    // Fetch transactions for this chama
    await fetchChamaTransactions(group.id);
  };

  const fetchChamaTransactions = async (chamaId: string) => {
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('chama_id', chamaId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching transactions:', error);
      } else {
        setChamaTransactions(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    if (value && index < 3) {
      document.getElementById(`pin-${index + 1}`)?.focus();
    }

    if (index === 3 && value) {
      verifyPin();
    }
  };

  const verifyPin = () => {
    setStep(2);
    setTimeout(() => {
      setStep(3);
      setTimeout(() => {
        // Show details modal instead of redirecting
        setShowDetailsModal(true);
      }, 1000);
    }, 1500);
  };

  const handleCreateChama = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCreateError("You must be logged in to create a chama");
        setCreating(false);
        return;
      }

      // Filter out empty rules
      const filteredRules = chamaRules.filter(rule => rule.trim() !== "");

      // Get admin ID
      const { data: admin } = await supabase
        .from('chama_admins')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!admin) {
        setCreateError("Admin account not found. Please contact support.");
        setCreating(false);
        return;
      }

      // Prepare chama data
      const chamaData: any = {
        name: chamaName,
        investment_goal: parseFloat(investmentGoal) || 0,
        monthly_growth_pct: parseFloat(monthlyGrowth) || 0,
        admin_id: admin.id,
        total_balance: 0
      };

      // Only add rules if the column exists and there are rules
      if (filteredRules.length > 0) {
        chamaData.rules = filteredRules;
      }

      const { data: chama, error: chamaError } = await supabase
        .from('chamas')
        .insert(chamaData)
        .select()
        .single();

      if (chamaError) {
        console.error("Error creating chama:", chamaError);
        console.error("Error details:", JSON.stringify(chamaError, null, 2));
        setCreateError(`Failed to create chama: ${chamaError.message || 'Unknown error'}`);
        setCreating(false);
        return;
      }

      console.log("Chama created successfully:", chama);
      
      // Close modal and reset form
      setShowCreateModal(false);
      setChamaName("");
      setInvestmentGoal("");
      setMonthlyGrowth("");
      setChamaRules([""]);
      
      // Refresh chamas list
      fetchChamas();
      
    } catch (error) {
      console.error("Create chama error:", error);
      setCreateError("An error occurred. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const addRule = () => {
    setChamaRules([...chamaRules, ""]);
  };

  const removeRule = (index: number) => {
    if (chamaRules.length > 1) {
      const newRules = chamaRules.filter((_, i) => i !== index);
      setChamaRules(newRules);
    }
  };

  const updateRule = (index: number, value: string) => {
    const newRules = [...chamaRules];
    newRules[index] = value;
    setChamaRules(newRules);
  };

  const handleInviteMember = async (chama: any) => {
    setInviteChama(chama);
    setShowInviteModal(true);
    setGeneratingInvite(true);
    setInviteLink("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('You must be logged in to generate invite links');
        setGeneratingInvite(false);
        return;
      }

      // Get admin ID
      const { data: admin } = await supabase
        .from('chama_admins')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!admin) {
        alert('Admin account not found');
        setGeneratingInvite(false);
        return;
      }

      const response = await fetch('/api/invite/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chamaId: chama.id,
          userId: admin.id,
          maxUses: 30,
          expiresInDays: 30
        })
      });

      const data = await response.json();

      if (data.success) {
        setInviteLink(data.inviteLink);
      } else {
        alert('Failed to generate invite link: ' + data.error);
      }
    } catch (error: any) {
      console.error('Error generating invite:', error);
      alert('Failed to generate invite link. Please try again.');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  const getColorClass = (index: number) => {
    const colors = ['amber', 'blue', 'purple', 'emerald', 'pink', 'indigo'];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-8 pb-20">
      
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          My Chamas 
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">
            {chamas.length} Active
          </span>
        </h1>
        <p className="text-slate-400 mt-1">Manage your investment groups and track performance</p>
      </div>

      {/* HELPFUL CONTEXT CARD */}
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              💡 Getting Started with Chamas
            </h3>
            <ul className="text-sm text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span><strong className="text-white">Create a Chama:</strong> Click the "Create New Chama" card to set up your investment group</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span><strong className="text-white">Invite Members:</strong> After creating, use the "Invite" button to generate invite links for members</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span><strong className="text-white">Track Growth:</strong> Monitor your chama's balance, member contributions, and investment goals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span><strong className="text-white">Manage Members:</strong> View member activity, approve loans, and distribute dividends</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {loadingChamas ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your chamas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* CREATE NEW CHAMA CARD */}
          <div 
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-slate-800 rounded-[32px] p-6 flex flex-col items-center justify-center text-slate-500 hover:border-amber-500/50 hover:text-amber-500 hover:bg-amber-500/5 transition-all cursor-pointer min-h-[250px] group"
          >
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <p className="font-bold">Create New Chama</p>
          </div>

          {/* ACTIVE CHAMAS */}
          {chamas.map((chama, index) => {
            const color = getColorClass(index);
            return (
              <div 
                key={chama.id}
                onClick={() => handleGroupClick(chama)}
                className="relative bg-slate-900 border border-slate-800 rounded-[32px] p-8 hover:border-amber-500/50 transition-all cursor-pointer group overflow-hidden"
              >
                <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${color}-500/10 blur-[60px] group-hover:bg-${color}-500/20 transition-all`}></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${color}-500/10 text-${color}-400`}>
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="bg-slate-950 px-3 py-1 rounded-full border border-slate-800 flex items-center gap-2">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Encrypted</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">{chama.name}</h3>
                  <p className="text-sm text-slate-400 mb-6">Admin • {chamaMemberCounts[chama.id] || 0} members</p>

                  <div className="flex justify-between items-end border-t border-slate-800 pt-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Total Balance</p>
                      <p className="text-lg font-bold text-white">
                        KES {parseFloat(chama.total_balance || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loadingChamas && chamas.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-700" />
          <p className="text-lg font-bold text-slate-400 mb-2">No chamas yet</p>
          <p className="text-sm">Click "Create New Chama" to get started</p>
        </div>
      )}

      {/* CREATE CHAMA MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[32px] p-8 relative shadow-2xl">
            
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 rounded-full p-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                <Building2 className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Create New Chama</h2>
              <p className="text-slate-400 text-sm">Set up your investment group in 3 easy steps</p>
            </div>

            {/* HELPFUL TIPS */}
            <div className="mb-6 p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <p className="text-xs text-amber-400 font-bold mb-2 uppercase tracking-wider">💡 Quick Tips</p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Choose a memorable name for your chama</li>
                <li>• Set realistic investment goals</li>
                <li>• Monthly growth target helps track progress</li>
                <li>• You can update these settings later</li>
              </ul>
            </div>

            {createError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateChama} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-amber-500 uppercase tracking-widest mb-2 ml-1">
                  Chama Name
                </label>
                <input 
                  type="text" 
                  required
                  value={chamaName}
                  onChange={(e) => setChamaName(e.target.value)}
                  placeholder="e.g., Family Savings"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-500 uppercase tracking-widest mb-2 ml-1">
                  Investment Goal (KES)
                </label>
                <input 
                  type="number" 
                  value={investmentGoal}
                  onChange={(e) => setInvestmentGoal(e.target.value)}
                  placeholder="e.g., 1000000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-500 uppercase tracking-widest mb-2 ml-1">
                  Monthly Growth Target (%)
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  value={monthlyGrowth}
                  onChange={(e) => setMonthlyGrowth(e.target.value)}
                  placeholder="e.g., 5.5"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label className="block text-xs font-bold text-amber-500 uppercase tracking-widest">
                    Chama Rules (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={addRule}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Rule
                  </button>
                </div>
                <div className="space-y-3">
                  {chamaRules.map((rule, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-shrink-0 w-6 h-10 flex items-center justify-center text-slate-500 font-bold text-sm">
                        {index + 1}.
                      </div>
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => updateRule(index, e.target.value)}
                        placeholder={`Rule ${index + 1} (e.g., Monthly contribution: KES 5,000)`}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
                      />
                      {chamaRules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRule(index)}
                          className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2 ml-1">
                  Define rules like contribution amounts, meeting schedules, loan policies, etc.
                </p>
              </div>

              <button 
                type="submit" 
                disabled={creating}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(251,191,36,0.3)]"
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

      {/* SECURITY CHALLENGE MODAL */}
      {selectedGroup && !showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#020617] border border-slate-700 w-full max-w-md rounded-[32px] p-8 relative shadow-2xl text-center">
            
            <button 
              onClick={() => setSelectedGroup(null)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {step === 1 && (
              <div>
                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                  <ShieldCheck className="w-10 h-10 text-amber-500" />
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
                      className="w-12 h-14 bg-slate-900 border border-slate-700 rounded-xl text-center text-2xl font-bold text-white focus:border-amber-500 focus:shadow-[0_0_20px_rgba(251,191,36,0.3)] outline-none transition-all"
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-600">Enter any 4 digits (Demo Mode)</p>
              </div>
            )}

            {step === 2 && (
              <div className="py-10">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
                <p className="text-white font-bold">Verifying Credentials...</p>
              </div>
            )}

            {step === 3 && (
              <div className="py-10">
                <CheckCircle className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-bounce" />
                <p className="text-white font-bold text-lg">Access Granted</p>
                <p className="text-amber-400 text-sm">Loading Chama Details...</p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CHAMA DETAILS MODAL */}
      {selectedGroup && showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-[32px] p-8 relative shadow-2xl my-8">
            
            <button 
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedGroup(null);
                setStep(1);
                setPin(["", "", "", ""]);
              }}
              className="absolute top-6 right-6 text-slate-500 hover:text-white bg-slate-800 rounded-full p-2 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                  <Building2 className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedGroup.name}</h2>
                  <p className="text-slate-400">Chama Overview & Management</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Total Balance</p>
                <p className="text-3xl font-bold text-white mb-1">
                  KES {parseFloat(selectedGroup.total_balance || 0).toLocaleString()}
                </p>
                <p className="text-xs text-emerald-400">+0% this month</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Investment Goal</p>
                <p className="text-3xl font-bold text-white mb-1">
                  KES {parseFloat(selectedGroup.investment_goal || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">Target amount</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Monthly Growth</p>
                <p className="text-3xl font-bold text-white mb-1">
                  {parseFloat(selectedGroup.monthly_growth_pct || 0).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400">Target rate</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-amber-500 rounded-full"></span>
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => {
                    handleInviteMember(selectedGroup);
                  }}
                  className="bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-xl p-4 text-center transition-all group"
                >
                  <Users className="w-6 h-6 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold text-white">Invite Members</p>
                </button>

                <button className="bg-slate-950 border border-slate-800 hover:border-amber-500 rounded-xl p-4 text-center transition-all group">
                  <CreditCard className="w-6 h-6 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold text-white">View Transactions</p>
                </button>

                <button className="bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-xl p-4 text-center transition-all group">
                  <Users className="w-6 h-6 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold text-white">Manage Members</p>
                </button>

                <button className="bg-slate-950 border border-slate-800 hover:border-purple-500 rounded-xl p-4 text-center transition-all group">
                  <Settings className="w-6 h-6 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold text-white">Settings</p>
                </button>
              </div>
            </div>

            {/* Information Sections */}
            <div className="space-y-6">
              {/* About This Chama */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  About This Chama
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">Created</p>
                    <p className="text-white font-semibold">
                      {new Date(selectedGroup.created_at).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Total Members</p>
                    <p className="text-white font-semibold">{chamaMemberCounts[selectedGroup.id] || 0} members</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Status</p>
                    <p className="text-emerald-400 font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      Active
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Your Role</p>
                    <p className="text-amber-400 font-semibold">Administrator</p>
                  </div>
                </div>

                {/* Chama Rules */}
                {selectedGroup.rules && selectedGroup.rules.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-800">
                    <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Chama Rules
                    </h4>
                    <ul className="space-y-2">
                      {selectedGroup.rules.map((rule: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <span className="flex-shrink-0 w-5 h-5 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400 font-bold text-xs mt-0.5">
                            {index + 1}
                          </span>
                          <span className="text-slate-300">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Next Steps */}
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  🚀 Next Steps
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-amber-400 font-bold text-xs">1</span>
                    <div>
                      <p className="text-white font-semibold">Invite your first members</p>
                      <p className="text-slate-400 text-xs">Click "Invite Members" to generate invite links</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-amber-400 font-bold text-xs">2</span>
                    <div>
                      <p className="text-white font-semibold">Set up contribution rules</p>
                      <p className="text-slate-400 text-xs">Define monthly contribution amounts and schedules</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-amber-400 font-bold text-xs">3</span>
                    <div>
                      <p className="text-white font-semibold">Start collecting contributions</p>
                      <p className="text-slate-400 text-xs">Members can deposit via M-Pesa once they join</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Transaction Ledger */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-400" />
                  Transaction Ledger
                </h3>
                {loadingTransactions ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Loading transactions...</p>
                  </div>
                ) : chamaTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No transactions yet</p>
                    <p className="text-slate-600 text-xs mt-1">Transactions will appear here once members start contributing</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chamaTransactions.map((txn) => {
                      const isCredit = txn.transaction_type === 'deposit' || txn.transaction_type === 'repayment';
                      return (
                        <div key={txn.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                {isCredit ? '+' : '-'}
                              </div>
                              <div>
                                <p className="text-white font-semibold text-sm capitalize">{txn.transaction_type}</p>
                                <p className="text-slate-500 text-xs">{new Date(txn.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${isCredit ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {isCredit ? '+' : '-'} KES {parseFloat(txn.amount).toLocaleString()}
                              </p>
                              <p className="text-slate-500 text-xs capitalize">{txn.status}</p>
                            </div>
                          </div>
                          {/* Blockchain Badge */}
                          {txn.blockchain_hash && (
                            <div className="pt-3 border-t border-slate-800">
                              <BlockchainBadge
                                transactionHash={txn.blockchain_hash}
                                qrCode={txn.blockchain_qr_code}
                                explorerUrl={txn.blockchain_explorer_url}
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button className="w-full py-3 text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors">
                      View All Transactions →
                    </button>
                  </div>
                )}
              </div>

              {/* Pricing & Upgrade Section */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Crown className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                      Current Plan: Pay-as-you-go
                    </h3>
                    <p className="text-slate-300 text-sm mb-4">
                      You're on our flexible pay-as-you-go plan. Only pay for what you use with no monthly commitments.
                    </p>
                    
                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 mb-4">
                      <h4 className="text-white font-semibold text-sm mb-3">Pay-as-you-go Pricing:</h4>
                      <ul className="space-y-2 text-sm text-slate-300">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                          <span>1.5% on deposits</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                          <span>2% on loan disbursements</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                          <span>0.5% on withdrawals</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                          <span>No monthly fees</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-5 h-5 text-purple-400" />
                        <h4 className="text-white font-bold">Upgrade to Pro - $5/month</h4>
                      </div>
                      <ul className="space-y-2 text-sm text-slate-300 mb-3">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Unlimited members (vs 20 on free)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Advanced analytics & reports</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Priority support</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Custom branding</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Reduced transaction fees (1% deposits, 1.5% loans)</span>
                        </li>
                      </ul>
                      <button 
                        onClick={() => alert('🚀 Upgrade to Pro\n\nContact us to upgrade your chama to Pro:\n\n📧 Email: pro@smartchama.com\n📱 WhatsApp: +254 XXX XXX XXX\n\nOr visit our pricing page for more details.')}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Crown className="w-5 h-5" />
                        Upgrade to Pro
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 text-center">
                      💡 Pro plan saves you money if you process over KES 100,000/month
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {showInviteModal && inviteChama && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[32px] p-8 relative shadow-2xl">
            
            <button 
              onClick={() => {
                setShowInviteModal(false);
                setInviteChama(null);
                setInviteLink("");
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 rounded-full p-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <Users className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Invite Members</h2>
              <p className="text-slate-400 text-sm">
                Share this link to invite members to <span className="text-white font-bold">{inviteChama.name}</span>
              </p>
            </div>

            {generatingInvite ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Generating invite link...</p>
              </div>
            ) : inviteLink ? (
              <div className="space-y-6">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-2">Invite Link</p>
                  <p className="text-sm text-emerald-400 break-all font-mono">{inviteLink}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={copyInviteLink}
                    className="bg-slate-950 border border-slate-800 hover:border-emerald-500 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => {
                      const message = `Join our chama "${inviteChama.name}" on SmartChama!\n\n${inviteLink}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-all"
                  >
                    Share via WhatsApp
                  </button>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-xs text-amber-200">
                    <strong>Note:</strong> This link can be used 30 times and expires in 30 days.
                  </p>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      )}

    </div>
  );
}

export default function MyChamasPage() {
  return (
    <Suspense fallback={<div className="text-amber-500 p-10">Loading Chamas...</div>}>
      <MyChamasContent />
    </Suspense>
  );
}

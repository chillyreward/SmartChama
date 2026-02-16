"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, UserPlus, Users, X, Download, 
  ShieldCheck, CreditCard, Building2
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// --- CUSTOM CSS CHART COMPONENT ---
function NeonChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end justify-between h-32 mt-8 px-2 gap-2 w-full">
      {data.map((val, i) => (
        <div key={i} className="w-full h-full flex items-end relative group">
           <div 
             style={{ height: `${(val / max) * 100}%` }} 
             className="w-full bg-amber-500 rounded-t-sm opacity-60 group-hover:opacity-100 transition-all duration-300 shadow-[0_0_10px_rgba(251,191,36,0.3)] group-hover:shadow-[0_0_20px_rgba(251,191,36,0.6)]"
           ></div>
           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
             KES {val.toLocaleString()}
           </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalChamas: 0,
    monthlyGrowth: 0,
    activeLoans: 0
  });
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [chamas, setChamas] = useState<any[]>([]);
  const [loadingChamas, setLoadingChamas] = useState(false);
  const [selectedChama, setSelectedChama] = useState<any>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);

  useEffect(() => {
    fetchTransactions();
    fetchAdminStats();
    fetchAdminProfile();

    // Listen for invite modal event from layout
    const handleOpenInviteModal = () => {
      openInviteModal();
    };

    window.addEventListener('openInviteModal', handleOpenInviteModal);

    return () => {
      window.removeEventListener('openInviteModal', handleOpenInviteModal);
    };
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: adminData, error: adminError } = await supabase
        .from('chama_admins')
        .select('*')
        .eq('admin_user_id', user.id)
        .single();

      if (!adminError && adminData) {
        setAdminProfile(adminData);
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions?limit=1000');
      const data = await response.json();
      
      if (data.success) {
        const totalBalance = data.transactions.reduce((sum: number, txn: any) => {
          if (txn.status !== 'completed') return sum;
          const amount = parseFloat(txn.amount) || 0;
          if (txn.transaction_type === 'deposit' || txn.transaction_type === 'dividend' || txn.transaction_type === 'repayment') {
            return sum + amount;
          } else if (txn.transaction_type === 'withdrawal' || txn.transaction_type === 'loan' || txn.transaction_type === 'penalty') {
            return sum - amount;
          }
          return sum;
        }, 0);
        
        setBalance(totalBalance);
        setTransactions(data.transactions.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get admin ID first
      const { data: admin } = await supabase
        .from('chama_admins')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!admin) return;

      // Fetch chamas count for this admin
      const { data: chamasData, error: chamasError } = await supabase
        .from('chamas')
        .select('id', { count: 'exact' })
        .eq('admin_id', admin.id);

      if (!chamasError && chamasData) {
        setStats(prev => ({ ...prev, totalChamas: chamasData.length }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const openInviteModal = async () => {
    setInviteModalOpen(true);
    setSelectedChama(null);
    setInviteLink("");
    await fetchChamas();
  };

  const fetchChamas = async () => {
    setLoadingChamas(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

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

      const { data, error } = await supabase
        .from('chamas')
        .select('*')
        .eq('admin_id', admin.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching chamas:', error);
      } else {
        setChamas(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingChamas(false);
    }
  };

  const generateInviteLink = async (chama: any) => {
    setSelectedChama(chama);
    setGeneratingInvite(true);
    
    try {
      // Get current user
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

      console.log('Generating invite for chama:', chama.id);

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

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', errorText);
        throw new Error(`Failed to generate invite: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Invite generated:', data);

      if (data.success) {
        setInviteLink(data.inviteLink);
      } else {
        alert('Failed to generate invite link: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating invite:', error);
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          alert('Network error: Please check if the dev server is running and try again.');
        } else {
          alert('Failed to generate invite link: ' + error.message);
        }
      } else {
        alert('Failed to generate invite link. Please try again.');
      }
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  return (
    <div className="space-y-8">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Admin Overview</h2>
          <p className="text-slate-400 text-sm">Manage your chamas and monitor performance</p>
        </div>
        
        {adminProfile && (
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
            <div className="size-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
              {adminProfile.full_name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <p className="text-white font-bold text-sm">{adminProfile.full_name || 'Admin'}</p>
              <p className="text-slate-400 text-xs">{adminProfile.email || ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BALANCE CARD */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-[32px] p-8 border border-amber-500/20 bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-slate-900"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-400/80 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Total Liquidity
                </p>
                <h3 className="text-5xl lg:text-6xl font-black text-white tracking-tighter">
                  <span className="text-2xl align-top opacity-50 mr-1">KES</span>
                  {loadingTransactions ? "..." : balance.toLocaleString()}
                </h3>
              </div>
              <div className="bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white font-mono flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-amber-400" /> AES-256
              </div>
            </div>
            
            <NeonChart data={[35000, 42000, 28000, 55000, 48000, 62000, 75000]} />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/admin/dashboard/chamas" className="bg-slate-900 border border-slate-800 rounded-[24px] p-6 flex flex-col justify-between hover:border-amber-500/50 hover:bg-amber-950/10 transition-all group">
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-white mt-4">My Chamas</span>
          </Link>
          
          <button onClick={openInviteModal} className="bg-slate-900 border border-slate-800 rounded-[24px] p-6 flex flex-col justify-between hover:border-emerald-500/50 hover:bg-emerald-950/10 transition-all group">
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="font-bold text-white mt-4">Invite</span>
          </button>

          <Link href="/admin/dashboard/analytics" className="col-span-2 bg-slate-900 border border-slate-800 rounded-[24px] p-6 flex items-center justify-between hover:bg-slate-800 transition-all group">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block font-bold text-white">Analytics</span>
                <span className="text-xs text-slate-500">View Reports</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-400" />
            <span className="text-xs text-slate-500 font-bold">TOTAL</span>
          </div>
          <h4 className="text-3xl font-black text-white">{stats.totalMembers}</h4>
          <p className="text-xs text-slate-400 mt-1">Active Members</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-8 h-8 text-amber-400" />
            <span className="text-xs text-slate-500 font-bold">CHAMAS</span>
          </div>
          <h4 className="text-3xl font-black text-white">{stats.totalChamas}</h4>
          <p className="text-xs text-slate-400 mt-1">Groups Managed</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
            <span className="text-xs text-slate-500 font-bold">GROWTH</span>
          </div>
          <h4 className="text-3xl font-black text-white">{stats.monthlyGrowth}%</h4>
          <p className="text-xs text-slate-400 mt-1">This Month</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-8 h-8 text-purple-400" />
            <span className="text-xs text-slate-500 font-bold">LOANS</span>
          </div>
          <h4 className="text-3xl font-black text-white">{stats.activeLoans}</h4>
          <p className="text-xs text-slate-400 mt-1">Active Loans</p>
        </div>
      </div>

      {/* TRANSACTIONS */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Recent Activity
            <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">LIVE</span>
          </h3>
          <button 
            onClick={() => alert("📊 Export Feature\n\nUpgrade to Pro to export transaction data to CSV/Excel.\n\nPro features include:\n• Unlimited exports\n• Advanced analytics\n• Custom reports\n• Priority support")}
            className="text-xs bg-slate-800 hover:bg-amber-500 hover:text-black px-4 py-2 rounded-full text-white flex items-center gap-2 transition-all font-bold"
          >
            <Download className="w-3 h-3" /> Export
          </button>
        </div>
        
        <div className="space-y-3">
          {loadingTransactions ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No transactions yet</div>
          ) : (
            transactions.map((txn) => {
              const isNegative = txn.transaction_type === 'penalty' || txn.transaction_type === 'withdrawal';
              const typeLabelMap: Record<string, string> = {
                'deposit': 'Deposit',
                'withdrawal': 'Withdrawal',
                'loan': 'Loan Disbursed',
                'repayment': 'Loan Repayment',
                'penalty': 'Late Penalty',
                'dividend': 'Dividend Payout'
              };
              const typeLabel = typeLabelMap[txn.transaction_type] || txn.transaction_type;
              const initials = txn.mpesa_receipt_number?.slice(0, 2) || 'TX';

              return (
                <div key={txn.id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5 hover:border-amber-500/20 hover:bg-slate-900 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs group-hover:bg-amber-500 group-hover:text-black transition-colors">
                      {initials}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{typeLabel}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {txn.mpesa_receipt_number || `TXN-${txn.id.slice(0, 8)}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${isNegative ? "text-amber-500" : "text-emerald-400"}`}>
                      {isNegative ? "-" : "+"} KES {parseFloat(txn.amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* INVITE MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-[32px] p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setInviteModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 rounded-full p-2 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="mb-6 text-center pt-4">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
                <UserPlus className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">Invite Members</h3>
              <p className="text-slate-400 text-sm mt-2">
                {!selectedChama ? 'Select a chama to generate an invite link' : 'Share this link with new members'}
              </p>
            </div>

            {!selectedChama ? (
              // CHAMA SELECTION VIEW
              <div className="space-y-4">
                <p className="text-xs text-slate-400 font-bold uppercase ml-1">Select Chama</p>
                
                {loadingChamas ? (
                  <div className="text-center py-8 text-slate-500">Loading chamas...</div>
                ) : chamas.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500 mb-4">No chamas found. Create one first!</p>
                    <Link 
                      href="/admin/dashboard/chamas"
                      className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-6 rounded-xl transition-all"
                    >
                      Create Chama
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {chamas.map((chama) => (
                      <button
                        key={chama.id}
                        onClick={() => generateInviteLink(chama)}
                        disabled={generatingInvite}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-emerald-500 hover:bg-slate-900 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg">
                              {chama.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white text-lg">{chama.name}</p>
                              <p className="text-xs text-slate-500">
                                Balance: KES {parseFloat(chama.total_balance || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <UserPlus className="w-5 h-5" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // INVITE LINK VIEW
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="size-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg">
                      {selectedChama.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{selectedChama.name}</p>
                      <p className="text-xs text-slate-500">Invite link generated</p>
                    </div>
                  </div>
                </div>

                {generatingInvite ? (
                  <div className="text-center py-8 text-slate-500">Generating invite link...</div>
                ) : inviteLink ? (
                  <>
                    <div>
                      <label className="text-xs text-slate-400 font-bold uppercase ml-1 mb-2 block">
                        Invite Link
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={inviteLink}
                          readOnly
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm font-mono outline-none"
                        />
                        <button
                          onClick={copyInviteLink}
                          className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 rounded-xl transition-all"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                      <p className="text-xs text-amber-400 font-bold mb-2">📋 INVITE DETAILS</p>
                      <ul className="text-xs text-slate-300 space-y-1">
                        <li>• Valid for 30 days</li>
                        <li>• Maximum 30 uses</li>
                        <li>• Members will be added to {selectedChama.name}</li>
                      </ul>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedChama(null);
                          setInviteLink("");
                        }}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all"
                      >
                        Generate Another
                      </button>
                      <button
                        onClick={() => setInviteModalOpen(false)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-all"
                      >
                        Done
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

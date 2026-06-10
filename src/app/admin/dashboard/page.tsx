"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, UserPlus, Users, X, Download, 
  ShieldCheck, CreditCard, Building2
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// --- CUSTOM CLEAN CHART COMPONENT ---
function CleanChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end justify-between h-32 mt-8 px-2 gap-2 w-full">
      {data.map((val, i) => (
        <div key={i} className="w-full h-full flex items-end relative group">
           <div 
             style={{ height: `${(val / max) * 100}%` }} 
             className="w-full bg-[#22C55E] rounded-t opacity-80 group-hover:opacity-100 transition-all duration-300"
           ></div>
           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0B0F0C] border border-[#E5E7EB] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-sm">
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
      const { data: adminData } = await supabase.from('chama_admins').select('*').eq('admin_user_id', user.id).single();
      if (adminData) setAdminProfile(adminData);
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
          if (txn.transaction_type === 'deposit' || txn.transaction_type === 'dividend' || txn.transaction_type === 'repayment') return sum + amount;
          if (txn.transaction_type === 'withdrawal' || txn.transaction_type === 'loan' || txn.transaction_type === 'penalty') return sum - amount;
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: admin } = await supabase.from('chama_admins').select('id').eq('email', user.email).single();
      if (!admin) return;
      const { data: chamasData } = await supabase.from('chamas').select('id', { count: 'exact' }).eq('admin_id', admin.id);
      if (chamasData) setStats(prev => ({ ...prev, totalChamas: chamasData.length }));
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
      const { data: admin } = await supabase.from('chama_admins').select('id').eq('email', user.email).single();
      if (!admin) { setLoadingChamas(false); return; }
      const { data } = await supabase.from('chamas').select('*').eq('admin_id', admin.id).order('created_at', { ascending: false });
      if (data) setChamas(data);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert('You must be logged in to generate invite links'); setGeneratingInvite(false); return; }
      const { data: admin } = await supabase.from('chama_admins').select('id').eq('email', user.email).single();
      if (!admin) { alert('Admin account not found'); setGeneratingInvite(false); return; }

      const response = await fetch('/api/invite/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chamaId: chama.id, maxUses: 30, expiresInDays: 30 })
      });
      if (!response.ok) throw new Error(`Failed to generate invite`);
      const data = await response.json();
      if (data.success) {
        setInviteLink(data.inviteLink);
      } else {
        alert('Failed to generate invite link: ' + data.error);
      }
    } catch (error) {
      alert('Failed to generate invite link. Please try again.');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full font-inter space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-geist font-bold text-on-surface">Admin Overview</h1>
          <p className="text-body-sm text-secondary mt-1">Manage your chamas and monitor performance</p>
        </div>
        
        {adminProfile && (
          <div className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 w-full md:w-auto shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#0B0F0C] flex items-center justify-center text-white font-bold shrink-0 text-sm">
              {adminProfile.full_name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-on-surface font-bold text-sm truncate">{adminProfile.full_name || 'Admin'}</p>
              <p className="text-secondary text-xs truncate">{adminProfile.email || ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BALANCE CARD */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-lg p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-label-caps text-on-surface-variant mb-2">
                Total Liquidity
              </p>
              <h3 className="text-display-lg font-geist font-black text-on-surface tracking-tight">
                <span className="text-2xl align-top opacity-50 mr-2 font-inter font-normal">KES</span>
                {loadingTransactions ? "..." : balance.toLocaleString()}
              </h3>
            </div>
            <div className="hidden md:flex bg-surface-container-low px-3 py-1.5 rounded border border-[#E5E7EB] text-xs text-on-surface font-mono items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-[#22C55E]" /> AES-256
            </div>
          </div>
          <CleanChart data={[35000, 42000, 28000, 55000, 48000, 62000, 75000]} />
        </div>

        {/* ACTIONS */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/admin/dashboard/chamas" className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between hover:bg-gray-50 transition-colors group shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-surface-container-low text-[#22C55E] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-medium text-on-surface mt-4 text-sm md:text-base">My Chamas</span>
          </Link>
          
          <button onClick={openInviteModal} className="text-left bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between hover:bg-gray-50 transition-colors group shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-surface-container-low text-[#22C55E] flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="font-medium text-on-surface mt-4 text-sm md:text-base">Invite</span>
          </button>

          <Link href="/admin/dashboard/analytics" className="col-span-2 bg-white border border-[#E5E7EB] rounded-lg p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-surface-container-low text-[#22C55E] flex items-center justify-center group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block font-medium text-on-surface">Analytics</span>
                <span className="text-xs text-secondary mt-1 block">View Reports</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, value: stats.totalMembers, label: "Members" },
          { icon: Building2, value: stats.totalChamas, label: "Chamas" },
          { icon: TrendingUp, value: `${stats.monthlyGrowth}%`, label: "Growth" },
          { icon: CreditCard, value: stats.activeLoans, label: "Loans" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="w-6 h-6 text-[#22C55E]" />
            </div>
            <h4 className="text-display-sm font-geist text-on-surface mb-1">{stat.value}</h4>
            <p className="text-label-caps text-on-surface-variant">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* TRANSACTIONS */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-headline-sm font-geist text-on-surface flex items-center gap-2">
            Recent Activity
            <span className="bg-surface-container-low text-[#22C55E] border border-[#4ae176] text-mono-data px-2 py-0.5 rounded">LIVE</span>
          </h3>
          <button 
            onClick={() => alert("Export Feature\n\nUpgrade to Pro to export transaction data to CSV/Excel.")}
            className="text-body-sm bg-white border border-[#E5E7EB] hover:bg-gray-50 px-4 py-2 rounded text-on-surface flex items-center justify-center gap-2 transition-colors font-medium w-full sm:w-auto"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
        
        <div className="space-y-0">
          {loadingTransactions ? (
            <div className="text-center py-8 text-secondary">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-secondary">No transactions yet</div>
          ) : (
            transactions.map((txn) => {
              const isNegative = txn.transaction_type === 'penalty' || txn.transaction_type === 'withdrawal' || txn.transaction_type === 'loan';
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
                <div key={txn.id} className="flex items-center justify-between py-4 border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50 transition-colors px-2 rounded -mx-2">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-surface-container-low text-[#22C55E] flex items-center justify-center font-bold text-xs">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-on-surface text-body-sm truncate">{typeLabel}</p>
                      <p className="text-mono-data text-secondary truncate mt-1">
                        {txn.mpesa_receipt_number || `TXN-${txn.id.slice(0, 8)}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <p className={`font-medium text-body-sm ${isNegative ? "text-on-surface" : "text-[#22C55E]"}`}>
                      {isNegative ? "-" : "+"} KES {parseFloat(txn.amount).toLocaleString()}
                    </p>
                    <p className="text-mono-data text-secondary hidden sm:block mt-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F0C]/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E7EB] w-full max-w-2xl rounded-xl p-6 relative shadow-2xl max-h-[90vh] flex flex-col font-inter">
            <button 
              onClick={() => setInviteModalOpen(false)} 
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface bg-gray-100 rounded-full p-2 transition-colors z-10 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="mb-6 text-center pt-4 shrink-0">
              <div className="w-16 h-16 bg-surface-container-low rounded-xl flex items-center justify-center mx-auto mb-4 border border-[#4ae176]">
                <UserPlus className="w-8 h-8 text-[#22C55E]" />
              </div>
              <h3 className="text-headline-lg font-geist font-bold text-on-surface tracking-tight">Invite Members</h3>
              <p className="text-body-sm text-secondary mt-2">
                {!selectedChama ? 'Select a chama to generate an invite link' : 'Share this link with new members'}
              </p>
            </div>

            <div className="overflow-y-auto pr-2">
              {!selectedChama ? (
                // CHAMA SELECTION VIEW
                <div className="space-y-4">
                  <p className="text-label-caps text-on-surface-variant">Select Chama</p>
                  
                  {loadingChamas ? (
                    <div className="text-center py-8 text-secondary">Loading chamas...</div>
                  ) : chamas.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-secondary mb-4 text-body-sm">No chamas found. Create one first!</p>
                      <Link 
                        href="/admin/dashboard/chamas"
                        className="inline-block bg-[#22C55E] hover:bg-[#006e2f] text-white font-medium py-3 px-6 rounded transition-all text-body-sm"
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
                          className="w-full bg-white border border-[#E5E7EB] rounded-lg p-4 hover:border-[#22C55E] hover:bg-surface-container-lowest transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-12 h-12 shrink-0 rounded bg-gray-100 text-[#0B0F0C] flex items-center justify-center font-bold text-lg">
                                {chama.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-on-surface text-body-lg truncate">{chama.name}</p>
                                <p className="text-body-sm text-secondary truncate mt-1">
                                  Balance: KES {parseFloat(chama.total_balance || 0).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-[#22C55E] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
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
                <div className="space-y-6">
                  <div className="bg-gray-50 border border-[#E5E7EB] rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 shrink-0 rounded bg-white border border-[#E5E7EB] text-[#0B0F0C] flex items-center justify-center font-bold text-lg">
                        {selectedChama.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-on-surface text-body-lg truncate">{selectedChama.name}</p>
                        <p className="text-body-sm text-secondary mt-1">Invite link generated</p>
                      </div>
                    </div>
                  </div>

                  {generatingInvite ? (
                    <div className="text-center py-8 text-secondary">Generating invite link...</div>
                  ) : inviteLink ? (
                    <>
                      <div>
                        <label className="text-label-caps text-on-surface-variant block mb-2">
                          Invite Link
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text" 
                            value={inviteLink}
                            readOnly
                            className="flex-1 bg-white border border-[#E5E7EB] rounded p-3 text-on-surface text-body-sm font-mono outline-none w-full focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]"
                          />
                          <button
                            onClick={copyInviteLink}
                            className="bg-[#22C55E] hover:bg-[#006e2f] text-white font-medium px-6 py-3 rounded transition-all whitespace-nowrap text-body-sm"
                          >
                            Copy Link
                          </button>
                        </div>
                      </div>

                      <div className="bg-surface-container-low border border-[#4ae176] rounded-lg p-4">
                        <p className="text-label-caps text-[#22C55E] mb-2">INVITE DETAILS</p>
                        <ul className="text-body-sm text-on-surface-variant space-y-1">
                          <li>• Valid for 30 days</li>
                          <li>• Maximum 30 uses</li>
                          <li>• Members will be added to {selectedChama.name}</li>
                        </ul>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 mt-6">
                        <button
                          onClick={() => {
                            setSelectedChama(null);
                            setInviteLink("");
                          }}
                          className="flex-1 bg-white border border-[#E5E7EB] hover:bg-gray-50 text-on-surface font-medium py-3 rounded transition-all text-body-sm"
                        >
                          Generate Another
                        </button>
                        <button
                          onClick={() => setInviteModalOpen(false)}
                          className="flex-1 bg-[#22C55E] hover:bg-[#006e2f] text-white font-medium py-3 rounded transition-all text-body-sm"
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
        </div>
      )}

    </div>
  );
}
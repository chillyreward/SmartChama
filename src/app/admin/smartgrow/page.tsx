"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function AdminSmartGrowPage() {
  const { member: adminMember, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);

  const [toastMsg, setToastMsg] = useState("");
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState("");

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  useEffect(() => {
    if (!adminMember || !group) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: wData } = await supabase.from('wallets').select('*').eq('group_id', group.id).single();
        setWallet(wData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [adminMember, group]);

  const handleInvest = async () => {
    if (!wallet || !investAmount) return;
    const amt = Number(investAmount);
    if (amt > wallet.balance) {
      alert("Insufficient wallet balance");
      return;
    }

    try {
      await supabase.from('wallets').update({
        balance: Number(wallet.balance) - amt
        // In a full implementation we'd add an "invested_balance" field to wallets
      }).eq('id', wallet.id);

      await supabase.from('transactions').insert({
        group_id: group?.id,
        type: 'smartgrow_investment',
        amount: -amt,
        recorded_by: adminMember?.id,
        notes: "Transferred to SmartGrow Fixed Income",
        status: 'confirmed'
      });

      setToastMsg("Funds invested in SmartGrow!");
      setTimeout(() => setToastMsg(""), 3000);
      setShowInvestModal(false);
      setInvestAmount("");
      
      const { data: wData } = await supabase.from('wallets').select('*').eq('group_id', group?.id).single();
      setWallet(wData);
    } catch (err) {
      alert("Error investing");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-64 bg-white border border-[#E5E7EB] rounded-lg animate-pulse mb-6 shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="p-8 font-inter">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#22C55E] text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* HERO BANNER */}
      <div className="bg-[#0B0F0C] rounded-xl p-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-md">
        <div className="flex-1">
          <div className="text-label-caps text-gray-400">ADMIN ASSET MANAGEMENT</div>
          <h1 className="text-[40px] font-geist font-bold text-white mt-2 leading-tight">
            Put idle group funds to work.
          </h1>
          <p className="text-body-lg text-gray-400 mt-3 max-w-xl">
            SmartGrow lets your chama invest unused wallet funds into vetted, low-risk instruments (MMFs, T-Bills) and earn passive returns as a group.
          </p>
          
          <button 
            onClick={() => setShowInvestModal(true)}
            className="mt-6 bg-[#22C55E] hover:bg-[#006e2f] text-white px-6 py-3 rounded text-headline-sm font-medium transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined">trending_up</span>
            Invest from Wallet
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 w-full md:w-72 shrink-0">
          <div className="text-label-caps text-gray-400 mb-1">CURRENT INVESTED PORTFOLIO</div>
          <div className="text-display-sm font-geist font-bold text-white mb-4">
            KSh 0
          </div>
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center text-body-sm">
              <span className="text-gray-400">YTD Returns</span>
              <span className="text-[#22C55E] font-medium">+0.00%</span>
            </div>
            <div className="flex justify-between items-center text-body-sm">
              <span className="text-gray-400">Wallet Available</span>
              <span className="text-white font-medium">KSh {formatCurrency(wallet?.balance || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* INVEST MODAL */}
      {showInvestModal && (
        <div className="fixed inset-0 bg-[#0B0F0C]/40 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-headline-sm font-geist font-bold text-on-surface mb-2">Invest in SmartGrow</h2>
            <p className="text-body-sm text-secondary mb-6">Transfer funds from group wallet to SmartGrow MMF.</p>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-label-caps text-secondary">Available Wallet</span>
                  <span className="font-mono font-bold text-primary">KSh {formatCurrency(wallet?.balance || 0)}</span>
                </div>
                <input 
                  type="number" 
                  value={investAmount} 
                  onChange={e => setInvestAmount(e.target.value)} 
                  placeholder="Amount to invest..."
                  className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E]" 
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowInvestModal(false)} className="flex-1 bg-white border border-[#E5E7EB] rounded py-2 text-body-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleInvest} disabled={!investAmount} className="flex-1 bg-[#22C55E] disabled:opacity-50 text-white rounded py-2 text-body-sm font-medium hover:bg-[#006e2f]">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

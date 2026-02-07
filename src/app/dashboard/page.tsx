"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Plus, Coins, TrendingUp, UserPlus, Grid3X3, Bell, Wallet, 
  ArrowUpRight, ShieldCheck, Users, X, Download, CreditCard,
  ChevronDown, Search
} from "lucide-react";

// --- CUSTOM CSS CHART COMPONENT (No Library Needed) ---
function NeonChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end justify-between h-32 mt-8 px-2 gap-2 w-full">
      {data.map((val, i) => (
        <div key={i} className="w-full h-full flex items-end relative group">
           {/* The Bar */}
           <div 
             style={{ height: `${(val / max) * 100}%` }} 
             className="w-full bg-emerald-500 rounded-t-sm opacity-60 group-hover:opacity-100 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]"
           ></div>
           {/* Tooltip */}
           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
             KES {val.toLocaleString()}
           </div>
        </div>
      ))}
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const userName = searchParams.get("user") || "Member";
  const userRole = searchParams.get("role")?.toLowerCase() || "member";
  const isAdmin = userRole === "admin";
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // 'deposit', 'loan', 'wallet'

  const openModal = (type: string) => {
    setModalType(type);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Overview
          </h2>
          <p className="text-slate-400 text-sm">Welcome back, <span className="text-emerald-400 font-bold">{userName}</span></p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/dashboard/chat" className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full text-slate-300 hover:text-white transition-colors group">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold group-hover:text-emerald-400 transition-colors">AI Advisor Online</span>
          </Link>
          
          <div className="relative group cursor-pointer">
             <div className="size-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-slate-900 flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                {userName.charAt(0).toUpperCase()}
             </div>
             {/* Simple Dropdown for Profile */}
             <div className="absolute right-0 top-12 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto p-2 z-50">
                <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-800 mb-1">Signed in as {userName}</div>
                <Link href="/login" className="block px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg">Sign Out</Link>
             </div>
          </div>
        </div>
      </div>

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COL: BALANCE CARD --- */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-[32px] p-8 group transition-all duration-500 border border-white/5 bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-slate-900"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-400/80 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {isAdmin ? "Total Liquidity" : "Available Balance"}
                </p>
                <h3 className="text-5xl lg:text-6xl font-black text-white tracking-tighter shadow-black drop-shadow-lg">
                  <span className="text-2xl align-top opacity-50 mr-1">KES</span>
                  {isAdmin ? "1,250,000" : "45,000"}
                </h3>
              </div>
              <div className="bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white font-mono flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> AES-256
              </div>
            </div>
            
            {/* THE CSS CHART */}
            <NeonChart data={[35000, 42000, 28000, 55000, 48000, 62000, 75000]} />
          </div>
        </div>

        {/* RIGHT COL: ACTIONS --- */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => openModal('deposit')} className="bg-slate-900 border border-slate-800 rounded-[24px] p-6 flex flex-col justify-between hover:border-emerald-500/50 hover:bg-emerald-950/10 transition-all group">
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span className="font-bold text-white mt-4">Deposit</span>
          </button>
          
          {isAdmin ? (
             <Link href="/dashboard/create" className="bg-slate-900 border border-slate-800 rounded-[24px] p-6 flex flex-col justify-between hover:border-blue-500/50 hover:bg-blue-950/10 transition-all group">
               <div className="size-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <UserPlus className="w-5 h-5" />
               </div>
               <span className="font-bold text-white mt-4">Invite</span>
             </Link>
          ) : (
             <button onClick={() => openModal('loan')} className="bg-slate-900 border border-slate-800 rounded-[24px] p-6 flex flex-col justify-between hover:border-amber-500/50 hover:bg-amber-950/10 transition-all group">
               <div className="size-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Coins className="w-5 h-5" />
               </div>
               <span className="font-bold text-white mt-4">Borrow</span>
             </button>
          )}

          <button onClick={() => openModal('wallet')} className="col-span-2 bg-slate-900 border border-slate-800 rounded-[24px] p-6 flex items-center justify-between hover:bg-slate-800 transition-all group">
            <div className="flex items-center gap-4">
               <div className="size-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Wallet className="w-5 h-5" />
               </div>
               <div className="text-left">
                 <span className="block font-bold text-white">My Wallet</span>
                 <span className="text-xs text-slate-500">Manage Cards & Banks</span>
               </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

       {/* --- TRANSACTIONS LIST --- */}
       <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-6 lg:p-8">
         <div className="flex items-center justify-between mb-6">
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
             Recent Activity
             <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">LIVE</span>
           </h3>
           <button 
             onClick={() => alert("Downloading CSV...")}
             className="text-xs bg-slate-800 hover:bg-emerald-500 hover:text-black px-4 py-2 rounded-full text-white flex items-center gap-2 transition-all font-bold"
           >
             <Download className="w-3 h-3" /> Export Data
           </button>
         </div>
         
         <div className="space-y-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5 hover:border-emerald-500/20 hover:bg-slate-900 transition-all cursor-pointer group">
                 <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                      {["SM", "DO", "JK", "AL"][i-1]}
                    </div>
                    <div>
                       <p className="font-bold text-white text-sm">
                         {["Monthly Contribution", "Loan Repayment", "Late Penalty", "Dividend Payout"][i-1]}
                       </p>
                       <p className="text-[10px] text-slate-500 font-mono">TXN-{88293 + i}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className={`font-bold text-sm ${i === 3 ? "text-amber-500" : "text-emerald-400"}`}>
                      {i === 3 ? "-" : "+"} KES {(Math.random() * 5000 + 1000).toFixed(0)}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase">
                      {new Date().toLocaleDateString()}
                    </p>
                 </div>
              </div>
            ))}
         </div>
       </div>

      {/* --- MODAL (The Popup) --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[32px] p-6 relative shadow-2xl">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 rounded-full p-2 transition-colors">
              <X className="w-4 h-4" />
            </button>
            
            <div className="mb-8 text-center pt-4">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
                {modalType === 'deposit' && <Plus className="w-8 h-8 text-emerald-500" />}
                {modalType === 'loan' && <Coins className="w-8 h-8 text-amber-500" />}
                {modalType === 'wallet' && <Wallet className="w-8 h-8 text-purple-500" />}
              </div>
              <h3 className="text-2xl font-black text-white capitalize tracking-tight">{modalType}</h3>
              <p className="text-slate-400 text-sm mt-2">
                {modalType === 'deposit' && "Funds will be deducted from your MPesa."}
                {modalType === 'loan' && "Interest rate: 1.2% per month."}
                {modalType === 'wallet' && "Manage your linked bank accounts."}
              </p>
            </div>

            <form className="space-y-4">
               <div>
                 <label className="text-xs text-slate-400 font-bold uppercase ml-1">Amount (KES)</label>
                 <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-lg font-bold outline-none focus:border-emerald-500 transition-colors" placeholder="0.00" />
               </div>
               
               <button type="button" onClick={() => setModalOpen(false)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                 Confirm {modalType}
               </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-emerald-500 p-10">Loading Command Center...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
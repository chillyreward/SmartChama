"use client";

import { useState } from "react";
import { 
  TrendingUp, Shield, AlertCircle, ArrowUpRight, 
  Landmark, Briefcase, ChevronRight, CheckCircle, X, ExternalLink 
} from "lucide-react";

// --- MOCK INVESTMENT DATA ---
const opportunities = [
  {
    id: 1,
    title: "NCBA Money Market Fund",
    type: "Low Risk",
    returnRate: "14.5%",
    minDeposit: 5000,
    partner: "NCBA Bank",
    description: "A low-risk fund that invests in short-term interest bearing assets. Your capital is safe and earns daily compounded interest.",
    color: "emerald"
  },
  {
    id: 2,
    title: "Government Infrastructure Bond",
    type: "Medium Risk",
    returnRate: "16.8%",
    minDeposit: 50000,
    partner: "Central Bank of Kenya",
    description: "Tax-free infrastructure bond. Lock in your savings for 5 years with guaranteed semi-annual coupon payments.",
    color: "blue"
  },
  {
    id: 3,
    title: "Nairobi Tech Hub Real Estate",
    type: "High Risk",
    returnRate: "22.4%",
    minDeposit: 100000,
    partner: "Mi Vida Homes",
    description: "Equity stake in the upcoming tech city housing project. High growth potential driven by rental yield and appreciation.",
    color: "purple"
  }
];

export default function SmartGrowPage() {
  const [selectedInvest, setSelectedInvest] = useState<any>(null);

  return (
    <div className="space-y-8 pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            SmartGrow <span className="bg-emerald-500 text-black text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">Pro</span>
          </h1>
          <p className="text-slate-400 mt-1">Institutional-grade investments for your Chama.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-white">Market Status: Open</span>
        </div>
      </div>

      {/* --- PORTFOLIO SUMMARY --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-3xl p-6">
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">Total Invested</p>
          <h3 className="text-4xl font-black text-white">KES 850,000</h3>
          <p className="text-slate-400 text-sm mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> +12.4% All Time
          </p>
        </div>
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-center">
           <h4 className="font-bold text-white mb-4">Trusted Partners</h4>
           <div className="flex flex-wrap gap-4">
             {["NCBA Loop", "KCB Capital", "Old Mutual", "Sanlam"].map((bank, i) => (
               <div key={i} className="px-6 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 font-bold hover:border-emerald-500/50 hover:text-white transition-all cursor-pointer flex items-center gap-2">
                 <Landmark className="w-4 h-4" /> {bank}
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* --- OPPORTUNITIES GRID --- */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          Verified Opportunities <Shield className="w-5 h-5 text-emerald-500" />
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((item) => (
            <div key={item.id} className="group bg-slate-900 border border-slate-800 rounded-[32px] p-1 overflow-hidden hover:border-emerald-500/50 transition-all">
              <div className="bg-slate-950 rounded-[28px] p-6 h-full flex flex-col justify-between relative overflow-hidden">
                
                {/* Decoration */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${item.color}-500/10 blur-3xl rounded-full group-hover:bg-${item.color}-500/20 transition-all`}></div>

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      item.type === 'Low Risk' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      item.type === 'Medium Risk' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    }`}>
                      {item.type}
                    </span>
                    <Briefcase className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                  
                  <h4 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{item.title}</h4>
                  <p className="text-xs text-slate-500 mb-6">via {item.partner}</p>

                  <div className="flex justify-between items-end border-t border-slate-800 pt-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Annual Return</p>
                      <p className="text-2xl font-black text-white">{item.returnRate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase text-right">Min Investment</p>
                      <p className="text-sm font-bold text-white text-right">KES {item.minDeposit.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedInvest(item)}
                  className="w-full mt-6 bg-slate-900 border border-slate-700 hover:bg-white hover:text-black text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  View Details <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MODAL: INVESTMENT DETAILS --- */}
      {selectedInvest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#020617] border border-slate-700 w-full max-w-2xl rounded-[32px] p-8 relative shadow-2xl overflow-hidden">
            
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 bg-${selectedInvest.color}-500/10 blur-[80px] pointer-events-none`}></div>

            <button onClick={() => setSelectedInvest(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white bg-slate-900 rounded-full p-2 transition-colors z-10">
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800">
                  <Landmark className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                   <h2 className="text-2xl font-bold text-white">{selectedInvest.title}</h2>
                   <p className="text-slate-400 text-sm">Partnership with {selectedInvest.partner}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                 <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-500 uppercase">APY</p>
                    <p className="text-xl font-bold text-emerald-400">{selectedInvest.returnRate}</p>
                 </div>
                 <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-500 uppercase">Risk</p>
                    <p className="text-xl font-bold text-white">{selectedInvest.type}</p>
                 </div>
                 <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-500 uppercase">Lock Period</p>
                    <p className="text-xl font-bold text-white">6 Months</p>
                 </div>
              </div>

              <h3 className="font-bold text-white mb-2">About this Asset</h3>
              <p className="text-slate-400 leading-relaxed mb-8 text-sm">
                {selectedInvest.description}
                <br /><br />
                By proceeding, you agree to the Terms & Conditions set by {selectedInvest.partner}. 
                SmartChama acts as an intermediary platform.
              </p>

              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 mb-8">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-200/80">
                  <strong>Investment Disclaimer:</strong> Past performance is not indicative of future results. 
                  Ensure your group has voted on this allocation.
                </p>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setSelectedInvest(null)} className="flex-1 py-4 rounded-xl font-bold text-slate-400 hover:bg-slate-900 transition-colors">
                  Cancel
                </button>
                <button onClick={() => alert("Redirecting to Bank API...")} className="flex-[2] bg-emerald-500 hover:bg-emerald-400 text-black py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  Start Investment <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
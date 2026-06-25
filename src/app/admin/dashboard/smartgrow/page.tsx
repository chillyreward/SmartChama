"use client";

import { useState } from "react";
import { 
  TrendingUp, Shield, AlertCircle, ArrowUpRight, 
  Landmark, Briefcase, X, ExternalLink 
} from "lucide-react";

// --- REAL INVESTMENT OPPORTUNITIES ---
const opportunities = [
  {
    id: 1,
    title: "CIC Money Market Fund",
    type: "Low Risk",
    returnRate: "12.5%",
    minDeposit: 5000,
    partner: "CIC Asset Management",
    description: "A low-risk fund that invests in short-term interest bearing assets. Your capital is safe and earns daily compounded interest.",
    color: "emerald",
    url: "https://cicassetmanagement.co.ke/money-market-fund/"
  },
  {
    id: 2,
    title: "Kenya Government Treasury Bonds",
    type: "Medium Risk",
    returnRate: "15.8%",
    minDeposit: 50000,
    partner: "Central Bank of Kenya",
    description: "Tax-free government bonds. Lock in your savings with guaranteed semi-annual coupon payments backed by the government.",
    color: "blue",
    url: "https://www.centralbank.go.ke/securities/government-securities/"
  },
  {
    id: 3,
    title: "Sanlam Money Market Fund",
    type: "Low Risk",
    returnRate: "13.2%",
    minDeposit: 10000,
    partner: "Sanlam Investments",
    description: "Invest in high-quality short-term securities. Offers liquidity and competitive returns with minimal risk.",
    color: "emerald",
    url: "https://www.sanlaminvestments.com/money-market-fund"
  },
  {
    id: 4,
    title: "NCBA Unit Trust Fund",
    type: "Medium Risk",
    returnRate: "16.5%",
    minDeposit: 25000,
    partner: "NCBA Investment Bank",
    description: "Diversified portfolio of equities and fixed income securities. Professional fund management with quarterly dividends.",
    color: "blue",
    url: "https://ncbabankgroup.com/investment-banking/unit-trusts"
  },
  {
    id: 5,
    title: "Old Mutual Balanced Fund",
    type: "Medium Risk",
    returnRate: "17.3%",
    minDeposit: 20000,
    partner: "Old Mutual Kenya",
    description: "Balanced mix of equities, bonds, and money market instruments. Ideal for medium-term growth with managed risk.",
    color: "blue",
    url: "https://www.oldmutual.co.ke/personal/investments/unit-trusts/balanced-fund/"
  },
  {
    id: 6,
    title: "Fahari I-REIT",
    type: "High Risk",
    returnRate: "8.5%",
    minDeposit: 20,
    partner: "Nairobi Securities Exchange",
    description: "Kenya's first Real Estate Investment Trust. Invest in commercial real estate with rental income and capital appreciation potential.",
    color: "purple",
    url: "https://www.nse.co.ke/listed-companies/fahari-i-reit/"
  }
];

export default function AdminSmartGrowPage() {
  const [selectedInvest, setSelectedInvest] = useState<any>(null);

  return (
    <div className="space-y-8">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-headline-lg font-geist font-bold text-on-surface flex items-center gap-2">
            SmartGrow <span className="bg-[#006e2f] text-white text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">Admin</span>
          </h1>
          <p className="text-secondary mt-1">Professional investments for your Chamas.</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 bg-[#006e2f] rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-on-surface">Market Status: Open</span>
        </div>
      </div>

      {/* --- PORTFOLIO SUMMARY --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-amber-900/40 to-slate-900 border border-[#E5E7EB] rounded-3xl p-6">
          <p className="text-[#006e2f] text-xs font-bold uppercase tracking-widest mb-2">Total Chama Investments</p>
          <h3 className="text-4xl font-black text-on-surface">KES 0</h3>
          <p className="text-secondary text-sm mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-[#006e2f]" /> Recommend investments to members
          </p>
        </div>
        <div className="md:col-span-2 bg-white border border-[#E5E7EB] rounded-3xl p-6 flex flex-col justify-center">
           <h4 className="font-bold text-on-surface mb-4">Investment Categories</h4>
           <div className="flex flex-wrap gap-4">
             {[
               { name: "Money Market", icon: "" },
               { name: "Government Bonds", icon: "️" },
               { name: "Unit Trusts", icon: "" },
               { name: "Real Estate", icon: "" }
             ].map((category, i) => (
               <div key={i} className="px-6 py-3 bg-surface-container-lowest border border-[#E5E7EB] rounded-xl text-secondary font-bold hover:border-[#006e2f]/50 hover:text-on-surface transition-all cursor-pointer flex items-center gap-2">
                 <span>{category.icon}</span> {category.name}
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* --- OPPORTUNITIES GRID --- */}
      <div>
        <h3 className="text-headline-sm font-geist font-bold text-on-surface mb-6 flex items-center gap-2">
          Verified Opportunities <Shield className="w-5 h-5 text-[#006e2f]" />
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((item) => (
            <div key={item.id} className="group bg-white border border-[#E5E7EB] rounded-[32px] p-1 overflow-hidden hover:border-[#006e2f]/50 transition-all">
              <div className="bg-surface-container-lowest rounded-[28px] p-6 h-full flex flex-col justify-between relative overflow-hidden">
                
                {/* Decoration */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${item.color}-500/10 blur-3xl rounded-full group-hover:bg-${item.color}-500/20 transition-all`}></div>

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      item.type === 'Low Risk' ? 'bg-surface-container-low text-[#006e2f] border-[#E5E7EB]' :
                      item.type === 'Medium Risk' ? 'bg-blue-500/10 text-[#006e2f] border-blue-500/20' :
                      'bg-purple-500/10 text-[#006e2f] border-purple-500/20'
                    }`}>
                      {item.type}
                    </span>
                    <Briefcase className="w-5 h-5 text-secondary group-hover:text-on-surface transition-colors" />
                  </div>
                  
                  <h4 className="text-headline-sm font-geist font-bold text-on-surface mb-1 group-hover:text-[#006e2f] transition-colors">{item.title}</h4>
                  <p className="text-xs text-secondary mb-6">via {item.partner}</p>

                  <div className="flex justify-between items-end border-t border-[#E5E7EB] pt-4">
                    <div>
                      <p className="text-[10px] text-secondary uppercase">Annual Return</p>
                      <p className="text-2xl font-black text-on-surface">{item.returnRate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-secondary uppercase text-right">Min Investment</p>
                      <p className="text-sm font-bold text-on-surface text-right">KES {item.minDeposit.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedInvest(item)}
                  className="w-full mt-6 bg-white border border-[#E5E7EB] hover:bg-white hover:text-black text-on-surface font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F0C]/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E7EB] w-full max-w-2xl rounded-[32px] p-8 relative shadow-2xl overflow-hidden">
            
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 bg-${selectedInvest.color}-500/10 blur-[80px] pointer-events-none`}></div>

            <button onClick={() => setSelectedInvest(null)} className="absolute top-6 right-6 text-secondary hover:text-on-surface bg-white rounded-full p-2 transition-colors z-10">
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-[#E5E7EB]">
                  <Landmark className="w-6 h-6 text-[#006e2f]" />
                </div>
                <div>
                   <h2 className="text-headline-sm font-geist font-bold text-on-surface">{selectedInvest.title}</h2>
                   <p className="text-secondary text-sm">Partnership with {selectedInvest.partner}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                 <div className="bg-white/50 p-4 rounded-2xl border border-[#E5E7EB]">
                    <p className="text-xs text-secondary uppercase">APY</p>
                    <p className="text-xl font-bold text-[#006e2f]">{selectedInvest.returnRate}</p>
                 </div>
                 <div className="bg-white/50 p-4 rounded-2xl border border-[#E5E7EB]">
                    <p className="text-xs text-secondary uppercase">Risk</p>
                    <p className="text-headline-sm font-geist font-bold text-on-surface">{selectedInvest.type}</p>
                 </div>
                 <div className="bg-white/50 p-4 rounded-2xl border border-[#E5E7EB]">
                    <p className="text-xs text-secondary uppercase">Lock Period</p>
                    <p className="text-headline-sm font-geist font-bold text-on-surface">6 Months</p>
                 </div>
              </div>

              <h3 className="font-bold text-on-surface mb-2">About this Asset</h3>
              <p className="text-secondary leading-relaxed mb-8 text-sm">
                {selectedInvest.description}
                <br /><br />
                By proceeding, you agree to the Terms & Conditions set by {selectedInvest.partner}. 
                SmartChama acts as an intermediary platform.
              </p>

              <div className="bg-surface-container-low border border-[#E5E7EB] p-4 rounded-xl flex gap-3 mb-8">
                <AlertCircle className="w-5 h-5 text-[#006e2f] flex-shrink-0" />
                <p className="text-xs text-amber-200/80">
                  <strong>Investment Disclaimer:</strong> Past performance is not indicative of future results. 
                  Ensure your group has voted on this allocation.
                </p>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setSelectedInvest(null)} className="flex-1 py-4 rounded-xl font-bold text-secondary hover:bg-white transition-colors">
                  Cancel
                </button>
                <a 
                  href={selectedInvest.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-[2] bg-[#006e2f] hover:bg-[#006e2f] text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                >
                  View Opportunity <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

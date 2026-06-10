"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function SmartGrowPage() {
  const { session, member, group, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState("");
  const [investDuration, setInvestDuration] = useState("Ongoing");

  // Calculations for modal
  const amountVal = parseFloat(investAmount.replace(/,/g, "")) || 0;
  const return9 = amountVal * 0.09;
  const return11 = amountVal * 0.11;

  const formatCurrency = (val: number) => {
    return val > 0 ? val.toLocaleString("en-KE", { maximumFractionDigits: 0 }) : "0";
  };

  const fetchData = async () => {
    if (!member || !group) return;
    try {
      setLoading(true);

      const { data: txData } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('group_id', member.group_id);

      let balance = 0;
      txData?.forEach(tx => {
        const isIncoming = ['contribution', 'repayment', 'penalty', 'interest'].includes(tx.type);
        if (isIncoming) balance += Number(tx.amount);
        else balance -= Number(tx.amount);
      });

      setWalletBalance(balance);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && member && group) {
      fetchData();
    }
  }, [authLoading, member, group]);

  if (authLoading || loading) {
    return (
      <div className="p-8">
        <div className="bg-[#0B0F0C] rounded-xl h-96 animate-pulse shadow-sm"></div>
      </div>
    );
  }

  const isAdmin = member?.role === 'admin';

  return (
    <div className="p-8 font-inter relative min-h-full">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center">
          <h1 className="text-headline-lg font-semibold text-on-surface font-geist">SmartGrow</h1>
          <span className="bg-[#22C55E]/10 text-[#005321] border border-[#4ae176] text-label-caps px-2 py-0.5 rounded inline-flex ml-3 font-bold">
            Beta
          </span>
        </div>
        <p className="text-body-sm text-secondary mt-1">Put your idle group funds to work.</p>
      </div>

      {/* HERO BANNER */}
      <div className="w-full bg-[#0B0F0C] rounded-xl p-8 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 shadow-sm">
        {/* Left */}
        <div className="flex-1 w-full max-w-xl">
          <div className="text-label-caps text-gray-400">INVESTMENTS</div>
          <div className="text-[40px] font-geist font-bold text-white mt-2 leading-tight">
            Your money shouldn't sit still.
          </div>
          <p className="text-body-lg text-gray-400 mt-4 leading-relaxed max-w-md">
            SmartGrow lets your chama invest idle funds into vetted, 
            low-risk instruments and earn as a group.
          </p>
          
          <button 
            onClick={() => {
              const el = document.getElementById('investment-options');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-8 bg-[#22C55E] hover:bg-[#006e2f] transition-colors text-white px-6 py-3 rounded text-headline-sm flex items-center gap-2 font-medium"
          >
            <span className="material-symbols-outlined text-[20px]">trending_up</span>
            Start Investing
          </button>
        </div>

        {/* Right - Visual card */}
        <div className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl p-6 shrink-0 relative overflow-hidden">
          <div className="text-label-caps text-gray-400 relative z-10">Portfolio Overview</div>
          <div className="text-display-sm font-geist font-bold text-white mt-2 relative z-10">KSh 45,000</div>
          
          <div className="flex justify-between mt-6 relative z-10">
            <div className="text-body-sm text-gray-400">Total Returns</div>
            <div className="text-body-sm text-[#22C55E] font-medium">+KSh 3,240</div>
          </div>
          
          <div className="flex justify-between mt-2 relative z-10">
            <div className="text-body-sm text-gray-400">Current ROI</div>
            <div className="text-body-sm text-[#22C55E] font-medium">7.2% p.a.</div>
          </div>
          
          {/* Subtle upward line chart */}
          <div className="mt-4 relative z-0 -mx-6 -mb-6">
            <svg className="w-full h-16" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path 
                d="M 0 35 C 20 35, 40 25, 60 20 C 80 15, 90 10, 100 5 L 100 40 L 0 40 Z" 
                fill="url(#chart-gradient)"
              />
              <path 
                d="M 0 35 C 20 35, 40 25, 60 20 C 80 15, 90 10, 100 5" 
                stroke="#22C55E" 
                strokeWidth="1.5" 
                fill="none" 
                strokeLinecap="round" 
              />
            </svg>
          </div>
        </div>
      </div>

      {/* INVESTMENT SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Card 1 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div className="text-label-caps text-secondary mb-2 uppercase">INVESTED AMOUNT</div>
          <div className="flex items-center justify-between">
            <div className="text-display-sm font-geist font-bold text-on-surface">KSh 45,000</div>
            <span className="material-symbols-outlined text-outline-variant text-[28px]">account_balance</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div className="text-label-caps text-secondary mb-2 uppercase">TOTAL RETURNS</div>
          <div className="flex items-end gap-3">
            <div className="text-display-sm font-geist font-bold text-[#22C55E]">KSh 3,240</div>
            <div className="flex items-center bg-[#22C55E]/10 text-[#005321] border border-[#4ae176] rounded px-2 py-0.5 text-label-caps mb-1 font-medium">
              <span className="material-symbols-outlined text-[14px] mr-1">arrow_upward</span>
              +7.2% ROI
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div className="text-label-caps text-secondary mb-2 uppercase">NEXT PAYOUT</div>
          <div className="text-display-sm font-geist font-bold text-on-surface">28 Feb 2025</div>
          <div className="text-label-caps text-secondary mt-1">Quarterly distribution</div>
        </div>
      </div>

      {/* AVAILABLE INVESTMENT OPTIONS */}
      <div id="investment-options" className="mb-10">
        <h2 className="text-headline-sm font-geist text-on-surface">Where to grow your funds</h2>
        <p className="text-body-sm text-secondary mt-1">Vetted, regulated Kenyan investment products</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Card 1 — Money Market Fund */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl relative overflow-hidden hover:border-[#22C55E] hover:shadow-md transition-all group">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#22C55E]"></div>
            <div className="p-6">
              <div className="inline-flex bg-[#22C55E]/10 text-[#005321] text-label-caps font-bold px-2 py-0.5 rounded">
                LOW RISK
              </div>
              <h3 className="text-headline-sm font-geist text-on-surface mt-4">Money Market Fund</h3>
              <div className="text-body-sm text-secondary">CIC Asset Management</div>
              
              <div className="border-t border-[#E5E7EB] my-5"></div>
              
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-label-caps text-secondary mb-0.5">Expected Return</div>
                  <div className="font-mono text-[#22C55E] font-medium text-[15px]">9–11% p.a.</div>
                </div>
                <div>
                  <div className="text-label-caps text-secondary mb-0.5">Min. Investment</div>
                  <div className="font-mono text-on-surface text-[15px]">KSh 5,000</div>
                </div>
                <div>
                  <div className="text-label-caps text-secondary mb-0.5">Liquidity</div>
                  <div className="font-mono text-on-surface text-[15px]">Withdraw in 3 days</div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  if (!isAdmin) {
                    alert("Only admins can initiate investments.");
                    return;
                  }
                  setShowInvestModal(true);
                }}
                className="w-full bg-[#22C55E] hover:bg-[#006e2f] text-white rounded py-2.5 text-body-sm font-medium transition-colors mt-6"
              >
                Invest Now
              </button>
            </div>
          </div>

          {/* Card 2 — Treasury Bills */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl relative overflow-hidden hover:border-yellow-400 hover:shadow-md transition-all group">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400"></div>
            <div className="p-6">
              <div className="inline-flex bg-yellow-100 text-yellow-800 text-label-caps font-bold px-2 py-0.5 rounded">
                MEDIUM RISK
              </div>
              <h3 className="text-headline-sm font-geist text-on-surface mt-4">Government Treasury Bills</h3>
              <div className="text-body-sm text-secondary">CBK via M-Pesa</div>
              
              <div className="border-t border-[#E5E7EB] my-5"></div>
              
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-label-caps text-secondary mb-0.5">Expected Return</div>
                  <div className="font-mono text-[#22C55E] font-medium text-[15px]">13–16% p.a.</div>
                </div>
                <div>
                  <div className="text-label-caps text-secondary mb-0.5">Min. Investment</div>
                  <div className="font-mono text-on-surface text-[15px]">KSh 50,000</div>
                </div>
                <div>
                  <div className="text-label-caps text-secondary mb-0.5">Liquidity</div>
                  <div className="font-mono text-on-surface text-[15px]">91-day lock</div>
                </div>
              </div>
              
              <button className="w-full bg-white border border-[#E5E7EB] text-on-surface hover:bg-gray-50 rounded py-2.5 text-body-sm font-medium transition-colors mt-6">
                Learn More
              </button>
            </div>
          </div>

          {/* Card 3 — Fixed Deposit */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl relative overflow-hidden hover:border-[#22C55E] hover:shadow-md transition-all group">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#22C55E]"></div>
            <div className="p-6">
              <div className="inline-flex bg-[#22C55E]/10 text-[#005321] text-label-caps font-bold px-2 py-0.5 rounded">
                LOW RISK
              </div>
              <h3 className="text-headline-sm font-geist text-on-surface mt-4">Chama Fixed Deposit</h3>
              <div className="text-body-sm text-secondary">Equity Bank</div>
              
              <div className="border-t border-[#E5E7EB] my-5"></div>
              
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-label-caps text-secondary mb-0.5">Expected Return</div>
                  <div className="font-mono text-[#22C55E] font-medium text-[15px]">8% p.a.</div>
                </div>
                <div>
                  <div className="text-label-caps text-secondary mb-0.5">Min. Investment</div>
                  <div className="font-mono text-on-surface text-[15px]">KSh 20,000</div>
                </div>
                <div>
                  <div className="text-label-caps text-secondary mb-0.5">Liquidity</div>
                  <div className="font-mono text-on-surface text-[15px]">6-month lock</div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  if (!isAdmin) {
                    alert("Only admins can initiate investments.");
                    return;
                  }
                  setShowInvestModal(true);
                }}
                className="w-full bg-[#22C55E] hover:bg-[#006e2f] text-white rounded py-2.5 text-body-sm font-medium transition-colors mt-6"
              >
                Invest Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE INVESTMENTS TABLE */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 mb-10 shadow-sm overflow-hidden">
        <h2 className="text-headline-sm font-geist text-on-surface mb-6">Your active investments</h2>
        
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-y border-[#E5E7EB]">
                <th className="px-4 py-3 text-label-caps text-secondary font-medium">INVESTMENT</th>
                <th className="px-4 py-3 text-label-caps text-secondary font-medium">PROVIDER</th>
                <th className="px-4 py-3 text-label-caps text-secondary font-medium">AMOUNT</th>
                <th className="px-4 py-3 text-label-caps text-secondary font-medium">START DATE</th>
                <th className="px-4 py-3 text-label-caps text-secondary font-medium">MATURITY</th>
                <th className="px-4 py-3 text-label-caps text-secondary font-medium">RETURN</th>
                <th className="px-4 py-3 text-label-caps text-secondary font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#22C55E] text-[20px]">trending_up</span>
                    <span className="text-body-sm text-on-surface font-medium">Money Market Fund</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-body-sm text-secondary">CIC Asset Management</td>
                <td className="px-4 py-4 font-mono font-medium text-on-surface">KSh 45,000</td>
                <td className="px-4 py-4 text-body-sm text-secondary">Jan 2025</td>
                <td className="px-4 py-4 text-body-sm text-secondary">Ongoing</td>
                <td className="px-4 py-4 font-mono font-medium text-[#22C55E]">+KSh 3,240</td>
                <td className="px-4 py-4">
                  <span className="bg-[#22C55E]/10 text-[#005321] rounded px-2 py-0.5 text-label-caps font-medium border border-[#4ae176]">
                    Active
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DISCLAIMER */}
      <div className="bg-surface-container-low border border-[#E5E7EB] rounded-lg p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-secondary shrink-0 mt-0.5">info</span>
        <p className="text-body-sm text-secondary leading-relaxed">
          SmartGrow investment options are provided by licensed Kenyan fund managers. 
          SmartChama is not a licensed investment advisor. Past performance does not 
          guarantee future returns. Capital at risk.
        </p>
      </div>

      {/* INVEST MODAL */}
      {showInvestModal && (
        <div className="fixed inset-0 bg-[#0B0F0C]/40 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl relative">
            <h2 className="text-headline-lg font-geist font-bold text-on-surface">Invest in Money Market Fund</h2>
            <p className="text-body-sm text-secondary mt-1 mb-6">CIC Asset Management · Expected 9–11% p.a.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-label-caps text-secondary mb-2" htmlFor="amount">Investment Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-medium">KSh</span>
                  <input 
                    type="number" 
                    id="amount"
                    name="amount"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder="0"
                    className="w-full border border-[#E5E7EB] rounded px-4 py-3 pl-14 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all font-medium"
                  />
                </div>
                <div className="text-body-sm text-[#22C55E] font-medium mt-2">
                  Available: KSh {formatCurrency(walletBalance)} in group wallet
                </div>
              </div>

              <div>
                <label className="block text-label-caps text-secondary mb-2" htmlFor="duration">Duration</label>
                <select 
                  id="duration"
                  name="duration"
                  value={investDuration}
                  onChange={(e) => setInvestDuration(e.target.value)}
                  className="w-full border border-[#E5E7EB] rounded px-4 py-3 text-on-surface outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all bg-white font-medium"
                >
                  <option value="Ongoing">Ongoing</option>
                  <option value="3 months">3 months</option>
                  <option value="6 months">6 months</option>
                  <option value="12 months">12 months</option>
                </select>
              </div>

              {/* Projected returns box */}
              <div className="bg-surface-container-low border border-[#E5E7EB] rounded-lg p-4 mt-6 space-y-3 shadow-sm">
                <div className="flex justify-between items-center text-body-sm">
                  <span className="text-secondary">Projected Return (9%):</span>
                  <span className="font-mono font-medium text-on-surface">KSh {formatCurrency(return9)}</span>
                </div>
                <div className="flex justify-between items-center text-body-sm pt-2 border-t border-[#E5E7EB]">
                  <span className="text-secondary">Projected Return (11%):</span>
                  <span className="font-mono font-bold text-[#22C55E]">KSh {formatCurrency(return11)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowInvestModal(false)}
                className="flex-1 bg-white border border-[#E5E7EB] text-on-surface hover:bg-gray-50 rounded py-3 font-medium transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (amountVal > walletBalance) {
                    alert("Insufficient wallet balance.");
                    return;
                  }
                  alert("Investment requested! Admin approval required.");
                  setShowInvestModal(false);
                }}
                disabled={!investAmount}
                className="flex-[2] bg-[#22C55E] hover:bg-[#006e2f] text-white rounded py-3 font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                Confirm Investment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
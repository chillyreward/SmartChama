'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const SEED_PRODUCTS = [
  {
    name: "Money Market Fund", provider: "CIC Asset Management", type: "money_market",
    min_amount: 5000, expected_return_min: 9.0, expected_return_max: 11.0,
    risk_level: "low", liquidity_days: 3,
    description: "A low-risk fund that invests in short-term government securities and bank deposits. Regulated by the Capital Markets Authority of Kenya.",
    regulatory_body: "CMA Kenya", is_active: true
  },
  {
    name: "Money Market Fund", provider: "Sanlam Investments Kenya", type: "money_market",
    min_amount: 1000, expected_return_min: 8.5, expected_return_max: 10.5,
    risk_level: "low", liquidity_days: 2,
    description: "Accessible money market fund with low minimum investment. Suitable for groups with smaller idle balances.",
    regulatory_body: "CMA Kenya", is_active: true
  },
  {
    name: "91-Day Treasury Bill", provider: "Central Bank of Kenya", type: "government_security",
    min_amount: 50000, expected_return_min: 13.0, expected_return_max: 16.0,
    risk_level: "low", liquidity_days: 91,
    description: "Short-term government debt securities issued by the Central Bank of Kenya. Considered the safest investment in Kenya. Interest rate set by weekly CBK auction.",
    regulatory_body: "CBK", is_active: true
  },
  {
    name: "Fixed Deposit Account", provider: "Equity Bank Kenya", type: "fixed_deposit",
    min_amount: 20000, expected_return_min: 7.0, expected_return_max: 9.0,
    risk_level: "low", liquidity_days: 180,
    description: "A fixed deposit account for savings groups held at Equity Bank. Interest paid at maturity. Protected by Kenya Deposit Insurance.",
    regulatory_body: "CBK / KDIC", is_active: true
  },
  {
    name: "Chama Sacco Share Capital", provider: "Various Licensed SACCOs", type: "sacco",
    min_amount: 10000, expected_return_min: 8.0, expected_return_max: 12.0,
    risk_level: "medium", liquidity_days: 365,
    description: "Invest in share capital of a licensed SACCO. Earn dividends annually and access larger loan facilities as a group shareholder. Regulated by SASRA.",
    regulatory_body: "SASRA", is_active: true
  }
];

export default function SmartGrowContent({ isAdminRoute = false }: { isAdminRoute?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [chama, setChama] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [investDuration, setInvestDuration] = useState('');
  const [investing, setInvesting] = useState(false);
  const [toast, setToast] = useState('');

  const formatCurrency = (val: number) => val.toLocaleString('en-KE', { maximumFractionDigits: 0 });

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: mem } = await supabase
          .from('members')
          .select('*, chamas(*)')
          .eq('user_id', session.user.id)
          .single();
        
        if (!mem || !mem.chama_id) return;
        setMember(mem);
        setChama(mem.chamas);

        const { data: wal } = await supabase
          .from('wallets')
          .select('*')
          .eq('chama_id', mem.chama_id)
          .single();
        
        setWallet(wal || { balance: 0, invested: 0 });

        // Fetch Products
        let { data: prods, error: prodErr } = await supabase
          .from('smartgrow_products')
          .select('*')
          .eq('is_active', true)
          .order('risk_level');

        // Seed if missing
        if (!prodErr && prods && prods.length === 0) {
          await supabase.from('smartgrow_products').insert(SEED_PRODUCTS);
          const { data: newProds } = await supabase
            .from('smartgrow_products')
            .select('*')
            .eq('is_active', true)
            .order('risk_level');
          prods = newProds;
        }

        setProducts(prods || []);

        // Fetch Investments
        const { data: invs } = await supabase
          .from('smartgrow_investments')
          .select(`
            *,
            smartgrow_products (
              name, provider, expected_return_min, expected_return_max
            )
          `)
          .eq('chama_id', mem.chama_id)
          .order('created_at', { ascending: false });

        setInvestments(invs || []);

      } catch (err) {
        console.error('SmartGrow load error', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [supabase]);

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !member) return;
    const amount = Number(investAmount);
    if (amount < selectedProduct.min_amount || amount > (wallet?.balance || 0)) return;
    
    setInvesting(true);
    
    try {
      // Create Investment
      const { error: invErr } = await supabase.from('smartgrow_investments').insert({
        chama_id: chama.id,
        product_id: selectedProduct.id,
        amount: amount,
        start_date: new Date().toISOString(),
        status: 'active',
        expected_return: selectedProduct.expected_return_min,
        created_by: member.id,
        created_at: new Date().toISOString()
      });

      if (invErr) throw invErr;

      // Deduct from wallet
      const newBalance = (wallet?.balance || 0) - amount;
      const newInvested = (wallet?.invested || 0) + amount;
      
      // If wallet exists update, otherwise insert (assuming it exists for the flow)
      if (wallet?.id) {
        await supabase.from('wallets').update({ balance: newBalance, invested: newInvested }).eq('id', wallet.id);
      }

      // Insert transaction
      await supabase.from('transactions').insert({
        chama_id: chama.id,
        type: 'smartgrow_investment',
        amount: -amount,
        description: `SmartGrow: ${selectedProduct.name} with ${selectedProduct.provider}`,
        status: 'confirmed',
        created_by: member.id,
        created_at: new Date().toISOString()
      });

      // Send SMS via our API (fire and forget)
      fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: member.phone,
          message: `SmartChama: Your group has invested KSh ${amount} in ${selectedProduct.name} (${selectedProduct.provider}). Track in your SmartGrow dashboard.`
        })
      }).catch(console.error);

      // Refresh Data Locally
      setInvestments([
        {
          id: Math.random().toString(),
          chama_id: chama.id,
          amount: amount,
          status: 'active',
          start_date: new Date().toISOString(),
          smartgrow_products: {
            name: selectedProduct.name,
            provider: selectedProduct.provider,
            expected_return_min: selectedProduct.expected_return_min,
            expected_return_max: selectedProduct.expected_return_max
          }
        },
        ...investments
      ]);
      setWallet({ ...wallet, balance: newBalance, invested: newInvested });
      setToast(`Investment of KSh ${amount} confirmed.`);
      setTimeout(() => setToast(''), 4000);
      setSelectedProduct(null);
      setInvestAmount('');

    } catch (err) {
      console.error('Invest Error', err);
      alert('Failed to process investment.');
    } finally {
      setInvesting(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'low': return { strip: 'bg-[#22C55E]', badge: 'bg-[#dcfce7] text-[#166534]' };
      case 'medium': return { strip: 'bg-yellow-400', badge: 'bg-[#fef9c3] text-[#854d0e]' };
      case 'high': return { strip: 'bg-red-400', badge: 'bg-red-100 text-red-800' };
      default: return { strip: 'bg-gray-400', badge: 'bg-gray-100 text-gray-800' };
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const calcProjected = (rate: number) => {
    const amt = Number(investAmount) || 0;
    return Math.round(amt + (amt * (rate / 100)));
  };

  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
  // simplified actual returns logic since this is a new platform
  const totalReturns = investments.reduce((sum, inv) => sum + Number(inv.actual_return || 0), 0);
  const activeCount = investments.filter(i => i.status === 'active').length;

  return (
    <div className="p-4 md:p-8 max-w-[1280px] mx-auto font-inter pb-24 text-[var(--text-main)]">
      {toast && (
        <div className="fixed top-4 right-4 bg-[#22C55E] text-white px-4 py-3 rounded shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="text-body-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6 md:mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>{isAdminRoute ? 'Admin Dashboard' : 'Dashboard'}</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>SmartGrow</span>
        </p>
        
        <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
          SmartGrow Investment
        </h1>
      </div>

      {/* HEADER SECTION */}
      <div className="bg-[#0B0F0C] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 mb-8 md:mb-12 shadow-sm border border-white/5">
        <div className="max-w-xl">
          <div className="text-label-caps text-[#22C55E] tracking-widest mb-3 md:mb-4">SMARTGROW</div>
          <h1 className="text-[28px] md:text-[36px] font-geist font-bold text-white mb-4 leading-tight">Grow your group's idle funds.</h1>
          <p className="text-[14px] md:text-[16px] text-gray-400 leading-relaxed mb-6">
            SmartChama partners with regulated Kenyan investment providers to help your group put idle funds to work. All products are licensed by the Capital Markets Authority or Central Bank of Kenya.
          </p>
          <button className="bg-[#22C55E] text-white px-6 py-3 rounded-lg text-headline-sm font-semibold flex items-center gap-2 hover:bg-[#1ea94e] transition-colors">
            <span className="material-symbols-outlined">trending_up</span>
            Get Started
          </button>
        </div>

        <div className="w-full md:w-auto min-w-full md:min-w-[300px]">
          {investments.length > 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-4">
               <div>
                 <div className="text-label-caps text-gray-400 mb-1">TOTAL INVESTED</div>
                 <div className="text-[28px] font-geist font-bold text-white">KSh {formatCurrency(totalInvested)}</div>
               </div>
               <div className="flex justify-between items-end">
                 <div>
                   <div className="text-label-caps text-gray-400 mb-1">TOTAL RETURNS</div>
                   <div className="text-[20px] font-geist font-bold text-[#22C55E]">KSh {formatCurrency(totalReturns)}</div>
                 </div>
                 <div className="text-right">
                   <div className="text-label-caps text-gray-400 mb-1">ACTIVE</div>
                   <div className="text-[20px] font-geist font-bold text-white">{activeCount}</div>
                 </div>
               </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
               <div className="text-label-caps text-gray-400 mb-2">START YOUR FIRST INVESTMENT</div>
               <p className="text-body-sm text-gray-400 mt-2">Your group has not made any investments yet.</p>
               <p className="text-body-sm text-gray-500 mt-3">
                 Idle funds in your wallet earn nothing. Even a short-term money market fund earning 9 to 11 percent annually grows your group meaningfully over time.
               </p>
               <div className="text-label-caps text-[#22C55E] mt-4">Minimum to start: KSh 1,000</div>
            </div>
          )}
        </div>
      </div>

      {/* AVAILABLE PRODUCTS */}
      <div className="mb-12">
        <h2 className="text-headline-sm font-geist font-bold text-[var(--text-main)]">Where to grow your funds</h2>
        <p className="text-body-sm text-[var(--text-muted)] mt-1 mb-6">All investment products are regulated and licensed in Kenya.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => {
            const colors = getRiskColor(product.risk_level);
            const canInvest = (wallet?.balance || 0) >= product.min_amount;
            return (
              <div key={product.id} className="card-bg border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md hover:border-[#22C55E] dark:hover:border-[#22C55E] transition-all">
                <div className={`w-full ${colors.strip} h-2`}></div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-1 rounded text-[11px] font-bold tracking-wider ${colors.badge}`}>
                      {product.risk_level.toUpperCase()} RISK
                    </span>
                  </div>
                  <h3 className="text-headline-sm font-geist font-bold text-[var(--text-main)]">{product.name}</h3>
                  <p className="text-body-sm text-[var(--text-muted)]">{product.provider}</p>
                  
                  <div className="border-t border-[var(--border)] my-4"></div>
                  
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-label-caps text-[var(--text-muted)]">Expected Return</span>
                      <span className="text-mono-data font-bold text-[var(--brand-green)]">{product.expected_return_min}–{product.expected_return_max}% p.a.</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-label-caps text-[var(--text-muted)]">Minimum Investment</span>
                      <span className="text-mono-data font-bold text-[var(--text-main)]">KSh {formatCurrency(product.min_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-label-caps text-[var(--text-muted)]">Liquidity</span>
                      <span className="text-mono-data font-bold text-[var(--text-main)]">{product.liquidity_days} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-label-caps text-[var(--text-muted)]">Regulated by</span>
                      <span className="text-body-sm font-bold text-[var(--text-main)]">{product.regulatory_body}</span>
                    </div>
                  </div>

                  <p className="text-body-sm text-[var(--text-muted)] flex-1">
                    {product.description}
                  </p>

                  <div className="mt-6">
                    {isAdminRoute ? (
                      canInvest ? (
                        <button 
                          onClick={() => setSelectedProduct(product)}
                          className="w-full bg-[#22C55E] text-white rounded-lg py-2.5 text-body-sm font-bold hover:bg-[#1ea94e] transition-colors"
                        >
                          Invest Now
                        </button>
                      ) : (
                        <div className="w-full relative group">
                          <button 
                            disabled 
                            className="w-full bg-[#E5E7EB] dark:bg-[#2d3d2d] text-[var(--text-muted)] rounded-lg py-2.5 text-body-sm font-bold cursor-not-allowed"
                          >
                            Insufficient funds
                          </button>
                          <div className="absolute bottom-full mb-2 hidden group-hover:block w-full bg-gray-800 text-white text-xs p-2 rounded text-center shadow-lg">
                            Your total recorded needs at least KSh {formatCurrency(product.min_amount)} to invest in this product.
                          </div>
                        </div>
                      )
                    ) : (
                      <button 
                        disabled 
                        className="w-full bg-transparent border border-[var(--border)] text-[var(--text-muted)] rounded-lg py-2.5 text-body-sm font-bold cursor-not-allowed"
                      >
                        Admin Action Required
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ACTIVE INVESTMENTS */}
      <div>
        <h2 className="text-headline-sm font-geist font-bold text-[var(--text-main)] mb-6">Active Investments</h2>
        {investments.length === 0 ? (
          <div className="card-bg border border-[var(--border)] rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="material-symbols-outlined text-[#E5E7EB] dark:text-[#2d3d2d] text-[48px] mb-4">savings</span>
            <h3 className="text-headline-sm font-geist font-bold text-[var(--text-main)]">No active investments</h3>
            <p className="text-body-sm text-[var(--text-muted)] mt-2 max-w-sm">
              Your group has not made any investments yet. Choose a product above to get started.
            </p>
          </div>
        ) : (
          <div className="card-bg border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            {/* Desktop Table View */}
            <table className="hidden md:table w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-[#FAFAFA] dark:bg-[#0f1410] border-b border-[var(--border)] text-[var(--text-muted)]">
                <tr>
                  <th className="py-4 px-6 text-label-caps font-bold">PRODUCT</th>
                  <th className="py-4 px-6 text-label-caps font-bold">PROVIDER</th>
                  <th className="py-4 px-6 text-label-caps font-bold">AMOUNT</th>
                  <th className="py-4 px-6 text-label-caps font-bold">START DATE</th>
                  <th className="py-4 px-6 text-label-caps font-bold">RETURN (EST)</th>
                  <th className="py-4 px-6 text-label-caps font-bold">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
                {investments.map(inv => {
                  const p = inv.smartgrow_products;
                  const d = new Date(inv.start_date);
                  return (
                    <tr key={inv.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                      <td className="py-4 px-6 text-body-sm font-bold text-[var(--text-main)]">{p?.name || 'Unknown'}</td>
                      <td className="py-4 px-6 text-body-sm text-[var(--text-muted)]">{p?.provider}</td>
                      <td className="py-4 px-6 text-body-sm font-mono font-bold text-[var(--text-main)]">KSh {formatCurrency(inv.amount)}</td>
                      <td className="py-4 px-6 text-body-sm text-[var(--text-muted)]">{d.toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-body-sm font-mono font-bold text-[var(--brand-green)]">{p?.expected_return_min}%</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${inv.status === 'active' ? 'bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176]' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f] p-4">
              {investments.map(inv => {
                const p = inv.smartgrow_products;
                const d = new Date(inv.start_date);
                return (
                  <div key={inv.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-bold text-[var(--text-main)]">{p?.name || 'Unknown'}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">{p?.provider}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${inv.status === 'active' ? 'bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176]' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
                        {inv.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-[#FAFAFA] dark:bg-[#1f2a1f]/30 p-2.5 rounded-lg border border-[var(--border)] text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Invested</span>
                        <span className="font-mono font-bold text-[var(--text-main)]">KSh {formatCurrency(inv.amount)}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Start Date</span>
                        <span>{d.toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 text-right">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Est Return</span>
                        <span className="font-mono font-bold text-[var(--brand-green)]">{p?.expected_return_min}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* INVEST MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card-bg border border-[var(--border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in text-[var(--text-main)]">
            <div className="p-6">
              <h2 className="text-[24px] font-geist font-bold text-[var(--text-main)]">Invest in {selectedProduct.name}</h2>
              <p className="text-body-sm text-[var(--text-muted)] mb-6">{selectedProduct.provider}</p>

              <div className="bg-transparent text-[var(--brand-green)] border border-[#22C55E] dark:border-[#22C55E]/30 rounded-xl p-4 flex items-start gap-3 mb-6">
                <span className="material-symbols-outlined text-[var(--brand-green)] mt-0.5">info</span>
                <p className="text-body-sm text-[var(--text-main)]">
                  This investment will be made from your total recorded. All members will be notified. This action requires confirmation from the group admin.
                </p>
              </div>

              <form onSubmit={handleInvest} className="flex flex-col gap-5">
                <div>
                  <label className="block text-label-caps text-[var(--text-muted)] font-bold mb-2">INVESTMENT AMOUNT</label>
                  <div className="flex border border-[var(--border)] rounded-lg overflow-hidden focus-within:border-[#22C55E] focus-within:ring-1 focus-within:ring-[#22C55E]">
                    <div className="bg-transparent border-r border-[var(--border)] px-3 py-3 flex items-center">
                      <span className="text-body-sm font-bold text-[var(--text-muted)]">KSh</span>
                    </div>
                    <input 
                      type="number" 
                      required
                      min={selectedProduct.min_amount}
                      max={wallet?.balance || 0}
                      value={investAmount}
                      onChange={e => setInvestAmount(e.target.value)}
                      placeholder={selectedProduct.min_amount.toString()}
                      className="flex-1 px-4 py-3 bg-transparent text-[var(--text-main)] font-mono focus:outline-none"
                    />
                  </div>
                  <p className="text-body-sm text-[var(--text-muted)] mt-1 flex justify-between">
                    <span>Available recorded: KSh {formatCurrency(wallet?.balance || 0)}</span>
                    <span className="text-[#22C55E] cursor-pointer hover:underline font-bold" onClick={() => setInvestAmount(wallet?.balance?.toString() || '0')}>Max</span>
                  </p>
                </div>

                <div>
                  <label className="block text-label-caps text-[var(--text-muted)] font-bold mb-2">DURATION</label>
                  <select 
                    required
                    value={investDuration}
                    onChange={e => setInvestDuration(e.target.value)}
                    className="w-full border border-[var(--border)] bg-transparent rounded-lg px-4 py-3 text-[var(--text-main)] focus:outline-none focus:border-[#22C55E]"
                  >
                    <option value="" disabled>Select duration</option>
                    {selectedProduct.type === 'money_market' && <option value="ongoing">Ongoing (withdraw anytime)</option>}
                    {selectedProduct.type === 'government_security' && <option value="91">91 days (fixed)</option>}
                    {selectedProduct.type === 'fixed_deposit' && <option value="180">180 days (fixed)</option>}
                    {selectedProduct.type === 'sacco' && <option value="365">12 months minimum</option>}
                    {!['money_market', 'government_security', 'fixed_deposit', 'sacco'].includes(selectedProduct.type) && (
                       <option value="custom">{selectedProduct.liquidity_days} days</option>
                    )}
                  </select>
                </div>

                {investAmount && Number(investAmount) >= selectedProduct.min_amount && (
                  <div className="bg-[#FAFAFA] dark:bg-[#0f1410] border border-[var(--border)] rounded-lg p-4 mt-2">
                    <div className="text-label-caps text-[var(--text-muted)] font-bold mb-3">PROJECTED RETURNS (1 YEAR)</div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-body-sm text-[var(--text-main)]">At {selectedProduct.expected_return_min}% p.a.</span>
                      <span className="text-mono-data font-bold text-[var(--text-main)]">KSh {formatCurrency(calcProjected(selectedProduct.expected_return_min))}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-[var(--border)] pt-2">
                      <span className="text-body-sm text-[var(--text-main)] font-bold">At {selectedProduct.expected_return_max}% p.a.</span>
                      <span className="text-mono-data font-bold text-[var(--brand-green)]">KSh {formatCurrency(calcProjected(selectedProduct.expected_return_max))}</span>
                    </div>
                    <p className="text-[12px] text-[var(--text-muted)] mt-3 italic">
                      Note: Returns are estimates based on current rates and are not guaranteed.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-4">
                  <button 
                    type="button" 
                    onClick={() => { setSelectedProduct(null); setInvestAmount(''); setInvestDuration(''); }}
                    className="px-6 py-3 rounded-lg text-body-sm font-bold text-[var(--text-main)] bg-transparent border border-[var(--border)] hover:bg-gray-50 dark:hover:bg-[#1f2a1f]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={investing}
                    className="px-6 py-3 rounded-lg text-body-sm font-bold text-white bg-[#22C55E] hover:bg-[#1ea94e] flex items-center gap-2"
                  >
                    {investing ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : null}
                    {investing ? 'Confirming...' : 'Confirm Investment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
import { Button, Chip, EmptyState, Field, Modal, Money, Notice, PageHeader, Panel, PanelTitle, Skeleton, TableWrap, cn, formatKsh, inputClass, tableClass } from '@/components/ui';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

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
    description: "Invest in share capital of a licensed SACCO. Earn dividends annually and access SACCO services as a group shareholder. Regulated by SASRA.",
    regulatory_body: "SASRA", is_active: true
  }
];

export default function SmartGrowContent({ isAdminRoute = false }: { isAdminRoute?: boolean }) {
  const { session: authSession, member: authMember, group: authGroup, isLoading: authLoading } = useAuth();
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


  useEffect(() => {
    if (authLoading) return;
    if (!authMember || !authGroup) {
      setLoading(false);
      return;
    }

    setMember(authMember);
    setChama(authGroup);

    async function loadData() {
      try {
        if (!authGroup?.id) return;
        const activeChamaId = authGroup.id;

        const { data: wal } = await supabase
          .from('wallets')
          .select('*')
          .eq('chama_id', activeChamaId)
          .single();
        
        setWallet(wal || { balance: 0, invested: 0 });

        // Fetch Products
        let { data: prods, error: prodErr } = await supabase
          .from('smartgrow_products')
          .select('*')
          .eq('is_active', true)
          .order('risk_level');

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
          .eq('chama_id', activeChamaId)
          .order('created_at', { ascending: false });

        setInvestments(invs || []);

      } catch (err) {
        console.error('SmartGrow load error', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [authMember, authGroup, authLoading]);

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !member) return;
    const amount = Number(investAmount);
    if (amount < selectedProduct.min_amount || amount > (wallet?.balance || 0)) return;
    
    setInvesting(true);
    
    try {
      // Investment, wallet deduction, transaction and ledger in one locked call
      const { data: invResult, error: invErr } = await supabase.rpc('record_smartgrow_investment', {
        p_chama_id: chama.id,
        p_product_id: selectedProduct.id,
        p_amount: amount
      });
      if (invErr || !invResult?.success) throw new Error(invResult?.error || invErr?.message);
      const newBalance = (wallet?.balance || 0) - amount;
      const newInvested = (wallet?.invested || 0) + amount;

      // Send SMS via our API (fire and forget)
      if (member.profile?.phone_number) {
        fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: member.profile.phone_number,
            chama_id: chama.id,
            message: `Akibora: Your group has invested KSh ${amount} in ${selectedProduct.name} (${selectedProduct.provider}). Track in your SmartGrow dashboard.`
          })
        }).catch(console.error);
      }

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
      setToast(`${formatKsh(amount)} recorded as invested in ${selectedProduct.name}.`);
      setTimeout(() => setToast(''), 4000);
      setSelectedProduct(null);
      setInvestAmount('');

    } catch (err) {
      console.error('Invest Error', err);
      setToast('The investment was not recorded. Check the amount and try again.');
    } finally {
      setInvesting(false);
    }
  };

  const RISK: Record<string, { label: string; cls: string }> = {
    low: { label: 'Low risk', cls: 'bg-tint text-brand' },
    medium: { label: 'Medium risk', cls: 'bg-amber-soft text-amber-ink' },
    high: { label: 'Higher risk', cls: 'bg-danger-soft text-danger-ink' },
  };
  const KIND: Record<string, string> = { money_market: 'Money market fund', government_security: 'Government security', fixed_deposit: 'Fixed deposit', sacco: 'SACCO shares' };

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-60" />
        <Skeleton className="h-48 rounded-[28px]" />
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-72" />)}</div>
      </div>
    );
  }

  const calcProjected = (rate: number) => {
    const amt = Number(investAmount) || 0;
    return Math.round(amt + (amt * (rate / 100)));
  };

  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalReturns = investments.reduce((sum, inv) => sum + Number(inv.actual_return || 0), 0);
  const available = Number(wallet?.balance || 0);

  return (
    <div>
      <PageHeader
        title="SmartGrow"
        subtitle={isAdminRoute
          ? 'Put money the group isn\'t using to work in regulated Kenyan products. Every member sees each investment you make.'
          : 'Where your group\'s spare money is invested, and what each option pays. Your officials make the investments.'}
      />

      {toast && <Notice tone="ok" className="mb-4">{toast}</Notice>}

      <Panel tone="forest" className="rounded-[28px] sm:p-8 mb-6">
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <div className="text-[14px] text-[#A9C2B3]">Invested now</div>
            <Money value={totalInvested} className="block text-[40px] sm:text-[48px] leading-[1.05] mt-1" />
            <div className="text-[13px] text-[#A9C2B3] mt-1">in {investments.filter((i) => i.status === 'active').length} active {investments.filter((i) => i.status === 'active').length === 1 ? 'investment' : 'investments'}</div>
          </div>
          <div>
            <div className="text-[14px] text-[#A9C2B3]">Returns received</div>
            <Money value={totalReturns} className="block text-[32px] leading-[1.05] mt-2 text-mint" />
          </div>
          <div>
            <div className="text-[14px] text-[#A9C2B3]">Available to invest</div>
            <Money value={available} className="block text-[32px] leading-[1.05] mt-2" />
          </div>
        </div>
      </Panel>

      <h2 className="font-display text-[26px] mb-1">Options</h2>
      <p className="text-[14px] text-ink-3 mb-4">Return ranges are each provider&apos;s published expectation, not a promise. Rates change.</p>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {products.map((product) => {
          const risk = RISK[product.risk_level] || RISK.low;
          const canInvest = available >= Number(product.min_amount);
          return (
            <Panel key={product.id} as="article" className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[13px] text-ink-3">{KIND[product.type] || product.type}</span>
                <span className={cn('text-[12px] font-semibold px-2.5 py-1 rounded-full', risk.cls)}>{risk.label}</span>
              </div>
              <h3 className="font-display text-[23px] leading-tight mt-2">{product.name}</h3>
              <div className="text-[14px] text-ink-2">{product.provider}</div>
              <div className="font-money text-[34px] mt-4 text-brand">{product.expected_return_min}–{product.expected_return_max}%</div>
              <div className="text-[13px] text-ink-3 -mt-0.5">expected a year</div>
              <dl className="grid grid-cols-3 gap-2 mt-4 text-[13px]">
                <div><dt className="text-ink-3">From</dt><dd className="font-medium">{formatKsh(product.min_amount)}</dd></div>
                <div><dt className="text-ink-3">Access in</dt><dd className="font-medium">{product.liquidity_days} days</dd></div>
                <div><dt className="text-ink-3">Regulator</dt><dd className="font-medium">{product.regulatory_body}</dd></div>
              </dl>
              <p className="text-[14px] text-ink-2 mt-4 flex-1">{product.description}</p>
              {isAdminRoute ? (
                <Button className="mt-5 w-full" disabled={!canInvest} onClick={() => setSelectedProduct(product)}>
                  {canInvest ? 'Invest from the pot' : `Needs at least ${formatKsh(product.min_amount)}`}
                </Button>
              ) : (
                <p className="mt-5 text-[13px] text-ink-3">Officials decide investments. Suggest this one in the group chat.</p>
              )}
            </Panel>
          );
        })}
      </div>

      <Panel aria-labelledby="inv-h">
        <PanelTitle id="inv-h">The group&apos;s investments</PanelTitle>
        {investments.length === 0 ? (
          <EmptyState title="Nothing invested yet">{isAdminRoute ? 'Pick an option above when the pot has money it doesn\'t need for a while.' : 'When officials invest, each one is listed here with its date and amount.'}</EmptyState>
        ) : (
          <TableWrap className="mt-3">
            <table className={cn(tableClass, 'min-w-[620px]')}>
              <thead><tr><th>Option</th><th>Started</th><th className="!text-right">Invested</th><th className="!text-right">Expected a year</th><th>Status</th></tr></thead>
              <tbody>
                {investments.map((inv) => (
                  <tr key={inv.id}>
                    <td><div className="font-medium">{inv.smartgrow_products?.name}</div><div className="text-[13px] text-ink-3">{inv.smartgrow_products?.provider}</div></td>
                    <td className="text-ink-2 whitespace-nowrap">{inv.start_date ? new Date(inv.start_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td className="text-right"><Money value={Number(inv.amount)} className="text-[17px]" /></td>
                    <td className="text-right text-ink-2">{inv.smartgrow_products?.expected_return_min}–{inv.smartgrow_products?.expected_return_max}%</td>
                    <td><Chip kind={inv.status === 'active' ? 'paid' : 'neutral'}>{inv.status === 'active' ? 'Active' : inv.status === 'matured' ? 'Matured' : inv.status}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      <Modal
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct ? `Invest in ${selectedProduct.name}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedProduct(null)}>Cancel</Button>
            <Button type="submit" form="invest-form" disabled={investing || !selectedProduct || Number(investAmount) < Number(selectedProduct?.min_amount || 0) || Number(investAmount) > available}>
              {investing ? 'Recording…' : `Invest ${formatKsh(Number(investAmount) || 0)}`}
            </Button>
          </>
        }
      >
        {selectedProduct && (
          <form id="invest-form" onSubmit={handleInvest} className="flex flex-col gap-5">
            <p className="text-[14px] text-ink-2">{selectedProduct.provider}. Make the transfer to the provider from the group account, then record it here so every member sees it.</p>
            <Field label="Amount" hint={`Between ${formatKsh(selectedProduct.min_amount)} and ${formatKsh(available)}.`}>
              <input type="number" inputMode="numeric" min={selectedProduct.min_amount} max={available} required value={investAmount} onChange={(e) => setInvestAmount(e.target.value)} className={inputClass} />
            </Field>
            <Field label="How long">
              <select value={investDuration} onChange={(e) => setInvestDuration(e.target.value)} className={inputClass}>
                <option value="">Choose</option>
                <option value="ongoing">No fixed end, withdraw when needed</option>
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
              </select>
            </Field>
            {Number(investAmount) > 0 && (
              <div className="rounded-[18px] bg-sage text-sage-ink p-4">
                <div className="text-[13px] text-[#2B4637]">After a year, if the provider pays its expected rate</div>
                <div className="font-money text-[28px] mt-1">{formatKsh(calcProjected(selectedProduct.expected_return_min))} to {formatKsh(calcProjected(selectedProduct.expected_return_max))}</div>
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}

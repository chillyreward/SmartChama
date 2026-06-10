"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function AdminTransactionsPage() {
  const { member: adminMember, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTx, setFilteredTx] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  useEffect(() => {
    if (!adminMember || !group) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('transactions')
          .select('*, members(full_name)')
          .eq('group_id', group.id)
          .order('created_at', { ascending: false });

        setTransactions(data || []);
        setFilteredTx(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [adminMember, group]);

  useEffect(() => {
    let res = transactions;
    if (filter === 'Incoming') res = res.filter(t => ['contribution', 'repayment', 'penalty', 'interest', 'deposit'].includes(t.type));
    else if (filter === 'Outgoing') res = res.filter(t => ['loan_disbursement', 'withdrawal'].includes(t.type));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(t => 
        t.reference?.toLowerCase().includes(q) || 
        t.type?.toLowerCase().includes(q) || 
        t.members?.full_name?.toLowerCase().includes(q)
      );
    }
    setFilteredTx(res);
  }, [searchQuery, filter, transactions]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-96 bg-white border border-[#E5E7EB] rounded-lg animate-pulse shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="p-8 font-inter min-h-full">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-headline-lg font-semibold text-on-surface font-geist">All Transactions</h1>
          <p className="text-body-sm text-secondary mt-1">Complete financial ledger for the group</p>
        </div>
        <button className="bg-white border border-[#E5E7EB] text-on-surface px-4 py-2 rounded text-body-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export CSV
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search by ref, type or member..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-[#E5E7EB] rounded pl-10 pr-4 py-2 text-body-sm outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all"
          />
        </div>
        
        <div className="flex gap-2">
          {['All', 'Incoming', 'Outgoing'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-body-sm font-medium whitespace-nowrap transition-colors ${
                filter === f 
                  ? 'bg-surface-container-high text-on-surface' 
                  : 'text-secondary hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#E5E7EB]">
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">DATE</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">TYPE</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">MEMBER</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">REFERENCE</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">STATUS</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium text-right">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-secondary text-body-sm">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTx.map(tx => {
                  const isIncoming = Number(tx.amount) > 0;
                  return (
                    <tr key={tx.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-body-sm text-secondary whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[16px] ${isIncoming ? 'text-[#22C55E]' : 'text-error'}`}>
                            {isIncoming ? 'arrow_downward' : 'arrow_upward'}
                          </span>
                          <span className="text-body-sm font-medium text-on-surface capitalize">
                            {tx.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-body-sm text-secondary whitespace-nowrap">
                        {tx.members?.full_name || '—'}
                      </td>
                      <td className="px-6 py-4 text-body-sm font-mono text-secondary">
                        {tx.reference || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-label-caps font-medium capitalize ${
                          tx.status === 'confirmed' ? 'bg-[#22C55E]/10 text-[#005321]' :
                          tx.status === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-mono font-bold whitespace-nowrap ${isIncoming ? 'text-[#22C55E]' : 'text-on-surface'}`}>
                        {isIncoming ? '+' : ''}KSh {formatCurrency(Number(tx.amount))}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

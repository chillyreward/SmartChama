"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminAnalyticsPage() {
  const { member: adminMember, group } = useAuth();
  const [loading, setLoading] = useState(true);

  const [loanHealth, setLoanHealth] = useState<any[]>([]);
  const [contributionStats, setContributionStats] = useState({ total: 0, late: 0, confirmed: 0 });
  const [topMembers, setTopMembers] = useState<any[]>([]);
  
  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  useEffect(() => {
    if (!adminMember || !group) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Loans
        const { data: loans } = await supabase.from('loans').select('status, amount').eq('group_id', group.id);
        const lHealth = { active: 0, overdue: 0, repaid: 0 };
        loans?.forEach(l => {
          if (l.status === 'active') lHealth.active += Number(l.amount);
          if (l.status === 'overdue') lHealth.overdue += Number(l.amount);
          if (l.status === 'repaid') lHealth.repaid += Number(l.amount);
        });

        setLoanHealth([
          { name: 'Healthy (Active)', value: lHealth.active, color: '#3B82F6' },
          { name: 'Overdue (Risk)', value: lHealth.overdue, color: '#EF4444' },
          { name: 'Repaid', value: lHealth.repaid, color: '#22C55E' }
        ]);

        // Fetch Contributions
        const { data: contribs } = await supabase.from('contributions').select('status, amount, member_id, members(full_name)').eq('group_id', group.id);
        
        let total = 0, late = 0, confirmed = 0;
        const memberTotals: Record<string, {name: string, total: number}> = {};

        contribs?.forEach(c => {
          const amt = Number(c.amount);
          total += amt;
          if (c.status === 'confirmed') confirmed += amt;
          if (c.status === 'late') late += amt;

          if (c.status === 'confirmed' && c.members?.full_name) {
            if (!memberTotals[c.member_id]) {
              memberTotals[c.member_id] = { name: c.members.full_name, total: 0 };
            }
            memberTotals[c.member_id].total += amt;
          }
        });

        setContributionStats({ total, late, confirmed });

        const sortedMembers = Object.values(memberTotals).sort((a, b) => b.total - a.total).slice(0, 5);
        setTopMembers(sortedMembers);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [adminMember, group]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-96 bg-white border border-[#E5E7EB] rounded-lg animate-pulse shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="p-8 font-inter">
      <div className="mb-6">
        <h1 className="text-headline-lg font-semibold text-on-surface font-geist">Analytics</h1>
        <p className="text-body-sm text-secondary mt-1">Deep dive into group financial health</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* LOAN BOOK HEALTH */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm p-6 flex flex-col">
          <h2 className="text-headline-sm font-geist text-on-surface mb-6">Loan Book Health</h2>
          <div className="flex-1 flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={loanHealth}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {loanHealth.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`KSh ${formatCurrency(value)}`, 'Amount']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 flex flex-col gap-4 mt-6 md:mt-0">
              {loanHealth.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-body-sm text-secondary">{item.name}</span>
                  </div>
                  <span className="font-mono font-medium text-on-surface">KSh {formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CONTRIBUTION STATS */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm p-6">
          <h2 className="text-headline-sm font-geist text-on-surface mb-6">Contribution Compliance</h2>
          
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <div className="text-display-sm font-geist font-bold text-[#22C55E]">
                {contributionStats.total > 0 ? Math.round((contributionStats.confirmed / contributionStats.total) * 100) : 0}%
              </div>
              <div className="text-label-caps text-secondary">ALL-TIME RECOVERY RATE</div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div 
                className="bg-[#22C55E] h-3 rounded-full" 
                style={{ width: `${contributionStats.total > 0 ? (contributionStats.confirmed / contributionStats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-surface-container-low border border-[#E5E7EB] rounded-lg">
              <div className="text-label-caps text-secondary mb-1">CONFIRMED FUNDS</div>
              <div className="font-mono font-bold text-on-surface text-lg">KSh {formatCurrency(contributionStats.confirmed)}</div>
            </div>
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
              <div className="text-label-caps text-orange-800 mb-1">OUTSTANDING (LATE)</div>
              <div className="font-mono font-bold text-orange-800 text-lg">KSh {formatCurrency(contributionStats.late)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm p-6">
        <h2 className="text-headline-sm font-geist text-on-surface mb-6">Top Contributors All-Time</h2>
        <div className="flex flex-col gap-4">
          {topMembers.map((m, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 border border-[#E5E7EB] rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-xs ${
                  idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                  idx === 1 ? 'bg-gray-200 text-gray-700' :
                  idx === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-surface-container-high text-secondary'
                }`}>
                  #{idx + 1}
                </div>
                <div className="font-medium text-on-surface">{m.name}</div>
              </div>
              <div className="font-mono font-bold text-[#22C55E]">KSh {formatCurrency(m.total)}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

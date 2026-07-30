"use client";

import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Calendar } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      
      <div>
        <h1 className="text-3xl font-black font-geist" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Track performance and growth metrics</p>
      </div>

      {/* KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-6 transition-colors" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-[#22C55E]" />
            <span className="flex items-center gap-1 text-[#22C55E] text-sm font-bold">
              <TrendingUp className="w-4 h-4" />
              +12.5%
            </span>
          </div>
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Total Revenue</p>
          <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>KES 1.8M</p>
        </div>

        <div className="rounded-2xl p-6 transition-colors" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-500" />
            <span className="flex items-center gap-1 text-[#22C55E] text-sm font-bold">
              <TrendingUp className="w-4 h-4" />
              +8.2%
            </span>
          </div>
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Active Members</p>
          <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>65</p>
        </div>

        <div className="rounded-2xl p-6 transition-colors" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-purple-500" />
            <span className="flex items-center gap-1 text-red-500 text-sm font-bold">
              <TrendingDown className="w-4 h-4" />
              -3.1%
            </span>
          </div>
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Transactions</p>
          <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>234</p>
        </div>

        <div className="rounded-2xl p-6 transition-colors" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-amber-500" />
            <span className="flex items-center gap-1 text-[#22C55E] text-sm font-bold">
              <TrendingUp className="w-4 h-4" />
              +15.3%
            </span>
          </div>
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Monthly Growth</p>
          <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>15.3%</p>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* REVENUE CHART */}
        <div className="rounded-[24px] p-6 transition-colors" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-lg font-bold mb-6 font-geist" style={{ color: 'var(--text-primary)' }}>Revenue Trend</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {[45, 52, 48, 65, 58, 72, 68, 75, 82, 78, 88, 95].map((height, i) => (
              <div key={i} className="flex-1 bg-[#22C55E]/20 hover:bg-[#22C55E] rounded-t transition-all cursor-pointer relative group" style={{height: `${height}%`}}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                  KES {(height * 1000).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Jan</span>
            <span>Dec</span>
          </div>
        </div>

        {/* MEMBER GROWTH */}
        <div className="rounded-[24px] p-6 transition-colors" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-lg font-bold mb-6 font-geist" style={{ color: 'var(--text-primary)' }}>Member Growth</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {[30, 35, 38, 42, 45, 48, 52, 55, 58, 60, 63, 65].map((height, i) => (
              <div key={i} className="flex-1 bg-blue-500/20 hover:bg-blue-500 rounded-t transition-all cursor-pointer relative group" style={{height: `${height}%`}}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                  {Math.round(height * 0.65)} members
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Jan</span>
            <span>Dec</span>
          </div>
        </div>
      </div>

      {/* TOP PERFORMERS */}
      <div className="rounded-[24px] p-6 transition-colors" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h3 className="text-lg font-bold mb-6 font-geist" style={{ color: 'var(--text-primary)' }}>Top Contributing Members</h3>
        <div className="space-y-4">
          {[
            { name: "David Mwangi", amount: "KES 67,000", percentage: 85 },
            { name: "Mary Wanjiku", amount: "KES 52,000", percentage: 65 },
            { name: "John Kamau", amount: "KES 45,000", percentage: 55 },
            { name: "Peter Omondi", amount: "KES 38,000", percentage: 45 },
          ].map((member, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center font-bold text-white">
                {member.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{member.name}</span>
                  <span className="text-[#22C55E] font-bold">{member.amount}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <div 
                    className="h-full bg-[#22C55E] rounded-full transition-all"
                    style={{width: `${member.percentage}%`}}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

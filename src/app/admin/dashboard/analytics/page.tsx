"use client";

import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Calendar } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      
      <div>
        <h1 className="text-3xl font-black text-white">Analytics</h1>
        <p className="text-slate-400 mt-1">Track performance and growth metrics</p>
      </div>

      {/* KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-emerald-400" />
            <span className="flex items-center gap-1 text-emerald-400 text-sm font-bold">
              <TrendingUp className="w-4 h-4" />
              +12.5%
            </span>
          </div>
          <p className="text-slate-400 text-sm mb-1">Total Revenue</p>
          <p className="text-2xl font-black text-white">KES 1.8M</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-400" />
            <span className="flex items-center gap-1 text-emerald-400 text-sm font-bold">
              <TrendingUp className="w-4 h-4" />
              +8.2%
            </span>
          </div>
          <p className="text-slate-400 text-sm mb-1">Active Members</p>
          <p className="text-2xl font-black text-white">65</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-purple-400" />
            <span className="flex items-center gap-1 text-red-400 text-sm font-bold">
              <TrendingDown className="w-4 h-4" />
              -3.1%
            </span>
          </div>
          <p className="text-slate-400 text-sm mb-1">Transactions</p>
          <p className="text-2xl font-black text-white">234</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-amber-400" />
            <span className="flex items-center gap-1 text-emerald-400 text-sm font-bold">
              <TrendingUp className="w-4 h-4" />
              +15.3%
            </span>
          </div>
          <p className="text-slate-400 text-sm mb-1">Monthly Growth</p>
          <p className="text-2xl font-black text-white">15.3%</p>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* REVENUE CHART */}
        <div className="bg-slate-900 border border-slate-800 rounded-[24px] p-6">
          <h3 className="text-lg font-bold text-white mb-6">Revenue Trend</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {[45, 52, 48, 65, 58, 72, 68, 75, 82, 78, 88, 95].map((height, i) => (
              <div key={i} className="flex-1 bg-amber-500/20 hover:bg-amber-500 rounded-t transition-all cursor-pointer relative group" style={{height: `${height}%`}}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  KES {(height * 1000).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-slate-500">
            <span>Jan</span>
            <span>Dec</span>
          </div>
        </div>

        {/* MEMBER GROWTH */}
        <div className="bg-slate-900 border border-slate-800 rounded-[24px] p-6">
          <h3 className="text-lg font-bold text-white mb-6">Member Growth</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {[30, 35, 38, 42, 45, 48, 52, 55, 58, 60, 63, 65].map((height, i) => (
              <div key={i} className="flex-1 bg-blue-500/20 hover:bg-blue-500 rounded-t transition-all cursor-pointer relative group" style={{height: `${height}%`}}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {Math.round(height * 0.65)} members
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-slate-500">
            <span>Jan</span>
            <span>Dec</span>
          </div>
        </div>
      </div>

      {/* TOP PERFORMERS */}
      <div className="bg-slate-900 border border-slate-800 rounded-[24px] p-6">
        <h3 className="text-lg font-bold text-white mb-6">Top Contributing Members</h3>
        <div className="space-y-4">
          {[
            { name: "David Mwangi", amount: "KES 67,000", percentage: 85 },
            { name: "Mary Wanjiku", amount: "KES 52,000", percentage: 65 },
            { name: "John Kamau", amount: "KES 45,000", percentage: 55 },
            { name: "Peter Omondi", amount: "KES 38,000", percentage: 45 },
          ].map((member, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-bold text-black">
                {member.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-white">{member.name}</span>
                  <span className="text-amber-400 font-bold">{member.amount}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
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

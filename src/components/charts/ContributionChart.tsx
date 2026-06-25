'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ContributionData {
  month: string;
  expected: number;
  actual: number;
}

interface ContributionChartProps {
  data: ContributionData[];
  title?: string;
  height?: number;
}

export default function ContributionChart({ data, title = "Contributions", height = 250 }: ContributionChartProps) {
  const chartData = useMemo(() => {
    // If the data is extremely large (e.g., daily over years), we could downsample it here.
    // For now, it accepts monthly aggregated data.
    return data;
  }, [data]);

  return (
    <div className="w-full">
      {title && <h3 className="text-headline-sm font-geist text-on-surface mb-4">{title}</h3>}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#006e2f]"></div>
          <span className="text-body-sm text-secondary">Actual Contributions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <span className="text-body-sm text-secondary">Expected Goal</span>
        </div>
      </div>
      
      <div style={{ height, width: '100%' }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006e2f" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#006e2f" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} tickFormatter={(val) => `KSh ${(val/1000).toFixed(val >= 1000 ? 0 : 1)}k`} />
              <Tooltip 
                formatter={(value: any, name: any) => [`KSh ${value.toLocaleString()}`, name === 'actual' ? 'Actual' : 'Expected']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
              />
              <Area type="monotone" dataKey="expected" stroke="#9CA3AF" strokeDasharray="4 4" fillOpacity={1} fill="url(#colorExpected)" />
              <Area type="monotone" dataKey="actual" stroke="#006e2f" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">bar_chart</span>
            <p className="text-body-sm text-secondary">No chart data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

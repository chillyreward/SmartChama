export default function MemberDashboard() {
  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full">
      
      {/* ROW 1: Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        
        {/* Card 1 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="text-label-caps text-on-surface-variant">TOTAL SAVINGS</div>
            <span className="material-symbols-outlined text-outline-variant">savings</span>
          </div>
          <div className="text-display-sm text-on-surface font-geist">KSh 124,500</div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between">
          <div className="text-label-caps text-on-surface-variant mb-4">ACTIVE LOANS</div>
          <div className="text-display-sm text-on-surface font-geist">3</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between">
          <div className="text-label-caps text-on-surface-variant mb-4">REPAYMENT RATE</div>
          <div className="flex items-center gap-3">
            <div className="text-display-sm text-on-surface font-geist">94%</div>
            <div className="bg-surface-container-low text-[#22C55E] px-2 py-0.5 rounded text-mono-data border border-[#4ae176]">
              +2%
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="text-label-caps text-on-surface-variant">TRUST SCORE</div>
            <span className="material-symbols-outlined text-[#22C55E]">verified</span>
          </div>
          <div className="text-display-sm text-[#22C55E] font-geist">82/100</div>
        </div>

      </div>

      {/* ROW 2: Contribution Trend Chart */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-headline-sm text-on-surface font-geist">Contribution Trend</h2>
          <div className="flex gap-2 text-body-sm">
            <button className="px-3 py-1 rounded bg-surface-container-low border border-[#4ae176] text-[#22C55E] font-medium">6M</button>
            <button className="px-3 py-1 rounded text-on-surface-variant hover:bg-gray-50 border border-transparent">1Y</button>
            <button className="px-3 py-1 rounded text-on-surface-variant hover:bg-gray-50 border border-transparent">ALL</button>
          </div>
        </div>
        
        {/* SVG Line Chart */}
        <div className="h-64 w-full relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 240" preserveAspectRatio="none">
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Horizontal Grid Lines */}
            <line x1="0" y1="40" x2="1000" y2="40" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="120" x2="1000" y2="120" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="200" x2="1000" y2="200" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
            
            {/* Area Fill */}
            <path d="M0,200 L0,150 C200,100 300,180 500,120 C700,60 800,100 1000,40 L1000,200 Z" fill="url(#trendGradient)" />
            
            {/* Line Path */}
            <path d="M0,150 C200,100 300,180 500,120 C700,60 800,100 1000,40" fill="none" stroke="#22C55E" strokeWidth="2" />
            
            {/* Data Points */}
            <circle cx="0" cy="150" r="4" fill="white" stroke="#22C55E" strokeWidth="2" />
            <circle cx="250" cy="120" r="4" fill="white" stroke="#22C55E" strokeWidth="2" />
            <circle cx="500" cy="120" r="4" fill="white" stroke="#22C55E" strokeWidth="2" />
            <circle cx="750" cy="80" r="4" fill="white" stroke="#22C55E" strokeWidth="2" />
            <circle cx="1000" cy="40" r="4" fill="white" stroke="#22C55E" strokeWidth="2" />
          </svg>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 w-full flex justify-between transform translate-y-6 text-label-caps text-on-secondary-container">
            <span>JUN</span>
            <span>JUL</span>
            <span>AUG</span>
            <span>SEP</span>
            <span>OCT</span>
            <span>NOV</span>
          </div>
        </div>
      </div>

      {/* ROW 3: Two columns */}
      <div className="grid lg:grid-cols-3 gap-6 mt-12 mb-12">
        
        {/* Left: Recent Transactions */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-headline-sm text-on-surface font-geist">Recent Transactions</h2>
            <button className="text-body-sm text-primary hover:underline">View All</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="py-3 text-label-caps text-on-secondary-container font-medium">DATE</th>
                  <th className="py-3 text-label-caps text-on-secondary-container font-medium">MEMBER</th>
                  <th className="py-3 text-label-caps text-on-secondary-container font-medium">TYPE</th>
                  <th className="py-3 text-label-caps text-on-secondary-container font-medium text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1 */}
                <tr className="border-b border-[#E5E7EB] hover:bg-gray-50 transition-colors">
                  <td className="py-4 text-body-sm text-on-surface">Oct 24</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center text-xs font-bold">JK</div>
                      <span className="text-body-sm text-on-surface font-medium">James K.</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="inline-block bg-surface-container-low border border-[#4ae176] text-[#22C55E] px-2 py-1 rounded text-xs font-medium">Monthly Cont.</span>
                  </td>
                  <td className="py-4 text-right text-body-sm text-[#22C55E] font-medium">+ KSh 5,000</td>
                </tr>

                {/* Row 2 */}
                <tr className="border-b border-[#E5E7EB] hover:bg-gray-50 transition-colors">
                  <td className="py-4 text-body-sm text-on-surface">Oct 22</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#fce7f3] text-[#be185d] flex items-center justify-center text-xs font-bold">MM</div>
                      <span className="text-body-sm text-on-surface font-medium">Mary M.</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="inline-block bg-white border border-[#E5E7EB] text-on-surface px-2 py-1 rounded text-xs font-medium">Loan Repayment</span>
                  </td>
                  <td className="py-4 text-right text-body-sm text-[#22C55E] font-medium">+ KSh 12,500</td>
                </tr>

                {/* Row 3 */}
                <tr className="border-b border-[#E5E7EB] hover:bg-gray-50 transition-colors">
                  <td className="py-4 text-body-sm text-on-surface">Oct 18</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#fef3c7] text-[#b45309] flex items-center justify-center text-xs font-bold">PK</div>
                      <span className="text-body-sm text-on-surface font-medium">Peter K.</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="inline-block bg-white border border-[#E5E7EB] text-on-surface px-2 py-1 rounded text-xs font-medium">Loan Disbursed</span>
                  </td>
                  <td className="py-4 text-right text-body-sm text-on-surface font-medium">- KSh 50,000</td>
                </tr>

                {/* Row 4 */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 text-body-sm text-on-surface">Oct 15</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                        <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      </div>
                      <span className="text-body-sm text-on-surface font-medium">Grace N.</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="inline-block bg-surface-container-low border border-[#4ae176] text-[#22C55E] px-2 py-1 rounded text-xs font-medium">Monthly Cont.</span>
                  </td>
                  <td className="py-4 text-right text-body-sm text-[#22C55E] font-medium">+ KSh 5,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Group Health Score */}
        <div className="lg:col-span-1 bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col">
          <h2 className="text-headline-sm text-on-surface font-geist mb-6">Group Health</h2>
          
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#22C55E" strokeWidth="8" strokeLinecap="round" 
                  strokeDasharray="282.7" strokeDashoffset="36.7" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                <span className="text-display-sm font-geist text-on-surface leading-none">87</span>
                <span className="text-label-caps text-on-secondary-container mt-1">Excellent</span>
              </div>
            </div>
          </div>

          <div className="space-y-5 flex-1">
            {[
              { label: 'Participation', value: '92%' },
              { label: 'Repayment', value: '88%' },
              { label: 'Consistency', value: '85%' },
              { label: 'Trust', value: '95%' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-label-caps text-on-surface-variant">{stat.label}</span>
                  <span className="text-mono-data text-on-surface">{stat.value}</span>
                </div>
                <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full bg-[#22C55E]" style={{ width: stat.value }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
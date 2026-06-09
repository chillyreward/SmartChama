export default function AnalyticsPage() {
  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full font-inter">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-headline-lg text-on-surface font-geist font-bold">Analytics</h1>
          <p className="text-body-sm text-secondary mt-1">Mama Pesa Chama · Last 12 months</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-white border border-[#E5E7EB] rounded px-4 py-2 text-body-sm flex items-center gap-2 text-on-surface cursor-pointer">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            Last 12 Months
            <span className="material-symbols-outlined text-lg">expand_more</span>
          </div>
          <button className="bg-[#22C55E] text-white rounded px-4 py-2 text-body-sm font-medium hover:bg-[#006e2f] transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between">
          <div className="text-label-caps text-on-surface-variant mb-4">TOTAL SAVED (GROUP)</div>
          <div className="text-display-sm text-on-surface font-geist mb-2">KSh 1,240,000</div>
          <div>
            <span className="inline-flex items-center bg-surface-container-low text-[#22C55E] border border-[#4ae176] px-2 py-0.5 rounded text-mono-data">
              ↑ 18% vs last year
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between">
          <div className="text-label-caps text-on-surface-variant mb-4">LOANS ISSUED</div>
          <div className="text-display-sm text-on-surface font-geist mb-2">KSh 320,000</div>
          <div className="text-label-caps text-secondary">12 loans total</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between">
          <div className="text-label-caps text-on-surface-variant mb-4">AVG CONTRIBUTION RATE</div>
          <div className="text-display-sm text-[#22C55E] font-geist">91%</div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between">
          <div className="text-label-caps text-on-surface-variant mb-4">GROUP TRUST SCORE</div>
          <div className="text-display-sm text-[#22C55E] font-geist mb-2">84/100</div>
          <div className="text-body-sm text-[#22C55E] font-medium">↑ 6 points</div>
        </div>
      </div>

      {/* CHART ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Left: Savings Growth */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
          <h2 className="text-headline-sm text-on-surface font-geist mb-6">Total group savings over time</h2>
          <div className="h-48 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Horizontal Grid Lines */}
              <line x1="0" y1="40" x2="1000" y2="40" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="1000" y2="100" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="160" x2="1000" y2="160" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
              
              {/* Area Fill */}
              <path d="M0,160 C200,140 300,120 500,80 C700,40 800,20 1000,10 L1000,200 L0,200 Z" fill="url(#areaGradient)" />
              {/* Line Path */}
              <path d="M0,160 C200,140 300,120 500,80 C700,40 800,20 1000,10" fill="none" stroke="#22C55E" strokeWidth="2" />
            </svg>
            
            {/* Y-axis labels (absolute positioned over the chart) */}
            <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-label-caps text-on-secondary-container -ml-12 pb-6">
              <span>1.2M</span>
              <span>800K</span>
              <span>400K</span>
              <span>0</span>
            </div>

            {/* X-axis labels */}
            <div className="absolute bottom-0 w-full flex justify-between transform translate-y-8 text-label-caps text-on-secondary-container">
              <span>JAN</span>
              <span>MAR</span>
              <span>MAY</span>
              <span>JUL</span>
              <span>SEP</span>
              <span>NOV</span>
              <span>DEC</span>
            </div>
          </div>
        </div>

        {/* Right: Contribution Rate */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
          <h2 className="text-headline-sm text-on-surface font-geist mb-6">Monthly collection rate</h2>
          <div className="h-48 w-full relative pl-8 pb-8 mt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 200" preserveAspectRatio="none">
              {/* 100% Target line */}
              <line x1="0" y1="20" x2="1000" y2="20" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="4 4" />
              <text x="1010" y="25" fill="#6B7280" fontSize="14" className="font-mono">100%</text>

              {/* Bars: 95 90 88 92 98 85 91 93 87 94 96 87.5 */}
              <rect x="20" y="29" width="40" height="171" fill="#22C55E" rx="4" />
              <rect x="100" y="38" width="40" height="162" fill="#22C55E" rx="4" />
              <rect x="180" y="41.6" width="40" height="158.4" fill="#22C55E" rx="4" />
              <rect x="260" y="34.4" width="40" height="165.6" fill="#22C55E" rx="4" />
              <rect x="340" y="23.6" width="40" height="176.4" fill="#22C55E" rx="4" />
              <rect x="420" y="47" width="40" height="153" fill="#22C55E" rx="4" />
              <rect x="500" y="36.2" width="40" height="163.8" fill="#22C55E" rx="4" />
              <rect x="580" y="32.6" width="40" height="167.4" fill="#22C55E" rx="4" />
              <rect x="660" y="43.4" width="40" height="156.6" fill="#22C55E" rx="4" />
              <rect x="740" y="30.8" width="40" height="169.2" fill="#22C55E" rx="4" />
              <rect x="820" y="27.2" width="40" height="172.8" fill="#22C55E" rx="4" />
              <rect x="900" y="42.5" width="40" height="157.5" fill="#22C55E" rx="4" />
            </svg>
            
            <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-label-caps text-on-secondary-container -ml-2 pb-8">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>

            <div className="absolute bottom-0 w-full flex justify-between text-label-caps text-on-secondary-container">
              <span>J</span><span>F</span><span>M</span><span>A</span><span>M</span><span>J</span><span>J</span><span>A</span><span>S</span><span>O</span><span>N</span><span>D</span>
            </div>
          </div>
        </div>

      </div>

      {/* CHART ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Left: Loan Performance */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
          <h2 className="text-headline-sm text-on-surface font-geist mb-6">Loans issued vs repaid</h2>
          <div className="h-48 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 200" preserveAspectRatio="none">
              <line x1="0" y1="50" x2="1000" y2="50" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="1000" y2="100" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="150" x2="1000" y2="150" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
              
              {/* Issued Amount (Gray Dashed) */}
              <path d="M0,150 L100,130 L200,140 L300,100 L400,90 L500,80 L600,85 L700,60 L800,50 L900,30 L1000,40" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="6 4" />
              
              {/* Repaid Amount (Green Solid) */}
              <path d="M0,160 L100,150 L200,145 L300,120 L400,100 L500,85 L600,90 L700,70 L800,60 L900,40 L1000,50" fill="none" stroke="#22C55E" strokeWidth="2" />
            </svg>
            
            <div className="absolute bottom-0 left-0 flex gap-4 text-body-sm text-on-secondary-container transform translate-y-10">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#22C55E]"></span> Repaid</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#9CA3AF]"></span> Issued</div>
            </div>
          </div>
        </div>

        {/* Right: Member Activity Breakdown */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col items-center">
          <h2 className="text-headline-sm text-on-surface font-geist mb-6 w-full text-left">Member contribution status — this month</h2>
          <div className="h-48 w-48 relative mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {/* Circumference = 2 * PI * 40 = 251.3 */}
              {/* 75% Paid (#22C55E) -> 188.4 */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#22C55E" strokeWidth="15" strokeDasharray="188.4 251.3" />
              {/* 15% Partial (#FCD34D) -> 37.7 */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#FCD34D" strokeWidth="15" strokeDasharray="37.7 251.3" strokeDashoffset="-188.4" />
              {/* 10% Not paid (#FCA5A5) -> 25.1 */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#FCA5A5" strokeWidth="15" strokeDasharray="25.1 251.3" strokeDashoffset="-226.1" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-headline-sm font-geist text-on-surface font-bold">20</span>
              <span className="text-label-caps text-on-secondary-container">Members</span>
            </div>
          </div>
          
          <div className="flex gap-4 text-body-sm text-on-surface w-full justify-center">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#22C55E]"></span> Paid (75%)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#FCD34D]"></span> Partial (15%)</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#FCA5A5]"></span> Not paid (10%)</div>
          </div>
        </div>

      </div>

      {/* GROUP HEALTH SCORE WIDGET */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 w-full mb-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-headline-sm text-on-surface font-geist">Group Health Score</h2>
          <div className="text-headline-sm text-[#22C55E] font-geist">87/100</div>
        </div>

        <div className="flex flex-col items-center mb-10">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#22C55E" strokeWidth="8" strokeLinecap="round" 
                strokeDasharray="282.7" strokeDashoffset="36.7" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
              <span className="text-display-sm font-geist text-[#22C55E] leading-none">87</span>
              <span className="text-label-caps text-[#22C55E] mt-1 text-center">Excellent<br/>Health</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {[
            { label: 'Participation Rate', value: '91%' },
            { label: 'Repayment Consistency', value: '94%' },
            { label: 'Contribution Regularity', value: '88%' },
            { label: 'Member Retention', value: '85%' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="flex justify-between items-end mb-2">
                <span className="text-label-caps text-on-surface-variant">{stat.label}</span>
                <span className="text-mono-data text-on-surface">{stat.value}</span>
              </div>
              <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div className="h-full bg-[#22C55E]" style={{ width: stat.value }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <div className="bg-surface-container-low border border-[#4ae176] px-4 py-2 rounded inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-[#22C55E] text-sm">check_circle</span>
            <span className="text-body-sm text-[#22C55E] font-medium">Your group is in Excellent Health</span>
          </div>
        </div>

      </div>

    </div>
  );
}

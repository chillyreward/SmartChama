// app/dashboard/smartgrow/page.tsx
import { 
  ShoppingCart, 
  PieChart, 
  Search, 
  Bell, 
  ChevronRight, 
  Info
} from "lucide-react";

const investmentProducts = [
  {
    id: 1,
    name: "NCBA Money Market Fund",
    description: "Capital preservation with daily liquidity.",
    return: 15.0,
    risk: "Low Risk",
    riskColor: "bg-emerald-500/20 text-emerald-400",
    active: true,
    logo: "N"
  },
  {
    id: 2,
    name: "Sanlam MMF",
    description: "Growth-focused cash management.",
    return: 14.5,
    risk: "Medium Risk",
    riskColor: "bg-slate-700 text-slate-300",
    active: false,
    logo: "S"
  },
  {
    id: 3,
    name: "CIC Wealth Fund",
    description: "Secure wealth accumulation strategy.",
    return: 13.8,
    risk: "Low Risk",
    riskColor: "bg-slate-700 text-slate-300",
    active: false,
    logo: "C"
  }
];

const chartBars = [20, 30, 40, 50, 60, 70, 80, 90, 100];

export default function SmartGrowPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Marketplace</h2>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search investment products..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>
          <div className="size-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600" />
        </div>
      </header>

      {/* Title */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Investment Marketplace</h1>
          <p className="text-slate-400 mt-2">Explore high-yield opportunities for your Chama</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-6 rounded-full transition-colors w-fit">
          <PieChart className="w-4 h-4" />
          <span>Manage Portfolio</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <div className="flex gap-6 overflow-x-auto scrollbar-hide">
          {["All Opportunities", "Money Market", "Fixed Deposit", "Real Estate"].map((tab, idx) => (
            <button 
              key={tab}
              className={`pb-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${idx === 1 ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
        {/* Investment Cards */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {investmentProducts.map((product) => (
            <div 
              key={product.id}
              className={`rounded-2xl p-6 relative overflow-hidden ${product.active ? 'bg-slate-900 border-2 border-emerald-500 ring-4 ring-emerald-500/10' : 'bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`size-12 rounded-xl flex items-center justify-center font-black text-xl ${product.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {product.logo}
                </div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${product.riskColor}`}>
                  {product.risk}
                </span>
              </div>
              
              <h3 className="text-white text-lg font-bold mb-1">{product.name}</h3>
              <p className="text-slate-400 text-sm mb-6">{product.description}</p>
              
              <div className="mb-6">
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-1">Expected Return</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-black tracking-tighter ${product.active ? 'text-emerald-400' : 'text-white'}`}>
                    {product.return.toFixed(1)}%
                  </span>
                  <span className="text-slate-500 font-bold">p.a.</span>
                </div>
              </div>
              
              <button className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${product.active ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'bg-slate-800 text-white hover:bg-emerald-500 hover:text-slate-950'}`}>
                Calculate Returns
                {product.active && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>

        {/* Calculator Panel */}
        <div className="w-full xl:w-96 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden sticky top-0">
          <div className="p-6 border-b border-slate-800">
            <h4 className="text-white font-bold mb-1">Growth Projection</h4>
            <p className="text-slate-400 text-xs">Based on 15% p.a. historical yield</p>
          </div>
          
          <div className="p-6">
            <div className="h-48 w-full relative mb-8 flex items-end gap-1">
              {chartBars.map((height, idx) => (
                <div 
                  key={idx} 
                  className="flex-1 bg-emerald-500/20 rounded-t-sm hover:bg-emerald-500/40 transition-colors"
                  style={{ height: `${height}%`, opacity: 0.3 + (idx * 0.08) }}
                />
              ))}
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  Invest Amount (KES)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">KES</span>
                  <input 
                    type="text" 
                    defaultValue="500,000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-14 pr-4 py-3 font-bold text-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-400 font-medium">Projected 12m Value</span>
                  <span className="text-xs text-emerald-400 font-bold">+KES 75,000</span>
                </div>
                <p className="text-2xl font-black text-white">KES 575,000</p>
              </div>

              <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
                Invest with Group
              </button>

              <div className="flex items-start gap-2 p-3 bg-slate-900 rounded-lg border border-slate-800">
                <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 italic">
                  Yields are calculated based on compound interest and may vary.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
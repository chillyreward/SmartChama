import { supabase } from "../lib/supabase";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Users, 
  TrendingUp, 
  LayoutDashboard, 
  PieChart, 
  CreditCard, 
  Settings, 
  Bell, 
  Search, 
  LogOut 
} from "lucide-react";

// FORCE DYNAMIC: This ensures the page always fetches fresh data from the DB
export const revalidate = 0;

export default async function Dashboard() {
  // 1. FETCH REAL DATA FROM SUPABASE
  // We fetch the "Family Savings" group specifically for the demo
  const { data: chama } = await supabase
    .from("chamas")
    .select("*")
    .eq("name", "Family Savings")
    .single();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, profiles(full_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(4);

  const { data: investments } = await supabase
    .from("investment_offers")
    .select("*")
    .eq("active", true)
    .limit(2);

  // Fallback values if DB is empty to prevent crashes
  const balance = chama?.total_balance || 0;
  const growth = chama?.monthly_growth_pct || 0;
  const goal = chama?.investment_goal || 1000000;
  const goalProgress = Math.min((balance / goal) * 100, 100);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">SmartChama</h1>
            <p className="text-xs text-slate-500 font-medium">Wealth Management</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={<LayoutDashboard />} label="Overview" active />
          <NavItem icon={<CreditCard />} label="Contributions" />
          <NavItem icon={<PieChart />} label="Investments" />
          <NavItem icon={<Users />} label="Members" />
          <NavItem icon={<Settings />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        
        {/* TOP HEADER */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Overview</h2>
            <p className="text-slate-400 text-sm hidden md:block">Welcome back, Demo Admin</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500 w-64"
              />
            </div>
            <button className="p-2 bg-slate-900 border border-slate-800 rounded-full hover:bg-slate-800 relative">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
            </button>
            <div className="h-10 w-10 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-full border-2 border-slate-900 shadow-lg"></div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN (Hero & Activity) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. GREEN HERO WALLET CARD */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-emerald-900/20">
              <div className="relative z-10 flex flex-col h-full justify-between min-h-[220px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-emerald-100/80 text-sm font-medium uppercase tracking-wider mb-1">Total Group Balance</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                      KES {balance?.toLocaleString()}
                    </h1>
                  </div>
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="flex items-end justify-between mt-8">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-emerald-100/60 text-xs font-bold uppercase">Monthly Growth</p>
                      <div className="flex items-center gap-1 text-white text-lg font-bold">
                        <TrendingUp className="w-4 h-4" />
                        +{growth}%
                      </div>
                    </div>
                    <div>
                      <p className="text-emerald-100/60 text-xs font-bold uppercase">Total Interest</p>
                      <p className="text-white text-lg font-bold">KES 45,900</p>
                    </div>
                  </div>
                  <button className="bg-white text-emerald-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors shadow-lg">
                    + Deposit
                  </button>
                </div>
              </div>
              
              {/* Decorative Background Pattern */}
              <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"></div>
              <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            </div>

            {/* 2. RECENT ACTIVITY LIST */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Recent Activity</h3>
                <button className="text-emerald-500 text-sm font-bold hover:underline">View All</button>
              </div>
              
              <div className="space-y-3">
                {transactions?.map((tx) => (
                  <div key={tx.id} className="group flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-all hover:bg-slate-800/50">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                        tx.type === 'contribution' ? 'bg-emerald-500/10 text-emerald-500' : 
                        tx.type === 'loan_disbursement' ? 'bg-amber-500/10 text-amber-500' : 
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {tx.type === 'contribution' ? <ArrowUpRight className="w-6 h-6" /> : 
                         tx.type === 'loan_disbursement' ? <ArrowDownRight className="w-6 h-6" /> :
                         <TrendingUp className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{tx.description}</p>
                        <p className="text-xs text-slate-500">
                           {tx.profiles ? 'by ' + tx.profiles.full_name : 'Automated'} • {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.type === 'contribution' ? 'text-emerald-400' : 'text-slate-100'}`}>
                        {tx.type === 'contribution' ? '+' : '-'} KES {tx.amount.toLocaleString()}
                      </p>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (Stats & Marketplace) */}
          <div className="space-y-8">
            
            {/* 3. GOAL PROGRESS CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-200">Goal Progress</h3>
                <span className="text-amber-500 font-bold text-sm">{goalProgress.toFixed(0)}%</span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${goalProgress}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Current: {balance.toLocaleString()}</span>
                <span>Target: {goal.toLocaleString()}</span>
              </div>
              
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-amber-500 text-xs font-bold uppercase mb-1">🔥 Strategy Tip</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Increase contributions by 15% next month to hit your goal 2 weeks earlier.
                </p>
              </div>
            </div>

            {/* 4. MARKETPLACE TEASER (New Feature) */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Investment Opportunities
              </h3>
              <div className="space-y-4">
                {investments?.map((offer) => (
                  <div key={offer.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500/50 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded-md">{offer.provider_name}</span>
                       <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                         offer.risk_level === 'Low' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                       }`}>
                         {offer.risk_level} Risk
                       </span>
                    </div>
                    <h4 className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{offer.title}</h4>
                    <div className="mt-3 flex items-end gap-1">
                      <span className="text-3xl font-black text-white">{offer.return_rate_pa}%</span>
                      <span className="text-xs text-slate-500 font-bold mb-1">p.a.</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-bold hover:bg-slate-800 transition-colors">
                View All Opportunities
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// Simple Helper Component for Sidebar Items
function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
      active ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
    }`}>
      <div className="w-5 h-5">{icon}</div>
      <span className="text-sm">{label}</span>
    </div>
  )
}
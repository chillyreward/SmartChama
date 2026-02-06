// app/savings/page.tsx
import { 
    Target, 
    Plus, 
    TrendingUp, 
    Calendar, 
    AlertCircle,
    ArrowRight,
    PiggyBank
  } from "lucide-react";
  
  const savingsGoals = [
    {
      id: 1,
      name: "Land in Kitengela",
      description: "1/8 Acre plot deposit",
      target: 1500000,
      current: 875000,
      deadline: "Dec 2024",
      category: "Property",
      icon: "🏡"
    },
    {
      id: 2,
      name: "Emergency Fund",
      description: "6 months expenses buffer",
      target: 500000,
      current: 320000,
      deadline: "Mar 2025",
      category: "Security",
      icon: "🛡️"
    },
    {
      id: 3,
      name: "School Fees 2025",
      description: "Term 1 & 2 tuition",
      target: 240000,
      current: 180000,
      deadline: "Jan 2025",
      category: "Education",
      icon: "🎓"
    },
    {
      id: 4,
      name: "Business Expansion",
      description: "New equipment & stock",
      target: 800000,
      current: 245000,
      deadline: "Jun 2025",
      category: "Business",
      icon: "📈"
    }
  ];
  
  const quickStats = [
    { label: "Total Saved", value: "KES 1,620,000", change: "+12.5%", positive: true },
    { label: "Active Goals", value: "4", change: "2 near completion", positive: true },
    { label: "Next Deadline", value: "45 days", change: "Emergency Fund", positive: false }
  ];
  
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  
  function calculateProgress(current: number, target: number) {
    return Math.min(Math.round((current / target) * 100), 100);
  }
  
  export default function SavingsPage() {
    return (
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">My Savings Goals</h1>
            <p className="text-slate-400 mt-1 text-sm lg:text-base">Track progress towards your financial targets</p>
          </div>
          <button className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-6 rounded-xl transition-colors w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            <span>New Goal</span>
          </button>
        </div>
  
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickStats.map((stat, idx) => (
            <div key={idx} className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-5">
              <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-white text-2xl font-black">{stat.value}</p>
              <p className={`text-xs font-medium mt-1 ${stat.positive ? 'text-emerald-400' : 'text-amber-400'}`}>
                {stat.change}
              </p>
            </div>
          ))}
        </div>
  
        {/* Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {savingsGoals.map((goal) => {
            const progress = calculateProgress(goal.current, goal.target);
            const isNearComplete = progress >= 75;
            
            return (
              <div 
                key={goal.id}
                className="group bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl lg:rounded-3xl p-5 lg:p-6 hover:border-emerald-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-12 lg:size-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {goal.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{goal.name}</h3>
                      <p className="text-slate-400 text-sm">{goal.description}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
                    {goal.category}
                  </span>
                </div>
  
                {/* Progress Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl lg:text-3xl font-black text-white">
                        {formatCurrency(goal.current)}
                      </p>
                      <p className="text-slate-500 text-sm">of {formatCurrency(goal.target)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-black ${isNearComplete ? 'text-emerald-400' : 'text-white'}`}>
                        {progress}%
                      </p>
                      <p className="text-slate-500 text-xs flex items-center gap-1 justify-end">
                        <Calendar className="w-3 h-3" />
                        {goal.deadline}
                      </p>
                    </div>
                  </div>
  
                  {/* Progress Bar */}
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        isNearComplete ? 'bg-emerald-500' : 'bg-emerald-500/60'
                      }`}
                      style={{ width: `${progress}%` }}
                    >
                      {/* Shimmer effect */}
                      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                  </div>
  
                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/50 mt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>On track</span>
                    </div>
                    <button className="flex items-center gap-1 text-emerald-400 text-sm font-bold hover:gap-2 transition-all">
                      Contribute <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
  
        {/* Add Goal CTA Card */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 border border-dashed border-emerald-500/30 rounded-2xl lg:rounded-3xl p-8 lg:p-12 text-center">
          <div className="size-16 lg:size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 lg:w-10 lg:h-10 text-emerald-400" />
          </div>
          <h3 className="text-white text-xl lg:text-2xl font-bold mb-2">Start a New Savings Goal</h3>
          <p className="text-slate-400 max-w-md mx-auto mb-6 text-sm lg:text-base">
            Whether Its a new business, education, or that dream vacation, start saving with your Chama today.
          </p>
          <button className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-8 rounded-xl transition-colors">
            <Plus className="w-5 h-5" />
            Create Goal
          </button>
        </div>
      </div>
    );
  }
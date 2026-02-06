// app/loans/page.tsx
import { 
    Wallet, 
    Clock, 
    AlertCircle, 
    CheckCircle2, 
    ArrowRight,
    Plus
  } from "lucide-react";
  
  const activeLoans = [
    {
      id: 1,
      type: "Emergency Loan",
      amount: 50000,
      balance: 32500,
      interest: 8,
      dueDate: "Nov 15, 2024",
      status: "active",
      progress: 35
    },
    {
      id: 2,
      type: "Development Loan",
      amount: 200000,
      balance: 150000,
      interest: 12,
      dueDate: "Feb 28, 2025",
      status: "active",
      progress: 25
    }
  ];
  
  const loanHistory = [
    { id: 3, type: "Short Term", amount: 30000, date: "Aug 2024", status: "paid" },
    { id: 4, type: "Emergency", amount: 15000, date: "Jun 2024", status: "paid" }
  ];
  
  export default function LoansPage() {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">My Loans</h1>
            <p className="text-slate-400 mt-1 text-sm lg:text-base">Manage your active loans and applications</p>
          </div>
          <button className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-6 rounded-xl transition-colors">
            <Plus className="w-5 h-5" />
            <span>Apply for Loan</span>
          </button>
        </div>
  
        {/* Credit Score Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Your Credit Score</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl lg:text-5xl font-black">785</h2>
                <span className="text-emerald-200 text-sm">/ 900</span>
              </div>
              <p className="text-emerald-100 text-sm mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Excellent - You qualify for up to KES 500,000
              </p>
            </div>
            <div className="flex gap-3">
              <div className="text-center px-4 py-3 bg-white/10 rounded-xl backdrop-blur">
                <p className="text-2xl font-bold">12%</p>
                <p className="text-xs text-emerald-100">Avg. Interest</p>
              </div>
              <div className="text-center px-4 py-3 bg-white/10 rounded-xl backdrop-blur">
                <p className="text-2xl font-bold">30d</p>
                <p className="text-xs text-emerald-100">Max Term</p>
              </div>
            </div>
          </div>
        </div>
  
        {/* Active Loans */}
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-white mb-4">Active Loans</h2>
          <div className="space-y-4">
            {activeLoans.map((loan) => (
              <div key={loan.id} className="glass-card rounded-2xl p-5 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{loan.type}</h3>
                      <p className="text-slate-400 text-sm">Interest: {loan.interest}% p.a.</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-black text-white">KES {loan.balance.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">remaining of KES {loan.amount.toLocaleString()}</p>
                  </div>
                </div>
  
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Repayment Progress</span>
                    <span className="text-emerald-400 font-bold">{loan.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${loan.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1 text-amber-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Due {loan.dueDate}</span>
                    </div>
                    <button className="text-emerald-400 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                      Repay Now <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
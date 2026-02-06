// app/login/page.tsx
import { 
    Wallet, 
    Users, 
    AtSign,
    Sun,
    Shield,
    TrendingUp,
    Bell
  } from "lucide-react";
  import Link from "next/link";
  
  export default function LoginPage() {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">SmartChama</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full bg-slate-200 text-slate-600">
              <Sun className="w-5 h-5" />
            </button>
            <div className="size-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600" />
          </div>
        </header>
  
        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          {/* Hero Card */}
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 bg-emerald-500 p-8 text-white flex flex-col justify-center">
                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Grow Together</h2>
                <p className="text-emerald-100 text-sm">Empowering community savings through digital transparency.</p>
              </div>
              <div className="md:w-2/3 p-8 md:p-12">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to SmartChama</h1>
                <p className="text-slate-500 mb-8">Next-gen fintech for African group savings</p>
              </div>
            </div>
          </div>
  
          {/* Login Form */}
          <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">
            <div className="flex gap-6 mb-8 border-b border-slate-200">
              <button className="pb-4 text-emerald-600 font-semibold border-b-2 border-emerald-500">Member Login</button>
              <button className="pb-4 text-slate-400 font-medium hover:text-slate-600">Admin Login</button>
              <button className="pb-4 text-slate-400 font-medium hover:text-slate-600">Create Account</button>
            </div>
  
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Chama ID</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type="text" placeholder="Enter your group ID" className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
  
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number or Email</label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type="text" placeholder="Enter registered contact" className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
  
              <Link href="/dashboard" className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-full transition-colors text-center">
                Login to Member Portal
              </Link>
  
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">OR</span>
                </div>
              </div>
  
              <button className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-3.5 rounded-full transition-colors">
                <PlusIcon className="w-5 h-5" />
                Add My Chama (Admin Registration)
              </button>
            </form>
  
            <p className="text-center text-sm text-slate-500 mt-6">
              Having trouble? <a href="#" className="text-emerald-600 font-semibold hover:underline">Contact Support</a>
            </p>
          </div>
  
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 max-w-4xl w-full">
            {[ 
              { icon: Shield, title: "Bank-Grade Security", desc: "Your group funds are encrypted and secured." },
              { icon: TrendingUp, title: "Smart Analytics", desc: "Track growth and individual contributions." },
              { icon: Bell, title: "Auto-Reminders", desc: "Never miss a contribution with M-Pesa prompts." },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </main>
  
        <footer className="text-center py-6 text-slate-400 text-sm">
          © 2023 SmartChama Fintech. All rights reserved.
        </footer>
      </div>
    );
  }
  
  function PlusIcon({ className }: { className?: string }) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v8M8 12h8"/>
      </svg>
    );
  }
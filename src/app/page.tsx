import Link from 'next/link';
import { ArrowRight, Wallet, Shield, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 flex flex-col">
      
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-950">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">SmartChama</span>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard" className="px-5 py-2 text-sm font-bold text-slate-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/dashboard" className="px-5 py-2 text-sm font-bold bg-emerald-500 text-slate-950 rounded-full hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto space-y-8 mt-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live on Vercel
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">
            The Future of <br/> Group Savings.
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Manage your Chama with AI. Automate contributions, track loans, and invest in high-yield opportunities instantly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/dashboard" className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-950 rounded-full font-bold text-lg hover:bg-slate-200 transition-all">
            Launch App
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-8 py-4 bg-slate-900 text-slate-200 border border-slate-800 rounded-full font-bold text-lg hover:bg-slate-800 transition-colors">
            View Demo
          </button>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-12">
          <FeatureCard 
            icon={<Shield className="w-6 h-6 text-emerald-400" />} 
            title="Secure & Transparent" 
            desc="Bank-grade security for every shilling." 
          />
          <FeatureCard 
            icon={<TrendingUp className="w-6 h-6 text-emerald-400" />} 
            title="High Yield Growth" 
            desc="Access exclusive investment markets." 
          />
           <FeatureCard 
            icon={<Wallet className="w-6 h-6 text-emerald-400" />} 
            title="Automated Loans" 
            desc="Instant borrowing based on savings." 
          />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-8 text-center text-slate-600 text-sm">
        © 2026 SmartChama Inc. Built for the Hackathon.
      </footer>
    </div>
  );
}

// REPLACE THE BOTTOM FUNCTION WITH THIS:

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-colors">
      <div className="mb-4 bg-slate-800 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-700">
        {icon}
      </div>
      <h3 className="font-bold text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-400">{desc}</p>
    </div>
  )
}
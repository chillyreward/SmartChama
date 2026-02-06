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
          <Link href="/dashboard" className="px-5 py-2 text-sm font-bold bg-emerald-500 text-slate-950 rounded-full hover:bg-emerald-400 transition-colors">
            Login
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto space-y-8 mt-10">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">
          The Future of <br/> Group Savings.
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Manage your Chama with AI. Automate contributions and invest instantly.
        </p>

        <Link href="/dashboard" className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-950 rounded-full font-bold text-lg hover:bg-slate-200 transition-all">
          Launch App
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </main>

      {/* FOOTER */}
      <footer className="py-8 text-center text-slate-600 text-sm">
        © 2026 SmartChama Inc.
      </footer>
    </div>
  );
}
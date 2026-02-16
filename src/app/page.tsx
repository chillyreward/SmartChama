import Link from "next/link";
import { 
  Wallet, Shield, Phone, ArrowRight, Instagram, Twitter, Linkedin, Facebook, 
  ChevronRight, Lock, Globe, Zap, PieChart, Users 
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col font-sans text-slate-300 selection:bg-emerald-500/30">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed w-full z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-2 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Wallet className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">SmartChama</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-white hover:text-emerald-400 font-medium text-sm transition-colors">
              Log In
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            V 2.0 Now Live
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8">
            The Future of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-400">Group Savings.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Manage your chama with AI. Automate contributions, instant loans, and blockchain transparency.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto px-10 py-5 bg-white text-black font-bold text-lg rounded-full hover:scale-105 transition-transform flex items-center justify-center gap-2">
              Start a Chama
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/ussd-demo" className="w-full sm:w-auto px-10 py-5 bg-slate-900 border border-slate-700 text-white font-bold text-lg rounded-full hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
              <Phone className="w-5 h-5 text-emerald-400" />
              *384*23713# Demo
            </Link>
          </div>
        </div>
      </section>

      {/* --- BENTO GRID FEATURES --- */}
      <section id="features" className="py-32 px-6 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-white mb-6">Built for Serious Growth</h2>
            <p className="text-slate-400 max-w-xl text-lg">Don't just save. Invest. Our tools give your group the power of a hedge fund.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-900/50 border border-white/10 rounded-[32px] p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-all" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                  <PieChart className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">AI Investment Advisor</h3>
                <p className="text-slate-400 max-w-md">Our Gemini-powered engine analyzes market trends and suggests the best high-yield savings accounts and bonds for your group.</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900 border border-white/10 rounded-[32px] p-10 relative group">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Instant Loans</h3>
              <p className="text-slate-400">Borrow against your savings instantly. No paperwork. Money in your MPesa in 30 seconds.</p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900 border border-white/10 rounded-[32px] p-10 relative group">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Works Offline</h3>
              <p className="text-slate-400">No data? No problem. Our full USSD suite means you can manage money from a "Mulika Mwizi".</p>
            </div>

            {/* Card 4 */}
            <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-900/50 border border-white/10 rounded-[32px] p-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Bank-Grade Security</h3>
                <p className="text-slate-400 max-w-md">Multi-signature wallets require 3 admins to approve withdrawals. Fraud is mathematically impossible.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER (Working Links) --- */}
      <footer className="border-t border-white/10 bg-[#020617] pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-emerald-500 p-1.5 rounded-lg">
                <Wallet className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold text-white text-lg">SmartChama</span>
            </div>
            <p className="text-slate-500 text-sm mb-6">
              Empowering the next generation of African investors.
            </p>
            <div className="flex gap-4">
              <a href="https://twitter.com" target="_blank" className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white hover:bg-emerald-600 transition-all"><Twitter className="w-4 h-4" /></a>
              <a href="https://instagram.com" target="_blank" className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white hover:bg-emerald-600 transition-all"><Instagram className="w-4 h-4" /></a>
              <a href="https://linkedin.com" target="_blank" className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white hover:bg-emerald-600 transition-all"><Linkedin className="w-4 h-4" /></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Features</Link></li>
              <li><Link href="/ussd-demo" className="hover:text-emerald-400 transition-colors">USSD Simulator</Link></li>
              <li><Link href="/pricing" className="hover:text-emerald-400 transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-emerald-400 transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 text-center text-slate-600 text-sm">
          &copy; 2026 SmartChama Technologies.
        </div>
      </footer>
    </div>
  );
}
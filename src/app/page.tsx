import Link from "next/link";
import { Wallet, Shield, Phone, ArrowRight, Instagram, Twitter, Linkedin, Facebook } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-emerald-500/30">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800/50 backdrop-blur-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-emerald-500 to-emerald-400 p-2 rounded-lg">
              <Wallet className="w-6 h-6 text-slate-950" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">SmartChama</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">
              Login
            </Link>
            <Link href="/login" className="bg-white text-slate-950 hover:bg-emerald-50 px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live on USSD *544#
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight mb-8">
            The Modern Way to manage <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Group Savings.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            SmartChama brings transparency to your investment group. 
            Automate contributions, track loans, and get AI financial advice—even without internet via USSD.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-full transition-all flex items-center justify-center gap-2">
              Start a Chama
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/ussd-demo" className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold rounded-full transition-all flex items-center justify-center gap-2">
              <Phone className="w-5 h-5 text-emerald-400" />
              Try USSD Demo
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 mt-32">
          {[
            { icon: Shield, title: "Secure & Transparent", desc: "Every shilling is tracked on the blockchain. No more 'lost' records." },
            { icon: Phone, title: "Works Offline", desc: "Members without smartphones can use *544# to pay and borrow." },
            { icon: Wallet, title: "Instant Loans", desc: "Get approved instantly based on your savings history." },
          ].map((f, i) => (
            <div key={i} className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 transition-colors">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                <f.icon className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-emerald-500 p-1.5 rounded-lg">
                <Wallet className="w-4 h-4 text-slate-950" />
              </div>
              <span className="font-bold text-white">SmartChama</span>
            </div>
            <p className="text-slate-500 text-sm mb-6">
              Empowering African investment groups with transparency and AI-driven insights.
            </p>
            <div className="flex gap-4">
              {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="text-slate-500 hover:text-emerald-400 transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#" className="hover:text-emerald-400">Features</a></li>
              <li><a href="#" className="hover:text-emerald-400">USSD Menu</a></li>
              <li><a href="#" className="hover:text-emerald-400">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#" className="hover:text-emerald-400">About Us</a></li>
              <li><a href="#" className="hover:text-emerald-400">Careers</a></li>
              <li><a href="#" className="hover:text-emerald-400">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#" className="hover:text-emerald-400">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-emerald-400">Terms of Service</a></li>
              <li><a href="#" className="hover:text-emerald-400">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 text-center text-slate-600 text-sm">
          &copy; 2026 SmartChama Technologies. Built for the Hackathon.
        </div>
      </footer>
    </div>
  );
}
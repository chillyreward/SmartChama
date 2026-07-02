import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F0C] flex flex-col font-inter text-[#161d16] dark:text-[#ECFDF5] transition-colors duration-300 overflow-x-hidden">
      
      <LandingNav />

      {/* --- HERO SECTION --- */}
      <section className="pt-20 lg:pt-32 pb-16 px-4 sm:px-6 md:px-8 lg:px-12 text-center lg:text-left bg-[#FAFAFA] dark:bg-[#0B0F0C] transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[55%_45%] gap-16 items-center">
          
          {/* Left Column */}
          <div className="space-y-8 flex flex-col items-center lg:items-start">
            <div className="inline-flex bg-[#006e2f]/10 dark:bg-[#22C55E]/10 border border-[#006e2f]/20 dark:border-[#22C55E]/20 px-4 py-1.5 rounded-full text-xs font-bold text-[#006e2f] dark:text-[#22C55E] tracking-wider uppercase">
              Now serving Kenya
            </div>
            
            <h1 className="text-[36px] sm:text-[48px] md:text-[64px] lg:text-[72px] font-bold font-geist tracking-tight leading-[1.05] text-[#161d16] dark:text-white mt-4 mb-6">
              Your Chama,{' '}
              <span className="text-[#22C55E]">
                Upgraded.
              </span>
            </h1>
            
            <p className="text-[16px] md:text-[18px] text-[#60645f] dark:text-gray-400 max-w-sm lg:max-w-xl leading-relaxed mb-8">
              Track contributions, manage loans, and build financial identity together.
            </p>

            {/* Two clear auth paths */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-8">

              {/* Admin path */}
              <Link
                href="/signup?role=admin"
                className="group flex items-center gap-3 px-7 py-4 rounded-2xl bg-[#22C55E] text-white text-[16px] font-semibold hover:bg-[#16A34A] transition-all duration-200 shadow-lg shadow-green-500/25">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  admin_panel_settings
                </span>
                <div className="text-left">
                  <div className="text-[15px] font-bold">
                    Create a Group
                  </div>
                  <div className="text-[12px] text-white/75">
                    I am starting a new chama
                  </div>
                </div>
              </Link>

              {/* Member path */}
              <Link
                href="/signup?role=member"
                className="group flex items-center gap-3 px-7 py-4 rounded-2xl border-2 border-[#22C55E] text-[16px] font-semibold transition-all duration-200"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)'
                }}>
                <span className="material-symbols-outlined text-[22px] text-[#22C55E]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  group
                </span>
                <div className="text-left">
                  <div className="text-[15px] font-bold">
                    Join a Group
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    I have a group code
                  </div>
                </div>
              </Link>

            </div>

            {/* Sign in link below */}
            <p className="text-center lg:text-left mt-6 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#22C55E] hover:underline">
                Sign In
              </Link>
            </p>

            {/* Trust signals — horizontal scroll on mobile */}
            <div className="flex flex-wrap sm:flex-nowrap gap-6 justify-center lg:justify-start mt-10 overflow-x-auto scrollbar-hide w-full pb-2">
              {["M-Pesa Connected", "2.4k+ Active Groups", "48M+ KSh Saved"].map(signal => (
                <div key={signal} className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px] text-[#22C55E]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  <span className="text-[13px] text-[#60645f] dark:text-gray-400 whitespace-nowrap">
                    {signal}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (Mockups with crisp shadows) — Hidden on Mobile */}
          <div className="hidden lg:flex relative pb-16 pl-12 pr-4 pt-12 justify-center">
            {/* Card B (Top-Left) */}
            <div className="absolute top-0 left-4 bg-white dark:bg-[#0E1410] border border-[#E5E7EB] dark:border-[#1B2520] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-none z-20 transform -rotate-[4deg] w-48 transition-transform duration-300 hover:rotate-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="material-symbols-outlined text-[#006e2f] dark:text-[#22C55E] text-lg">event</span>
                <span className="text-[10px] font-bold text-[#7E8E84] dark:text-[#607367] uppercase tracking-wider">Reminder</span>
              </div>
              <div className="text-xs font-semibold text-[#161d16] dark:text-[#ECFDF5]">Next contribution: Friday</div>
            </div>

            {/* Main Dashboard Card */}
            <div className="relative z-10 bg-white dark:bg-[#0E1410] border border-[#E5E7EB] dark:border-[#1B2520] rounded-2xl p-8 shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:shadow-none transform -rotate-[2deg] hover:rotate-0 transition-all duration-500 w-full max-w-md">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-[#161d16] dark:text-white font-geist">Group Dashboard</h3>
                <span className="material-symbols-outlined text-[#7E8E84] dark:text-[#607367]">more_horiz</span>
              </div>
              
              <div className="mb-8">
                <div className="text-xs font-bold text-[#7E8E84] dark:text-[#607367] mb-1.5 uppercase tracking-wider">Total Savings</div>
                <div className="flex items-end gap-3">
                  <div className="text-3xl md:text-4xl font-extrabold text-[#161d16] dark:text-white font-geist">KSh 450,200</div>
                  <div className="bg-[#006e2f]/10 dark:bg-[#22C55E]/10 border border-[#006e2f]/20 dark:border-[#22C55E]/20 text-[#006e2f] dark:text-[#22C55E] px-2 py-0.5 rounded text-xs font-bold mb-1">
                    ↑ +12%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-8">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 border-2 border-white dark:border-[#0E1410] flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300">JW</div>
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 border-2 border-white dark:border-[#0E1410] flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300">DK</div>
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950 border-2 border-white dark:border-[#0E1410] flex items-center justify-center text-xs font-bold text-purple-700 dark:text-purple-300">MA</div>
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-[#0E1410] flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300">+8</div>
                </div>
                <div className="text-[#006e2f] dark:text-[#22C55E] font-bold text-xs uppercase tracking-wider">
                  24-Week Streak
                </div>
              </div>

              <div className="bg-[#FAFAFA] dark:bg-black/45 border border-[#E5E7EB] dark:border-[#1B2520] p-4 rounded-xl flex justify-between items-center transition-colors">
                <div className="text-xs font-bold text-[#161d16] dark:text-[#ECFDF5]">Group Trust Score</div>
                <div className="bg-[#006e2f] dark:bg-[#22C55E] text-white dark:text-black px-3 py-1 rounded text-xs font-bold">
                  82 — Good Standing
                </div>
              </div>
            </div>

            {/* Card A (Bottom-Right) */}
            <div className="absolute bottom-4 right-4 bg-white dark:bg-[#0E1410] border border-[#E5E7EB] dark:border-[#1B2520] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-none z-20 transform rotate-[3deg] w-52 transition-transform duration-300 hover:rotate-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#006e2f]/10 dark:bg-[#22C55E]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#006e2f] dark:text-[#22C55E] text-sm">payments</span>
                </div>
                <span className="text-[10px] font-bold text-[#7E8E84] dark:text-[#607367] uppercase tracking-wider">Monthly Progress</span>
              </div>
              <div className="text-sm font-bold text-[#161d16] dark:text-[#ECFDF5] font-geist">KSh 12,500 saved</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SOCIAL PROOF BAR --- */}
      <section className="bg-white dark:bg-[#0E1410] border-y border-[#E5E7EB] dark:border-[#1B2520] py-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-3 text-center">
          <span className="material-symbols-outlined text-[#006e2f] dark:text-[#22C55E] text-base">verified_user</span>
          <span className="text-xs md:text-sm font-semibold tracking-wider text-[#4F5A53] dark:text-[#8FA196] uppercase">
            Trusted by savings groups in Nairobi · Mombasa · Kisumu · Nakuru · Eldoret
          </span>
        </div>
      </section>

      {/* --- PROBLEM SECTION (Stays dark for high contrast) --- */}
      <section className="bg-[#050806] text-white py-24 md:py-32 px-6 border-b border-[#163822]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold font-geist text-center max-w-4xl mx-auto leading-tight mb-20 tracking-tight">
            Kenyan chamas manage billions of shillings —<br/>
            <span className="text-gray-400">using WhatsApp and notebooks.</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* The old way */}
            <div className="bg-black/50 border border-red-950/40 rounded-2xl p-10 hover:border-red-900/60 transition-all duration-300">
              <div className="flex items-center gap-3.5 mb-8">
                <span className="material-symbols-outlined text-[#EF4444] text-2xl font-bold">close</span>
                <h3 className="text-2xl font-bold font-geist text-white">The old way</h3>
              </div>
              <ul className="space-y-6">
                {[
                  { icon: "book", text: "Manual entry in easily lost or damaged notebooks." },
                  { icon: "chat", text: "Chasing payments through endless WhatsApp threads." },
                  { icon: "handshake", text: "Verbal loan agreements with no formal tracking." },
                  { icon: "history", text: "Zero credit history built despite years of consistent savings." }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-gray-500 mt-1 text-lg">{item.icon}</span>
                    <span className="text-base text-gray-400">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The SmartChama way */}
            <div className="bg-[#0E1410]/60 border border-[#163822] rounded-2xl p-10 hover:border-[#22C55E]/40 transition-all duration-300">
              <div className="flex items-center gap-3.5 mb-8">
                <span className="material-symbols-outlined text-[#22C55E] text-2xl font-bold">check_circle</span>
                <h3 className="text-2xl font-bold font-geist text-[#22C55E]">The SmartChama way</h3>
              </div>
              <ul className="space-y-6">
                {[
                  { icon: "wallet", text: "Digital, tamper-proof ledger backed up securely in the cloud." },
                  { icon: "notifications_active", text: "Automated reminders and instant M-Pesa payment tracking." },
                  { icon: "handshake", text: "Transparent loan requests, approvals, and repayment tracking." },
                  { icon: "trending_up", text: "Every contribution builds a verifiable group and individual Trust Score." }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-[#22C55E] mt-1 text-lg">{item.icon}</span>
                    <span className="text-base text-gray-300">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-[#163822] pt-8 mt-16 text-center">
            <p className="text-lg md:text-xl font-medium text-[#22C55E] uppercase tracking-wider font-geist">
              Over KSh 2.1B managed informally in Kenya annually
            </p>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="bg-white dark:bg-[#050806] py-20 md:py-32 px-4 sm:px-6 md:px-8 lg:px-12 scroll-mt-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[32px] sm:text-[48px] lg:text-[64px] font-bold font-geist text-[#161d16] dark:text-white tracking-tight mb-4">
              Everything your chama needs. Nothing it doesn't.
            </h2>
            <p className="text-lg md:text-xl text-[#4F5A53] dark:text-[#8FA196]">
              Professional tools designed specifically for Kenyan savings groups.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { idx: "01", icon: 'payments', title: 'Contributions', desc: 'Track every member payment automatically via M-Pesa.' },
              { idx: "02", icon: 'real_estate_agent', title: 'Internal Loans', desc: 'Request, approve, and track group loans digitally.' },
              { idx: "03", icon: 'verified', title: 'Trust Score', desc: 'Build a verifiable financial reputation from contribution history.' },
              { idx: "04", icon: 'account_balance', title: 'Group Wallet', desc: 'One secure, transparent wallet for all group funds.' },
              { idx: "05", icon: 'moving', title: 'SmartGrow', desc: 'Grow idle funds through vetted investment options.', badge: 'Coming Soon' },
              { idx: "06", icon: 'monitoring', title: 'Analytics', desc: 'Visual insights into group health, trends, and performance.' }
            ].map((f, i) => (
              <div key={i} className="bg-white dark:bg-[#0E1410] border border-[#E5E7EB] dark:border-[#1B2520] rounded-2xl p-8 hover:border-[#006e2f] dark:hover:border-[#22C55E] transition-all duration-300 relative group shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-none">
                {f.badge && (
                  <div className="absolute top-6 right-6 bg-[#006e2f]/10 dark:bg-[#22C55E]/10 text-[#006e2f] dark:text-[#22C55E] px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                    {f.badge}
                  </div>
                )}
                
                <div className="absolute top-6 left-6 text-4xl font-extrabold text-[#006e2f]/5 dark:text-[#22C55E]/5 select-none font-geist group-hover:text-[#006e2f]/10 dark:group-hover:text-[#22C55E]/10 transition-colors">
                  {f.idx}
                </div>

                <div className="w-12 h-12 rounded-xl bg-[#FAFAFA] dark:bg-[#0B0F0C] flex items-center justify-center mb-6 group-hover:bg-[#006e2f] dark:group-hover:bg-[#22C55E] transition-colors border border-[#E5E7EB] dark:border-[#1B2520]">
                  <span className="material-symbols-outlined text-[#006e2f] dark:text-[#22C55E] group-hover:text-white dark:group-hover:text-black transition-colors">{f.icon}</span>
                </div>
                
                <h3 className="text-xl font-bold font-geist text-[#161d16] dark:text-white mb-3">{f.title}</h3>
                <p className="text-sm text-[#4F5A53] dark:text-[#8FA196] mb-6 leading-relaxed">{f.desc}</p>
                <Link href="#" className="text-xs font-bold uppercase tracking-wider text-[#006e2f] dark:text-[#22C55E] hover:underline inline-block">
                  Learn more →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="bg-[#FAFAFA] dark:bg-[#0B0F0C] py-20 md:py-32 px-4 sm:px-6 md:px-8 lg:px-12 overflow-hidden scroll-mt-16 border-t border-[#E5E7EB] dark:border-[#1B2520] transition-colors duration-300">
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
            <h2 className="text-[32px] sm:text-[48px] lg:text-[64px] font-bold font-geist text-[#161d16] dark:text-white tracking-tight mb-4">
              Up and running in minutes.
            </h2>
            <p className="text-lg md:text-xl text-[#4F5A53] dark:text-[#8FA196]">
              No bank visits. No paperwork. Just transparency.
            </p>
          </div>
          
          <div className="relative flex flex-col gap-8 md:flex-row md:gap-8 justify-between">
            {/* Dashed connector line for desktop */}
            <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-[2px] -z-10 opacity-30" 
                 style={{ backgroundImage: 'linear-gradient(to right, #006e2f 50%, transparent 50%)', backgroundSize: '16px 2px', backgroundRepeat: 'repeat-x' }} />
                 
            {/* Vertical connector line for mobile */}
            <div className="md:hidden absolute left-6 top-8 bottom-8 w-0.5 border-l-2 border-dashed border-[#22C55E] opacity-30" />
                 
            {[
              { num: '1', title: 'Create Your Group', desc: 'Invite members, set rules, and configure contribution amounts.' },
              { num: '2', title: 'Contribute via M-Pesa', desc: 'Auto-tracked deposits directly from phones. No manual receipts.' },
              { num: '3', title: 'Manage Loans', desc: 'Transparent approvals and automated repayment reminders.' },
              { num: '4', title: 'Build Financial Identity', desc: 'Every transaction builds your verifiable credit history.' }
            ].map((step, i) => (
              <div key={i} className="flex gap-4 md:flex-col md:items-center md:text-center relative">
                
                {/* Step number circle */}
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white dark:bg-[#0E1410] border-2 border-[#22C55E] flex items-center justify-center flex-shrink-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-none transition-transform duration-300">
                  <span className="text-[18px] md:text-2xl font-bold text-[#006e2f] dark:text-[#22C55E] font-geist">
                    {step.num}
                  </span>
                </div>
                
                {/* Step content */}
                <div>
                  <h3 className="text-[16px] md:text-lg font-bold font-geist text-[#161d16] dark:text-white mb-1 md:mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[14px] md:text-sm text-[#4F5A53] dark:text-[#8FA196] max-w-[240px] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="bg-white dark:bg-[#050806] py-20 md:py-32 px-4 sm:px-6 md:px-8 lg:px-12 scroll-mt-16 border-y border-[#E5E7EB] dark:border-[#1B2520] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[32px] sm:text-[48px] lg:text-[64px] font-bold font-geist text-[#161d16] dark:text-white tracking-tight mb-4">
              Simple, transparent pricing.
            </h2>
            <p className="text-lg md:text-xl text-[#4F5A53] dark:text-[#8FA196]">
              Pay only for what you use. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {/* Basic Plan */}
            <div className="bg-white dark:bg-[#0E1410] border border-[#E5E7EB] dark:border-[#1B2520] rounded-2xl p-8 hover:border-[#006e2f] dark:hover:border-[#22C55E] transition-all duration-300 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-none">
              <h3 className="text-2xl font-bold font-geist text-[#161d16] dark:text-white mb-2">Basic</h3>
              <p className="text-sm text-[#4F5A53] dark:text-[#8FA196] mb-8 min-h-[40px]">Perfect for new groups starting to build their history.</p>
              
              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold font-geist text-[#161d16] dark:text-white">Free</span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7E8E84] dark:text-[#607367]"> forever</span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Up to 10 members",
                  "Manual contribution tracking",
                  "Basic ledger exports"
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#006e2f] dark:text-[#22C55E] text-base mt-0.5">check</span>
                    <span className="text-sm text-[#161d16] dark:text-[#ECFDF5]">{feat}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="w-full block bg-[#FAFAFA] dark:bg-[#1a2218] border border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-[#ECFDF5] text-center py-3 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-black transition-colors">
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-[#006e2f] dark:bg-[#0E1410] border-2 border-[#006e2f] dark:border-[#22C55E] rounded-2xl p-8 relative flex flex-col shadow-lg transform md:-translate-y-4 transition-transform duration-300">
              <div className="absolute top-0 right-8 transform -translate-y-1/2">
                <span className="bg-black text-white dark:bg-[#22C55E] dark:text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</span>
              </div>
              
              <h3 className="text-2xl font-bold font-geist text-white mb-2">Pro</h3>
              <p className="text-sm text-green-100 dark:text-[#8FA196] mb-8 min-h-[40px]">Automated tracking and M-Pesa integration for serious chamas.</p>
              
              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold font-geist text-white">KSh 500</span>
                <span className="text-xs font-bold uppercase tracking-wider text-green-100 dark:text-[#607367]"> / month</span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Unlimited members",
                  "M-Pesa STK Push integration",
                  "Automated SMS reminders",
                  "Loan management & tracking"
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-white dark:text-[#22C55E] text-base mt-0.5">check</span>
                    <span className="text-sm text-white dark:text-[#ECFDF5]">{feat}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=pro" className="w-full block bg-white dark:bg-[#22C55E] text-[#006e2f] dark:text-black text-center py-3 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-[#4ade80] transition-colors">
                Upgrade to Pro
              </Link>
            </div>

            {/* Scale Plan */}
            <div className="bg-white dark:bg-[#0E1410] border border-[#E5E7EB] dark:border-[#1B2520] rounded-2xl p-8 hover:border-[#006e2f] dark:hover:border-[#22C55E] transition-all duration-300 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-none">
              <h3 className="text-2xl font-bold font-geist text-[#161d16] dark:text-white mb-2">Scale</h3>
              <p className="text-sm text-[#4F5A53] dark:text-[#8FA196] mb-8 min-h-[40px]">For investment groups needing advanced financial tools.</p>
              
              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold font-geist text-[#161d16] dark:text-white">KSh 2,500</span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7E8E84] dark:text-[#607367]"> / month</span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Everything in Pro",
                  "SmartGrow investments",
                  "Trust Score APIs",
                  "Priority support"
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#006e2f] dark:text-[#22C55E] text-base mt-0.5">check</span>
                    <span className="text-sm text-[#161d16] dark:text-[#ECFDF5]">{feat}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=scale" className="w-full block bg-[#FAFAFA] dark:bg-[#1a2218] border border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-[#ECFDF5] text-center py-3 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-black transition-colors">
                Go Scale
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- TRUST INFRASTRUCTURE (Stays dark for high contrast) --- */}
      <section id="about" className="bg-[#050806] py-20 md:py-32 px-4 sm:px-6 md:px-8 lg:px-12 relative overflow-hidden border-b border-[#163822]">
        <div className="absolute inset-0 z-0 opacity-5" 
             style={{ backgroundImage: 'radial-gradient(#22C55E 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 mb-16 items-center">
            <div className="space-y-6">
              <h2 className="text-[32px] sm:text-[48px] lg:text-[64px] font-bold font-geist text-white leading-[1.1] tracking-tight">
                Beyond Savings.<br/>
                <span className="text-[#22C55E]">Building Financial Identity.</span>
              </h2>
              <p className="text-base md:text-lg text-gray-400 max-w-lg leading-relaxed">
                In Kenya, millions are creditworthy but have no way to prove it.
                SmartChama changes that. Every payment is recorded, timestamped,
                and verifiable. Your chama history is your financial passport.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-[#0E1410] border border-[#163822] rounded-2xl p-8 hover:border-[#22C55E]/30 transition-colors">
                <div className="text-4xl md:text-5xl font-extrabold font-geist text-[#22C55E] mb-2">94%</div>
                <div className="text-lg font-bold text-white mb-1 font-geist">Repayment Rate</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Across all managed groups</div>
              </div>
              <div className="bg-[#0E1410] border border-[#163822] rounded-2xl p-8 hover:border-[#22C55E]/30 transition-colors">
                <div className="text-4xl md:text-5xl font-extrabold font-geist text-[#22C55E] mb-2">2,400+</div>
                <div className="text-lg font-bold text-white mb-1 font-geist">Active Groups</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Trusting our infrastructure</div>
              </div>
              <div className="sm:col-span-2 bg-[#0E1410] border border-[#163822] rounded-2xl p-8 hover:border-[#22C55E]/30 transition-colors flex flex-col justify-center">
                <div className="text-4xl md:text-5xl font-extrabold font-geist text-[#22C55E] mb-2">KSh 48M+</div>
                <div className="text-lg font-bold text-white mb-1 font-geist">Savings Secured</div>
                <div className="text-xs text-gray-500">Auditable, transparent, and instantly verifiable.</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-[#163822] pt-8 flex flex-wrap justify-center gap-x-12 gap-y-6">
            {[
              { icon: 'receipt_long', text: 'Append-Only Ledger' },
              { icon: 'security', text: 'Tamper-Proof' },
              { icon: 'how_to_reg', text: 'Consent-Based Sharing' },
              { icon: 'psychology', text: 'AI Scoring' },
              { icon: 'send_to_mobile', text: 'M-Pesa Native' }
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#22C55E] text-base">{b.icon}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="bg-[#FAFAFA] dark:bg-[#0B0F0C] py-20 md:py-32 px-4 sm:px-6 md:px-8 lg:px-12 border-b border-[#E5E7EB] dark:border-[#1B2520] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[32px] sm:text-[48px] lg:text-[64px] font-bold font-geist text-[#161d16] dark:text-white tracking-tight mb-4">
              Real groups. Real results.
            </h2>
            <p className="text-lg md:text-xl text-[#4F5A53] dark:text-[#8FA196]">
              Join thousands of Kenyans upgrading their savings experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "Before SmartChama, we argued every month about who had paid. Now everyone sees the records. No more drama, just savings.",
                name: "Grace Wanjiku", role: "Chama Chairlady, Nairobi"
              },
              {
                quote: "I showed my SmartChama history to a SACCO. They were impressed and approved my loan in two days.",
                name: "David Otieno", role: "Treasurer, Kisumu"
              },
              {
                quote: "Our group grew from 8 to 24 members once we went digital. People trust the platform, so they trust the group.",
                name: "Amina Hassan", role: "Secretary, Mombasa"
              }
            ].map((t, i) => (
              <div key={i} className="bg-white dark:bg-[#0E1410] border border-[#E5E7EB] dark:border-[#1B2520] rounded-2xl p-8 hover:border-[#006e2f] dark:hover:border-[#22C55E] transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-none">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="material-symbols-outlined text-[#006e2f] dark:text-[#22C55E] text-base fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <p className="text-base text-[#161d16] dark:text-[#ECFDF5] italic mb-8 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#006e2f]/10 dark:bg-[#22C55E]/10 flex items-center justify-center text-[#006e2f] dark:text-[#22C55E] font-bold text-lg">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-base font-bold text-[#161d16] dark:text-white font-geist">{t.name}</div>
                    <div className="text-xs text-[#7E8E84] dark:text-[#607367] font-medium uppercase tracking-wider">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="bg-white dark:bg-[#050806] py-20 md:py-32 px-4 sm:px-6 md:px-8 lg:px-12 relative overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.01]" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-8">
          <h2 className="text-[32px] sm:text-[48px] lg:text-[64px] font-bold font-geist text-[#161d16] dark:text-white tracking-tight leading-tight">
            Start building your group's financial future today.
          </h2>
          <p className="text-lg md:text-xl text-[#4F5A53] dark:text-[#8FA196] max-w-2xl mx-auto leading-relaxed">
            Free to start. No bank account required. M-Pesa ready.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link href="/signup" className="bg-[#006e2f] dark:bg-[#22C55E] text-white dark:text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#005321] dark:hover:bg-[#4ade80] transition-colors shadow-sm">
              Create Your Group Free
            </Link>
            <Link href="/contact" className="border border-[#E5E7EB] dark:border-[#1B2520] bg-white dark:bg-[#0E1410] text-[#161d16] dark:text-[#ECFDF5] px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-none">
              Talk to Our Team
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-2 pt-6">
            <span className="material-symbols-outlined text-[#7E8E84] dark:text-[#607367] text-base">verified_user</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7E8E84] dark:text-[#607367]">
              Trusted by 5,000+ groups across 12 counties
            </span>
          </div>
        </div>
      </section>

      <LandingFooter />

    </div>
  );
}

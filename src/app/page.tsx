'use client';

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

// Client-only: reads localStorage to show only once
const HamsterOnboarding = dynamic(
  () => import('@/components/HamsterOnboarding'),
  { ssr: false }
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col font-inter text-[var(--text-primary)] transition-colors duration-300 overflow-x-hidden">
      
      {/* Hamster onboarding overlay — only shown to first-time visitors */}
      <HamsterOnboarding />

      <LandingNav />

      {/* --- HERO SECTION --- */}
      <section className="pt-16 lg:pt-28 pb-16 px-4 sm:px-6 md:px-8 lg:px-12 bg-[var(--bg-page)] transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="inline-flex bg-[#22C55E]/10 border border-[#22C55E]/30 px-4 py-1.5 rounded-full text-xs font-bold text-[#22C55E] tracking-wider uppercase">
              Built for Kenyan Chamas &middot; Free to Start
            </div>
            
            <h1 className="text-[36px] sm:text-[48px] md:text-[60px] lg:text-[68px] font-bold font-geist tracking-tight leading-[1.08] text-[var(--text-primary)] mt-2 mb-4">
              Your Chama,{' '}
              <span className="text-[#22C55E] underline decoration-emerald-500/30 decoration-wavy decoration-2">
                Upgraded.
              </span>
            </h1>
            
            <p className="text-[16px] md:text-[19px] text-[var(--text-secondary)] max-w-sm lg:max-w-2xl leading-relaxed mb-6">
              Automate M-Pesa contribution tracking, issue instant internal loans, manage Merry-Go-Round rotation schedules, and build a verifiable financial identity for your group.
            </p>

            {/* Two clear auth paths */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start w-full sm:w-auto">

              {/* Admin path */}
              <Link
                href="/signup?role=admin"
                className="group flex items-center justify-center sm:justify-start gap-3 px-7 py-4 rounded-xl bg-[#22C55E] text-white text-[16px] font-semibold hover:bg-[#16A34A] transition-all duration-200 shadow-md">
                <span className="material-symbols-outlined text-[24px]">
                  admin_panel_settings
                </span>
                <div className="text-left">
                  <div className="text-[15px] font-bold">
                    Create a Group
                  </div>
                  <div className="text-[12px] text-white/80 font-normal">
                    Start a new digital chama
                  </div>
                </div>
              </Link>

              {/* Member path */}
              <Link
                href="/signup?role=member"
                className="group flex items-center justify-center sm:justify-start gap-3 px-7 py-4 rounded-xl border-2 border-[#22C55E] text-[16px] font-semibold transition-all duration-200 hover:bg-[#22C55E]/10"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)'
                }}>
                <span className="material-symbols-outlined text-[24px] text-[#22C55E]">
                  group_add
                </span>
                <div className="text-left">
                  <div className="text-[15px] font-bold">
                    Join a Group
                  </div>
                  <div className="text-[12px] text-[var(--text-secondary)] font-normal">
                    Enter group invite code
                  </div>
                </div>
              </Link>

            </div>

            {/* Sign in link */}
            <p className="text-center lg:text-left mt-4 text-[14px] text-[var(--text-secondary)]">
              Already a member?{' '}
              <Link href="/login" className="font-semibold text-[#22C55E] hover:underline">
                Sign In to Dashboard
              </Link>
            </p>

            {/* Trust signals */}
            <div className="flex flex-wrap sm:flex-nowrap gap-6 justify-center lg:justify-start mt-6 overflow-x-auto w-full pb-2">
              {["M-Pesa Native STK Push", "Free to Start", "Built in Nairobi"].map(signal => (
                <div key={signal} className="flex items-center gap-2 flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px] text-[#22C55E]">
                    check_circle
                  </span>
                  <span className="text-[13px] font-medium text-[var(--text-secondary)] whitespace-nowrap">
                    {signal}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column — Real Dashboard Image Showcase */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-[var(--border)] bg-[var(--bg-card)] group transition-all duration-500">
              <Image
                src="/images/hero_dashboard.jpg"
                alt="SmartChama Group Dashboard Interface"
                width={800}
                height={500}
                className="w-full h-auto object-cover rounded-2xl"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs font-semibold bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  Real-time M-Pesa Tracking
                </span>
                <span className="text-emerald-400 font-mono">Instant STK Push</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SOCIAL PROOF & COMMUNITY SHOWCASE --- */}
      <section className="bg-[var(--bg-card)] border-y border-[var(--border)] py-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5 flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-[#22C55E]">
                <Image
                  src="/images/chama_women.jpg"
                  alt="Kenyan Chama Members"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h4 className="text-base font-bold text-[var(--text-primary)] font-geist">Empowering Kenyan Communities</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Designed for savings groups across Kenya — from Nairobi to Eldoret.</p>
              </div>
            </div>
            <div className="md:col-span-7 flex flex-wrap items-center justify-start md:justify-end gap-6 text-[13px] font-semibold text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#22C55E]">verified</span>
                M-Pesa STK Push
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#22C55E]">shield</span>
                Immutable Ledger
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#22C55E]">psychology</span>
                AI Fraud Detection
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PROBLEM VS SOLUTION SECTION --- */}
      <section className="bg-[#050806] text-white py-20 md:py-28 px-6 border-b border-[#163822]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-geist text-white leading-tight tracking-tight mb-4">
              Kenyan chamas manage billions of shillings —<br/>
              <span className="text-emerald-400">using paper notebooks and WhatsApp.</span>
            </h2>
            <p className="text-gray-400 text-base md:text-lg">
              SmartChama replaces manual record-keeping with a secure, transparent digital platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The old way */}
            <div className="bg-black/60 border border-red-900/40 rounded-2xl p-8 hover:border-red-600/60 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-lg">✕</span>
                <h3 className="text-2xl font-bold font-geist text-white">The Old Way</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Manual ledger entries in notebooks vulnerable to damage or loss.",
                  "Endless WhatsApp messages chasing late contribution payments.",
                  "Unrecorded verbal loan agreements leading to disputes.",
                  "Zero credit history built despite years of disciplined savings."
                ].map((text, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm md:text-base">
                    <span className="text-red-400 mt-1">•</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The SmartChama way */}
            <div className="bg-[#0E1410] border border-[#22C55E]/40 rounded-2xl p-8 hover:border-[#22C55E] transition-all duration-300 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center font-bold text-lg">✓</span>
                <h3 className="text-2xl font-bold font-geist text-[#22C55E]">The SmartChama Way</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Digital, tamper-proof cloud ledger backed up in real-time.",
                  "Automated M-Pesa STK push prompts & payment confirmations.",
                  "Transparent loan requests, 5% interest calculator, and repayment schedules.",
                  "Dynamic AI Trust Scores that build a verifiable credit passport."
                ].map((text, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-200 text-sm md:text-base">
                    <span className="text-[#22C55E] mt-1">•</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID WITH REAL IMAGES --- */}
      <section id="features" className="bg-[var(--bg-page)] py-20 md:py-28 px-4 sm:px-6 md:px-8 lg:px-12 scroll-mt-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[32px] sm:text-[44px] lg:text-[56px] font-bold font-geist text-[var(--text-primary)] tracking-tight mb-4">
              Built for Modern Kenyan Chamas
            </h2>
            <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              Comprehensive tools designed to automate financial management, improve trust, and grow group wealth.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'M-Pesa Contributions',
                desc: 'Initiate STK push prompts directly to members and verify receipts automatically.',
                img: '/images/mpesa_confirm.jpg',
                badge: 'M-Pesa Native'
              },
              {
                title: 'Internal Group Loans',
                desc: 'Request loans, calculate interest, and track repayments with automated credit limits.',
                img: '/images/loan_approval.jpg',
                badge: '5% Interest Rate'
              },
              {
                title: 'Member Trust Scores',
                desc: 'AI-calculated credit scores based on contribution timeliness and repayment history.',
                img: '/images/group_members.jpg',
                badge: 'AI Scoring'
              },
              {
                title: 'SmartGrow Investments',
                desc: 'Pool idle funds into Treasury Bills and high-yield investment proposals via group voting.',
                img: '/images/smartgrow_proposal.jpg',
                badge: 'Yield Growth'
              },
              {
                title: 'Merry-Go-Round Rotations',
                desc: 'Manage rotating savings payout schedules with automated turn notifications.',
                img: '/images/merrygoround_sched.jpg',
                badge: 'Rotating Savings'
              },
              {
                title: 'Welfare & Emergency Fund',
                desc: 'Submit and approve emergency medical or family welfare claims with officer sign-off.',
                img: '/images/welfare_claim.jpg',
                badge: 'Emergency Fund'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[#22C55E] transition-all duration-300 group flex flex-col shadow-sm hover:shadow-md"
              >
                <div className="relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-zinc-800">
                  <Image
                    src={feature.img}
                    alt={feature.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-emerald-400 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
                    {feature.badge}
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold font-geist text-[var(--text-primary)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 flex-1">
                    {feature.desc}
                  </p>
                  <Link
                    href="/signup"
                    className="text-xs font-bold uppercase tracking-wider text-[#22C55E] hover:underline flex items-center gap-1"
                  >
                    Explore feature →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="bg-[var(--bg-card)] py-20 md:py-28 px-4 sm:px-6 md:px-8 lg:px-12 scroll-mt-16 border-t border-[var(--border)] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[32px] sm:text-[44px] lg:text-[56px] font-bold font-geist text-[var(--text-primary)] tracking-tight mb-4">
              How SmartChama Works
            </h2>
            <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
              Get your Chama digitalized in 4 simple steps. No bank visits required.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { num: '01', title: 'Create Your Group', desc: 'Register your Chama, invite members with a 6-character code.' },
              { num: '02', title: 'Contribute via M-Pesa', desc: 'Members pay via M-Pesa STK push. Receipts logged automatically.' },
              { num: '03', title: 'Access Group Loans', desc: 'Borrow up to 5x your credit limit at transparent group rates.' },
              { num: '04', title: 'Build Credit History', desc: 'Generate PDF financial statements and build verifiable credit.' }
            ].map((step, i) => (
              <div key={i} className="bg-[var(--bg-page)] border border-[var(--border)] p-6 rounded-2xl flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#22C55E]/10 border border-[#22C55E] text-[#22C55E] flex items-center justify-center font-bold text-lg font-geist mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold font-geist text-[var(--text-primary)] mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="bg-[var(--bg-page)] py-20 md:py-28 px-4 sm:px-6 md:px-8 lg:px-12 scroll-mt-16 border-t border-[var(--border)] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[32px] sm:text-[44px] lg:text-[56px] font-bold font-geist text-[var(--text-primary)] tracking-tight mb-4">
              Simple & Transparent Pricing
            </h2>
            <p className="text-base md:text-lg text-[var(--text-secondary)]">
              Choose the right plan for your Chama size. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {/* Basic Plan */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 flex flex-col shadow-sm hover:border-[#22C55E] transition-all">
              <h3 className="text-2xl font-bold font-geist text-[var(--text-primary)] mb-2">Basic</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-6 min-h-[32px]">Ideal for small family chamas getting started.</p>
              
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-geist text-[var(--text-primary)]">Free</span>
                <span className="text-xs font-bold text-[var(--text-secondary)]"> forever</span>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1 text-sm text-[var(--text-secondary)]">
                <li className="flex items-center gap-2">✓ Up to 10 members</li>
                <li className="flex items-center gap-2">✓ Manual contribution logging</li>
                <li className="flex items-center gap-2">✓ Basic ledger PDF export</li>
              </ul>
              
              <Link href="/signup" className="w-full text-center bg-[var(--bg-page)] border border-[var(--border)] text-[var(--text-primary)] py-3 rounded-xl font-semibold hover:border-[#22C55E] transition-colors">
                Start Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-[var(--bg-card)] border-2 border-[#22C55E] rounded-2xl p-8 flex flex-col shadow-xl relative transform md:-translate-y-2">
              <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-[#22C55E] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                Most Popular
              </div>
              
              <h3 className="text-2xl font-bold font-geist text-[var(--text-primary)] mb-2">Pro</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-6 min-h-[32px]">Automated M-Pesa STK push & SMS reminders for active chamas.</p>
              
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-geist text-[#22C55E]">KSh 500</span>
                <span className="text-xs font-bold text-[var(--text-secondary)]"> / month</span>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1 text-sm text-[var(--text-primary)]">
                <li className="flex items-center gap-2">✓ Unlimited group members</li>
                <li className="flex items-center gap-2">✓ M-Pesa STK Push Integration</li>
                <li className="flex items-center gap-2">✓ Automated SMS & Push Alerts</li>
                <li className="flex items-center gap-2">✓ Loan approvals & interest engine</li>
              </ul>
              
              <Link href="/signup?plan=pro" className="w-full text-center bg-[#22C55E] text-white py-3 rounded-xl font-bold hover:bg-[#16a34a] transition-colors shadow-md">
                Get Started with Pro
              </Link>
            </div>

            {/* Scale Plan */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 flex flex-col shadow-sm hover:border-[#22C55E] transition-all">
              <h3 className="text-2xl font-bold font-geist text-[var(--text-primary)] mb-2">Scale</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-6 min-h-[32px]">For investment groups needing SmartGrow and AI auditing.</p>
              
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-geist text-[var(--text-primary)]">KSh 2,500</span>
                <span className="text-xs font-bold text-[var(--text-secondary)]"> / month</span>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1 text-sm text-[var(--text-secondary)]">
                <li className="flex items-center gap-2">✓ Everything in Pro</li>
                <li className="flex items-center gap-2">✓ SmartGrow Investment Proposals</li>
                <li className="flex items-center gap-2">✓ AI Credit & Fraud Detection</li>
                <li className="flex items-center gap-2">✓ Priority Support</li>
              </ul>
              
              <Link href="/signup?plan=scale" className="w-full text-center bg-[var(--bg-page)] border border-[var(--border)] text-[var(--text-primary)] py-3 rounded-xl font-semibold hover:border-[#22C55E] transition-colors">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="bg-[#050806] py-20 md:py-28 px-4 sm:px-6 md:px-8 lg:px-12 text-center text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-[32px] sm:text-[44px] lg:text-[56px] font-bold font-geist tracking-tight leading-tight">
            Ready to upgrade your Chama?
          </h2>
          <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto">
            Start managing your Chama digitally — no paperwork, no WhatsApp chaos.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link href="/signup" className="bg-[#22C55E] text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-[#16a34a] transition-all shadow-md">
              Create Free Account
            </Link>
            <Link href="/login" className="border border-white/20 bg-white/5 text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-white/10 transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />

    </div>
  );
}

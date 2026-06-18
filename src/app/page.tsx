import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-inter text-on-surface overflow-x-hidden">
      
      {/* --- NAVIGATION --- */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] h-[64px] flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="text-headline-lg text-primary font-geist">SmartChama</div>
          <div className="hidden md:flex items-center gap-6 text-body-sm text-on-secondary-container">
            <Link href="#" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#" className="hover:text-primary transition-colors">How It Works</Link>
            <Link href="#" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="#" className="hover:text-primary transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-on-surface font-medium hover:text-primary transition-colors">Sign In</Link>
            <Link href="/signup" className="bg-[#22C55E] text-white px-4 py-2 rounded font-medium hover:bg-opacity-90 transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="bg-[#FAFAFA] py-16 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[55%_45%] gap-12 items-center">
          
          {/* Left Column */}
          <div>
            <div className="inline-block bg-surface-container-low border border-outline-variant px-3 py-1 rounded-full text-label-caps text-on-surface mb-6 uppercase">
              Now available across Kenya
            </div>
            <h1 className="text-display-lg font-geist text-on-surface mb-4">
              Your Chama, Upgraded.<br/>
              <span className="text-[#22C55E]">Your Future, Secured.</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-xl mb-8">
              Replace messy spreadsheets with a professional-grade ledger. 
              Track contributions, manage loans, and build a verifiable 
              financial identity for your group.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/signup" className="bg-[#22C55E] text-white px-6 py-4 rounded font-headline-sm text-center hover:bg-opacity-90 transition-colors">
                Create Your Group — It's Free
              </Link>
              <Link href="#" className="bg-white border border-[#E5E7EB] text-on-surface px-6 py-4 rounded text-center hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2">
                <span className="text-xs">▶</span> See How It Works
              </Link>
            </div>
            
            {/* Trust Signals */}
            <div className="border-t border-outline-variant pt-6 mt-6 grid grid-cols-3 gap-4">
              <div>
                <div className="text-display-sm text-on-surface font-geist">M-Pesa</div>
                <div className="text-label-caps text-on-secondary-container uppercase">Connected</div>
              </div>
              <div>
                <div className="text-display-sm text-on-surface font-geist">2.4k+</div>
                <div className="text-label-caps text-on-secondary-container uppercase">Active Groups</div>
              </div>
              <div>
                <div className="text-display-sm text-[#22C55E] font-geist">48M+</div>
                <div className="text-label-caps text-on-secondary-container uppercase">KSh Saved</div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="relative mt-12 lg:mt-0 pb-16 pl-12 pr-4 pt-12">
            {/* Card B (Top-Left) */}
            <div className="absolute top-0 left-0 bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm z-20 transform -rotate-[3deg] w-48">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-outline">event</span>
                <span className="text-label-caps text-on-secondary-container uppercase">Reminder</span>
              </div>
              <div className="text-body-sm text-on-surface font-medium">Next contribution: Friday</div>
            </div>

            {/* Main Dashboard Card */}
            <div className="relative z-10 bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transform -rotate-[2deg] hover:rotate-0 transition-all duration-500 w-full max-w-md mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-headline-sm text-on-surface font-geist">Group Dashboard</h3>
                <span className="material-symbols-outlined text-on-secondary-container">more_horiz</span>
              </div>
              
              <div className="mb-8">
                <div className="text-label-caps text-on-secondary-container mb-1 uppercase">Total Savings</div>
                <div className="flex items-end gap-3">
                  <div className="text-display-sm text-on-surface font-geist">KSh 450,200</div>
                  <div className="bg-surface-container-low border border-outline-variant text-[#22C55E] px-2 py-0.5 rounded text-mono-data mb-1">
                    ↑ +12%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-8">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-xs font-bold text-emerald-700">JW</div>
                  <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-700">DK</div>
                  <div className="w-10 h-10 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs font-bold text-purple-700">MA</div>
                  <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-700">+8</div>
                </div>
                <div className="text-[#22C55E] font-medium text-sm">
                  24-Week Streak
                </div>
              </div>

              <div className="bg-surface-container-low border border-outline-variant p-3 rounded flex justify-between items-center">
                <div className="text-body-sm text-on-surface font-medium">Group Trust Score</div>
                <div className="bg-[#22C55E] text-white px-3 py-1 rounded text-mono-data font-medium">
                  82 — Good Standing
                </div>
              </div>
            </div>

            {/* Card A (Bottom-Right) */}
            <div className="absolute bottom-4 right-0 bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm z-20 transform rotate-[3deg] w-48">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm">payments</span>
                </div>
                <span className="text-label-caps text-on-secondary-container uppercase">Monthly Progress</span>
              </div>
              <div className="text-headline-sm text-on-surface font-geist">KSh 12,500 saved</div>
            </div>
          </div>

        </div>
      </section>

      {/* --- SOCIAL PROOF BAR --- */}
      <section className="bg-surface-container border-y border-outline-variant py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-2 text-center">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">verified_user</span>
          <span className="text-body-sm text-on-surface-variant">Trusted by savings groups in Nairobi · Mombasa · Kisumu · Nakuru · Eldoret</span>
        </div>
      </section>

      {/* --- PROBLEM SECTION --- */}
      <section className="bg-[#0B0F0C] text-white py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-display-lg font-geist text-white max-w-4xl mx-auto text-center mb-16">
            Kenyan chamas manage billions of shillings —<br/>using WhatsApp and notebooks.
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* The old way */}
            <div className="bg-[#1A1110] border border-[#3E2522] rounded-xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-error">close</span>
                <h3 className="text-headline-lg font-geist text-white">The old way</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#A39998] mt-0.5">book</span>
                  <span className="text-body-lg text-[#A39998]">Manual entry in easily lost or damaged notebooks.</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#A39998] mt-0.5">chat</span>
                  <span className="text-body-lg text-[#A39998]">Chasing payments through endless WhatsApp threads.</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#A39998] mt-0.5">handshake</span>
                  <span className="text-body-lg text-[#A39998]">Verbal loan agreements with no formal tracking.</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#A39998] mt-0.5">history</span>
                  <span className="text-body-lg text-[#A39998]">Zero credit history built despite years of consistent savings.</span>
                </li>
              </ul>
            </div>

            {/* The SmartChama way */}
            <div className="bg-[#0A1A10] border border-[#163822] rounded-xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-[#22C55E]">check_circle</span>
                <h3 className="text-headline-lg font-geist text-[#22C55E]">The SmartChama way</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#22C55E] mt-0.5">wallet</span>
                  <span className="text-body-lg text-[#B2C6BA]">Digital, tamper-proof ledger backed up securely in the cloud.</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#22C55E] mt-0.5">notifications_active</span>
                  <span className="text-body-lg text-[#B2C6BA]">Automated reminders and instant M-Pesa payment tracking.</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#22C55E] mt-0.5">handshake</span>
                  <span className="text-body-lg text-[#B2C6BA]">Transparent loan requests, approvals, and repayment tracking.</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#22C55E] mt-0.5">trending_up</span>
                  <span className="text-body-lg text-[#B2C6BA]">Every contribution builds a verifiable group and individual Trust Score.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#163822] pt-4 text-center">
            <p className="text-headline-sm font-geist text-[#22C55E]">
              Over KSh 2.1B managed informally in Kenya annually
            </p>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-display-sm font-geist text-on-surface mb-4">Everything your chama needs. Nothing it doesn't.</h2>
            <p className="text-body-lg text-on-secondary-container">Professional tools designed specifically for Kenyan savings groups.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: 'payments', title: 'Contributions', desc: 'Track every member payment automatically via M-Pesa.' },
              { icon: 'real_estate_agent', title: 'Internal Loans', desc: 'Request, approve, and track group loans digitally.' },
              { icon: 'verified', title: 'Trust Score', desc: 'Build a verifiable financial reputation from contribution history.' },
              { icon: 'account_balance', title: 'Group Wallet', desc: 'One secure, transparent wallet for all group funds.' },
              { icon: 'moving', title: 'SmartGrow', desc: 'Grow idle funds through vetted investment options.', badge: 'Coming Soon' },
              { icon: 'monitoring', title: 'Analytics', desc: 'Visual insights into group health, trends, and performance.' }
            ].map((f, i) => (
              <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl p-8 hover:border-[#22C55E] transition-colors relative group">
                {f.badge && (
                  <div className="absolute top-6 right-6 bg-[#E8F0E4] text-[#60645F] px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                    {f.badge}
                  </div>
                )}
                <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center mb-6 group-hover:bg-[#22C55E] transition-colors">
                  <span className="material-symbols-outlined text-primary group-hover:text-white transition-colors">{f.icon}</span>
                </div>
                <h3 className="text-headline-sm font-geist text-on-surface mb-3">{f.title}</h3>
                <p className="text-body-sm text-on-surface-variant mb-6">{f.desc}</p>
                <Link href="#" className="text-label-caps text-primary hover:underline uppercase inline-block">Learn more →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="bg-surface-container-low py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-display-lg font-geist text-on-surface mb-4">Up and running in minutes.</h2>
            <p className="text-body-lg text-on-surface-variant">No bank visits. No paperwork. Just transparency.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 relative z-10">
            {/* Dashed connector line */}
            <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-[2px] -z-10" 
                 style={{ backgroundImage: 'linear-gradient(to right, #22c55e 50%, transparent 50%)', backgroundSize: '16px 2px', backgroundRepeat: 'repeat-x' }} />
                 
            {[
              { num: '1', title: 'Create Your Group', desc: 'Invite members, set rules, and configure contribution amounts.' },
              { num: '2', title: 'Contribute via M-Pesa', desc: 'Auto-tracked deposits directly from phones. No manual receipts.' },
              { num: '3', title: 'Manage Loans', desc: 'Transparent approvals and automated repayment reminders.' },
              { num: '4', title: 'Build Financial Identity', desc: 'Every transaction builds your verifiable credit history.' }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-[#22C55E] flex items-center justify-center mb-6 text-display-sm text-primary font-geist z-10">
                  {step.num}
                </div>
                <h3 className="text-headline-sm font-geist text-on-surface mb-3">{step.title}</h3>
                <p className="text-body-sm text-on-surface-variant max-w-[240px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TRUST INFRASTRUCTURE --- */}
      <section className="bg-[#0B0F0C] py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-5" 
             style={{ backgroundImage: 'radial-gradient(#22c55e 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 mb-16">
            <div>
              <h2 className="text-[52px] font-geist font-bold text-white leading-tight mb-2 tracking-[-0.04em]">
                Beyond Savings.
              </h2>
              <h2 className="text-[52px] font-geist font-bold text-[#22C55E] leading-tight mb-6 tracking-[-0.04em]">
                Building Financial Identity.
              </h2>
              <p className="text-body-lg text-gray-400 max-w-lg">
                In Kenya, millions are creditworthy but have no way to prove it.
                SmartChama changes that. Every payment is recorded, timestamped,
                and verifiable. Your chama history is your financial passport.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-[#161D16] border border-[#2A322A] rounded-lg p-6 hover:border-[#22C55E]/30 transition-colors">
                <div className="text-display-lg font-geist text-[#22C55E] mb-2">94%</div>
                <div className="text-headline-sm font-geist text-white mb-1">Repayment Rate</div>
                <div className="text-body-sm text-gray-500">Across all managed groups</div>
              </div>
              <div className="bg-[#161D16] border border-[#2A322A] rounded-lg p-6 hover:border-[#22C55E]/30 transition-colors">
                <div className="text-display-lg font-geist text-[#22C55E] mb-2">2,400+</div>
                <div className="text-headline-sm font-geist text-white mb-1">Active Groups</div>
                <div className="text-body-sm text-gray-500">Trusting our infrastructure</div>
              </div>
              <div className="sm:col-span-2 bg-[#161D16] border border-[#2A322A] rounded-lg p-6 hover:border-[#22C55E]/30 transition-colors flex flex-col justify-center">
                <div className="text-display-lg font-geist text-[#22C55E] mb-2">KSh 48M+</div>
                <div className="text-headline-sm font-geist text-white mb-1">Savings Secured</div>
                <div className="text-body-sm text-gray-500">Auditable, transparent, and instantly verifiable.</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-[#2A322A] pt-8 flex flex-wrap justify-center gap-x-12 gap-y-6">
            {[
              { icon: 'receipt_long', text: 'Append-Only Ledger' },
              { icon: 'security', text: 'Tamper-Proof' },
              { icon: 'how_to_reg', text: 'Consent-Based Sharing' },
              { icon: 'psychology', text: 'AI Scoring' },
              { icon: 'send_to_mobile', text: 'M-Pesa Native' }
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#22C55E] text-sm">{b.icon}</span>
                <span className="text-mono-data text-gray-300 uppercase tracking-wider text-xs">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="bg-[#FAFAFA] py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-display-sm font-geist text-on-surface mb-4">Real groups. Real results.</h2>
            <p className="text-body-lg text-on-surface-variant">Join thousands of Kenyans upgrading their savings experience.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
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
              <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl p-8 hover:border-[#22C55E] transition-colors">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="material-symbols-outlined text-[#22C55E] text-lg fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <p className="text-body-lg text-on-surface italic mb-8">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-headline-sm font-geist text-on-surface">{t.name}</div>
                    <div className="text-body-sm text-on-secondary-container">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="bg-[#22C55E] py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h2 className="text-display-lg font-geist text-[#0B0F0C] mb-6">Start building your group's financial future today.</h2>
          <p className="text-body-lg text-[#0B0F0C] opacity-90 mb-10">Free to start. No bank account required. M-Pesa ready.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link href="/signup" className="bg-[#0B0F0C] text-white px-8 py-4 rounded text-headline-sm font-geist hover:bg-black transition-colors">
              Create Your Group Free
            </Link>
            <Link href="#" className="border-2 border-[#0B0F0C] text-[#0B0F0C] px-8 py-4 rounded text-headline-sm font-geist hover:bg-[#0B0F0C]/10 transition-colors">
              Talk to Our Team
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[#0B0F0C] text-sm">verified_user</span>
            <span className="text-body-sm text-[#0B0F0C] opacity-80">Trusted by 5,000+ groups across 12 counties</span>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#0B0F0C] text-white pt-20 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div>
              <div className="text-headline-lg font-black font-geist text-white mb-4">SmartChama</div>
              <p className="text-body-sm text-gray-400 mb-6">Financial infrastructure for community wealth.</p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors"><span className="material-symbols-outlined">link</span></a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors"><span className="material-symbols-outlined">forum</span></a>
              </div>
            </div>
            
            <div>
              <h4 className="text-label-caps text-gray-500 uppercase tracking-wider mb-6">Product</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-body-sm text-gray-300 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="text-body-sm text-gray-300 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-body-sm text-gray-300 hover:text-white transition-colors">M-Pesa Integration</Link></li>
                <li><Link href="#" className="text-body-sm text-gray-300 hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-label-caps text-gray-500 uppercase tracking-wider mb-6">Company</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-body-sm text-gray-300 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="text-body-sm text-gray-300 hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="text-body-sm text-gray-300 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-body-sm text-gray-300 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-label-caps text-gray-500 uppercase tracking-wider mb-6">Legal</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-body-sm text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="text-body-sm text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="text-body-sm text-gray-300 hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-body-sm text-gray-500 text-center md:text-left">
              © 2026 SmartChama Technologies Ltd. Built with pride in Nairobi, Kenya
            </div>
            <div className="text-body-sm text-gray-500">
              Regulated by the Central Bank of Kenya.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

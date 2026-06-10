import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-inter text-gray-900 overflow-x-hidden selection:bg-green-100 selection:text-green-900">
      
      {/* --- NAVIGATION --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
            </div>
            <div className="text-lg font-bold tracking-tight text-black">SmartChama</div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <Link href="#" className="hover:text-black transition-colors">Features</Link>
            <Link href="#" className="hover:text-black transition-colors">How It Works</Link>
            <Link href="#" className="hover:text-black transition-colors">Security</Link>
            <Link href="#" className="hover:text-black transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/login" className="text-gray-500 hover:text-black transition-colors">Sign in</Link>
            <Link href="/signup" className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">Get started</Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="bg-white pt-32 pb-24 px-6 border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Now available across Kenya
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-black mb-6 leading-tight">
            Financial infrastructure <br className="hidden md:block"/> for community wealth.
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Replace messy spreadsheets with a professional-grade ledger. 
            Track contributions, manage loans, and build a verifiable 
            financial identity for your group.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto bg-black text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              Create free account
            </Link>
            <Link href="#" className="w-full sm:w-auto bg-white border border-gray-200 text-black px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              Contact sales
            </Link>
          </div>
        </div>
      </section>

      {/* --- METRICS / TRUST BAR --- */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="text-3xl font-bold tracking-tight text-black mb-1">KSh 48M+</div>
            <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">Savings Secured</div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-black mb-1">2,400+</div>
            <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">Active Groups</div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-black mb-1">94%</div>
            <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">Repayment Rate</div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-black mb-1">M-Pesa</div>
            <div className="text-xs uppercase tracking-wider text-green-600 font-medium">Native Integration</div>
          </div>
        </div>
      </section>

      {/* --- PROBLEM VS SOLUTION SECTION --- */}
      <section className="bg-gray-50 py-32 px-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-4">
              A modern operating system for savings groups.
            </h2>
            <p className="text-lg text-gray-500">
              Kenyan chamas manage billions of shillings using disjointed WhatsApp threads and fragile notebooks. We built a platform that treats your group's money with the rigor it deserves.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-px bg-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
            {/* The old way */}
            <div className="bg-white p-10 md:p-16">
              <div className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-8">The Old Way</div>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-5 h-5 mt-0.5 border border-gray-300 rounded flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-px bg-gray-400"></div>
                  </div>
                  <span className="text-gray-500 leading-relaxed">Manual entry in easily lost or damaged notebooks leading to discrepancies.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-5 h-5 mt-0.5 border border-gray-300 rounded flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-px bg-gray-400"></div>
                  </div>
                  <span className="text-gray-500 leading-relaxed">Chasing payments through endless, unsearchable WhatsApp threads.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-5 h-5 mt-0.5 border border-gray-300 rounded flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-px bg-gray-400"></div>
                  </div>
                  <span className="text-gray-500 leading-relaxed">Zero credit history built despite years of consistent, disciplined savings.</span>
                </li>
              </ul>
            </div>

            {/* The SmartChama way */}
            <div className="bg-white p-10 md:p-16">
              <div className="text-sm font-semibold uppercase tracking-wider text-black mb-8">SmartChama</div>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-5 h-5 mt-0.5 bg-black rounded flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-black leading-relaxed">Digital, tamper-proof ledger backed up securely to the cloud.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-5 h-5 mt-0.5 bg-black rounded flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-black leading-relaxed">Automated reminders and instant M-Pesa payment tracking.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-5 h-5 mt-0.5 bg-black rounded flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-black leading-relaxed">Every contribution builds a verifiable group and individual Trust Score.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="bg-white py-32 px-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-black mb-4">Everything your group needs.</h2>
            <p className="text-lg text-gray-500">Professional tools designed to enforce transparency and trust.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-y-16 gap-x-12">
            {[
              { title: 'Automated Contributions', desc: 'Track every member payment automatically via M-Pesa callbacks.' },
              { title: 'Internal Loan Management', desc: 'Request, approve, and track group loans with automated repayment reminders.' },
              { title: 'Verifiable Trust Score', desc: 'Build a rigorous financial reputation based on contribution consistency.' },
              { title: 'Unified Group Wallet', desc: 'One secure, transparent wallet for all group funds, visible to all members.' },
              { title: 'Blockchain Ledger', desc: 'Append-only, tamper-proof transaction logs that guarantee data integrity.' },
              { title: 'Actionable Analytics', desc: 'Visual insights into group health, collection rates, and member participation.' }
            ].map((f, i) => (
              <div key={i}>
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center mb-6">
                  <div className="w-2 h-2 bg-black rounded-sm"></div>
                </div>
                <h3 className="text-base font-bold text-black mb-2 tracking-tight">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{f.desc}</p>
                <Link href="#" className="text-xs font-semibold text-black hover:text-gray-500 uppercase tracking-wider transition-colors">Explore feature →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="bg-black text-white py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Ready to formalize your group?</h2>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of groups already using SmartChama to manage their finances, approve loans, and build credit history.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup" className="bg-white text-black px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
              Create free account
            </Link>
            <Link href="#" className="bg-transparent border border-gray-700 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors">
              Read documentation
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white pt-20 pb-10 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-sm"></div>
                </div>
                <div className="text-sm font-bold tracking-tight text-black">SmartChama</div>
              </div>
              <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
                Financial infrastructure designed to bring transparency and formal identity to African savings groups.
              </p>
            </div>
            
            <div>
              <h4 className="text-xs font-semibold text-black uppercase tracking-wider mb-6">Platform</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Overview</Link></li>
                <li><Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Integrations</Link></li>
                <li><Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-xs font-semibold text-black uppercase tracking-wider mb-6">Company</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">About</Link></li>
                <li><Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Careers</Link></li>
                <li><Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-xs font-semibold text-black uppercase tracking-wider mb-6">Legal</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Terms</Link></li>
                <li><Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Privacy</Link></li>
                <li><Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Licenses</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-gray-400">
              © {new Date().getFullYear()} SmartChama Technologies Ltd.
            </div>
            <div className="flex gap-6">
              <Link href="#" className="text-xs text-gray-400 hover:text-black transition-colors">Twitter</Link>
              <Link href="#" className="text-xs text-gray-400 hover:text-black transition-colors">LinkedIn</Link>
              <Link href="#" className="text-xs text-gray-400 hover:text-black transition-colors">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

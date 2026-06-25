import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export const metadata = {
  title: "About Us | SmartChama",
  description: "We are building the financial infrastructure Africa deserves. Learn about our mission to modernize informal savings groups.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-inter text-on-surface">
      <LandingNav />
      
      {/* HERO SECTION */}
      <section className="bg-[#0B0F0C] py-24 text-center px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-label-caps text-[#22C55E] tracking-widest mb-6">OUR STORY</div>
          <h1 className="text-display-lg font-geist font-bold text-white mb-6 leading-tight">
            We are building the financial<br className="hidden md:block" />
            infrastructure Africa deserves.
          </h1>
          <p className="text-body-lg text-gray-400 max-w-2xl mx-auto mt-6">
            SmartChama started with a simple observation. Millions of Kenyan families save together every month in informal groups called chamas. They are disciplined. They are consistent. They are creditworthy. But they have no way to prove it.
          </p>
        </div>
      </section>

      {/* MISSION SECTION */}
      <section className="bg-white py-24 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-[36px] font-geist font-bold text-[#161d16] mb-8">Our Mission</h2>
            <div className="space-y-6 text-[18px] font-inter text-[#3d4a3d] leading-relaxed">
              <p>
                SmartChama exists to modernize informal savings groups across Africa. We believe that the trust built inside a chama — the consistency of showing up every month, repaying loans on time, supporting fellow members — is one of the most valuable financial assets a person can have. We are making that asset visible.
              </p>
              <p>
                Our platform digitizes the entire lifecycle of a savings group. From the first contribution to the final loan repayment, every transaction is recorded, verified, and stored in a tamper-proof ledger. This creates something powerful: a verifiable financial history for people who have never had one.
              </p>
              <p>
                We are not just building a savings app. We are building financial identity infrastructure for underserved communities. When a SmartChama member applies for a loan at a bank or SACCO, they can show their contribution record as proof of financial discipline. That changes everything.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-8">
              <div className="text-display-lg font-geist font-bold text-[#006e2f] mb-2">2,400+</div>
              <div className="text-body-sm text-[#60645f]">Active savings groups</div>
            </div>
            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-8">
              <div className="text-display-lg font-geist font-bold text-[#006e2f] mb-2">KSh 48M+</div>
              <div className="text-body-sm text-[#60645f]">Total savings recorded</div>
            </div>
            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-8">
              <div className="text-display-lg font-geist font-bold text-[#006e2f] mb-2">94%</div>
              <div className="text-body-sm text-[#60645f]">Average loan repayment rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM WE ARE SOLVING */}
      <section className="bg-[#edf6ea] py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-[36px] font-geist font-bold text-[#161d16] mb-4">The problem with informal finance</h2>
            <p className="text-[18px] text-[#3d4a3d]">
              Kenya's chamas manage over KSh 2 billion annually using notebooks, WhatsApp, and verbal agreements.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-8">
              <div className="w-12 h-12 bg-[#edf6ea] rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#006e2f]">description</span>
              </div>
              <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-3">Records get lost</h3>
              <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                Handwritten ledgers are damaged, lost, or disputed. When the person who kept the records leaves the group, years of history disappear with them. There is no backup, no audit trail, and no way to verify what happened.
              </p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-lg p-8">
              <div className="w-12 h-12 bg-[#edf6ea] rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#006e2f]">chat</span>
              </div>
              <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-3">WhatsApp is not a financial system</h3>
              <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                Payment reminders buried in group chats. Confirmations that scroll out of view. Screenshots that can be faked. Groups spend more time chasing payments than managing their money. This creates friction, distrust, and conflict.
              </p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-lg p-8">
              <div className="w-12 h-12 bg-[#edf6ea] rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#006e2f]">handshake</span>
              </div>
              <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-3">Verbal agreements fail</h3>
              <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                Loan terms agreed verbally are forgotten or disputed. Interest calculations done by hand contain errors. When members disagree, there is no record to refer to. Relationships break down and groups dissolve.
              </p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-lg p-8">
              <div className="w-12 h-12 bg-[#edf6ea] rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#006e2f]">block</span>
              </div>
              <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-3">No financial identity</h3>
              <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                A member who has saved consistently for five years in a chama has no document to show a bank. Their discipline is invisible to the formal financial system. They remain unbanked not because they are irresponsible, but because their record does not exist in a form anyone can verify.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW WE ARE DIFFERENT */}
      <section className="bg-white py-24 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-[36px] font-geist font-bold text-[#161d16] mb-16 text-center">What SmartChama does differently</h2>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-[#006e2f] shrink-0 mt-1">check_circle</span>
              <div>
                <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-2">Append-only ledger</h3>
                <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                  Every transaction recorded on SmartChama is permanent and tamper-proof. Records cannot be edited or deleted. This creates an audit trail that both members and administrators can trust completely.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="material-symbols-outlined text-[#006e2f] shrink-0 mt-1">check_circle</span>
              <div>
                <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-2">M-Pesa native</h3>
                <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                  We built around how Kenyans actually move money. Members pay contributions directly via M-Pesa. Confirmations are automatic. No one needs to chase anyone for a receipt because the system records everything the moment payment is made.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="material-symbols-outlined text-[#006e2f] shrink-0 mt-1">check_circle</span>
              <div>
                <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-2">AI trust scoring</h3>
                <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                  Our algorithm analyses contribution consistency, loan repayment behaviour, group tenure, and participation rate to generate a trust score for every member. This score is the beginning of a financial identity.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="material-symbols-outlined text-[#006e2f] shrink-0 mt-1">check_circle</span>
              <div>
                <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-2">Consent-based lender visibility</h3>
                <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                  Members choose whether to share their SmartChama record with banks or SACCOs. When they do, lenders see a verified history of financial discipline. This opens doors that were previously closed.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="material-symbols-outlined text-[#006e2f] shrink-0 mt-1">check_circle</span>
              <div>
                <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-2">Blockchain verification</h3>
                <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                  Critical financial records are anchored to a blockchain. This means the record cannot be altered after the fact. Every contribution carries a cryptographic proof of its authenticity.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="material-symbols-outlined text-[#006e2f] shrink-0 mt-1">check_circle</span>
              <div>
                <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-2">Built for Africa</h3>
                <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                  SmartChama is designed specifically for the Kenyan and broader African context. We support M-Pesa, Swahili language options, USSD for feature phones, and pricing in Kenya Shillings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEAM SECTION */}
      <section className="bg-[#0B0F0C] py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[36px] font-geist font-bold text-white mb-8">Built in Nairobi</h2>
          <div className="space-y-6 text-[18px] text-gray-400 leading-relaxed mb-10">
            <p>
              SmartChama is built by a team that grew up watching their parents save in chamas. We understand this world because we are part of it.
            </p>
            <p>
              We are based in Nairobi, Kenya. We are hiring. If you believe in financial inclusion and want to build something that matters, we want to hear from you.
            </p>
          </div>
          <Link href="/careers" className="inline-block bg-[#006e2f] hover:bg-[#005321] transition-colors text-white font-medium px-8 py-4 rounded">
            See open positions
          </Link>
        </div>
      </section>

      {/* VALUES SECTION */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-[36px] font-geist font-bold text-[#161d16] mb-16 text-center">What we believe</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-8">
              <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-4">Transparency above all</h3>
              <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                Every feature we build starts with one question: does this make the group more transparent? We believe that financial trust is built through visibility, not promises.
              </p>
            </div>

            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-8">
              <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-4">Community is the product</h3>
              <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                We do not serve individuals. We serve groups. The strength of SmartChama is the collective. Our job is to make that collective stronger, more organised, and more powerful.
              </p>
            </div>

            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-8">
              <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-4">Africa builds for Africa</h3>
              <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                The solutions that will transform African finance will be built by Africans who understand the context. We are not adapting a Western product. We are building something new.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="bg-[#22C55E] py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[40px] font-geist font-bold text-[#0B0F0C] mb-4 leading-tight">Ready to upgrade your chama?</h2>
          <p className="text-[20px] text-[#0B0F0C] opacity-90 mb-10">
            Join thousands of savings groups already building their financial future.
          </p>
          <Link href="/signup" className="inline-block bg-[#0B0F0C] hover:bg-black transition-colors text-white font-medium px-10 py-5 rounded text-headline-sm">
            Create Your Group
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

"use client";

import { useState } from "react";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How do I register my chama on SmartChama?",
      a: "Registering your group takes less than five minutes. Click Get Started on our homepage, create your account with your phone number and email, then follow the steps to create your group. You will set your group name, contribution amount, due date, and basic rules. Once your group is created, you can invite members using their phone numbers. They will receive an SMS with a link to join."
    },
    {
      q: "Does SmartChama work with M-Pesa?",
      a: "Yes. SmartChama is built around M-Pesa. When a member makes a contribution, they receive an M-Pesa STK push directly on their phone. They enter their PIN and the payment is confirmed automatically. The contribution appears in the group ledger within seconds. No manual recording is required."
    },
    {
      q: "What is a CREDIT SCORE?",
      a: "Your CREDIT SCORE is a number between 0 and 100 that reflects your financial reliability within your savings group. It is calculated from four factors: how consistently you contribute, how reliably you repay loans, how long you have been in the group, and your overall participation rate. A higher score can help you access larger loans from your group and, with your permission, demonstrate your creditworthiness to formal lenders."
    },
    {
      q: "Can I use SmartChama on a feature phone?",
      a: "Yes. SmartChama has a USSD interface that works on any phone including basic feature phones with no internet. Dial our USSD code, enter your group PIN, and you can check your balance, view upcoming contribution dates, and receive payment confirmations. The full dashboard is available on smartphones via our web app."
    },
    {
      q: "How secure is SmartChama?",
      a: "SmartChama uses multiple layers of security. All data is encrypted in transit and at rest. Critical financial records are anchored to a blockchain, meaning they cannot be altered after the fact. We use Supabase for our database, which includes row-level security so each member can only see their own data. Admin access requires separate authentication. We do not store M-Pesa PINs or any payment credentials."
    },
    {
      q: "What happens if someone does not pay?",
      a: "SmartChama sends automated payment reminders via SMS three days before the contribution due date, on the due date, and three days after. If a member is still unpaid after the grace period, they are marked as late in the system. Admins can apply penalties according to the group rules. The member's CREDIT SCORE is also affected by late or missed payments."
    },
    {
      q: "How does the loan system work?",
      a: "A member requests a loan through their dashboard. They specify the amount, purpose, and repayment period. Group admins receive a notification and can approve or decline the request. The member's CREDIT SCORE and savings history are shown to admins to help them make the decision. Once approved, the loan is recorded in the system and repayments are tracked automatically."
    },
    {
      q: "Can we share our financial record with a bank or SACCO?",
      a: "Yes, but only if you choose to. SmartChama has a consent-based lender visibility feature. When you turn it on, vetted financial institutions can view your contribution history and CREDIT SCORE. You can turn this off at any time. No data is shared without your explicit permission."
    },
    {
      q: "What does SmartChama cost?",
      a: "SmartChama has a free plan that supports groups of up to 20 members with full contribution tracking, loan management, and M-Pesa integration. Larger groups and advanced features are available on our Growth plan at KSh 999 per month. Enterprise pricing is available for organisations managing multiple groups. See our pricing page for full details."
    },
    {
      q: "How do I invite members to my group?",
      a: "Once your group is created, go to the Members section of your admin dashboard and click Invite Member. Enter the member's phone number or email address. They will receive an SMS with a unique link. When they click the link, they are taken to the signup page where their group is already pre-selected. After signing up, they appear in your members list and can start contributing immediately."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-inter text-on-surface">
      <LandingNav />

      {/* HERO */}
      <section className="bg-white border-b border-[#E5E7EB] py-16 px-6">
        <div className="max-w-7xl mx-auto text-center md:text-left">
          <h1 className="text-[48px] font-geist font-bold text-[#161d16] mb-4">Get in touch</h1>
          <p className="text-[18px] text-[#60645f] max-w-xl leading-relaxed">
            Whether you are a group looking to get started, a financial institution interested in our data, or a developer wanting to build on our platform, we want to hear from you.
          </p>
        </div>
      </section>

      {/* TWO COLUMN LAYOUT */}
      <section className="bg-[#FAFAFA] py-24 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">
          
          {/* LEFT - Contact Details */}
          <div>
            <h2 className="text-[32px] font-geist font-bold text-[#161d16] mb-10">Contact information</h2>
            
            <div className="flex flex-col gap-6 mb-12">
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex gap-4 hover:border-[#006e2f] transition-colors">
                <span className="material-symbols-outlined text-[#006e2f] text-[24px] mt-1 shrink-0">mail</span>
                <div>
                  <div className="text-label-caps text-[#60645f] tracking-wider font-bold mb-1 uppercase">General enquiries</div>
                  <a href="mailto:hello@smartchama.co.ke" className="text-body-sm text-[#161d16] font-bold hover:underline mb-2 block">hello@smartchama.co.ke</a>
                  <p className="text-body-sm text-[#60645f] leading-relaxed">For questions about the platform, pricing, and getting started.</p>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex gap-4 hover:border-[#006e2f] transition-colors">
                <span className="material-symbols-outlined text-[#006e2f] text-[24px] mt-1 shrink-0">support_agent</span>
                <div>
                  <div className="text-label-caps text-[#60645f] tracking-wider font-bold mb-1 uppercase">Member support</div>
                  <a href="mailto:support@smartchama.co.ke" className="text-body-sm text-[#161d16] font-bold hover:underline mb-2 block">support@smartchama.co.ke</a>
                  <p className="text-body-sm text-[#60645f] leading-relaxed">For help with your account, contributions, or loans. We respond within 4 hours on business days.</p>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex gap-4 hover:border-[#006e2f] transition-colors">
                <span className="material-symbols-outlined text-[#006e2f] text-[24px] mt-1 shrink-0">handshake</span>
                <div>
                  <div className="text-label-caps text-[#60645f] tracking-wider font-bold mb-1 uppercase">Partnerships</div>
                  <a href="mailto:partners@smartchama.co.ke" className="text-body-sm text-[#161d16] font-bold hover:underline mb-2 block">partners@smartchama.co.ke</a>
                  <p className="text-body-sm text-[#60645f] leading-relaxed">For banks, SACCOs, and financial institutions interested in accessing SmartChama financial identity data.</p>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex gap-4 hover:border-[#006e2f] transition-colors">
                <span className="material-symbols-outlined text-[#006e2f] text-[24px] mt-1 shrink-0">code</span>
                <div>
                  <div className="text-label-caps text-[#60645f] tracking-wider font-bold mb-1 uppercase">Developer enquiries</div>
                  <a href="mailto:dev@smartchama.co.ke" className="text-body-sm text-[#161d16] font-bold hover:underline mb-2 block">dev@smartchama.co.ke</a>
                  <p className="text-body-sm text-[#60645f] leading-relaxed">For API access, integrations, and technical partnerships.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-[#006e2f] text-[24px]">location_on</span>
                <div>
                  <h3 className="font-bold text-[#161d16] mb-1">Nairobi, Kenya</h3>
                  <p className="text-body-sm text-[#60645f]">We work across Nairobi and serve groups across all 47 counties.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-[#006e2f] text-[24px]">schedule</span>
                <div>
                  <h3 className="font-bold text-[#161d16] mb-1">Monday to Friday, 8am to 6pm EAT</h3>
                  <p className="text-body-sm text-[#60645f]">WhatsApp support available 7am to 9pm daily.</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - Contact Form */}
          <div>
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 shadow-sm">
              <h2 className="text-[28px] font-geist font-bold text-[#161d16] mb-8">Send us a message</h2>
              
              <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-label-caps text-[#60645f] font-bold mb-2 uppercase">Full Name</label>
                  <input type="text" required className="w-full border border-[#E5E7EB] rounded px-4 py-3 text-[#161d16] focus:outline-none focus:ring-1 focus:ring-[#006e2f] focus:border-[#006e2f] transition-colors" />
                </div>
                
                <div>
                  <label className="block text-label-caps text-[#60645f] font-bold mb-2 uppercase">Email</label>
                  <input type="email" required className="w-full border border-[#E5E7EB] rounded px-4 py-3 text-[#161d16] focus:outline-none focus:ring-1 focus:ring-[#006e2f] focus:border-[#006e2f] transition-colors" />
                </div>
                
                <div>
                  <label className="block text-label-caps text-[#60645f] font-bold mb-2 uppercase">Phone (optional)</label>
                  <div className="flex border border-[#E5E7EB] rounded focus-within:ring-1 focus-within:ring-[#006e2f] focus-within:border-[#006e2f] transition-colors overflow-hidden">
                    <div className="bg-[#FAFAFA] border-r border-[#E5E7EB] px-3 flex items-center justify-center text-[#60645f] font-medium">+254</div>
                    <input type="tel" className="w-full px-4 py-3 text-[#161d16] focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-label-caps text-[#60645f] font-bold mb-2 uppercase">Subject</label>
                  <select className="w-full border border-[#E5E7EB] rounded px-4 py-3 text-[#161d16] focus:outline-none focus:ring-1 focus:ring-[#006e2f] focus:border-[#006e2f] transition-colors bg-white">
                    <option>General enquiry</option>
                    <option>Technical support</option>
                    <option>Partnership</option>
                    <option>Press</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-label-caps text-[#60645f] font-bold mb-2 uppercase">Message</label>
                  <textarea rows={6} required placeholder="Tell us how we can help..." className="w-full border border-[#E5E7EB] rounded px-4 py-3 text-[#161d16] focus:outline-none focus:ring-1 focus:ring-[#006e2f] focus:border-[#006e2f] transition-colors resize-y"></textarea>
                </div>

                <button type="submit" className="w-full bg-[#006e2f] hover:bg-[#005321] transition-colors text-white rounded py-3 text-headline-sm font-bold mt-2">
                  Send Message
                </button>

                <p className="text-body-sm text-[#60645f] text-center mt-2">
                  We typically respond within one business day.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[32px] font-geist font-bold text-[#161d16] mb-10 text-center">Frequently asked questions</h2>
          
          <div className="border-t border-[#E5E7EB]">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-[#E5E7EB]">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
                >
                  <span className="text-headline-sm font-geist font-bold text-[#161d16] group-hover:text-[#006e2f] transition-colors">
                    {faq.q}
                  </span>
                  <span className={`material-symbols-outlined text-[#60645f] transition-transform duration-300 ${openFaq === idx ? 'rotate-90' : ''}`}>
                    chevron_right
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

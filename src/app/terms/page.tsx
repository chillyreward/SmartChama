import Link from "next/link";
import { Wallet, ArrowLeft, Shield, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-300">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-slate-900" />
            </div>
            <span className="font-bold text-white">SmartChama</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-6">
            <FileText className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Terms and Conditions</h1>
          <p className="text-slate-400">Last Updated: February 12, 2026</p>
        </div>

        {/* Terms Content */}
        <div className="prose prose-invert prose-slate max-w-none">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <Shield className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Important Notice</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Please read these Terms and Conditions carefully before using SmartChama. By accessing or using our platform, you agree to be bound by these terms.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              By creating an account, accessing, or using SmartChama ("the Platform"), you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
            </p>
            <p className="text-slate-400 leading-relaxed">
              These terms apply to all users, including administrators, members, and visitors of the Platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">2. Service Description</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              SmartChama is a digital platform designed to facilitate group savings and investment management for chamas (investment groups) in Kenya and across Africa. Our services include:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>Group savings management and tracking</li>
              <li>Member contribution monitoring</li>
              <li>Loan management and disbursement</li>
              <li>AI-powered financial advisory services</li>
              <li>M-Pesa payment integration</li>
              <li>Transaction history and reporting</li>
              <li>Multi-language support</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
            <h3 className="text-lg font-semibold text-emerald-400 mb-3">3.1 Account Registration</h3>
            <p className="text-slate-400 leading-relaxed mb-4">
              To use SmartChama, you must create an account by providing accurate, complete, and current information. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
              <li>Ensuring your contact information is up to date</li>
            </ul>

            <h3 className="text-lg font-semibold text-emerald-400 mb-3">3.2 Account Types</h3>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li><strong className="text-white">Admin Accounts:</strong> Chama administrators who create and manage groups</li>
              <li><strong className="text-white">Member Accounts:</strong> Chama members who join via invite links</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">4. Financial Transactions</h2>
            <h3 className="text-lg font-semibold text-emerald-400 mb-3">4.1 M-Pesa Integration</h3>
            <p className="text-slate-400 leading-relaxed mb-4">
              SmartChama integrates with Safaricom's M-Pesa service for payments. By using our payment features, you agree to:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
              <li>Comply with M-Pesa's terms and conditions</li>
              <li>Provide accurate phone numbers for transactions</li>
              <li>Verify all transaction details before confirming</li>
              <li>Accept that transaction fees may apply</li>
            </ul>

            <h3 className="text-lg font-semibold text-emerald-400 mb-3">4.2 Transaction Responsibility</h3>
            <p className="text-slate-400 leading-relaxed mb-4">
              You acknowledge that:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>All transactions are final once processed</li>
              <li>SmartChama acts as a facilitator, not a financial institution</li>
              <li>You are responsible for verifying recipient details</li>
              <li>Refunds are subject to chama group policies</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">5. Data Privacy and Security</h2>
            <h3 className="text-lg font-semibold text-emerald-400 mb-3">5.1 Data Collection</h3>
            <p className="text-slate-400 leading-relaxed mb-4">
              We collect and process personal information including:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
              <li>Name, email address, and phone number</li>
              <li>ID numbers for verification purposes</li>
              <li>Transaction history and financial data</li>
              <li>Device and usage information</li>
            </ul>

            <h3 className="text-lg font-semibold text-emerald-400 mb-3">5.2 Data Protection</h3>
            <p className="text-slate-400 leading-relaxed mb-4">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>256-bit end-to-end encryption</li>
              <li>Secure database storage with Supabase</li>
              <li>Regular security audits and updates</li>
              <li>Compliance with Kenya Data Protection Act, 2019</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">6. User Conduct</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>Use the Platform for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to other accounts</li>
              <li>Transmit viruses, malware, or harmful code</li>
              <li>Engage in fraudulent activities or money laundering</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Impersonate any person or entity</li>
              <li>Scrape or collect data without permission</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">7. AI Advisory Services</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Our AI-powered financial advisory features are provided for informational purposes only. You acknowledge that:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>AI recommendations are not professional financial advice</li>
              <li>You should consult qualified financial advisors for major decisions</li>
              <li>SmartChama is not liable for investment losses</li>
              <li>AI accuracy may vary and is not guaranteed</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">8. Intellectual Property</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              All content, features, and functionality of SmartChama, including but not limited to:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
              <li>Software code and algorithms</li>
              <li>Design, graphics, and user interface</li>
              <li>Logos, trademarks, and branding</li>
              <li>Text, images, and multimedia content</li>
            </ul>
            <p className="text-slate-400 leading-relaxed">
              are owned by SmartChama Technologies and protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          {/* Section 9 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">9. Limitation of Liability</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              To the maximum extent permitted by law, SmartChama shall not be liable for:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>Any indirect, incidental, or consequential damages</li>
              <li>Loss of profits, data, or business opportunities</li>
              <li>Service interruptions or technical failures</li>
              <li>Actions or omissions of third-party service providers</li>
              <li>Disputes between chama members</li>
              <li>Investment losses or financial decisions</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">10. Termination</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              We reserve the right to suspend or terminate your account if:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
              <li>You violate these Terms and Conditions</li>
              <li>We suspect fraudulent or illegal activity</li>
              <li>You provide false or misleading information</li>
              <li>Your account remains inactive for an extended period</li>
            </ul>
            <p className="text-slate-400 leading-relaxed">
              You may terminate your account at any time by contacting our support team. Upon termination, you remain liable for any outstanding obligations.
            </p>
          </section>

          {/* Section 11 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">11. Dispute Resolution</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              In the event of any dispute arising from these terms:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>Parties agree to first attempt resolution through good-faith negotiation</li>
              <li>If unresolved, disputes shall be submitted to mediation</li>
              <li>Any legal proceedings shall be governed by the laws of Kenya</li>
              <li>Jurisdiction shall be in the courts of Nairobi, Kenya</li>
            </ul>
          </section>

          {/* Section 12 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">12. Changes to Terms</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              SmartChama reserves the right to modify these Terms and Conditions at any time. We will notify users of significant changes via:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
              <li>Email notification to registered users</li>
              <li>In-app notifications</li>
              <li>Updates on our website</li>
            </ul>
            <p className="text-slate-400 leading-relaxed">
              Continued use of the Platform after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          {/* Section 13 */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">13. Contact Information</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              For questions, concerns, or support regarding these Terms and Conditions, please contact us:
            </p>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <p className="text-slate-300 mb-2"><strong className="text-white">Email:</strong> support@smartchama.com</p>
              <p className="text-slate-300 mb-2"><strong className="text-white">Phone:</strong> +254 700 000 000</p>
              <p className="text-slate-300 mb-2"><strong className="text-white">Address:</strong> Nairobi, Kenya</p>
              <p className="text-slate-300"><strong className="text-white">Business Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM EAT</p>
            </div>
          </section>

          {/* Acknowledgment */}
          <section className="mb-10">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-3">Acknowledgment</h2>
              <p className="text-slate-300 leading-relaxed">
                By using SmartChama, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. You also acknowledge that these terms constitute a legally binding agreement between you and SmartChama Technologies.
              </p>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl transition-all text-center"
          >
            Accept & Create Account
          </Link>
          <Link
            href="/"
            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-center"
          >
            Back to Home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-slate-500 text-sm">
          <p>© 2026 SmartChama Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

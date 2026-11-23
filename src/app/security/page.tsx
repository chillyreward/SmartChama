import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export const metadata = {
  title: "Security | Akibora",
  description: "Security you can trust. Akibora handles real money for real families. We take security seriously at every level.",
};

export default function SecurityPage() {
  const sections = [
    {
      icon: "verified_user",
      title: "Encrypted data",
      desc: "All data transmitted between your device and Akibora is encrypted using TLS 1.3. Data stored in our database is encrypted at rest. Your personal and financial information is never stored in plain text."
    },
    {
      icon: "link",
      title: "Blockchain verification",
      desc: "Critical financial records including contribution confirmations and payouts are anchored to a blockchain. This creates a cryptographic proof that cannot be altered after the fact. Every record has a transaction hash that can be independently verified."
    },
    {
      icon: "lock",
      title: "Row-level security",
      desc: "Our database uses row-level security, which means each user can only access data they are permitted to see. A member cannot view another member's private details. An admin can only access their own group's data."
    },
    {
      icon: "phone_android",
      title: "M-Pesa security",
      desc: "Akibora never stores your M-Pesa PIN. Payment requests are sent directly from Safaricom to your phone. You enter your PIN only on your phone's M-Pesa interface. We only receive a payment confirmation after the transaction is complete."
    },
    {
      icon: "manage_accounts",
      title: "Access controls",
      desc: "Admin access requires separate authentication from member access. Critical admin actions such as payout approvals, member removal, and wallet withdrawals require multi-admin approval. All admin actions are logged in a permanent audit trail."
    },
    {
      icon: "notifications_active",
      title: "Real-time alerts",
      desc: "You receive an SMS notification for every transaction on your account. If a contribution is recorded, a payout is made, or any change is made to your account, you are notified immediately. If you receive a notification for something you did not do, contact support@akibora.co.ke immediately."
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--ak-surface-2)] flex flex-col font-inter text-on-surface">
      <LandingNav />

      {/* HERO */}
      <section className="bg-[var(--ak-page)] py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="material-symbols-outlined text-[var(--ak-brand-ink)] text-6xl mb-6">shield</span>
          <h1 className="text-display-lg font-geist font-bold text-white mb-6 leading-tight">Security you can trust</h1>
          <p className="text-[18px] text-gray-400 max-w-xl mx-auto leading-relaxed">
            Akibora handles real money for real families. We take security seriously at every level.
          </p>
        </div>
      </section>

      {/* SECURITY SECTIONS */}
      <section className="bg-white py-24 px-6 border-b border-[var(--ak-line)]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
          {sections.map((sec, idx) => (
            <div key={idx} className="flex gap-6">
              <div className="w-12 h-12 bg-[var(--ak-tint)] rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[var(--ak-brand-ink)]">{sec.icon}</span>
              </div>
              <div>
                <h3 className="text-headline-sm font-geist font-bold text-[var(--ak-text)] mb-3">{sec.title}</h3>
                <p className="text-body-lg text-[var(--ak-text-2)] leading-relaxed">
                  {sec.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RESPONSIBLE DISCLOSURE */}
      <section className="bg-[var(--ak-tint)] py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[32px] font-geist font-bold text-[var(--ak-text)] mb-6">Report a vulnerability</h2>
          <p className="text-[18px] text-[var(--ak-text-2)] leading-relaxed">
            If you discover a security vulnerability in Akibora, please report it responsibly to <a href="mailto:security@akibora.co.ke" className="text-[var(--ak-brand-ink)] hover:underline font-bold">security@akibora.co.ke</a>. Do not publicly disclose the issue until we have had the opportunity to investigate and address it. We commit to responding within 48 hours and keeping you informed of our progress.
          </p>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

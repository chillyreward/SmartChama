import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export const metadata = {
  title: "Privacy Policy | SmartChama",
  description: "Privacy Policy for using the SmartChama platform.",
};

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. What data we collect",
      content: (
        <>
          <p className="font-bold text-[#161d16] mb-2">When you create an account:</p>
          <ul className="list-disc pl-5 space-y-2 my-4">
            <li>Full name</li>
            <li>Phone number (used for M-Pesa)</li>
            <li>Email address</li>
            <li>National ID number (for verification)</li>
            <li>County and occupation</li>
          </ul>

          <p className="font-bold text-[#161d16] mt-6 mb-2">When you use the platform:</p>
          <ul className="list-disc pl-5 space-y-2 my-4">
            <li>Contribution amounts and dates</li>
            <li>Loan requests and repayment records</li>
            <li>Credit Score and its components</li>
            <li>Login times and device information</li>
            <li>SMS delivery records</li>
          </ul>

          <p className="font-bold text-[#161d16] mt-6 mb-2">From M-Pesa:</p>
          <ul className="list-disc pl-5 space-y-2 my-4">
            <li>Payment confirmation details</li>
            <li>M-Pesa receipt numbers</li>
            <li>Transaction timestamps</li>
          </ul>
          <p>We do not collect or store your M-Pesa PIN.</p>
        </>
      )
    },
    {
      title: "2. How we use your data",
      content: (
        <>
          <p className="mb-2">We use your data to:</p>
          <ul className="list-disc pl-5 space-y-2 my-4">
            <li>Provide and operate the SmartChama platform</li>
            <li>Record and verify your contributions</li>
            <li>Calculate your Credit Score</li>
            <li>Send you payment reminders and confirmations via SMS</li>
            <li>Allow your group administrator to manage your membership</li>
            <li>Generate financial identity reports at your request</li>
            <li>Improve our platform and fix technical issues</li>
            <li>Comply with legal obligations</li>
          </ul>
        </>
      )
    },
    {
      title: "3. Who can see your data",
      content: (
        <>
          <p className="font-bold text-[#161d16] mb-2">Your group administrator can see:</p>
          <ul className="list-disc pl-5 space-y-2 my-4">
            <li>Your contribution history and status</li>
            <li>Your Credit Score</li>
            <li>Your loan history within the group</li>
            <li>Your contact details</li>
          </ul>

          <p className="font-bold text-[#161d16] mt-6 mb-2">Other group members can see:</p>
          <ul className="list-disc pl-5 space-y-2 my-4">
            <li>Whether you have paid your contribution</li>
            <li>Your name and role in the group</li>
          </ul>
          <p>They cannot see your loan details.</p>

          <p className="mt-6">
            SmartChama staff can access your data only when needed to provide support or investigate a reported issue.
          </p>

          <p className="font-bold text-[#161d16] mt-6 mb-2">Third parties:</p>
          <p className="mb-2">
            We do not sell your data. We share data with third parties only in these circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-2 my-4">
            <li>Safaricom, to process M-Pesa payments</li>
            <li>Africa's Talking, to send SMS messages</li>
            <li>With your explicit consent, with financial institutions you choose to share your record with</li>
          </ul>
        </>
      )
    },
    {
      title: "4. Data storage and security",
      content: (
        <>
          <p>
            Your data is stored on Supabase infrastructure hosted in secure data centres. We use encryption in transit and at rest. Critical financial records are anchored to a blockchain for tamper-proof verification.
          </p>
          <p className="mt-4">
            We implement row-level security so each user can only access data they are permitted to see. Admin access requires separate multi-factor authentication.
          </p>
        </>
      )
    },
    {
      title: "5. Your rights",
      content: (
        <>
          <p className="mb-2">You have the right to:</p>
          <ul className="list-disc pl-5 space-y-2 my-4">
            <li>Access a copy of all data we hold about you</li>
            <li>Correct inaccurate personal data</li>
            <li>Request deletion of your account and personal data</li>
            <li>Withdraw consent for lender visibility at any time</li>
            <li>Object to processing of your data in certain circumstances</li>
            <li>Request a machine-readable export of your data</li>
          </ul>
          <p>
            To exercise any of these rights, contact <a href="mailto:privacy@smartchama.co.ke" className="text-[#006e2f] hover:underline">privacy@smartchama.co.ke</a>. We will respond within 14 days.
          </p>
        </>
      )
    },
    {
      title: "6. Cookies",
      content: (
        <>
          <p>
            SmartChama uses essential cookies to keep you logged in and maintain your session. We use analytics cookies to understand how the platform is used so we can improve it. You can manage cookie preferences in your browser settings. See our Cookie Policy for full details.
          </p>
        </>
      )
    },
    {
      title: "7. Data retention",
      content: (
        <>
          <p>
            We retain your personal data for as long as your account is active. Contribution and transaction records that form part of a group's ledger are retained permanently as they affect the integrity of the group's financial history.
          </p>
          <p className="mt-4">
            If you delete your account, your personal details are removed but anonymised transaction records may be retained as part of the group's ledger.
          </p>
        </>
      )
    },
    {
      title: "8. Contact",
      content: (
        <>
          <p className="mb-2">
            For privacy questions or to exercise your rights, contact:<br/>
            <a href="mailto:privacy@smartchama.co.ke" className="text-[#006e2f] hover:underline">privacy@smartchama.co.ke</a>
          </p>
          <p className="mt-6 text-[#60645f]">
            SmartChama Technologies Ltd<br/>
            Nairobi, Kenya
          </p>
        </>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-inter text-on-surface">
      <LandingNav />

      <main className="flex-1 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-[40px] font-geist font-bold text-[#161d16] mb-2">Privacy Policy</h1>
          <p className="text-body-sm text-[#60645f] mb-10">Last updated: June 2025</p>

          <p className="text-[18px] text-[#3d4a3d] leading-relaxed mb-12">
            SmartChama Technologies Ltd is committed to protecting your privacy. This policy explains what data we collect, how we use it, and what rights you have over it.
          </p>

          <div className="space-y-12">
            {sections.map((section, idx) => (
              <section key={idx}>
                <h2 className="text-[24px] font-geist font-bold text-[#161d16] mb-4">
                  {section.title}
                </h2>
                <div className="text-[16px] text-[#3d4a3d] leading-relaxed">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

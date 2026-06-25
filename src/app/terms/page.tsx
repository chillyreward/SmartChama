import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export const metadata = {
  title: "Terms of Service | SmartChama",
  description: "Terms of Service for using the SmartChama platform.",
};

export default function TermsPage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: (
        <>
          <p>
            By accessing SmartChama through our website, mobile application, or USSD interface, you confirm that you are at least 18 years of age, that you have the legal capacity to enter into a binding agreement, and that you agree to comply with these terms.
          </p>
          <p>
            If you are registering a savings group on behalf of other members, you confirm that you have the authority to do so and that you will communicate these terms to all members of your group.
          </p>
        </>
      )
    },
    {
      title: "2. Description of Service",
      content: (
        <>
          <p>
            SmartChama provides a digital platform for informal savings groups to manage contributions, loans, and financial records. Our services include:
          </p>
          <ul className="list-disc pl-5 space-y-2 my-4">
            <li>Digital contribution tracking via M-Pesa integration</li>
            <li>Internal loan management and repayment tracking</li>
            <li>Trust score calculation based on financial behaviour</li>
            <li>Group wallet management</li>
            <li>Transaction recording and reporting</li>
            <li>SMS and in-app notifications</li>
            <li>Financial identity records for qualifying members</li>
          </ul>
          <p>
            SmartChama is a financial management platform. We are not a bank, a lending institution, or a regulated financial services provider. We facilitate the management of group finances but do not hold, guarantee, or insure funds.
          </p>
        </>
      )
    },
    {
      title: "3. Account Registration",
      content: (
        <>
          <p>
            To use SmartChama, you must create an account with a valid phone number and email address. You are responsible for maintaining the confidentiality of your login credentials. You must not share your password with anyone, including other members of your group.
          </p>
          <p>
            You must provide accurate and truthful information during registration. SmartChama reserves the right to suspend or terminate accounts where false information has been provided.
          </p>
          <p>
            Each person may only hold one account on SmartChama. Creating multiple accounts to circumvent group rules or platform policies is strictly prohibited.
          </p>
        </>
      )
    },
    {
      title: "4. Group Administration",
      content: (
        <>
          <p>
            The person who creates a group on SmartChama is designated as the Chairlady or Administrator. This person is responsible for:
          </p>
          <ul className="list-disc pl-5 space-y-2 my-4">
            <li>Inviting and managing group members</li>
            <li>Setting and enforcing group rules including contribution amounts, due dates, and loan policies</li>
            <li>Approving or declining loan requests</li>
            <li>Maintaining accurate group records</li>
            <li>Ensuring the group operates in accordance with these terms</li>
          </ul>
          <p>
            SmartChama provides tools for group administration but is not responsible for the internal governance decisions of any savings group. Disputes between group members are the responsibility of the group to resolve.
          </p>
        </>
      )
    },
    {
      title: "5. Contributions and Payments",
      content: (
        <>
          <p>
            All contributions made through SmartChama are processed via Safaricom M-Pesa. By initiating a contribution, you authorise SmartChama to trigger an M-Pesa payment request to your registered phone number.
          </p>
          <p>
            SmartChama does not store your M-Pesa PIN or any payment credentials. Payment processing is handled entirely by Safaricom. SmartChama records the confirmation of payment but is not responsible for any M-Pesa transaction failures, delays, or errors caused by Safaricom's systems.
          </p>
          <p>
            All contribution records are stored permanently and cannot be deleted once confirmed. This is by design to ensure the integrity of the group's financial history.
          </p>
        </>
      )
    },
    {
      title: "6. Loans",
      content: (
        <>
          <p>
            SmartChama facilitates internal lending between members of a savings group. All loan decisions, including approval, amounts, interest rates, and repayment terms, are made by the group's administrators, not by SmartChama.
          </p>
          <p>
            SmartChama is not a lender. We do not provide, guarantee, or underwrite any loan. We provide tools to record and track loan agreements that are made between group members.
          </p>
          <p>
            Members who take loans from their group and fail to repay them may have their trust score reduced. Persistent non-repayment may result in the member being flagged or removed from the group by the administrator.
          </p>
        </>
      )
    },
    {
      title: "7. Trust Scores and Financial Identity",
      content: (
        <>
          <p>
            SmartChama calculates a trust score for each member based on their contribution consistency, loan repayment behaviour, group tenure, and participation rate. This score is an indication of financial reliability within the group context.
          </p>
          <p>
            Trust scores are not a credit rating and are not regulated by the Central Bank of Kenya or any financial authority. They are an internal metric provided for informational purposes.
          </p>
          <p>
            Members may choose to share their trust score and contribution history with third-party financial institutions through SmartChama's consent-based lender visibility feature. SmartChama does not guarantee that any lender will extend credit based on this information.
          </p>
        </>
      )
    },
    {
      title: "8. Privacy and Data",
      content: (
        <>
          <p>
            SmartChama collects and processes personal data as described in our Privacy Policy. By using SmartChama, you consent to this processing.
          </p>
          <p>
            Your contribution and loan records are visible to the administrators of your savings group. Other group members can see contribution statuses but cannot see individual loan details unless they are also administrators.
          </p>
          <p>
            You may request a copy of your data or request deletion of your account at any time by contacting <a href="mailto:privacy@smartchama.co.ke" className="text-[#006e2f] hover:underline">privacy@smartchama.co.ke</a>. Note that contribution and transaction records that form part of a group's financial history cannot be deleted as they affect other members' records.
          </p>
        </>
      )
    },
    {
      title: "9. Acceptable Use",
      content: (
        <>
          <p>
            You must not use SmartChama to:
          </p>
          <ul className="list-disc pl-5 space-y-2 my-4">
            <li>Record fraudulent contributions or transactions</li>
            <li>Create a savings group for the purpose of collecting funds without the intention to distribute them</li>
            <li>Impersonate another person or group administrator</li>
            <li>Attempt to access another member's account without authorisation</li>
            <li>Use the platform to facilitate money laundering or any other illegal financial activity</li>
            <li>Reverse engineer, copy, or redistribute any part of our platform or software</li>
          </ul>
          <p>
            Violation of these terms may result in immediate account suspension and referral to relevant authorities.
          </p>
        </>
      )
    },
    {
      title: "10. Limitation of Liability",
      content: (
        <>
          <p>
            SmartChama provides its platform on an as-is basis. We do not guarantee that the service will be available at all times or that it will be error-free.
          </p>
          <p>
            SmartChama is not liable for:
          </p>
          <ul className="list-disc pl-5 space-y-2 my-4">
            <li>Losses arising from M-Pesa transaction failures</li>
            <li>Disputes between group members</li>
            <li>Decisions made by group administrators regarding loans or member management</li>
            <li>Loss of data caused by events outside our control</li>
            <li>Any indirect or consequential losses arising from use of the platform</li>
          </ul>
          <p>
            Our total liability to any user shall not exceed the amount paid by that user to SmartChama in the 12 months preceding the event giving rise to the claim.
          </p>
          <p className="mt-6">
            For questions about these terms, contact <a href="mailto:legal@smartchama.co.ke" className="text-[#006e2f] hover:underline">legal@smartchama.co.ke</a>
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
          <h1 className="text-[40px] font-geist font-bold text-[#161d16] mb-2">Terms of Service</h1>
          <p className="text-body-sm text-[#60645f] mb-10">Last updated: June 2025</p>

          <p className="text-[18px] text-[#3d4a3d] leading-relaxed mb-12">
            These Terms of Service govern your use of SmartChama, operated by SmartChama Technologies Ltd, a company registered in Kenya. By creating an account or using our platform, you agree to these terms in full. Please read them carefully before proceeding.
          </p>

          <div className="space-y-12">
            {sections.map((section, idx) => (
              <section key={idx}>
                <h2 className="text-[24px] font-geist font-bold text-[#161d16] mb-4">
                  {section.title}
                </h2>
                <div className="text-[16px] text-[#3d4a3d] leading-relaxed space-y-4">
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

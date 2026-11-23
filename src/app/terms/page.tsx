import Link from 'next/link';
import { LegalPage } from '@/components/landing/LegalPage';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Terms | Akibora',
  description: 'The terms for using Akibora.',
};

const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated="23 November 2026"
      intro={
        <p>
          These terms cover your use of Akibora on the web, in the app and by USSD. By creating an account or using
          Akibora you agree to them. Akibora is in early access and has not launched publicly, so features and these
          terms may change. If a change affects you, we&apos;ll say so in the app.
        </p>
      }
      sections={[
        {
          id: 'who',
          title: 'Who can use Akibora',
          body: (
            <>
              <p>You must be 18 or older and able to agree to these terms.</p>
              <p>If you start a group, you confirm you are allowed to set it up for its members and that you will tell them about these terms.</p>
            </>
          ),
        },
        {
          id: 'what',
          title: 'What Akibora does, and doesn’t',
          body: (
            <>
              <p>Akibora is a record-keeping tool for savings groups. It helps you:</p>
              <ul>
                <li>Collect and record contributions by M-Pesa, and record cash payments.</li>
                <li>Run a merry-go-round, a welfare fund and penalties.</li>
                <li>Agree on withdrawals as a group.</li>
                <li>Keep a shared, readable history of every transaction.</li>
                <li>Send reminders by SMS and in the app.</li>
                <li>Work out each member&apos;s trust score and download a credit passport.</li>
              </ul>
              <p>
                <strong>Akibora is not a bank, a lender or a licensed financial provider.</strong> Your group&apos;s money stays in
                the group&apos;s own M-Pesa, bank or SACCO accounts. We don&apos;t hold, guarantee or insure it, and we don&apos;t
                lend money.
              </p>
            </>
          ),
        },
        {
          id: 'account',
          title: 'Your account',
          body: (
            <>
              <p>You need a working phone number. Keep your password to yourself, including from other members of your group.</p>
              <p>Give true details when you sign up. We may suspend accounts set up with false details.</p>
              <p>One account per person. Don&apos;t create extra accounts to get around a group&apos;s rules.</p>
            </>
          ),
        },
        {
          id: 'officials',
          title: 'Officials',
          body: (
            <>
              <p>The person who starts a group is its first official. Officials (chair, treasurer, secretary, admin) are responsible for:</p>
              <ul>
                <li>Approving and managing members.</li>
                <li>Setting the group&apos;s rules: contribution amounts, due dates, penalties.</li>
                <li>Recording cash payments accurately.</li>
                <li>Running the group in line with these terms.</li>
              </ul>
              <p>Akibora gives officials the tools, but the group decides how it is run. Disagreements between members are for the group to settle.</p>
            </>
          ),
        },
        {
          id: 'payments',
          title: 'Contributions and payments',
          body: (
            <>
              <p>When you pay through Akibora, we ask M-Pesa to send a payment prompt to your phone. You approve it with your own PIN, which we never see.</p>
              <p>Safaricom processes M-Pesa payments. We record the confirmation, but we aren&apos;t responsible for failures or delays on Safaricom&apos;s side.</p>
              <p>Confirmed contributions can&apos;t be deleted. That keeps the group&apos;s history trustworthy for everyone in it.</p>
            </>
          ),
        },
        {
          id: 'trust',
          title: 'Trust scores and the credit passport',
          body: (
            <>
              <p>
                Each member&apos;s trust score comes from their own record in the group: how often they pay on time, how long
                they have been a member, and their current run of on-time payments.
              </p>
              <p>
                It is not a credit rating, and no financial regulator oversees it. Your credit passport is a PDF of your
                record that you download and give to whoever you choose. We don&apos;t promise that any lender will accept it.
              </p>
            </>
          ),
        },
        {
          id: 'data',
          title: 'Your data',
          body: (
            <p>
              We handle personal data as the <Link href="/privacy">privacy page</Link> describes. Your officials see your
              contribution history; other members see whether you have paid. You can ask for a copy of your data or delete
              your account at any time, but records that are part of the group&apos;s shared history stay, without your
              contact details.
            </p>
          ),
        },
        {
          id: 'use',
          title: 'What you must not do',
          body: (
            <>
              <ul>
                <li>Record false contributions or transactions.</li>
                <li>Start a group to collect money you don&apos;t intend to pay back out.</li>
                <li>Pretend to be another person or an official.</li>
                <li>Get into someone else&apos;s account without permission.</li>
                <li>Use Akibora for money laundering or anything else illegal.</li>
                <li>Copy, reverse engineer or resell Akibora.</li>
              </ul>
              <p>We may suspend accounts that break these rules, and report illegal activity to the authorities.</p>
            </>
          ),
        },
        {
          id: 'liability',
          title: 'Limits on our responsibility',
          body: (
            <>
              <p>Akibora is provided as it is. We work to keep it running and correct, but we can&apos;t promise it will always be available or free of errors.</p>
              <p>We are not responsible for:</p>
              <ul>
                <li>Losses from M-Pesa failures.</li>
                <li>Disagreements between members.</li>
                <li>Decisions officials make about payouts or members.</li>
                <li>Data lost through events outside our control.</li>
                <li>Indirect losses from using Akibora.</li>
              </ul>
              <p>Our total responsibility to you is limited to what you paid Akibora in the 12 months before the problem.</p>
            </>
          ),
        },
        {
          id: 'contact',
          title: 'Contact',
          body: <p>Questions about these terms: {mail}.</p>,
        },
      ]}
    />
  );
}

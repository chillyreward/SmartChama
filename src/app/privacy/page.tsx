import Link from 'next/link';
import { LegalPage } from '@/components/landing/LegalPage';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Privacy | Akibora',
  description: 'What Akibora collects, who can see it, and what you can ask us to do with it.',
};

const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="23 November 2026"
      intro={
        <p>
          What Akibora collects, who can see it, and what you can ask us to do with it. Akibora is in early access and
          has not launched publicly. If anything here is unclear, write to {mail}.
        </p>
      }
      sections={[
        {
          id: 'collect',
          title: 'What we collect',
          body: (
            <>
              <p><strong>When you create an account:</strong> your full name, phone number, email address if you give one, county, and national ID number.</p>
              <p><strong>When you use Akibora:</strong> the contributions, payouts, welfare claims, penalties and withdrawals recorded for your group; messages in your group chat; your trust score and how it was worked out; and when you sign in.</p>
              <p><strong>From M-Pesa:</strong> the confirmation for each payment, including the M-Pesa receipt number and time. We never see or store your M-Pesa PIN.</p>
              <p><strong>For identity checks:</strong> photos of your ID or passport and a live selfie. See Identity checks below.</p>
            </>
          ),
        },
        {
          id: 'use',
          title: 'How we use it',
          body: (
            <ul>
              <li>To run your group&apos;s records: contributions, the merry-go-round, welfare, penalties and withdrawals.</li>
              <li>To work out your trust score from your own payment history in the group.</li>
              <li>To send reminders and confirmations by SMS and in the app.</li>
              <li>To let your group&apos;s officials approve and manage members.</li>
              <li>To make your credit passport PDF when you ask for one.</li>
              <li>To find and fix problems with Akibora.</li>
              <li>To meet legal duties.</li>
            </ul>
          ),
        },
        {
          id: 'who-sees',
          title: 'Who can see it',
          body: (
            <>
              <p><strong>Your group&apos;s officials</strong> (chair, treasurer, secretary, admin) see your contribution history, trust score and contact details.</p>
              <p><strong>Other members of your group</strong> see your name, your role, whether you have paid, and what you write in the group chat.</p>
              <p><strong>The Akibora team</strong> looks at your data only to give support, review an identity check, or look into a problem you or your group reported.</p>
              <p><strong>Nobody else, unless you choose.</strong> We don&apos;t sell data. The services below process it for us, only to do their part:</p>
              <ul>
                <li>Supabase, which hosts our database and sign-in.</li>
                <li>Safaricom, to process M-Pesa payments.</li>
                <li>Africa&apos;s Talking, to send SMS messages.</li>
                <li>Amazon Web Services, to compare your selfie with your ID photo during an identity check.</li>
              </ul>
              <p>Your credit passport is a PDF you download yourself. You decide who gets it; Akibora doesn&apos;t send it to anyone.</p>
            </>
          ),
        },
        {
          id: 'security',
          title: 'How it is protected',
          body: (
            <p>
              Connections to Akibora are encrypted. The database uses row-level security, so each person can only read what
              their role in their own group allows. ID photos and selfies sit in private storage that only the
              verification system and the people reviewing it can open. More on our{' '}
              <Link href="/security">security page</Link>.
            </p>
          ),
        },
        {
          id: 'kyc',
          title: 'Identity checks',
          body: (
            <>
              <p>
                Before money can leave a group, through withdrawals or investments, the person who started it confirms who
                they are. With your consent we collect your ID or passport number, photos of the document, and a live selfie.
              </p>
              <ul>
                <li>An automated service (Amazon Web Services Rekognition) compares your selfie with the photo on your document for us. If the result is unclear, a person on the Akibora team looks at the images.</li>
                <li>The images are never shown to other members of your group.</li>
                <li>We use them only to confirm your identity and prevent fraud. We keep them while you run a group, and afterwards only as long as the law requires.</li>
                <li>You can ask us to delete them. Your group&apos;s withdrawals and investments then lock again.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'rights',
          title: 'What you can ask us to do',
          body: (
            <>
              <ul>
                <li>Give you a copy of the data we hold about you, in a format a computer can read.</li>
                <li>Correct details that are wrong.</li>
                <li>Delete your account and personal details.</li>
                <li>Stop using your data in a particular way.</li>
              </ul>
              <p>Write to {mail}. We aim to reply within 14 days. You can also start an account deletion from the <Link href="/account/delete">delete account page</Link>.</p>
            </>
          ),
        },
        {
          id: 'retention',
          title: 'How long we keep it',
          body: (
            <>
              <p>We keep your personal details while your account is open.</p>
              <p>
                Contributions and payouts are part of your group&apos;s shared book, and other members rely on them. If you
                delete your account we remove your personal details, but those records stay in the group&apos;s history
                without your contact details.
              </p>
            </>
          ),
        },
        {
          id: 'cookies',
          title: 'Cookies and storage',
          body: (
            <p>
              We use cookies and your browser&apos;s storage to keep you signed in and remember which group you last opened.
              We don&apos;t use advertising or analytics cookies. The full list is on the <Link href="/cookies">cookies page</Link>.
            </p>
          ),
        },
        {
          id: 'contact',
          title: 'Contact',
          body: <p>Privacy questions and requests: {mail}. Akibora, Nairobi, Kenya.</p>,
        },
      ]}
    />
  );
}

import { PublicPage } from '@/components/landing/PublicPage';
import { Panel } from '@/components/ui';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Security | Akibora',
  description: 'How Akibora protects your group’s records and your personal details.',
};

const POINTS: [string, string][] = [
  ['Your PIN stays on your phone', 'Akibora never sees or stores your M-Pesa PIN. When you pay, M-Pesa shows the prompt on your phone and you approve it there. We receive the confirmation after Safaricom completes the payment.'],
  ['Each person sees only their part', 'The database uses row-level security. Members read their own group’s records and nothing else. Officials manage only the groups they are officials of.'],
  ['Encrypted in transit and at rest', 'Every connection to Akibora is encrypted. Our database provider, Supabase, encrypts stored data on disk.'],
  ['Money leaves only with the group’s say', 'A withdrawal needs members to vote in favour before an official can release it. The person who started the group must also pass an identity check first.'],
  ['ID photos are kept private', 'Photos of IDs and selfies sit in private storage, away from other members. Only the verification system and the people reviewing a check can open them.'],
  ['A history no one can quietly edit', 'Confirmed contributions can’t be deleted, and every payment keeps its M-Pesa reference, so members can check the book against their own messages.'],
];

export default function SecurityPage() {
  return (
    <PublicPage
      title="How we protect your group"
      intro="Savings groups run on trust. These are the protections Akibora has today. We’re in early access, so we’ll keep adding to this list and keep it accurate."
    >
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 pb-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {POINTS.map(([title, body]) => (
          <Panel key={title}>
            <h2 className="font-display text-[24px] leading-tight">{title}</h2>
            <p className="text-[16px] text-ink-2 mt-3 leading-relaxed">{body}</p>
          </Panel>
        ))}
      </section>
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 pb-24">
        <Panel tone="forest" className="p-8 sm:p-12 grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
          <h2 className="font-display text-[34px] leading-tight">Found a security problem?</h2>
          <div className="text-[17px] leading-relaxed text-[#C9DACF] space-y-4">
            <p>
              Please email <a className="text-mint underline underline-offset-4" href={`mailto:${SITE.contactEmail}?subject=Security`}>{SITE.contactEmail}</a> with
              the subject &ldquo;Security&rdquo; and the steps to reproduce it.
            </p>
            <p>Give us a fair chance to fix it before telling anyone else. We will reply, keep you updated, and credit you if you want.</p>
            <p>Seen a transaction on your account that you didn&apos;t make? Tell an official in your group and email us straight away.</p>
          </div>
        </Panel>
      </section>
    </PublicPage>
  );
}

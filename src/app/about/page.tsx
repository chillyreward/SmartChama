import { PublicPage, Prose } from '@/components/landing/PublicPage';
import { ButtonLink } from '@/components/ui';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'About',
  description: 'Akibora is savings group software for Kenyan chamas. It started as a hackathon project and is now in early access.',
};

const PRINCIPLES = [
  { t: 'The group owns its record', b: 'Every member sees the same numbers. Officials run the group; they don\'t get a private version of the truth.' },
  { t: 'Money moves on M-Pesa', b: 'Members already pay with M-Pesa, so that\'s where contributions come from. Cash and bank deposits can still be logged by an official.' },
  { t: 'Nothing leaves without the group', b: 'Withdrawals need a vote. A member\'s credit passport is only shared when that member chooses to share it.' },
  { t: 'Plain words', b: 'We write the app in the language a chama already uses: contribution, round, welfare, penalty. No jargon to decode.' },
];

export default function AboutPage() {
  return (
    <PublicPage
      title="We're building the notebook every chama deserves."
      intro="Akibora keeps a savings group's contributions, merry-go-round, welfare fund and investments in one shared record, paid over M-Pesa and visible to every member."
    >
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 pb-24 grid lg:grid-cols-[1fr_1fr] gap-12">
        <Prose>
          <h2>Why we started</h2>
          <p>
            Chamas run on trust and a notebook. When the notebook is lost, or the person who kept it leaves, the group&apos;s history can go with it.
            Payment confirmations get buried in group chats, and the meeting turns into arithmetic.
          </p>
          <p>
            Members who have saved faithfully for years also have nothing to show a lender for it. That discipline is real, but it isn&apos;t written down anywhere a bank can read.
          </p>
          <h2>Where we are</h2>
          <p>
            Akibora began as a hackathon project, and the team won. We&apos;re now turning it into a product. <strong>We haven&apos;t launched publicly yet</strong>, and we&apos;re
            working with early groups to get the details right before we do.
          </p>
          <p>We&apos;d rather tell you that plainly than dress it up.</p>
        </Prose>

        <div className="flex flex-col gap-3 self-start">
          {PRINCIPLES.map((p) => (
            <div key={p.t} className="rounded-[22px] bg-surface border border-line p-6">
              <h3 className="font-display text-[23px]">{p.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{p.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-sage text-sage-ink">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-16 flex flex-wrap items-center justify-between gap-6">
          <p className="font-display text-[28px] sm:text-[34px] leading-tight max-w-[24ch]">Run a chama and want to try Akibora early? Talk to us.</p>
          <ButtonLink href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent('Early access for our chama')}`} variant="forest" size="lg">Email the team</ButtonLink>
        </div>
      </section>
    </PublicPage>
  );
}

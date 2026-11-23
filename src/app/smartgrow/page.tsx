import { PublicPage } from '@/components/landing/PublicPage';
import { ButtonLink, Panel } from '@/components/ui';

export const metadata = {
  title: 'SmartGrow | Akibora',
  description: 'See regulated places a group can put savings it doesn’t need yet, and keep the record where every member can see it.',
};

const KINDS: [string, string, string][] = [
  ['Money market funds', 'Regulated by the Capital Markets Authority', 'Low risk. Money is usually back in a few days when you need it.'],
  ['Treasury bills', 'Issued by the Central Bank of Kenya', 'Government debt for 91, 182 or 364 days. The rate is set at each auction.'],
  ['SACCO shares', 'SACCOs licensed by SASRA', 'Longer term. Shares usually earn a yearly dividend and can open up loans.'],
];

export default function SmartGrowPublicPage() {
  return (
    <PublicPage
      title="SmartGrow"
      intro="A list of regulated places a group can put money it doesn’t need yet, with each provider’s published return range. When the group invests, an official records it in Akibora so every member can see where the money went."
    >
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 pb-16 grid md:grid-cols-3 gap-4">
        {KINDS.map(([title, regulator, body]) => (
          <Panel key={title}>
            <h2 className="font-display text-[26px] leading-tight">{title}</h2>
            <p className="text-[14px] text-brand mt-2">{regulator}</p>
            <p className="text-[16px] text-ink-2 mt-3 leading-relaxed">{body}</p>
          </Panel>
        ))}
      </section>
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 pb-24 grid lg:grid-cols-2 gap-4">
        <Panel tone="sage" className="p-8">
          <h2 className="font-display text-[28px]">What Akibora doesn&apos;t do</h2>
          <ul className="mt-4 space-y-2 text-[16px] leading-relaxed list-disc pl-5">
            <li>Hold the group&apos;s money or move it for you. The group pays the provider from its own account.</li>
            <li>Give investment advice. Return ranges are what providers publish, not a promise.</li>
          </ul>
        </Panel>
        <Panel className="p-8 flex flex-col justify-between gap-6">
          <p className="text-[17px] text-ink-2 leading-relaxed">
            SmartGrow is inside the app for every group. Officials record investments; members see each one next to the group&apos;s savings.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/signup?role=admin">Start a group</ButtonLink>
            <ButtonLink href="/login" variant="outline">Sign in</ButtonLink>
          </div>
        </Panel>
      </section>
    </PublicPage>
  );
}

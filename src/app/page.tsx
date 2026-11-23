import dynamic from 'next/dynamic';
import { Receipt, History, IdCard, Vote } from 'lucide-react';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';
import { FeatureAccordion } from '@/components/landing/FeatureAccordion';
import { ButtonLink, Meter, Ticks, WovenRing, cn, type Seat } from '@/components/ui';
import { PLANS } from '@/lib/site';

const HamsterOnboarding = dynamic(() => import('@/components/HamsterOnboarding'));

// Illustrative group shown in the hero. Labelled as an example on the page.
const SEATS: Seat[] = ['WK', 'KC', 'JO', 'NK', 'BW', 'CC', 'MN', 'PK', 'EA', 'AO', 'DM', 'SN'].map((initials, i) => ({
  initials,
  state: i < 6 ? 'received' : i === 6 ? 'current' : 'upcoming',
}));

const STEPS = [
  { title: 'Create the group', body: 'Name it, set the contribution and how often it is due, and confirm your ID as the founding official.' },
  { title: 'Invite members', body: 'Share the group code or QR. Members join with a verified phone number, and officials approve each one.' },
  { title: 'Write your rules in', body: 'Grace period, late fine, merry-go-round order, welfare fund. The same constitution, kept by the app.' },
  { title: 'Collect on M-Pesa', body: 'Members get a payment prompt on the due date. Every shilling is recorded the moment it is confirmed.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-page text-ink overflow-x-clip">
      <HamsterOnboarding />
      <LandingNav />

      <main id="main">
        {/* ---------------- HERO ---------------- */}
        <section className="max-w-[1280px] mx-auto px-5 sm:px-8 pt-10 sm:pt-16 pb-24 lg:pb-32 grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-12 items-center">
          <div>
            <p className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full border border-line-strong text-[13px] text-ink-2">
              <span className="w-2 h-2 rounded-full bg-mint" aria-hidden="true" />
              Early access. Not launched publicly yet.
            </p>
            <h1 className="mt-6 font-display font-normal text-[46px] sm:text-[64px] lg:text-[76px] leading-[1.02] tracking-[-0.025em] max-w-[11ch]">
              Every shilling your chama saves, kept in the open.
            </h1>
            <p className="mt-7 text-[17px] sm:text-[19px] leading-[1.6] text-ink-2 max-w-[50ch]">
              Akibora collects contributions over M-Pesa, runs your merry-go-round and welfare fund, and shows
              every member where the pot stands. On a smartphone, on the web, or through a USSD menu on a basic phone.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/signup?role=admin" size="lg">Start a group</ButtonLink>
              <ButtonLink href="/signup?role=member" size="lg" variant="outline">Join with a group code</ButtonLink>
            </div>
            <p className="mt-5 text-[14px] text-ink-3">Free for groups of up to 10 members.</p>
          </div>

          <figure className="relative justify-self-center lg:justify-self-end">
            <div className="relative w-[340px] h-[340px] sm:w-[450px] sm:h-[450px] lg:w-[500px] lg:h-[500px]">
            <div className="absolute left-0 top-0 w-[500px] h-[500px] origin-top-left scale-[0.68] sm:scale-90 lg:scale-100">
              <WovenRing
                size={500}
                seats={SEATS}
                seatSize={46}
                label="Example: a merry-go-round of 12 members in round 7. Muthoni receives KSh 84,000 on Saturday 28 November, and 11 of 12 members have paid."
              >
                <span className="text-[14px] text-[#8FAA9B]">Round 7 of 12</span>
                <span className="font-money text-[48px] leading-[1.05] mt-1.5">KSh 84,000</span>
                <span className="text-[15px] leading-snug text-[#C9DACF] mt-2 max-w-[22ch]">goes to Muthoni on Saturday 28 November</span>
                <Ticks total={12} done={11} className="w-[150px] mt-5" />
                <span className="text-[13px] text-[#8FAA9B] mt-2">11 of 12 have paid</span>
              </WovenRing>

              <div className="absolute -left-4 sm:-left-12 bottom-6 w-[250px] rounded-2xl bg-sage text-sage-ink p-4 shadow-[0_18px_40px_rgba(0,0,0,.3)]" aria-hidden="true">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-semibold">Payment received</span>
                  <span className="text-[12px] text-[#44604F]">just now</span>
                </div>
                <div className="font-money text-[24px] mt-1">KSh 7,000</div>
                <div className="text-[13px] text-[#2B4637]">from Njeri Kariuki</div>
                <div className="font-mono text-[12px] text-[#44604F] mt-1.5">M-Pesa TKR4H7XQ2P</div>
              </div>
            </div>
            </div>
            <figcaption className="mt-6 text-center text-[13px] text-ink-3">An example group. Names and amounts are illustrative.</figcaption>
          </figure>
        </section>

        {/* ---------------- WHAT IT DOES ---------------- */}
        <section id="features" className="pb-24 sm:pb-32 scroll-mt-24">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
            <div className="py-6 lg:py-14 lg:pr-6 flex flex-col justify-center">
              <h2 className="font-display font-normal text-[38px] sm:text-[52px] leading-[1.08] tracking-[-0.02em] max-w-[13ch]">
                Built around how chamas already work.
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed text-ink-2 max-w-[42ch]">
                Your rules, your officials, your rotation. Akibora keeps the record so the meeting can be about the group, not the arithmetic.
              </p>
            </div>
            <div className="bg-forest dark:bg-canopy rounded-[28px] p-4 sm:p-8 lg:p-10">
              <FeatureAccordion />
            </div>
          </div>
        </section>

        {/* ---------------- WHERE THE MONEY GOES ---------------- */}
        <section id="how-it-works" className="bg-sage text-sage-ink py-24 sm:py-28 scroll-mt-16">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
            <h2 className="font-display font-normal text-[38px] sm:text-[48px] leading-[1.1] tracking-[-0.02em]">Where the money goes</h2>
            <p className="mt-4 text-[17px] leading-relaxed text-[#2B4637] max-w-[56ch]">
              Members pay in, officials approve what goes out, and every movement leaves a record the whole group can see.
            </p>

            <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_auto_1fr] items-center">
              <div className="flex flex-col gap-6">
                <FlowCard title="Members" body="Pay their share each cycle" edge="Pays in on M-Pesa" side="left" />
                <FlowCard title="Welfare fund" body="Set aside for hard days" edge="Emergency claims" side="left" out />
              </div>
              <div className="justify-self-center flex flex-col items-center">
                <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px]">
                  <div className="ak-weave absolute inset-0" style={{ ['--ring-a' as string]: '#2F5A45', ['--ring-b' as string]: '#A9C3B0', ['--ring-inner' as string]: '82%' }} />
                  <div className="absolute inset-[30px] rounded-full bg-forest text-[#EEF4EF] flex flex-col items-center justify-center text-center p-6">
                    <span className="font-display text-[30px]">The pot</span>
                    <span className="text-[15px] text-[#A9C2B3] mt-1 max-w-[18ch]">One shared balance every member can see</span>
                  </div>
                </div>
                <div className="w-px h-10 bg-moss" aria-hidden="true" />
                <div className="rounded-[16px] bg-mint text-forest px-6 py-4 text-center">
                  <div className="font-display text-[20px]">Merry-go-round payout</div>
                  <div className="text-[14px]">to this round&apos;s member</div>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <FlowCard title="Officials" body="Chair, treasurer and secretary" edge="Approve payouts" side="right" />
                <FlowCard title="SmartGrow" body="Money market, T-bills, SACCO shares" edge="Investments officials make" side="right" out />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- GETTING STARTED ---------------- */}
        <section className="max-w-[1280px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
          <h2 className="font-display font-normal text-[38px] sm:text-[48px] leading-[1.1] tracking-[-0.02em] max-w-[18ch]">From notebook to Akibora in an afternoon</h2>
          <ol className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {STEPS.map((s, i) => (
              <li key={s.title} className="border-t border-line-strong pt-5">
                <span className="font-display text-[44px] leading-none text-brand">{i + 1}</span>
                <h3 className="mt-4 text-[18px] font-semibold">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------------- CREDIT PASSPORT ---------------- */}
        <section id="passport" className="bg-surface-2 border-y border-line py-24 sm:py-28 scroll-mt-16">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display font-normal text-[38px] sm:text-[52px] leading-[1.08] tracking-[-0.02em] max-w-[14ch]">
                Years of saving on time should count for something.
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed text-ink-2 max-w-[46ch]">
                Each on-time contribution builds your trust score inside the group. When you need it, Akibora turns that
                history into a credit passport you can download and show a lender. Nobody outside your group sees it unless you share it.
              </p>
            </div>
            <figure>
              <div className="bg-forest text-[#EEF4EF] rounded-[28px] p-7 sm:p-9 shadow-[0_30px_60px_rgba(14,31,24,.25)]">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="text-[14px] text-[#8FAA9B]">Credit passport</div>
                    <div className="font-display text-[28px] sm:text-[30px] mt-1">Achieng Otieno</div>
                    <div className="text-[14px] text-[#A9C2B3] mt-0.5">Member of Tujenge Women Group since March 2023</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-money text-[60px] leading-none text-mint">86</div>
                    <div className="text-[13px] text-[#8FAA9B]">of 100</div>
                  </div>
                </div>
                <Meter value={86} segments={40} height={34} className="mt-7" label="Trust score 86 of 100" offClass="bg-[#22402F]" />
                <dl className="grid grid-cols-3 gap-4 mt-7 pt-6 border-t border-[#234235]">
                  {[['41 of 43', 'contributions on time'], ['KSh 301k', 'saved in total'], ['19 months', 'longest streak']].map(([v, l]) => (
                    <div key={l}>
                      <dd className="font-money text-[22px] sm:text-[26px]">{v}</dd>
                      <dt className="text-[13px] text-[#8FAA9B] mt-0.5">{l}</dt>
                    </div>
                  ))}
                </dl>
              </div>
              <figcaption className="mt-4 text-[13px] text-ink-3">An example passport.</figcaption>
            </figure>
          </div>
        </section>

        {/* ---------------- SECURITY ---------------- */}
        <section className="max-w-[1280px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
          <h2 className="mx-auto text-center font-display font-normal text-[36px] sm:text-[48px] leading-[1.1] tracking-[-0.02em] max-w-[18ch]">
            Nobody has to take the treasurer&apos;s word for it.
          </h2>
          <div className="mt-14 grid md:grid-cols-2 gap-4">
            {[
              { Icon: Receipt, t: 'A receipt for every shilling', b: 'M-Pesa confirms each payment before it reaches the record. Cash and bank deposits are logged by an official, with their name on the entry.' },
              { Icon: History, t: 'A history nobody can quietly edit', b: 'Changes to members, rules and money are written to an audit log, and contribution records can be checked against an on-chain copy.' },
              { Icon: IdCard, t: 'Officials are who they say', b: 'Whoever creates a group confirms their ID first, and every member joins with a verified phone number.' },
              { Icon: Vote, t: 'Withdrawals need the group', b: 'Taking money out of the pot needs a vote of the members, not a single signature.' },
            ].map(({ Icon, t, b }) => (
              <div key={t} className="rounded-[24px] border border-line p-7 sm:p-8">
                <Icon size={26} strokeWidth={1.6} className="text-brand" aria-hidden="true" />
                <h3 className="mt-5 font-display text-[25px]">{t}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-ink-2 max-w-[52ch]">{b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- PRICING ---------------- */}
        <section id="pricing" className="bg-surface-2 border-t border-line py-24 sm:py-28 scroll-mt-16">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
            <h2 className="font-display font-normal text-[38px] sm:text-[52px] leading-[1.08] tracking-[-0.02em]">Priced per group, not per member.</h2>
            <p className="mt-4 text-[17px] text-ink-2 max-w-[60ch]">
              We haven&apos;t launched yet, so these are the plans we intend to offer. Start free and move up when the group outgrows the notebook.
            </p>
            <div className="mt-12 grid md:grid-cols-3 gap-4 items-stretch">
              {PLANS.map((p) => {
                const featured = 'featured' in p && p.featured;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'rounded-[24px] p-7 sm:p-8 flex flex-col',
                      featured ? 'bg-forest text-[#EEF4EF]' : 'bg-surface border border-line',
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[16px] font-semibold">{p.name}</span>
                      {featured && <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-mint text-forest">For most groups</span>}
                    </div>
                    <div className="mt-3">
                      <span className="font-money text-[46px]">{p.price}</span>
                      {p.per && <span className={cn('text-[15px]', featured ? 'text-[#A9C2B3]' : 'text-ink-3')}> {p.per}</span>}
                    </div>
                    <p className={cn('mt-2 text-[15px]', featured ? 'text-[#A9C2B3]' : 'text-ink-2')}>{p.blurb}</p>
                    <ul className="mt-6 flex flex-col gap-2.5 text-[15px] flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2.5">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cn('mt-[3px] shrink-0', featured ? 'text-mint' : 'text-brand')} aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <ButtonLink href="/signup?role=admin" variant={featured ? 'mint' : 'outline'} className="mt-7 w-full">
                      {p.id === 'basic' ? 'Start free' : `Choose ${p.name}`}
                    </ButtonLink>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function FlowCard({ title, body, edge, side, out }: { title: string; body: string; edge: string; side: 'left' | 'right'; out?: boolean }) {
  const pointsRight = side === 'left' ? !out : !!out;
  return (
    <div className={cn('flex items-center gap-3', side === 'right' && 'lg:flex-row-reverse')}>
      <div className="flex-1 rounded-[14px] bg-[#EEF3EE] border border-moss shadow-[5px_5px_0_#A9C3B0] px-5 py-4">
        <div className="font-display text-[22px]">{title}</div>
        <div className="text-[15px] text-[#2B4637]">{body}</div>
      </div>
      <div className="hidden lg:flex flex-col items-center w-[150px] shrink-0">
        <span className="text-[13px] text-[#2B4637] text-center leading-tight mb-1.5">{edge}</span>
        <svg width="150" height="10" viewBox="0 0 150 10" aria-hidden="true" className={cn(!pointsRight && 'rotate-180')}>
          <path d="M2 5 H140" stroke="#2F5A45" strokeWidth="2" strokeLinecap="round" />
          <path d="M140 1 L148 5 L140 9 Z" fill="#2F5A45" />
        </svg>
      </div>
      <span className="lg:hidden text-[13px] text-[#2B4637] w-[110px] shrink-0">{edge}</span>
    </div>
  );
}

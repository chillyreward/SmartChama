import Link from 'next/link';
import { Logo, ButtonLink } from '@/components/ui';
import { SITE } from '@/lib/site';

const COLS = [
  {
    title: 'Product',
    links: [
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/smartgrow', label: 'SmartGrow' },
      { href: '/#pricing', label: 'Pricing' },
      { href: '/security', label: 'Security' },
    ],
  },
  {
    title: 'Akibora',
    links: [
      { href: '/about', label: 'About' },
      { href: '/blog', label: 'Notes' },
      { href: '/careers', label: 'Working with us' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/cookies', label: 'Cookies' },
      { href: '/account/delete', label: 'Delete your account' },
    ],
  },
];

export default function LandingFooter({ showCta = true }: { showCta?: boolean }) {
  return (
    <footer className="bg-forest text-[#EEF4EF]">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 pt-20 sm:pt-24 pb-10">
        {showCta && (
          <div className="flex flex-wrap items-end justify-between gap-8 pb-16 sm:pb-20 border-b border-[#234235]">
            <h2 className="font-display font-normal text-[40px] sm:text-[56px] leading-[1.04] tracking-[-0.025em] max-w-[14ch]">
              Bring your group&apos;s notebook. We&apos;ll take it from here.
            </h2>
            <ButtonLink href="/signup?role=admin" variant="mint" size="lg">Start a group</ButtonLink>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 pt-12 text-[14px] text-[#A9C2B3]">
          <div className="col-span-2 md:col-span-1">
            <Logo href="/" className="text-[#EEF4EF]" />
            <p className="mt-4 max-w-[34ch] leading-relaxed">
              Savings group software for Kenya. Akibora is in early access and hasn&apos;t launched publicly yet.
            </p>
            <a href={`mailto:${SITE.contactEmail}`} className="inline-block mt-4 text-mint hover:underline">{SITE.contactEmail}</a>
          </div>
          {COLS.map((c) => (
            <nav key={c.title} aria-label={c.title} className="flex flex-col gap-3">
              <span className="text-[#EEF4EF] font-semibold">{c.title}</span>
              {c.links.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-[#EEF4EF] w-fit">{l.label}</Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-[#234235] flex flex-wrap justify-between gap-3 text-[13px] text-[#8FAA9B]">
          <span>© {new Date().getFullYear()} Akibora</span>
          <span><i className="font-display text-[15px]">akiba</i>, savings. <i className="font-display text-[15px]">bora</i>, the best of it.</span>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';
import { ArrowUp, Mail } from 'lucide-react';
import { ButtonLink, LogoMark } from '@/components/ui';
import { SITE } from '@/lib/site';

const COLS = [
  {
    title: 'Product',
    links: [
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/#passport', label: 'Credit passport' },
      { href: '/smartgrow', label: 'SmartGrow' },
      { href: '/#pricing', label: 'Pricing' },
      { href: '/security', label: 'Security' },
    ],
  },
  {
    title: 'Company',
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
    <footer className="relative bg-forest text-[#EEF4EF] overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-8">
        {showCta && (
          <div className="rounded-[28px] bg-canopy p-6 sm:p-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 sm:mb-20">
            <div>
              <h2 className="font-display font-normal text-[32px] sm:text-[48px] leading-[1.05] tracking-[-0.025em] max-w-[16ch]">
                Bring your group&apos;s notebook. We&apos;ll take it from here.
              </h2>
              <p className="text-[15px] text-[#A9C2B3] mt-3 max-w-[46ch]">
                Set up takes about ten minutes. Members join with the group code from any phone.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <ButtonLink href="/signup?role=admin" variant="mint" size="lg">Start a group</ButtonLink>
              <ButtonLink href="/login" variant="outline" size="lg" className="!border-[#3C6B55] !text-[#EEF4EF] hover:!bg-[#1A3428]">Log in</ButtonLink>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-x-6 gap-y-10 text-[15px]">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3 rounded-md" aria-label="Akibora home">
              <LogoMark size={40} />
              <span className="font-display text-[28px] tracking-[-0.02em]">akibora</span>
            </Link>
            <p className="mt-4 max-w-[36ch] leading-relaxed text-[#A9C2B3]">
              Savings group software for Kenya. Contributions, merry-go-round and welfare in one record every member can see.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1A3428] px-3 py-1.5 text-[13px] text-[#CFE0D4]">
              <span className="w-2 h-2 rounded-full bg-amber" aria-hidden="true" />
              Early access, not yet publicly launched
            </p>
            <a href={`mailto:${SITE.contactEmail}`} className="mt-5 flex items-center gap-2 text-mint hover:underline underline-offset-4 w-fit">
              <Mail size={16} aria-hidden="true" />{SITE.contactEmail}
            </a>
          </div>

          {COLS.map((c) => (
            <nav key={c.title} aria-label={c.title} className="flex flex-col">
              <span className="text-[13px] text-[#8FAA9B] mb-3">{c.title}</span>
              {c.links.map((l) => (
                <Link key={l.href} href={l.href} className="py-1.5 text-[#DCE8DF] hover:text-mint w-fit">{l.label}</Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-[#234235] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 text-[13px] text-[#8FAA9B]">
          <span>© {new Date().getFullYear()} Akibora</span>
          <span className="sm:text-center">
            <i className="font-display text-[15px] text-[#CFE0D4]">akiba</i>, savings. <i className="font-display text-[15px] text-[#CFE0D4]">bora</i>, the best of it.
          </span>
          <a href="#main" className="inline-flex items-center gap-1.5 hover:text-mint w-fit">
            <ArrowUp size={14} aria-hidden="true" />Back to top
          </a>
        </div>
      </div>

      <div aria-hidden="true" className="pointer-events-none select-none font-display leading-[0.78] tracking-[-0.05em] text-[#132A20] text-[30vw] lg:text-[22vw] text-center -mb-[3vw] whitespace-nowrap">
        akibora
      </div>
    </footer>
  );
}

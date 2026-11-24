'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/components/AuthProvider';
import { Logo, ButtonLink, cn } from '@/components/ui';

const LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#passport', label: 'Credit passport' },
  { href: '/security', label: 'Security' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

const OFFICIAL_ROLES = ['admin', 'chairlady', 'treasurer', 'secretary'];

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { session, member } = useAuth();
  const dashboardPath = member?.role && OFFICIAL_ROLES.includes(member.role) ? '/admin/dashboard' : '/dashboard';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 text-ink transition-colors',
        scrolled || open ? 'ak-glass border-b' : 'bg-transparent border-b border-transparent',
      )}
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Main" className="hidden lg:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'h-10 px-3.5 inline-flex items-center rounded-full text-[15px] text-ink-2 hover:text-ink hover:bg-raised transition-colors',
                pathname === l.href && 'text-ink bg-raised',
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {session ? (
            <ButtonLink href={dashboardPath} variant="primary" className="hidden sm:inline-flex">Open your group</ButtonLink>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex h-11 px-4 items-center rounded-full text-[15px] font-medium hover:bg-raised">Log in</Link>
              <ButtonLink href="/signup?role=admin" variant="primary" className="hidden sm:inline-flex">Start a group</ButtonLink>
            </>
          )}
          <button
            type="button"
            className="lg:hidden w-11 h-11 inline-flex items-center justify-center rounded-full hover:bg-raised"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="lg:hidden border-t border-line px-5 pb-6 pt-2 max-h-[calc(100dvh-72px)] overflow-y-auto">
          <nav aria-label="Mobile" className="flex flex-col">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3.5 font-display text-[24px] border-b border-line">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 mt-5">
            {session ? (
              <ButtonLink href={dashboardPath} size="lg">Open your group</ButtonLink>
            ) : (
              <>
                <ButtonLink href="/signup?role=admin" size="lg">Start a group</ButtonLink>
                <ButtonLink href="/login" variant="outline" size="lg">Log in</ButtonLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

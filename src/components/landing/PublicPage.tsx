import type { ReactNode } from 'react';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

export function PublicPage({ title, intro, children, cta = true }: { title: ReactNode; intro?: ReactNode; children: ReactNode; cta?: boolean }) {
  return (
    <div className="min-h-screen bg-page text-ink">
      <LandingNav />
      <main id="main">
        <header className="max-w-[1280px] mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-14 sm:pb-20">
          <h1 className="font-display font-normal text-[44px] sm:text-[64px] leading-[1.03] tracking-[-0.025em] max-w-[16ch]">{title}</h1>
          {intro && <p className="mt-6 text-[17px] sm:text-[19px] leading-relaxed text-ink-2 max-w-[58ch]">{intro}</p>}
        </header>
        {children}
      </main>
      <LandingFooter showCta={cta} />
    </div>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-5 text-[17px] leading-[1.7] text-ink-2 max-w-[64ch] [&_strong]:text-ink [&_h2]:font-display [&_h2]:text-ink [&_h2]:text-[30px] [&_h2]:leading-tight [&_h2]:mt-6">{children}</div>;
}

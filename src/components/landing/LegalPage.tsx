import type { ReactNode } from 'react';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';

export type LegalSection = { id: string; title: string; body: ReactNode };

/**
 * Policies and terms. Contents list on the left on wide screens, sections read
 * as plain prose. Section titles are not numbered so links stay stable when a
 * section is added.
 */
export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: ReactNode; sections: LegalSection[] }) {
  return (
    <div className="min-h-screen bg-page text-ink">
      <LandingNav />
      <main id="main" className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-24">
        <header className="max-w-[64ch]">
          <h1 className="font-display text-[44px] sm:text-[60px] leading-[1.03] tracking-[-0.025em]">{title}</h1>
          <p className="text-[14px] text-ink-3 mt-4">Last updated {updated}</p>
          <div className="mt-6 text-[18px] leading-relaxed text-ink-2">{intro}</div>
        </header>

        <div className="mt-14 grid lg:grid-cols-[240px_1fr] gap-12">
          <nav aria-label="On this page" className="hidden lg:block">
            <ul className="sticky top-24 space-y-1 border-l border-line">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="block -ml-px border-l border-transparent pl-4 py-1.5 text-[14px] text-ink-2 hover:text-ink hover:border-ink">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-14 max-w-[68ch]">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="font-display text-[28px] sm:text-[32px] leading-tight tracking-[-0.015em]">{s.title}</h2>
                <div className="mt-4 flex flex-col gap-4 text-[17px] leading-[1.7] text-ink-2 [&_strong]:text-ink [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <LandingFooter showCta={false} />
    </div>
  );
}

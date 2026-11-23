import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo, Ticks, cn } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';

/**
 * Frame for sign-in, sign-up, password reset and the officials sign-in.
 * Form on the left; on wide screens a forest panel on the right shows an
 * example page of a group's book (labelled as an example).
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  aside = 'ledger',
  wide,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  aside?: 'ledger' | 'officials' | 'none';
  wide?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-page text-ink flex">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-5 sm:px-10 h-[72px]">
          <Logo size="sm" />
          <ThemeToggle />
        </header>

        <main className="flex-1 flex items-start sm:items-center justify-center px-5 sm:px-10 pb-10 pt-4">
          <div className={cn('w-full', wide ? 'max-w-[520px]' : 'max-w-[420px]')}>
            <h1 className="font-display text-[34px] sm:text-[42px] leading-[1.05] tracking-[-0.02em]">{title}</h1>
            {subtitle && <p className="text-[16px] text-ink-2 mt-3 leading-relaxed">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-[15px] text-ink-2">{footer}</div>}
          </div>
        </main>

        <footer className="px-5 sm:px-10 py-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-3">
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <Link href="/contact" className="hover:text-ink">Get help</Link>
        </footer>
      </div>

      {aside !== 'none' && (
        <aside className="hidden lg:flex w-[46%] max-w-[680px] p-4">
          <div className="relative flex-1 rounded-[32px] bg-forest dark:bg-canopy dark:border dark:border-line text-[#EEF4EF] overflow-hidden flex flex-col justify-between p-12">
            <div className="ak-weave absolute -right-40 -top-40 w-[520px] h-[520px] opacity-40" style={{ ['--ring-inner' as string]: '82%' }} aria-hidden="true" />
            {aside === 'officials' ? <OfficialsAside /> : <LedgerAside />}
          </div>
        </aside>
      )}
    </div>
  );
}

const ROWS: [string, string, 'paid' | 'late' | 'due'][] = [
  ['Wanjiru Kimani', '2 Nov', 'paid'],
  ['Kiprop Chesire', '3 Nov', 'paid'],
  ['Njeri Kariuki', '6 Nov', 'late'],
  ['Brian Wafula', '1 Nov', 'paid'],
  ['Joy Otieno', 'Due 1 Dec', 'due'],
];

function LedgerAside() {
  return (
    <>
      <p className="relative font-display text-[40px] leading-[1.1] tracking-[-0.02em] max-w-[16ch]">
        The group&apos;s book, open to every member.
      </p>
      <div className="relative">
        <p className="text-[13px] text-[#8FAA9B] mb-3">An example group</p>
        <div className="rounded-[24px] bg-[#12271D] dark:bg-forest border border-[#2A4A3A] p-6">
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-semibold">November contributions</span>
            <span className="text-[13px] text-[#8FAA9B]">4 of 5 paid</span>
          </div>
          <Ticks total={5} done={4} className="mt-3" />
          <ul className="mt-5 divide-y divide-[#24402F]">
            {ROWS.map(([name, when, state]) => (
              <li key={name} className="flex items-center justify-between py-3 text-[15px]">
                <span>{name}</span>
                <span className="flex items-center gap-3">
                  <span className="text-[13px] text-[#8FAA9B]">{when}</span>
                  <span
                    className={cn(
                      'font-money text-[17px] w-[92px] text-right',
                      state === 'due' ? 'text-[#5F7F6D]' : 'text-[#EEF4EF]',
                    )}
                  >
                    KSh 7,000
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[14px] text-[#C9DACF] mt-5 max-w-[44ch] leading-relaxed">
          Every payment shows who paid, when, and the M-Pesa reference. Nobody has to ask the treasurer for the numbers.
        </p>
      </div>
    </>
  );
}

function OfficialsAside() {
  return (
    <>
      <p className="relative font-display text-[40px] leading-[1.1] tracking-[-0.02em] max-w-[16ch]">
        For chairs, treasurers and secretaries.
      </p>
      <ul className="relative space-y-4 text-[16px] text-[#C9DACF] max-w-[40ch]">
        <li>Approve people who ask to join.</li>
        <li>Record cash payments with a receipt everyone can see.</li>
        <li>Run the merry-go-round and release payouts.</li>
        <li>Decide welfare claims and withdrawals.</li>
      </ul>
    </>
  );
}

/** Small password field with show/hide, shared by the auth pages. */
export { PasswordInput } from './PasswordInput';

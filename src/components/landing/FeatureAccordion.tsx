'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/components/ui';

const ITEMS = [
  {
    title: 'Contributions over M-Pesa',
    body: 'On the day a contribution is due, each member gets an M-Pesa prompt on their phone. The payment lands in the group record the moment Safaricom confirms it, so nobody has to forward screenshots to the treasurer.',
  },
  {
    title: 'Merry-go-round',
    body: 'Set the order once. Akibora tracks who has paid into each round, who receives next, and reminds officials when a payout is due.',
  },
  {
    title: 'Welfare fund',
    body: 'Keep a separate pot for funerals, hospital bills and emergencies. A member files a claim, officials approve it, and everyone can see where the money went.',
  },
  {
    title: 'Penalties and grace periods',
    body: 'Late payments pick up the fine your group agreed on, after the grace period you choose. The member sees why, and pays it like any contribution.',
  },
  {
    title: 'SmartGrow investments',
    body: 'Officials can put money the group isn\'t using into a money market fund, Treasury bills or SACCO shares, and every member sees where it went and what it earns.',
  },
  {
    title: 'Chat and announcements',
    body: 'The group conversation sits next to the record, so a question about a payment can point straight at the payment.',
  },
];

export function FeatureAccordion() {
  const [open, setOpen] = useState(0);
  return (
    <div className="flex flex-col gap-2.5">
      {ITEMS.map((it, i) => {
        const isOpen = open === i;
        return (
          <div
            key={it.title}
            className={cn(
              'rounded-[18px] text-sage-ink transition-colors',
              isOpen ? 'bg-sage' : i % 2 ? 'bg-[#DCE6EF]' : 'bg-[#CFE0D3]',
            )}
          >
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`feat-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full min-h-[60px] flex items-center gap-4 px-5 py-3.5 text-left rounded-[18px] focus-visible:outline-2 focus-visible:outline-mint"
              >
                <span
                  aria-hidden="true"
                  className={cn('w-3.5 h-3.5 rounded-full border-2 border-moss shrink-0', isOpen && 'bg-moss')}
                />
                <span className="flex-1 font-display text-[21px] tracking-[-0.01em]">{it.title}</span>
                <ChevronDown size={18} aria-hidden="true" className={cn('shrink-0 transition-transform', isOpen && 'rotate-180')} />
              </button>
            </h3>
            <div id={`feat-${i}`} hidden={!isOpen}>
              <p className="pl-[54px] pr-5 pb-5 text-[15px] leading-relaxed text-[#2B4637] max-w-[62ch]">{it.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

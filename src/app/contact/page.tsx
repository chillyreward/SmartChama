'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PublicPage } from '@/components/landing/PublicPage';
import { buttonClass, cn } from '@/components/ui';
import { SITE, PLANS } from '@/lib/site';

const FAQS = [
  {
    q: 'How do I start a group?',
    a: 'Choose "Start a group", sign up with your phone number, and confirm your ID as the founding official. Then name the group and set the contribution amount and schedule. You get a group code to share with members.',
  },
  {
    q: 'How do members join?',
    a: 'Members sign up with a verified phone number and enter the group code, or scan the group QR. An official approves each request before the member can see the group.',
  },
  {
    q: 'How do payments work?',
    a: 'When a member pays, they get an M-Pesa prompt on their phone and enter their PIN. The contribution is recorded once M-Pesa confirms it. Officials can also log cash or bank payments, and their name is kept on the entry.',
  },
  {
    q: 'What is the trust score?',
    a: 'A number from 0 to 100 that reflects how reliably you contribute: paying on time, your streak, and how long you have been in the group. You can download it as a credit passport and choose who to share it with.',
  },
  {
    q: 'Does it work on a basic phone?',
    a: 'There is a USSD menu for checking balances and dates on any phone. Paying, the merry-go-round and the full record are on the web app and the Android app.',
  },
  {
    q: 'What will it cost?',
    a: `We haven't launched yet. The plans we intend to offer are ${PLANS.map((p) => `${p.name} (${p.price}${p.per ? ' ' + p.per : ''})`).join(', ')}.`,
  },
];

const TOPICS = ['A question about Akibora', 'Help with my account', 'Trying Akibora with our chama', 'Something else'];

export default function ContactPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState('');

  const mailto = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(topic + (name ? ` (from ${name})` : ''))}&body=${encodeURIComponent(message)}`;

  return (
    <PublicPage title="Talk to the team." intro={<>Write to us at <a href={`mailto:${SITE.contactEmail}`} className="text-brand underline underline-offset-4">{SITE.contactEmail}</a>. We&apos;re a small team, so a reply may take a day or two.</>} cta={false}>
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 pb-24 grid lg:grid-cols-[1fr_1.1fr] gap-10">
        <form
          className="rounded-[24px] bg-surface border border-line p-6 sm:p-8 flex flex-col gap-5 self-start"
          onSubmit={(e) => { e.preventDefault(); window.location.href = mailto; }}
        >
          <h2 className="font-display text-[28px]">Write a message</h2>
          <p className="text-[14px] text-ink-3 -mt-3">This opens your email app with the message ready to send.</p>
          <label className="flex flex-col gap-2 text-[14px] font-medium">
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="h-12 px-4 rounded-[14px] bg-surface-2 border border-line text-[16px] font-normal focus:outline-none focus:border-line-strong" />
          </label>
          <label className="flex flex-col gap-2 text-[14px] font-medium">
            What it&apos;s about
            <select value={topic} onChange={(e) => setTopic(e.target.value)} className="h-12 px-4 rounded-[14px] bg-surface-2 border border-line text-[16px] font-normal focus:outline-none focus:border-line-strong">
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-[14px] font-medium">
            Message
            <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="px-4 py-3 rounded-[14px] bg-surface-2 border border-line text-[16px] font-normal focus:outline-none focus:border-line-strong" />
          </label>
          <button type="submit" className={buttonClass('primary', 'lg', 'self-start')}>Open in my email app</button>
        </form>

        <div>
          <h2 className="font-display text-[30px] mb-4">Common questions</h2>
          <div className="flex flex-col gap-2">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className={cn('rounded-[18px] border', isOpen ? 'bg-sage text-sage-ink border-sage' : 'border-line')}>
                  <h3>
                    <button type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => setOpen(isOpen ? null : i)} className="w-full min-h-[58px] px-5 py-3 flex items-center gap-4 text-left">
                      <span className="flex-1 text-[16px] font-medium">{f.q}</span>
                      <ChevronDown size={18} aria-hidden="true" className={cn('shrink-0 transition-transform', isOpen && 'rotate-180')} />
                    </button>
                  </h3>
                  <div id={`faq-${i}`} hidden={!isOpen}>
                    <p className="px-5 pb-5 text-[15px] leading-relaxed text-[#2B4637] max-w-[60ch]">{f.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </PublicPage>
  );
}

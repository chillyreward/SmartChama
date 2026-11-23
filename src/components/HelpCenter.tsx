'use client';

import { useState } from 'react';
import { ChevronDown, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { SITE } from '@/lib/site';
import { Field, PageHeader, Panel, PanelTitle, buttonClass, cn, inputClass, textareaClass } from '@/components/ui';

const MEMBER_FAQ = [
  { q: 'How is my trust score worked out?', a: 'Out of 100: up to 55 points for paying every month (M-Pesa payments count fully, cash counts half), up to 25 for time in the group (full marks at two years) and up to 20 for an unbroken streak (full marks at twelve months).' },
  { q: 'My M-Pesa payment went through but shows as waiting.', a: 'It turns to confirmed as soon as Safaricom sends its confirmation, usually within a minute. If it still shows waiting after an hour, message your treasurer with the M-Pesa code from your SMS.' },
  { q: 'Can I be in more than one group?', a: 'Yes. Use the group name at the top of the menu to switch between groups, or to join another one with its group code.' },
  { q: 'Who can take money out of the pot?', a: 'Nobody on their own. A withdrawal request opens a vote, and the money is only released when most members agree.' },
  { q: 'Where is the money actually kept?', a: 'In your group\'s own M-Pesa till, paybill or bank account, held by your officials. Akibora keeps the shared record; it does not hold the money.' },
];

const OFFICIAL_FAQ = [
  { q: 'How do I record a cash or bank payment?', a: 'Open Contributions and choose "Record cash payment". Your name is saved on the entry, and cash counts half towards the member\'s trust score.' },
  { q: 'How do I approve someone who joined with the code?', a: 'Open Members. People waiting for approval are listed at the top; approve or decline each one.' },
  { q: 'How do I change the contribution amount or dates?', a: 'Open Group settings and change the amount or schedule. The next due date is worked out from the new schedule.' },
  { q: 'How do I start a merry-go-round?', a: 'Open Merry-go-round, set the amount per member and the order, then start the cycle. Members see their turn straight away.' },
];

export function HelpCenter({ variant = 'member' }: { variant?: 'member' | 'admin' }) {
  const { member, group } = useAuth();
  const [open, setOpen] = useState<number | null>(0);
  const [topic, setTopic] = useState('A question about using Akibora');
  const [message, setMessage] = useState('');
  const faqs = variant === 'admin' ? [...OFFICIAL_FAQ, ...MEMBER_FAQ] : MEMBER_FAQ;

  const body = `${message}\n\n—\nFrom: ${member?.full_name || ''}\nGroup: ${group?.name || ''}`;
  const mailto = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(topic)}&body=${encodeURIComponent(body)}`;

  return (
    <div>
      <PageHeader title="Help" subtitle="Answers to common questions, and a way to reach the Akibora team." />
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 items-start">
        <Panel aria-labelledby="faq-h">
          <PanelTitle id="faq-h">Common questions</PanelTitle>
          <div className="mt-4 flex flex-col gap-2">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className={cn('rounded-[16px] border', isOpen ? 'border-line-strong/50 bg-surface-2' : 'border-line')}>
                  <h3>
                    <button type="button" aria-expanded={isOpen} aria-controls={`help-${i}`} onClick={() => setOpen(isOpen ? null : i)} className="w-full min-h-[56px] px-4 py-3 flex items-center gap-3 text-left">
                      <span className="flex-1 text-[15px] font-medium">{f.q}</span>
                      <ChevronDown size={18} aria-hidden="true" className={cn('shrink-0 transition-transform', isOpen && 'rotate-180')} />
                    </button>
                  </h3>
                  <div id={`help-${i}`} hidden={!isOpen}><p className="px-4 pb-4 text-[14px] leading-relaxed text-ink-2">{f.a}</p></div>
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel tone="lavender">
            <Sparkles size={22} aria-hidden="true" />
            <h2 className="font-display text-[24px] mt-2">Ask the assistant</h2>
            <p className="text-[14px] text-[#3A3060] mt-1">The button in the bottom corner answers questions about using Akibora, any time.</p>
          </Panel>
          <Panel>
            <PanelTitle>Write to the team</PanelTitle>
            <form className="flex flex-col gap-4 mt-4" onSubmit={(e) => { e.preventDefault(); window.location.href = mailto; }}>
              <Field label="About">
                <select value={topic} onChange={(e) => setTopic(e.target.value)} className={inputClass}>
                  <option>A question about using Akibora</option>
                  <option>A payment problem</option>
                  <option>Something isn&apos;t working</option>
                  <option>An idea or request</option>
                </select>
              </Field>
              <Field label="Message">
                <textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className={textareaClass} />
              </Field>
              <button type="submit" className={buttonClass('primary', 'md', 'self-start')}><Mail size={18} aria-hidden="true" />Open in my email app</button>
              <p className="text-[13px] text-ink-3">Goes to {SITE.contactEmail}. We&apos;re a small team, so give us a day or two.</p>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}

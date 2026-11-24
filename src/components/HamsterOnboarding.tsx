'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Hammy, type HammyPose } from '@/components/tour/Hammy';
import { ButtonLink } from '@/components/ui';

type Step = { title: string; body: string; pose: HammyPose };

const STEPS: Step[] = [
  {
    title: 'Karibu Akibora',
    body: "I'm Hammy. Give me thirty seconds and I'll show you how a chama runs here.",
    pose: 'wave',
  },
  {
    title: 'Start or join a group',
    body: 'An official creates the group and gets a group code. Members join with that code and an official approves each one.',
    pose: 'run',
  },
  {
    title: 'Pay with M-Pesa',
    body: 'On the due date you get an M-Pesa prompt on your phone. When it goes through, the payment appears in the shared record. Officials can record cash too.',
    pose: 'think',
  },
  {
    title: 'Everyone sees the same record',
    body: 'Contributions, the merry-go-round order, the welfare fund and every withdrawal vote, in one place the whole group can check.',
    pose: 'run',
  },
  {
    title: 'Your saving becomes proof',
    body: 'Each month you pay on time raises your trust score. Download it as a credit passport when a SACCO or lender asks.',
    pose: 'think',
  },
  {
    title: "That's the tour",
    body: 'Inside the app I can walk you round again from the Help page.',
    pose: 'celebrate',
  },
];

const KEY = 'ak_hammy_seen_v2';

export default function HamsterOnboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    // Wait for the first-load screen to finish
    const t = setTimeout(() => setOpen(true), 2100);
    return () => clearTimeout(t);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="hammy-title">
      <button type="button" aria-label="Close the tour" className="absolute inset-0 bg-[#08120D]/60 backdrop-blur-[2px]" onClick={close} />

      <div className="ak-toast-in relative w-full sm:max-w-[440px] rounded-t-[28px] sm:rounded-[28px] bg-surface text-ink overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,.35)] pb-safe">
        <div className="relative bg-forest text-[#EEF4EF] h-[176px] flex items-end justify-center overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-10 bg-canopy" aria-hidden="true" />
          <Hammy pose={s.pose} size={128} className="relative -mb-1" />
          <span className="absolute top-4 left-4 text-[13px] text-[#A9C2B3]">{step + 1} of {STEPS.length}</span>
          <button type="button" onClick={close} aria-label="Close the tour" className="absolute top-2.5 right-2.5 w-10 h-10 rounded-full flex items-center justify-center text-[#A9C2B3] hover:bg-[#1A3428] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 sm:px-7 pt-6">
          <h2 id="hammy-title" className="font-display text-[28px] leading-tight tracking-[-0.02em]">{s.title}</h2>
          <p className="text-[16px] text-ink-2 leading-relaxed mt-2 min-h-[78px]">{s.body}</p>
        </div>

        <div className="flex gap-1.5 px-6 sm:px-7 mt-4" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-7 bg-brand' : i < step ? 'w-3 bg-brand/50' : 'w-3 bg-line-strong'}`} />
          ))}
        </div>

        <div className="flex items-center gap-2 px-6 sm:px-7 py-6">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="h-11 px-4 rounded-full inline-flex items-center gap-1.5 text-[15px] font-medium hover:bg-raised">
              <ArrowLeft size={17} aria-hidden="true" />Back
            </button>
          ) : (
            <button type="button" onClick={close} className="h-11 px-4 rounded-full text-[15px] text-ink-2 hover:bg-raised">Skip</button>
          )}
          <span className="flex-1" />
          {last ? (
            <ButtonLink href="/signup?role=admin" onClick={close}>Start a group</ButtonLink>
          ) : (
            <button type="button" onClick={() => setStep(step + 1)} className="h-11 px-5 rounded-full inline-flex items-center gap-1.5 bg-primary text-on-primary text-[15px] font-semibold hover:opacity-90">
              Next<ArrowRight size={17} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

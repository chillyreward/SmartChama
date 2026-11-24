'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Hammy, type HammyPose } from './Hammy';

type Step = { targets?: string[]; title: string; body: string; pose: HammyPose };

const MEMBER: Step[] = [
  { title: 'Karibu to your group', body: "I'm Hammy. Let me point out where everything is. It takes thirty seconds.", pose: 'wave' },
  { targets: ['group'], title: 'Your group', body: "This is the chama you're looking at. In more than one? Switch between them here, or start and join others.", pose: 'think' },
  { targets: ['/dashboard/contributions'], title: 'Pay your contribution', body: 'Tap here when a contribution is due. M-Pesa sends a prompt to your phone, and the payment shows up once it goes through.', pose: 'run' },
  { targets: ['/dashboard/wallet'], title: "The group's money", body: 'The balance everyone can see, loans, and withdrawal requests. Money only leaves when the members vote for it.', pose: 'think' },
  { targets: ['/dashboard/merry-go-round', 'more'], title: 'Merry-go-round, welfare and more', body: "Whose turn it is, the welfare fund, penalties and the group chat all live here.", pose: 'run' },
  { targets: ['/dashboard/trust-score', 'more'], title: 'Your trust score', body: 'Every month you pay on time raises it. You can download it as a credit passport for a SACCO or lender.', pose: 'think' },
  { title: "You're set", body: 'You can take this tour again any time from Help.', pose: 'celebrate' },
];

const OFFICIAL: Step[] = [
  { title: 'Karibu, official', body: "I'm Hammy. Here's where you run the group from. Thirty seconds.", pose: 'wave' },
  { targets: ['group'], title: 'Your group', body: 'The group you are managing. Switch here if you look after more than one.', pose: 'think' },
  { targets: ['/admin/members'], title: 'Members', body: 'Approve people who ask to join, invite new members and change roles.', pose: 'run' },
  { targets: ['/admin/contributions'], title: 'Record payments', body: 'M-Pesa payments record themselves. Record cash or bank payments here so the record stays complete.', pose: 'think' },
  { targets: ['/admin/wallet'], title: 'Wallet and withdrawals', body: 'Balance, loans and withdrawal requests. A payout needs a majority of members to vote yes first.', pose: 'run' },
  { targets: ['/admin/settings', 'more'], title: 'Group settings', body: 'Your group code, contribution amount, schedule and rules.', pose: 'think' },
  { title: "You're set", body: 'Take this tour again any time from the Help page.', pose: 'celebrate' },
];

type Rect = { top: number; left: number; width: number; height: number };

function findTarget(targets?: string[]): HTMLElement | null {
  if (!targets) return null;
  for (const t of targets) {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${t}"]`));
    const visible = nodes.find((n) => {
      const r = n.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(n).visibility !== 'hidden';
    });
    if (visible) return visible;
  }
  return null;
}

export function startTour() {
  window.dispatchEvent(new Event('ak:tour'));
}

export default function AppTour({ variant }: { variant: 'member' | 'admin' }) {
  const { session } = useAuth();
  const steps = variant === 'admin' ? OFFICIAL : MEMBER;
  const key = `ak_tour_v1_${variant}_${session?.user?.id || 'anon'}`;
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vw, setVw] = useState(1024);

  useEffect(() => {
    if (!session?.user?.id) return;
    let seen = true;
    try { seen = !!localStorage.getItem(key); } catch { /* ignore */ }
    if (!seen) {
      const t = setTimeout(() => { setI(0); setOpen(true); }, 900);
      return () => clearTimeout(t);
    }
  }, [key, session?.user?.id]);

  useEffect(() => {
    const go = () => { setI(0); setOpen(true); };
    window.addEventListener('ak:tour', go);
    return () => window.removeEventListener('ak:tour', go);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try { localStorage.setItem(key, '1'); } catch { /* ignore */ }
  }, [key]);

  const measure = useCallback(() => {
    setVw(window.innerWidth);
    const el = findTarget(steps[i]?.targets);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    const pad = 6;
    setRect({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
  }, [i, steps]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setI((v) => Math.min(v + 1, steps.length - 1));
      if (e.key === 'ArrowLeft') setI((v) => Math.max(v - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close, steps.length]);

  if (!open) return null;
  const s = steps[i];
  const last = i === steps.length - 1;
  const mobile = vw < 640;

  // Card placement: next to the highlighted item when there is room, otherwise centred.
  let cardStyle: React.CSSProperties = {};
  if (rect && !mobile) {
    const cardW = 360;
    const right = rect.left + rect.width + 16;
    if (right + cardW < window.innerWidth) {
      cardStyle = { left: right, top: Math.max(16, Math.min(rect.top, window.innerHeight - 340)) };
    } else {
      cardStyle = { left: Math.max(16, Math.min(rect.left, window.innerWidth - cardW - 16)), top: Math.max(16, rect.top - 330) };
    }
  }
  const nearBottom = !!rect && rect.top > window.innerHeight / 2;

  return (
    <div className="fixed inset-0 z-[9997]" role="dialog" aria-modal="true" aria-labelledby="ak-tour-title">
      {rect ? (
        <div className="ak-tour-hole" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} aria-hidden="true" />
      ) : (
        <div className="fixed inset-0 bg-[#08120D]/65" aria-hidden="true" />
      )}
      <button type="button" aria-label="Close the tour" className="fixed inset-0 z-[9998] cursor-default" onClick={close} />

      <div
        className={
          rect && !mobile
            ? 'fixed z-[9999] w-[360px]'
            : rect && mobile
              ? `fixed z-[9999] inset-x-3 ${nearBottom ? 'top-[max(16px,env(safe-area-inset-top))]' : 'bottom-[max(16px,env(safe-area-inset-bottom))]'}`
              : 'fixed z-[9999] inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] top-1/2 -translate-y-1/2'
        }
        style={rect && !mobile ? cardStyle : undefined}
      >
        <div key={i} className="ak-toast-in rounded-[24px] bg-surface text-ink shadow-[0_24px_60px_rgba(0,0,0,.4)] overflow-hidden">
          <div className="flex items-start gap-3 p-5 pb-0">
            <Hammy pose={s.pose} size={rect ? 64 : 88} className="shrink-0 -mt-1" />
            <div className="min-w-0 flex-1">
              <div className="text-[12px] text-ink-3">{i + 1} of {steps.length}</div>
              <h2 id="ak-tour-title" className="font-display text-[22px] leading-tight mt-0.5">{s.title}</h2>
            </div>
            <button type="button" onClick={close} aria-label="Close the tour" className="w-9 h-9 -mr-2 -mt-1 rounded-full flex items-center justify-center text-ink-3 hover:bg-raised shrink-0">
              <X size={18} />
            </button>
          </div>
          <p className="px-5 pt-2 text-[15px] leading-relaxed text-ink-2">{s.body}</p>
          <div className="flex items-center gap-2 p-4 pt-4">
            <div className="flex gap-1" aria-hidden="true">
              {steps.map((_, n) => (
                <span key={n} className={`h-1.5 rounded-full ${n === i ? 'w-5 bg-brand' : 'w-1.5 bg-line-strong'}`} />
              ))}
            </div>
            <span className="flex-1" />
            {i > 0 && (
              <button type="button" onClick={() => setI(i - 1)} className="h-10 px-3 rounded-full inline-flex items-center gap-1 text-[14px] font-medium hover:bg-raised">
                <ArrowLeft size={16} aria-hidden="true" />Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? close() : setI(i + 1))}
              className="h-10 px-4 rounded-full inline-flex items-center gap-1 bg-primary text-on-primary text-[14px] font-semibold hover:opacity-90"
              autoFocus
            >
              {last ? 'Start' : 'Next'}{!last && <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

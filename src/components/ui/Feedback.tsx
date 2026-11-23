'use client';
// In-app toasts and confirm dialogs, in place of the browser's alert() and
// confirm() boxes. Call toast() or ask() from anywhere; <FeedbackHost /> in the
// root layout renders them.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type Tone = 'ok' | 'danger' | 'info';
type ToastItem = { id: number; message: string; tone: Tone };
type AskOptions = { title: string; body?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean };
type AskItem = AskOptions & { resolve: (v: boolean) => void };

const TOAST_EVENT = 'ak:toast';
const ASK_EVENT = 'ak:ask';

export function toast(message: string, tone: Tone = 'ok') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, tone } }));
}

/** Promise-based confirm. Resolves true when the person confirms. */
export function ask(options: AskOptions | string): Promise<boolean> {
  const opts = typeof options === 'string' ? { title: options } : options;
  if (typeof window === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: { ...opts, resolve } }));
  });
}

export function FeedbackHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [question, setQuestion] = useState<AskItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- portal target exists only after mount
    setMounted(true);
    const onToast = (e: Event) => {
      const { message, tone } = (e as CustomEvent).detail as { message: string; tone: Tone };
      const id = ++seq.current;
      setToasts((t) => [...t.slice(-2), { id, message, tone }]);
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'danger' ? 7000 : 4500);
    };
    const onAsk = (e: Event) => setQuestion((e as CustomEvent).detail as AskItem);
    window.addEventListener(TOAST_EVENT, onToast);
    window.addEventListener(ASK_EVENT, onAsk);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      window.removeEventListener(ASK_EVENT, onAsk);
    };
  }, []);

  useEffect(() => {
    if (!question) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') answer(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  const answer = (v: boolean) => {
    question?.resolve(v);
    setQuestion(null);
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        aria-live="polite"
        className="fixed z-[80] left-1/2 -translate-x-1/2 bottom-[104px] lg:bottom-8 flex flex-col items-center gap-2 w-[min(92vw,440px)] pointer-events-none"
      >
        {toasts.map((t) => {
          const Icon = t.tone === 'danger' ? AlertTriangle : t.tone === 'info' ? Info : CheckCircle2;
          return (
            <div
              key={t.id}
              role={t.tone === 'danger' ? 'alert' : 'status'}
              className="pointer-events-auto w-full flex items-start gap-3 rounded-[18px] bg-forest text-[#EEF4EF] border border-canopy shadow-[0_12px_32px_rgba(0,0,0,0.28)] px-4 py-3.5 ak-toast-in"
            >
              <Icon size={20} className={t.tone === 'danger' ? 'text-[#F6B3AA] shrink-0 mt-px' : 'text-mint shrink-0 mt-px'} aria-hidden="true" />
              <p className="text-[15px] leading-snug flex-1">{t.message}</p>
              <button
                type="button"
                onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
                className="text-[#8FAA9B] hover:text-white -mr-1 -mt-0.5 p-1 rounded-full"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {question && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="ak-ask-title">
          <button type="button" aria-label="Cancel" className="absolute inset-0 bg-black/45" onClick={() => answer(false)} />
          <div className="relative w-full max-w-[420px] rounded-[28px] bg-surface border border-line p-6 shadow-2xl">
            <h2 id="ak-ask-title" className="font-display text-[26px] leading-tight">{question.title}</h2>
            {question.body && <p className="text-[15px] text-ink-2 mt-2 leading-relaxed">{question.body}</p>}
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => answer(false)} className="flex-1 h-12 rounded-full border border-line-strong text-[15px] font-semibold hover:bg-raised">
                {question.cancelLabel ?? 'Cancel'}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={() => answer(true)}
                className={
                  question.danger
                    ? 'flex-1 h-12 rounded-full bg-danger-soft text-danger-ink text-[15px] font-semibold hover:opacity-90'
                    : 'flex-1 h-12 rounded-full bg-primary text-on-primary text-[15px] font-semibold hover:opacity-90'
                }
              >
                {question.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';

interface Step {
  title: string;
  body: string;
  icon: string;
  hamsterPose: 'wave' | 'run' | 'think' | 'celebrate';
}

const STEPS: Step[] = [
  {
    title: "Karibu SmartChama! 👋",
    body: "I'm Hammy, your SmartChama guide. Let me show you how to manage your chama savings in under 2 minutes.",
    icon: "🐹",
    hamsterPose: "wave",
  },
  {
    title: "Create or Join a Chama",
    body: "If you're a group chair, create a digital chama in minutes. Members join using a unique invite code — no paper forms needed.",
    icon: "🏠",
    hamsterPose: "run",
  },
  {
    title: "Collect Contributions via M-Pesa",
    body: "SmartChama sends an M-Pesa STK Push directly to each member's phone. Payments are recorded automatically — no manual tracking.",
    icon: "💚",
    hamsterPose: "think",
  },
  {
    title: "Issue & Track Loans",
    body: "Members apply for internal loans from the group wallet. Repayments are tracked automatically, and trust scores grow with each payment.",
    icon: "🏦",
    hamsterPose: "run",
  },
  {
    title: "Merry-Go-Round Schedules",
    body: "Set up a rotating payout schedule. Every member knows exactly when it's their turn. No disputes, no forgotten lists.",
    icon: "🔄",
    hamsterPose: "think",
  },
  {
    title: "You're Ready!",
    body: "Start your chama for free today. No credit card. No complicated setup. Hammy will be here if you need help.",
    icon: "🎉",
    hamsterPose: "celebrate",
  },
];

const HAMSTER_SVG: Record<Step['hamsterPose'], string> = {
  wave: `
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Body -->
      <ellipse cx="60" cy="80" rx="32" ry="28" fill="#C4956A"/>
      <ellipse cx="60" cy="85" rx="24" ry="20" fill="#E8C49A"/>
      <!-- Head -->
      <circle cx="60" cy="52" r="26" fill="#C4956A"/>
      <!-- Face -->
      <ellipse cx="60" cy="58" rx="18" ry="14" fill="#E8C49A"/>
      <!-- Eyes -->
      <circle cx="52" cy="50" r="4" fill="#1a1a1a"/>
      <circle cx="68" cy="50" r="4" fill="#1a1a1a"/>
      <circle cx="53" cy="49" r="1.5" fill="white"/>
      <circle cx="69" cy="49" r="1.5" fill="white"/>
      <!-- Nose -->
      <ellipse cx="60" cy="56" rx="3" ry="2" fill="#D4607A"/>
      <!-- Cheek pouches -->
      <ellipse cx="46" cy="57" rx="7" ry="5" fill="#E8C49A" opacity="0.7"/>
      <ellipse cx="74" cy="57" rx="7" ry="5" fill="#E8C49A" opacity="0.7"/>
      <!-- Ears -->
      <circle cx="38" cy="33" r="10" fill="#C4956A"/>
      <circle cx="38" cy="33" r="6" fill="#E8A0A0"/>
      <circle cx="82" cy="33" r="10" fill="#C4956A"/>
      <circle cx="82" cy="33" r="6" fill="#E8A0A0"/>
      <!-- Waving arm -->
      <ellipse cx="92" cy="65" rx="6" ry="14" fill="#C4956A" transform="rotate(-40 92 65)"/>
      <circle cx="100" cy="55" r="6" fill="#C4956A"/>
      <!-- Other arm -->
      <ellipse cx="28" cy="75" rx="6" ry="12" fill="#C4956A"/>
      <!-- Legs -->
      <ellipse cx="48" cy="104" rx="8" ry="6" fill="#C4956A"/>
      <ellipse cx="72" cy="104" rx="8" ry="6" fill="#C4956A"/>
      <!-- Tail -->
      <ellipse cx="88" cy="92" rx="8" ry="5" fill="#E8C49A"/>
    </svg>
  `,
  run: `
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="65" cy="78" rx="30" ry="24" fill="#C4956A"/>
      <ellipse cx="65" cy="82" rx="22" ry="17" fill="#E8C49A"/>
      <circle cx="60" cy="50" r="26" fill="#C4956A"/>
      <ellipse cx="60" cy="56" rx="18" ry="14" fill="#E8C49A"/>
      <circle cx="52" cy="48" r="4" fill="#1a1a1a"/>
      <circle cx="68" cy="48" r="4" fill="#1a1a1a"/>
      <circle cx="53" cy="47" r="1.5" fill="white"/>
      <circle cx="69" cy="47" r="1.5" fill="white"/>
      <ellipse cx="60" cy="54" rx="3" ry="2" fill="#D4607A"/>
      <ellipse cx="46" cy="55" rx="7" ry="5" fill="#E8C49A" opacity="0.7"/>
      <ellipse cx="74" cy="55" rx="7" ry="5" fill="#E8C49A" opacity="0.7"/>
      <circle cx="37" cy="32" r="10" fill="#C4956A"/>
      <circle cx="37" cy="32" r="6" fill="#E8A0A0"/>
      <circle cx="82" cy="32" r="10" fill="#C4956A"/>
      <circle cx="82" cy="32" r="6" fill="#E8A0A0"/>
      <!-- Running arms -->
      <ellipse cx="86" cy="68" rx="5" ry="13" fill="#C4956A" transform="rotate(30 86 68)"/>
      <ellipse cx="34" cy="68" rx="5" ry="13" fill="#C4956A" transform="rotate(-30 34 68)"/>
      <!-- Running legs -->
      <ellipse cx="50" cy="100" rx="7" ry="8" fill="#C4956A" transform="rotate(-20 50 100)"/>
      <ellipse cx="76" cy="102" rx="7" ry="8" fill="#C4956A" transform="rotate(20 76 102)"/>
    </svg>
  `,
  think: `
    <svg viewBox="0 0 130 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="80" rx="32" ry="28" fill="#C4956A"/>
      <ellipse cx="60" cy="85" rx="24" ry="20" fill="#E8C49A"/>
      <circle cx="60" cy="50" r="26" fill="#C4956A"/>
      <ellipse cx="60" cy="56" rx="18" ry="14" fill="#E8C49A"/>
      <circle cx="51" cy="47" r="4" fill="#1a1a1a"/>
      <circle cx="70" cy="47" r="4" fill="#1a1a1a"/>
      <!-- Thinking eyes — looking up right -->
      <circle cx="52" cy="46" r="1.5" fill="white"/>
      <circle cx="71" cy="46" r="1.5" fill="white"/>
      <ellipse cx="60" cy="54" rx="3" ry="2" fill="#D4607A"/>
      <ellipse cx="46" cy="57" rx="7" ry="5" fill="#E8C49A" opacity="0.7"/>
      <ellipse cx="74" cy="57" rx="7" ry="5" fill="#E8C49A" opacity="0.7"/>
      <circle cx="37" cy="30" r="10" fill="#C4956A"/>
      <circle cx="37" cy="30" r="6" fill="#E8A0A0"/>
      <circle cx="82" cy="30" r="10" fill="#C4956A"/>
      <circle cx="82" cy="30" r="6" fill="#E8A0A0"/>
      <!-- Chin rest arm -->
      <ellipse cx="86" cy="70" rx="5" ry="16" fill="#C4956A" transform="rotate(-15 86 70)"/>
      <circle cx="92" cy="56" r="6" fill="#C4956A"/>
      <!-- Thought bubbles -->
      <circle cx="105" cy="42" r="4" fill="#22C55E" opacity="0.6"/>
      <circle cx="112" cy="30" r="6" fill="#22C55E" opacity="0.7"/>
      <circle cx="116" cy="18" r="8" fill="#22C55E" opacity="0.8"/>
      <text x="111" y="23" font-size="9" text-anchor="middle" fill="white">💡</text>
      <!-- Legs -->
      <ellipse cx="48" cy="104" rx="8" ry="6" fill="#C4956A"/>
      <ellipse cx="72" cy="104" rx="8" ry="6" fill="#C4956A"/>
    </svg>
  `,
  celebrate: `
    <svg viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Confetti -->
      <rect x="20" y="10" width="6" height="6" fill="#22C55E" rx="1" transform="rotate(20 20 10)"/>
      <rect x="100" y="15" width="5" height="5" fill="#F59E0B" rx="1" transform="rotate(-15 100 15)"/>
      <rect x="30" y="30" width="4" height="4" fill="#3B82F6" rx="1" transform="rotate(40 30 30)"/>
      <rect x="90" y="8" width="4" height="7" fill="#EF4444" rx="1" transform="rotate(10 90 8)"/>
      <circle cx="15" cy="45" r="3" fill="#8B5CF6"/>
      <circle cx="108" cy="40" r="3" fill="#22C55E"/>
      <!-- Body -->
      <ellipse cx="65" cy="88" rx="32" ry="28" fill="#C4956A"/>
      <ellipse cx="65" cy="93" rx="24" ry="20" fill="#E8C49A"/>
      <!-- Head -->
      <circle cx="65" cy="58" r="26" fill="#C4956A"/>
      <ellipse cx="65" cy="64" rx="18" ry="14" fill="#E8C49A"/>
      <!-- Happy eyes -->
      <path d="M 55 55 Q 57 52 59 55" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M 70 55 Q 72 52 74 55" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <!-- Big smile -->
      <path d="M 53 65 Q 65 75 77 65" stroke="#D4607A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <ellipse cx="51" cy="63" rx="7" ry="5" fill="#E8C49A" opacity="0.7"/>
      <ellipse cx="79" cy="63" rx="7" ry="5" fill="#E8C49A" opacity="0.7"/>
      <circle cx="42" cy="38" r="10" fill="#C4956A"/>
      <circle cx="42" cy="38" r="6" fill="#E8A0A0"/>
      <circle cx="88" cy="38" r="10" fill="#C4956A"/>
      <circle cx="88" cy="38" r="6" fill="#E8A0A0"/>
      <!-- Both arms up -->
      <ellipse cx="30" cy="68" rx="5" ry="14" fill="#C4956A" transform="rotate(35 30 68)"/>
      <circle cx="22" cy="57" r="6" fill="#C4956A"/>
      <ellipse cx="100" cy="68" rx="5" ry="14" fill="#C4956A" transform="rotate(-35 100 68)"/>
      <circle cx="108" cy="57" r="6" fill="#C4956A"/>
      <!-- Star in paw -->
      <text x="17" y="60" font-size="10">⭐</text>
      <text x="105" y="60" font-size="10">🎊</text>
      <!-- Legs -->
      <ellipse cx="53" cy="112" rx="8" ry="6" fill="#C4956A"/>
      <ellipse cx="77" cy="112" rx="8" ry="6" fill="#C4956A"/>
    </svg>
  `,
};

const STORAGE_KEY = 'sc_hamster_seen_v1';

export default function HamsterOnboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    // Only show to first-time visitors
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Small delay so page loads first
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage blocked — silently skip
    }
  }, []);

  const dismiss = useCallback(() => {
    setAnimClass('opacity-0 scale-95');
    setTimeout(() => {
      setVisible(false);
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    }, 300);
  }, []);

  const next = useCallback(() => {
    if (step >= STEPS.length - 1) {
      dismiss();
      return;
    }
    setAnimClass('opacity-0 translate-x-4');
    setTimeout(() => {
      setStep(s => s + 1);
      setAnimClass('opacity-100 translate-x-0');
    }, 200);
  }, [step, dismiss]);

  const prev = useCallback(() => {
    if (step <= 0) return;
    setAnimClass('opacity-0 -translate-x-4');
    setTimeout(() => {
      setStep(s => s - 1);
      setAnimClass('opacity-100 translate-x-0');
    }, 200);
  }, [step]);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="SmartChama onboarding tutorial"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div
          className={`
            relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden
            bg-white dark:bg-[#121215]
            border border-[#22C55E]/20
            transition-all duration-300 ease-out
            ${animClass || 'opacity-100 scale-100'}
          `}
          onClick={e => e.stopPropagation()}
        >
          {/* Green progress bar */}
          <div className="h-1 bg-gray-100 dark:bg-[#1e1e22]">
            <div
              className="h-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Hamster Stage */}
          <div className="relative h-44 flex items-center justify-center bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7] dark:from-[#052E16]/60 dark:to-[#052E16]/30 overflow-hidden">
            {/* Walking dots trail */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 opacity-30">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"
                  style={{ opacity: i <= step ? 1 : 0.3 }}
                />
              ))}
            </div>

            {/* Hamster SVG — animates based on pose */}
            <div
              className={`
                w-32 h-32 select-none
                ${current.hamsterPose === 'run' ? 'animate-[hamsterRun_0.5s_ease-in-out_infinite]' : ''}
                ${current.hamsterPose === 'wave' ? 'animate-[hamsterWave_1s_ease-in-out_infinite]' : ''}
                ${current.hamsterPose === 'celebrate' ? 'animate-[hamsterCelebrate_0.6s_ease-in-out_infinite]' : ''}
              `}
              dangerouslySetInnerHTML={{ __html: HAMSTER_SVG[current.hamsterPose] }}
            />

            {/* Floating icon badge */}
            <div className="absolute top-4 right-4 text-3xl select-none">
              {current.icon}
            </div>

            {/* Step counter pill */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/80 dark:bg-black/40 text-[11px] font-bold text-[#22C55E] backdrop-blur-sm">
              {step + 1} / {STEPS.length}
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pt-6 pb-4">
            <h2 className="text-xl font-bold text-[#09090B] dark:text-white mb-2 leading-tight">
              {current.title}
            </h2>
            <p className="text-[15px] text-[#3F3F46] dark:text-[#D4D4D8] leading-relaxed">
              {current.body}
            </p>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 pt-2 pb-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setAnimClass(i > step ? 'opacity-0 translate-x-4' : 'opacity-0 -translate-x-4');
                  setTimeout(() => {
                    setStep(i);
                    setAnimClass('opacity-100 translate-x-0');
                  }, 180);
                }}
                aria-label={`Go to step ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 h-2.5 bg-[#22C55E]' : 'w-2.5 h-2.5 bg-gray-200 dark:bg-[#27272A]'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 px-8 pb-8 pt-3">
            {step > 0 && (
              <button
                onClick={prev}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium text-[#3F3F46] dark:text-[#D4D4D8] hover:bg-gray-100 dark:hover:bg-[#1e1e22] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back
              </button>
            )}

            <button
              onClick={next}
              className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-[14px] font-semibold transition-all duration-200 shadow-md shadow-emerald-500/20 active:scale-95"
            >
              {isLast ? 'Get Started' : 'Next'}
              <span className="material-symbols-outlined text-[18px]">
                {isLast ? 'rocket_launch' : 'arrow_forward'}
              </span>
            </button>
          </div>

          {/* Skip link */}
          <div className="text-center pb-5">
            <button
              onClick={dismiss}
              className="text-[12px] text-[#71717A] hover:text-[#22C55E] transition-colors underline underline-offset-2"
            >
              Skip tutorial
            </button>
          </div>
        </div>
      </div>

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes hamsterRun {
          0%, 100% { transform: translateY(0) rotate(-1deg) scaleX(1); }
          50% { transform: translateY(-6px) rotate(1deg) scaleX(0.97); }
        }
        @keyframes hamsterWave {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes hamsterCelebrate {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
      `}</style>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';

const KEY = 'ak-first-load';

/**
 * Shown once per browser session while the app first loads: the Akibora mark,
 * three coins dropping into place, and a bar that fills. It is in the server
 * HTML so it covers the page from the first paint; the inline script removes it
 * straight away on later page loads in the same session.
 */
export default function LoadingScreen() {
  const [phase, setPhase] = useState<'show' | 'leaving' | 'gone'>('show');

  useEffect(() => {
    let seen = false;
    try { seen = !!sessionStorage.getItem(KEY); } catch { /* storage blocked */ }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen) { setPhase('gone'); return; }
    try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    const t1 = setTimeout(() => setPhase('leaving'), reduced ? 300 : 1350);
    const t2 = setTimeout(() => setPhase('gone'), reduced ? 400 : 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'gone') return null;

  return (
    <>
      <div
        id="ak-loader"
        role="status"
        aria-label="Loading Akibora"
        suppressHydrationWarning
        className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-forest text-[#EEF4EF] transition-opacity duration-300 ${phase === 'leaving' ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="ak-load-rise flex flex-col items-center">
          <span className="w-[76px] h-[76px] rounded-[26%] bg-white flex items-center justify-center shadow-[0_18px_40px_rgba(0,0,0,.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" width={56} height={56} />
          </span>
          <span className="font-display text-[40px] tracking-[-0.03em] mt-5 leading-none">akibora</span>
        </div>

        <div className="flex gap-2.5 mt-8" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="ak-coin-drop w-3.5 h-3.5 rounded-full bg-mint shadow-[inset_0_-2px_0_rgba(14,31,24,.25)]"
              style={{ animationDelay: `${260 + i * 160}ms` }}
            />
          ))}
        </div>

        <div className="w-[180px] h-[3px] rounded-full bg-[#234235] overflow-hidden mt-7" aria-hidden="true">
          <div className="ak-load-fill h-full bg-mint rounded-full" style={{ animationDelay: '150ms' }} />
        </div>

        <p className="mt-6 text-[14px] text-[#8FAA9B]">
          <i className="font-display text-[16px] text-[#CFE0D4]">akiba</i>, savings. <i className="font-display text-[16px] text-[#CFE0D4]">bora</i>, the best of it.
        </p>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem('${KEY}')){var e=document.getElementById('ak-loader');if(e)e.style.display='none'}}catch(e){}`,
        }}
      />
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isFirst = !sessionStorage.getItem('sc-initial-load');
    if (!isFirst) {
      return;
    }

    let current = 0;
    const duration = 2200; // 2.2 seconds total duration
    const intervalTime = 20;
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= 100) {
        setProgress(100);
        clearInterval(timer);
        sessionStorage.setItem('sc-initial-load', 'done');
        setFadeOut(true);
        setTimeout(() => {
          document.documentElement.classList.add('sc-splash-hidden');
        }, 500);
      } else {
        const rand = Math.random() > 0.85 ? Math.random() * 3.5 : 0;
        setProgress(Math.min(99, Math.round(current + rand)));
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  if (mounted && typeof window !== 'undefined' && sessionStorage.getItem('sc-initial-load') === 'done') {
    return null;
  }

  return (
    <div className={`
      fixed inset-0 z-[9999]
      flex flex-col items-center justify-center gap-10
      page-bg
      transition-opacity duration-500
      ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}
    `}>

      {/* Logo */}
      <div className="flex items-center gap-3">
        <Image src="/logo.png"
          alt="SmartChama"
          width={56} height={56}
          className="h-14 w-14 object-contain" priority />
        <span className="text-[26px] font-bold tracking-tight text-[#161d16] dark:text-white">
          SmartChama
        </span>
      </div>

      {/* Walking stage */}
      <div className="relative w-80">
        
        {/* Elephant walks above the bar */}
        <div className="relative h-40 overflow-visible mb-2">
          <div
            style={{
              position: 'absolute',
              left: `${Math.max(-10, Math.min(progress * 2.4 - 20, 240))}px`,
              bottom: '8px',
              transition: 'left 0.12s linear'
            }}>
            
            <svg
              viewBox="0 0 280 200"
              xmlns="http://www.w3.org/2000/svg"
              className="w-48 h-36 elephant-walk text-[#006e2f] dark:text-[#22C55E]"
              style={{ color: 'currentColor' }}>
              
              {/* ═══ BACK LEG RIGHT 
                  (furthest from viewer, 
                  slightly behind) ═══ */}
              <rect
                x="194" y="138" 
                width="22" height="52"
                rx="11"
                fill="currentColor"
                opacity="0.7"
              />
              <ellipse
                cx="205" cy="190"
                rx="14" ry="7"
                fill="currentColor"
                opacity="0.7"
              />
              
              {/* ═══ BACK LEG LEFT 
                  (forward position — walking) ═══ */}
              <rect
                x="168" y="130"
                width="22" height="60"
                rx="11"
                fill="currentColor"
                opacity="0.85"
              />
              <ellipse
                cx="179" cy="190"
                rx="14" ry="7"
                fill="currentColor"
                opacity="0.85"
              />
              
              {/* ═══ MAIN BODY ═══ */}
              <ellipse
                cx="158" cy="112"
                rx="72" ry="52"
                fill="currentColor"
              />
              
              {/* ═══ RUMP (back of elephant) ═══ */}
              <ellipse
                cx="214" cy="118"
                rx="42" ry="38"
                fill="currentColor"
              />
              
              {/* Body-rump connection fill */}
              <rect
                x="170" y="80"
                width="80" height="75"
                fill="currentColor"
              />
              
              {/* ═══ TAIL ═══ */}
              <path
                d="M248 100 
                   C258 108 262 118 256 128 
                   C252 135 246 136 244 132"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
              />
              <ellipse
                cx="244" cy="134"
                rx="6" ry="8"
                fill="currentColor"
              />
              
              {/* ═══ FRONT LEG RIGHT 
                  (back position) ═══ */}
              <rect
                x="100" y="148"
                width="24" height="42"
                rx="12"
                fill="currentColor"
                opacity="0.75"
              />
              <ellipse
                cx="112" cy="190"
                rx="14" ry="7"
                fill="currentColor"
                opacity="0.75"
              />
              
              {/* ═══ FRONT LEG LEFT 
                  (forward — walking) ═══ */}
              <rect
                x="124" y="140"
                width="24" height="50"
                rx="12"
                fill="currentColor"
              />
              <ellipse
                cx="136" cy="190"
                rx="14" ry="7"
                fill="currentColor"
              />
              
              {/* ═══ NECK ═══ */}
              <path
                d="M86 110 
                   C86 95 94 82 108 76 
                   C118 72 130 74 138 82 
                   C130 90 118 98 108 102 
                   C98 106 90 108 86 110Z"
                fill="currentColor"
              />
              
              {/* ═══ HEAD ═══ 
                  Large rounded head, 
                  slightly lower than body */}
              <ellipse
                cx="72" cy="96"
                rx="38" ry="34"
                fill="currentColor"
              />
              
              {/* ═══ FOREHEAD DOME ═══
                  African elephants have 
                  a prominent forehead */}
              <ellipse
                cx="62" cy="76"
                rx="26" ry="22"
                fill="currentColor"
              />
              
              {/* ═══ EAR ═══ 
                  Large African elephant ear,
                  slightly behind/left of head,
                  lighter to show depth */}
              
              {/* Ear shadow/depth */}
              <ellipse
                cx="86" cy="88"
                rx="30" ry="38"
                fill="currentColor"
                opacity="0.4"
              />
              
              {/* Ear main shape */}
              <ellipse
                cx="88" cy="88"
                rx="24" ry="31"
                fill="currentColor"
                opacity="0.55"
              />
              
              {/* Ear inner (lighter for texture) */}
              <ellipse
                cx="90" cy="88"
                rx="16" ry="21"
                fill="currentColor"
                opacity="0.25"
              />
              
              {/* ═══ TRUNK ═══
                  Long, curves naturally downward
                  with a slight forward curl */}
              <path
                d="M42 108 
                   C36 116 30 126 26 138 
                   C22 150 22 162 26 168 
                   C30 174 36 174 40 170 
                   C44 166 44 158 42 152 
                   C40 146 38 140 38 134 
                   C42 138 48 140 52 136 
                   C58 130 56 120 50 114 
                   L42 108Z"
                fill="currentColor"
              />
              
              {/* Trunk tip rounded end */}
              <ellipse
                cx="33" cy="169"
                rx="9" ry="6"
                fill="currentColor"
                transform="rotate(-15 33 169)"
              />
              
              {/* ═══ TUSK ═══
                  Elegant ivory tusk */}
              <path
                d="M50 114
                   C46 120 40 124 36 132
                   C32 138 34 146 40 146
                   C46 146 50 140 52 134
                   C54 128 52 120 50 114Z"
                fill="white"
                opacity="0.65"
              />
              
              {/* ═══ EYE ═══ */}
              <circle
                cx="56"
                cy="82"
                r="6"
                fill="white"
              />
              <circle
                cx="57"
                cy="82"
                r="3"
                fill="#0B0F0C"
              />
              {/* Eye highlight */}
              <circle
                cx="59"
                cy="80"
                r="1.5"
                fill="white"
                opacity="0.8"
              />
              
              {/* ═══ TOENAILS ═══
                  Small white crescents 
                  at base of front feet */}
              <ellipse cx="128" cy="192" 
                rx="3.5" ry="2"
                fill="white" opacity="0.5" />
              <ellipse cx="136" cy="193" 
                rx="3.5" ry="2"
                fill="white" opacity="0.5" />
              <ellipse cx="144" cy="192" 
                rx="3.5" ry="2"
                fill="white" opacity="0.5" />
              
              {/* ═══ SUBTLE GROUND SHADOW ═══ */}
              <ellipse
                cx="155" cy="197"
                rx="90" ry="6"
                fill="currentColor"
                opacity="0.12"
              />
            </svg>

          </div>
        </div>
        
        {/* Percentage */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF] dark:text-[#5a6e5a]">
            Loading
          </span>
          <span className="text-[13px] font-bold tabular-nums text-[#161d16] dark:text-white">
            {progress}%
          </span>
        </div>
        
        {/* Progress bar track */}
        <div className="h-1 w-full rounded-full bg-[#E5E7EB] dark:bg-[#1a2a1a] overflow-hidden">
          
          {/* Fill */}
          <div
            className="h-full rounded-full bg-[#22C55E] transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
          
        </div>
        
      </div>

      {/* Tagline fades in at 60% */}
      <p className={`
        text-[13px] text-[#9CA3AF] dark:text-[#5a6e5a]
        transition-opacity duration-700 text-center
        ${progress > 60 ? 'opacity-100' : 'opacity-0'}
      `}>
        Financial infrastructure for<br />community wealth.
      </p>

    </div>
  );
}

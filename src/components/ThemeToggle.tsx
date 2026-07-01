'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-9 h-9" />;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2218] rounded-xl transition-all cursor-pointer border border-transparent hover:border-[var(--border)]"
      aria-label="Toggle theme"
    >
      <span className="material-symbols-outlined text-[20px] transition-transform duration-300">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}

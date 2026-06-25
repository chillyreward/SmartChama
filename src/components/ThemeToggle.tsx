'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        style={{ width: '36px', height: '36px', borderRadius: '8px' }} 
        className="animate-pulse bg-gray-200 dark:bg-gray-800" 
      />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center justify-center transition-colors"
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-input)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)'
      }}
      aria-label="Toggle Dark Mode"
    >
      <span 
        className="material-symbols-outlined text-[18px]"
        style={{ color: theme === 'dark' ? 'var(--brand-green)' : 'var(--text-muted)' }}
      >
        {theme === 'dark' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  );
}

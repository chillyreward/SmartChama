'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/components/ui';

export function ThemeToggle({ className, onShell = false }: { className?: string; onShell?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const isDark = mounted && resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'w-11 h-11 rounded-full inline-flex items-center justify-center transition-colors',
        onShell ? 'text-shell-muted hover:text-shell-ink hover:bg-shell-2' : 'text-ink-2 hover:text-ink hover:bg-raised',
        className,
      )}
    >
      {!mounted ? <span className="w-[18px] h-[18px]" /> : isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

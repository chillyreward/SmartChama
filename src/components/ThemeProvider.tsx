'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';
import { useEffect } from 'react';

export { useTheme } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Enforce strict pure white and pure black modes
  useEffect(() => {
    const applyStrictThemeColors = () => {
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        document.documentElement.style.setProperty('--bg-page', '#000000');
        document.documentElement.style.setProperty('--bg-card', '#0A0A0A');
      } else {
        document.documentElement.style.setProperty('--bg-page', '#FAFAFA');
        document.documentElement.style.setProperty('--bg-card', '#FFFFFF');
      }
    };

    // Run initially and on theme change
    applyStrictThemeColors();
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          applyStrictThemeColors();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      {children}
    </NextThemesProvider>
  );
}

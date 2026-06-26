'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export { useTheme } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" forcedTheme="dark" {...props}>
      {children}
    </NextThemesProvider>
  );
}

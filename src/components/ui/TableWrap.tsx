'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Wraps a table. On wide screens it scrolls sideways if it must; on phones
 * (see .ak-table-stack in globals.css) each row becomes a card and every cell
 * is labelled with its column heading, so nobody has to swipe sideways.
 */
export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const label = () => {
      root.querySelectorAll('table').forEach((table) => {
        const heads = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent?.trim() || '');
        table.querySelectorAll('tbody tr').forEach((tr) => {
          Array.from(tr.children).forEach((td, i) => {
            const text = heads[i] || '';
            if (td.getAttribute('data-label') !== text) td.setAttribute('data-label', text);
          });
        });
      });
    };
    label();
    const obs = new MutationObserver(label);
    obs.observe(root, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={twMerge(clsx('ak-table-stack overflow-x-auto -mx-3', className))}>
      {children}
    </div>
  );
}

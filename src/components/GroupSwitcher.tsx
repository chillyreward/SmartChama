'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronsUpDown, Plus, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { ROLE_LABEL } from '@/components/shell/nav';
import { cn } from '@/components/ui';

function switchTo(chamaId: string) {
  sessionStorage.setItem('active_chama_id', chamaId);
  localStorage.setItem('sc_last_chama_id', chamaId);
  document.cookie = `active_chama_id=${chamaId}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  window.location.reload();
}

type Row = { id: string; role: string; chamas_v2: { id: string; name: string } | null };

export default function GroupSwitcher({ onShell = true }: { onShell?: boolean }) {
  const { group, member } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      const { data } = await supabase
        .from('chama_memberships')
        .select('id, role, chamas_v2 ( id, name )')
        .eq('profile_id', user.id)
        .eq('status', 'active');
      if (!cancelled && data) setRows(data as unknown as Row[]);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, []);

  if (!group) return null;

  const roleLabel = ROLE_LABEL[member?.role || 'member'] || 'Member';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'w-full flex items-center gap-3 p-2.5 rounded-[14px] text-left transition-colors',
          onShell ? 'bg-shell-2 hover:bg-[#21402F] text-shell-ink' : 'bg-surface-2 hover:bg-raised text-ink border border-line',
        )}
      >
        <span className="w-9 h-9 rounded-[10px] bg-sage text-forest flex items-center justify-center font-display text-[18px] shrink-0">
          {group.name?.[0]?.toUpperCase() || 'A'}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-semibold truncate">{group.name}</span>
          <span className={cn('block text-[12px]', onShell ? 'text-shell-muted' : 'text-ink-3')}>{roleLabel}</span>
        </span>
        <ChevronsUpDown size={16} className={onShell ? 'text-shell-muted' : 'text-ink-3'} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-2 rounded-[18px] bg-surface text-ink border border-line shadow-soft overflow-hidden">
          <div className="px-4 pt-3 pb-2 text-[13px] text-ink-3">Your groups</div>
          <ul role="listbox" aria-label="Your groups" className="max-h-64 overflow-y-auto px-1.5">
            {rows.map((m) => {
              const c = m.chamas_v2;
              if (!c) return null;
              const current = c.id === group.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={current}
                    onClick={() => !current && switchTo(c.id)}
                    className={cn('w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left hover:bg-raised', current && 'bg-tint')}
                  >
                    <span className="w-8 h-8 rounded-[9px] bg-sage text-forest flex items-center justify-center font-display text-[16px] shrink-0">{c.name?.[0]?.toUpperCase()}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-medium truncate">{c.name}</span>
                      <span className="block text-[12px] text-ink-3">{ROLE_LABEL[m.role] || 'Member'}</span>
                    </span>
                    {current && <Check size={16} className="text-brand" aria-label="Current group" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-line mt-1.5 p-1.5 flex flex-col">
            <Link href="/onboarding?intent=create" className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-[14px] hover:bg-raised">
              <Plus size={16} className="text-brand" aria-hidden="true" /> Start another group
            </Link>
            <Link href="/onboarding?intent=join" className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-[14px] hover:bg-raised">
              <UserPlus size={16} className="text-brand" aria-hidden="true" /> Join with a group code
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

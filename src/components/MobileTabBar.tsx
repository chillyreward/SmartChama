'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, Plus, MessageCircle, MoreHorizontal, Users, LogOut, X, ArrowLeftRight } from 'lucide-react';
import { signOut } from '@/lib/auth-helpers';
import { useAuth } from '@/components/AuthProvider';
import { ADMIN_NAV, MEMBER_NAV, OFFICIAL_ROLES, isActive } from '@/components/shell/nav';
import { cn } from '@/components/ui';
import GroupSwitcher from '@/components/GroupSwitcher';

const TABS = {
  member: [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
    { href: '/dashboard/contributions', label: 'Pay', icon: Plus, primary: true },
    { href: '/dashboard/chat', label: 'Chat', icon: MessageCircle },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Overview', icon: Home },
    { href: '/admin/members', label: 'Members', icon: Users },
    { href: '/admin/contributions', label: 'Record', icon: Plus, primary: true },
    { href: '/admin/wallet', label: 'Wallet', icon: Wallet },
  ],
};

export function MobileTabBar({ variant = 'member' }: { variant?: 'member' | 'admin' }) {
  const pathname = usePathname();
  const { member } = useAuth();
  const [more, setMore] = useState(false);
  const isOfficial = !!member?.role && OFFICIAL_ROLES.includes(member.role);
  const groups = variant === 'admin' ? ADMIN_NAV : MEMBER_NAV;

  useEffect(() => {
    if (!more) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMore(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [more]);

  return (
    <>
      <nav
        aria-label="App"
        className="lg:hidden fixed inset-x-3 z-40 h-[66px] rounded-full ak-glass-forest text-[#EEF4EF] flex items-center justify-around px-2"
        style={{ bottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        {TABS[variant].map((t) => {
          const active = isActive(pathname, t.href);
          if (t.primary) {
            return (
              <Link key={t.href} href={t.href} data-tour={t.href} aria-label={t.label} className="w-[54px] h-[54px] rounded-full bg-mint text-forest flex items-center justify-center">
                <t.icon size={24} strokeWidth={2.2} aria-hidden="true" />
              </Link>
            );
          }
          return (
            <Link
              key={t.href}
              href={t.href}
              data-tour={t.href}
              aria-label={t.label}
              aria-current={active ? 'page' : undefined}
              className={cn('w-12 h-12 rounded-full flex items-center justify-center', active ? 'bg-[#0B1913] text-mint' : 'text-[#A9C2B3]')}
            >
              <t.icon size={21} strokeWidth={1.9} aria-hidden="true" />
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMore(true)}
          data-tour="more"
          aria-label="More"
          aria-expanded={more}
          className={cn('w-12 h-12 rounded-full flex items-center justify-center', more ? 'bg-[#0B1913] text-mint' : 'text-[#A9C2B3]')}
        >
          <MoreHorizontal size={22} aria-hidden="true" />
        </button>
      </nav>

      {more && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="All pages">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/45" onClick={() => setMore(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[28px] bg-surface text-ink pb-safe animate-slide-up">
            <div className="sticky top-0 bg-surface flex items-center justify-between px-5 pt-4 pb-2">
              <span className="font-display text-[24px]">Everything</span>
              <button type="button" onClick={() => setMore(false)} aria-label="Close" className="w-11 h-11 rounded-full hover:bg-raised flex items-center justify-center">
                <X size={20} />
              </button>
            </div>
            <div className="px-4 pt-1">
              <GroupSwitcher onShell={false} />
            </div>
            {groups.map((g) => (
              <div key={g.title} className="px-4 pt-3">
                <div className="px-1 pb-2 text-[13px] text-ink-3">{g.title}</div>
                <div className="grid grid-cols-2 gap-2">
                  {g.items.map((it) => {
                    const active = isActive(pathname, it.href);
                    return (
                      <Link
                        key={it.href}
                        href={it.href}
                        onClick={() => setMore(false)}
                        className={cn('flex items-center gap-2.5 h-[52px] px-3.5 rounded-[14px] text-[14px]', active ? 'bg-tint text-brand font-medium' : 'bg-surface-2 hover:bg-raised')}
                      >
                        <it.icon size={18} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
                        <span className="truncate">{it.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="px-4 pt-5 pb-8 flex flex-col gap-2">
              {isOfficial && (
                <Link href={variant === 'admin' ? '/dashboard' : '/admin/dashboard'} className="flex items-center gap-2.5 h-[52px] px-3.5 rounded-[14px] bg-sage text-sage-ink text-[14px] font-medium">
                  <ArrowLeftRight size={18} aria-hidden="true" />
                  {variant === 'admin' ? 'Switch to member view' : 'Switch to officials view'}
                </Link>
              )}
              <button type="button" onClick={signOut} className="flex items-center gap-2.5 h-[52px] px-3.5 rounded-[14px] text-danger text-[14px] font-medium hover:bg-danger-soft">
                <LogOut size={18} aria-hidden="true" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

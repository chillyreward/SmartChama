'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftRight, LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { signOut } from '@/lib/auth-helpers';
import GroupSwitcher from '@/components/GroupSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo, cn, initialsOf } from '@/components/ui';
import { ADMIN_NAV, MEMBER_NAV, OFFICIAL_ROLES, ROLE_LABEL, isActive } from '@/components/shell/nav';

export function Sidebar({ variant }: { variant: 'admin' | 'member' }) {
  const pathname = usePathname();
  const { member } = useAuth();
  const groups = variant === 'admin' ? ADMIN_NAV : MEMBER_NAV;
  const isOfficial = !!member?.role && OFFICIAL_ROLES.includes(member.role);

  return (
    <aside className="w-[264px] h-screen flex flex-col shrink-0 bg-shell text-shell-ink">
      <div className="h-[68px] px-5 flex items-center justify-between">
        <Logo href={variant === 'admin' ? '/admin/dashboard' : '/dashboard'} size="sm" />
        <div className="flex items-center gap-1.5">
          {variant === 'admin' && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-shell-2 text-mint">Officials</span>
          )}
          <ThemeToggle onShell className="w-9 h-9" />
        </div>
      </div>

      <div className="px-3 pb-3">
        <GroupSwitcher />
      </div>

      <nav aria-label={variant === 'admin' ? 'Officials' : 'Group'} className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((g) => (
          <div key={g.title} className="mt-4 first:mt-1">
            <div className="px-3 pb-1.5 text-[12px] text-[#6F8E7B]">{g.title}</div>
            <ul className="flex flex-col gap-0.5">
              {g.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'h-10 px-3 flex items-center gap-3 rounded-[10px] text-[14px] transition-colors',
                        active ? 'bg-shell-2 text-shell-ink font-medium' : 'text-shell-muted hover:bg-shell-2/60 hover:text-shell-ink',
                      )}
                    >
                      <item.icon size={18} strokeWidth={1.8} className={cn('shrink-0', active && 'text-mint')} aria-hidden="true" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[#1F3A2D] flex flex-col gap-1">
        {isOfficial && (
          <Link
            href={variant === 'admin' ? '/dashboard' : '/admin/dashboard'}
            className="h-10 px-3 flex items-center gap-3 rounded-[10px] text-[14px] text-shell-muted hover:bg-shell-2 hover:text-shell-ink"
          >
            <ArrowLeftRight size={18} strokeWidth={1.8} aria-hidden="true" />
            {variant === 'admin' ? 'Switch to member view' : 'Switch to officials view'}
          </Link>
        )}
        {member && (
          <Link
            href={variant === 'admin' ? '/admin/profile' : '/dashboard/profile'}
            className="flex items-center gap-3 px-2 py-2 rounded-[12px] hover:bg-shell-2"
          >
            <span className="w-9 h-9 rounded-full bg-lavender text-forest flex items-center justify-center text-[13px] font-semibold shrink-0">
              {initialsOf(member.full_name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] truncate">{member.full_name || 'Your profile'}</span>
              <span className="block text-[12px] text-shell-muted">{ROLE_LABEL[member.role] || 'Member'}</span>
            </span>
          </Link>
        )}
        <button
          type="button"
          onClick={signOut}
          className="h-10 px-3 flex items-center gap-3 rounded-[10px] text-[14px] text-shell-muted hover:bg-shell-2 hover:text-[#F6B3AA]"
        >
          <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

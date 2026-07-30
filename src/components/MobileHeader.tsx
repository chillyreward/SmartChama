'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';

import { ThemeToggle } from '@/components/ThemeToggle';

export default function MobileHeader({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const { member, group } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const chamaName = group?.name || 'SmartChama Group';
  const fullName = member?.full_name || '';

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  useEffect(() => {
    if (group?.id) {
      // Query notifications count
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', group.id)
        .eq('read', false)
        .then(({ count }) => {
          setUnreadCount(count || 0);
        });

      // Realtime subscription for notifications unread count
      const channel = supabase
        .channel('mobile_header_notifications')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `group_id=eq.${group.id}` },
          () => {
            supabase
              .from('notifications')
              .select('id', { count: 'exact', head: true })
              .eq('group_id', group.id)
              .eq('read', false)
              .then(({ count }) => setUnreadCount(count || 0));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [group]);

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 sidebar-bg border-b border-[var(--border)] h-14 flex items-center justify-between px-4 pt-safe">
      {/* Left: Logo + group name */}
      <div className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="SmartChama Logo"
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
        />
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[15px] font-bold leading-tight text-[var(--text-main)]">
              SmartChama
            </p>
            {isAdmin && (
              <span className="text-[9px] font-extrabold tracking-wider bg-red-50 dark:bg-red-950/20 text-[#ba1a1a] dark:text-red-400 px-1.5 py-0.5 rounded border border-red-200/50 dark:border-red-900/30 uppercase shrink-0">
                Admin
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-tight">
            {chamaName}
          </p>
        </div>
      </div>

      {/* Right: theme toggle + notification bell + avatar */}
      <div className="flex items-center gap-1.5">
        <ThemeToggle />

        {/* Notification bell with badge */}
        <button
          onClick={() => router.push(isAdmin ? '/admin/announcements' : '/dashboard/notifications')}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[#edf6ea] dark:hover:bg-[#1a2a1a] transition-colors"
          aria-label="View notifications"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#22C55E] text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile avatar */}
        <button
          onClick={() => router.push(isAdmin ? '/admin/profile' : '/dashboard/profile')}
          className="w-8 h-8 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0 hover:opacity-90 transition-opacity"
        >
          {getInitials(fullName)}
        </button>
      </div>
    </header>
  );
}

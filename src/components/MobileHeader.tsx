'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoMark, initialsOf } from '@/components/ui';
import { ROLE_LABEL } from '@/components/shell/nav';

export default function MobileHeader({ isAdmin = false }: { isAdmin?: boolean }) {
  const { member, group } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!group?.id) return;
    const load = () =>
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('chama_id', group.id)
        .eq('read', false)
        .then(({ count }) => setUnread(count || 0));
    load();
    const channel = supabase
      .channel(`mobile_header_notifications_${group.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `chama_id=eq.${group.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [group?.id]);

  return (
    <header className="lg:hidden fixed top-0 inset-x-0 z-30 bg-page/90 backdrop-blur-md border-b border-line pt-safe">
      <div className="h-[60px] px-4 flex items-center justify-between gap-3">
        <Link href={isAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2.5 min-w-0">
          <LogoMark size={30} />
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold leading-tight truncate">{group?.name || 'Akibora'}</span>
            <span className="block text-[12px] text-ink-3 leading-tight">
              {isAdmin ? 'Officials view' : ROLE_LABEL[member?.role || 'member'] || 'Member'}
            </span>
          </span>
        </Link>

        <div className="flex items-center">
          <ThemeToggle />
          <Link
            href={isAdmin ? '/admin/announcements' : '/dashboard/notifications'}
            className="relative w-11 h-11 rounded-full inline-flex items-center justify-center text-ink-2 hover:bg-raised"
            aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          >
            <Bell size={19} aria-hidden="true" />
            {unread > 0 && (
              <span className="absolute top-2 right-2 min-w-4 h-4 px-1 rounded-full bg-mint text-forest text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
          <Link
            href={isAdmin ? '/admin/profile' : '/dashboard/profile'}
            aria-label="Your profile"
            className="ml-1 w-9 h-9 rounded-full bg-lavender text-forest flex items-center justify-center text-[13px] font-semibold"
          >
            {initialsOf(member?.full_name)}
          </Link>
        </div>
      </div>
    </header>
  );
}

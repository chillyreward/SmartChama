'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
import { Coins, UserPlus } from 'lucide-react';
import { EmptyState, PageHeader, Panel, Skeleton, cn, formatKsh } from '@/components/ui';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

export default function GroupActivityPage() {
  const { member, group, isLoading } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      if (!member || !group) return;
      
      try {
        // Fetch recent contributions
        const { data: contributions } = await supabase
          .from('contributions_v2')
          .select(`
            id, 
            amount, 
            created_at, 
            membership:chama_memberships (
              profile:profiles (
                full_name
              )
            )
          `)
          .eq('chama_id', group.id)
          .order('created_at', { ascending: false })
          .limit(20);
          
        // Fetch members joined
        const { data: newMembers } = await supabase
          .from('chama_memberships')
          .select(`
            id, 
            created_at,
            profile:profiles (
              full_name
            )
          `)
          .eq('chama_id', group.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        const combined = [];
        
        if (contributions) {
          combined.push(...contributions.map((c: any) => ({
            id: `c-${c.id}`,
            type: 'contribution',
            title: 'Contribution paid',
            description: `${c.membership?.profile?.full_name ?? 'Someone'} paid ${formatKsh(c.amount)}`,
            date: new Date(c.created_at),
            icon: 'payments',
            color: 'text-[var(--ak-brand-ink)]',
            bg: 'bg-emerald-500/10'
          })));
        }
        
        
        if (newMembers) {
          combined.push(...newMembers.map((m: any) => ({
            id: `m-${m.id}`,
            type: 'member',
            title: 'New member',
            description: `${m.profile?.full_name ?? 'Someone'} joined the group`,
            date: new Date(m.created_at),
            icon: 'person_add',
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
          })));
        }
        
        // Sort by date descending
        combined.sort((a, b) => b.date.getTime() - a.date.getTime());
        
        setActivities(combined.slice(0, 30));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (!isLoading) {
      loadActivity();
    }
  }, [isLoading, member, group]);

  if (isLoading || loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Group activity" subtitle={`Payments and new members in ${group?.name || 'your group'}, newest first.`} />
      <Panel>
        {activities.length === 0 ? (
          <EmptyState title="Nothing has happened yet">When members pay or join, it shows up here.</EmptyState>
        ) : (
          <ol className="relative ml-4 border-l border-line-strong/40">
            {activities.map((a) => (
              <li key={a.id} className="relative pl-8 pb-7 last:pb-1">
                <span aria-hidden="true" className={cn('absolute -left-[17px] top-0 w-[34px] h-[34px] rounded-full flex items-center justify-center ring-4 ring-surface', a.type === 'member' ? 'bg-lavender text-lavender-ink' : 'bg-mint text-forest')}>
                  {a.type === 'member' ? <UserPlus size={16} /> : <Coins size={16} />}
                </span>
                <div className="text-[16px] font-medium">{a.title}</div>
                <p className="text-[15px] text-ink-2 mt-0.5">{a.description}</p>
                <time className="block text-[13px] text-ink-3 mt-1">
                  {a.date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}, {a.date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                </time>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}

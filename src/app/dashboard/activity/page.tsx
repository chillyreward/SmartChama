'use client';

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
          
        // Fetch recent loans
        const { data: loans } = await supabase
          .from('loans_v2')
          .select(`
            id, 
            amount, 
            status, 
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
            title: 'Contribution Added',
            description: `${c.membership?.profile?.full_name ?? 'Someone'} contributed KSh ${c.amount}`,
            date: new Date(c.created_at),
            icon: 'payments',
            color: 'text-[#22C55E]',
            bg: 'bg-emerald-500/10'
          })));
        }
        
        if (loans) {
          combined.push(...loans.map((l: any) => ({
            id: `l-${l.id}`,
            type: 'loan',
            title: `Loan ${l.status === 'active' ? 'Approved' : 'Requested'}`,
            description: `${l.membership?.profile?.full_name ?? 'Someone'} ${l.status === 'active' ? 'received a loan of' : 'requested a loan of'} KSh ${l.amount}`,
            date: new Date(l.created_at),
            icon: 'account_balance',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
          })));
        }
        
        if (newMembers) {
          combined.push(...newMembers.map((m: any) => ({
            id: `m-${m.id}`,
            type: 'member',
            title: 'New Member Joined',
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
      <div className="p-8 h-full flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="p-8 font-inter max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold font-geist" style={{ color: 'var(--text-primary)' }}>Group Activity</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Recent events in {group?.name}</p>
      </div>

      <div className="rounded-xl shadow-sm p-6 transition-colors" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {activities.length === 0 ? (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-5xl mb-2" style={{ color: 'var(--text-muted)' }}>history</span>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No recent activity found.</p>
          </div>
        ) : (
          <div className="relative border-l-2 ml-4 pl-6 space-y-8" style={{ borderColor: 'var(--border)' }}>
            {activities.map((activity) => (
              <div key={activity.id} className="relative">
                {/* Timeline Dot */}
                <div 
                  className={`absolute -left-[35px] w-8 h-8 rounded-full flex items-center justify-center ${activity.bg} shadow-sm`}
                  style={{ border: '2px solid var(--bg-card)' }}
                >
                  <span className={`material-symbols-outlined text-sm ${activity.color}`}>
                    {activity.icon}
                  </span>
                </div>
                
                {/* Content */}
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{activity.title}</h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{activity.description}</p>
                  <div className="text-xs mt-2 font-mono" style={{ color: 'var(--text-muted)' }}>
                    {activity.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

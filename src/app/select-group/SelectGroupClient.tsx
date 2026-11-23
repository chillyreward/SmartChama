'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

export default function SelectGroupClient() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMemberships() {
      const { data: { user } } = await supabase.auth.getUser();
      const session = user ? { user } : null;
      if (cancelled) return;
      if (!session) {
        router.push('/login');
        return;
      }

      if (!user?.id) return;

      const { data } = await supabase
        .from('chama_memberships')
        .select(`
          id, role, trust_score, joined_at,
          chamas_v2 (
            id, name, county, contribution_amount
          )
        `)
        .eq('profile_id', user.id)
        .eq('status', 'active');

      if (cancelled) return;
      if (data) {
        setMemberships(data);
      }
      setLoading(false);
    }

    loadMemberships();
    return () => { cancelled = true; };
  }, [router, supabase]);

  const handleSelect = (chamaId: string, role: string) => {
    sessionStorage.setItem('active_chama_id', chamaId);
    document.cookie = `active_chama_id=${chamaId}; path=/; max-age=${60 * 60 * 24 * 30}`;
    
    const isAdmin = ['admin', 'chairlady', 'treasurer', 'secretary'].includes(role);
    router.push(isAdmin ? '/admin/dashboard' : '/dashboard');
  };

  const getTrustStatusLabel = (score: number) => {
    if (score >= 80) {
      return (
        <span className="text-[var(--ak-brand-ink)] dark:text-[var(--ak-brand-ink)] bg-[var(--ak-tint)] dark:bg-[var(--ak-tint)] px-2 py-1 rounded text-xs font-semibold">
          Excellent Standing
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="text-yellow-800 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded text-xs font-semibold">
          Good Standing
        </span>
      );
    }
    return (
      <span className="text-red-800 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-xs font-semibold">
        Needs Attention
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ak-surface-2)] dark:bg-[var(--ak-page)] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-[var(--ak-brand-ink)] border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ak-surface-2)] dark:bg-[var(--ak-page)] p-6 pt-20 transition-colors duration-300 text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)]">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 justify-center mb-8">
          <Image
            src="/logo.png"
            alt="Akibora"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
          />
          <span className="text-[24px] font-bold tracking-tight text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)]">
            Akibora
          </span>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-[32px] font-bold text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] ">Choose a group</h1>
          <p className="text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] mt-2">You belong to multiple savings groups. Select one to continue.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {memberships.map((m) => {
            const chama = m.chamas_v2 as any;
            const isLeadership = ['admin', 'chairlady', 'treasurer', 'secretary'].includes(m.role);
            
            return (
              <div 
                key={m.id} 
                onClick={() => handleSelect(chama.id, m.role)}
                className="bg-white dark:bg-[var(--ak-surface)] border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-2xl p-6 hover:border-[var(--ak-brand-ink)] cursor-pointer transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-headline-sm font-bold text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] leading-tight">{chama.name}</h2>
                    <span className={`px-2 py-1 rounded text-xs font-semibold capitalize whitespace-nowrap ml-2 ${
                      isLeadership 
                        ? 'bg-[var(--ak-tint)] dark:bg-[var(--ak-tint)] text-[var(--ak-brand-ink)] dark:text-[var(--ak-brand-ink)]' 
                        : 'bg-gray-100 dark:bg-[var(--ak-raised)] text-gray-800 dark:text-[var(--ak-text-3)]'
                    }`}>
                      {m.role}
                    </span>
                  </div>
                  
                  <div className="text-body-sm text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] mb-4">
                    KSh {chama.contribution_amount.toLocaleString()} / month
                  </div>

                  <div>
                    {getTrustStatusLabel(m.trust_score)}
                  </div>
                </div>

                <div className="border-t border-[var(--ak-line)] dark:border-[var(--ak-line)] pt-4 mt-6 flex justify-between items-center text-xs text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] font-medium">
                  <span>{chama.county || 'Nairobi'}</span>
                  <span>Joined {new Date(m.joined_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link href="/onboarding" className="text-sm font-semibold text-[var(--ak-brand-ink)] dark:text-[var(--ak-brand-ink)] hover:underline">
            + Create a new group
          </Link>
        </div>
      </div>
    </div>
  );
}

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
        <span className="text-[#166534] dark:text-[#4ae176] bg-[#dcfce7] dark:bg-[#1a3a1a] px-2 py-1 rounded text-xs font-semibold">
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
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F0C] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F0C] p-6 pt-20 font-inter transition-colors duration-300 text-[#161d16] dark:text-[#E8F0E4]">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 justify-center mb-8">
          <Image
            src="/logo.png"
            alt="SmartChama"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
          />
          <span className="text-[24px] font-bold tracking-tight text-[#161d16] dark:text-[#E8F0E4]">
            SmartChama
          </span>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-[32px] font-bold text-[#161d16] dark:text-[#E8F0E4] font-geist">Choose a group</h1>
          <p className="text-[#60645f] dark:text-[#8FA88F] mt-2">You belong to multiple savings groups. Select one to continue.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {memberships.map((m) => {
            const chama = m.chamas_v2 as any;
            const isLeadership = ['admin', 'chairlady', 'treasurer', 'secretary'].includes(m.role);
            
            return (
              <div 
                key={m.id} 
                onClick={() => handleSelect(chama.id, m.role)}
                className="bg-white dark:bg-[#161d16] border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-2xl p-6 hover:border-[#22C55E] cursor-pointer transition-colors shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-headline-sm font-bold text-[#161d16] dark:text-[#E8F0E4] font-geist leading-tight">{chama.name}</h2>
                    <span className={`px-2 py-1 rounded text-xs font-semibold capitalize whitespace-nowrap ml-2 ${
                      isLeadership 
                        ? 'bg-[#dcfce7] dark:bg-[#1a3a1a] text-[#166534] dark:text-[#4ae176]' 
                        : 'bg-gray-100 dark:bg-[#1f2a1f] text-gray-800 dark:text-[#8FA88F]'
                    }`}>
                      {m.role}
                    </span>
                  </div>
                  
                  <div className="text-body-sm text-[#60645f] dark:text-[#8FA88F] mb-4">
                    KSh {chama.contribution_amount.toLocaleString()} / month
                  </div>

                  <div>
                    {getTrustStatusLabel(m.trust_score)}
                  </div>
                </div>

                <div className="border-t border-[#E5E7EB] dark:border-[#2d3d2d] pt-4 mt-6 flex justify-between items-center text-xs text-[#60645f] dark:text-[#8FA88F] font-medium">
                  <span>{chama.county || 'Nairobi'}</span>
                  <span>Joined {new Date(m.joined_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link href="/onboarding" className="text-sm font-semibold text-[#006e2f] dark:text-[#4ae176] hover:underline">
            + Create a new group
          </Link>
        </div>
      </div>
    </div>
  );
}

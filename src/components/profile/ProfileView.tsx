'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Camera, ChevronRight, Plus, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { loadNationalId } from '@/lib/private-profile';
import { ROLE_LABEL } from '@/components/shell/nav';
import { Avatar, ButtonLink, Chip, Money, Notice, Panel, PanelTitle, Skeleton, cn } from '@/components/ui';

type Profile = {
  full_name: string | null; email: string | null; phone_number: string | null; county: string | null;
  occupation: string | null; avatar_url: string | null; kyc_status: string | null; phone_verified_at: string | null;
};
type GroupRow = {
  membershipId: string; chamaId: string; name: string; role: string; status: string;
  joinedAt: string | null; trust: number; streak: number; saved: number;
};

const OFFICIAL = ['admin', 'chairlady', 'treasurer', 'secretary'];

function switchTo(chamaId: string, role: string) {
  try {
    sessionStorage.setItem('active_chama_id', chamaId);
    localStorage.setItem('sc_last_chama_id', chamaId);
  } catch { /* ignore */ }
  document.cookie = `active_chama_id=${chamaId}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  window.location.href = OFFICIAL.includes(role) ? '/admin/dashboard' : '/dashboard';
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

export default function ProfileView({ variant }: { variant: 'member' | 'admin' }) {
  const { session, group, refreshMemberData } = useAuth();
  const userId = session?.user?.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [nationalId, setNationalId] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'danger'; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [profRes, memRes, nid] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, email, phone_number, county, occupation, avatar_url, kyc_status, phone_verified_at')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('chama_memberships')
        .select('id, chama_id, role, status, joined_at, trust_score, contribution_streak, chamas_v2 ( name )')
        .eq('profile_id', userId)
        .in('status', ['active', 'pending'])
        .order('joined_at', { ascending: false, nullsFirst: false }),
      loadNationalId(supabase, userId).catch(() => ''),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- joined row
    const mems = ((memRes.data || []) as any[]);
    const ids = mems.map((m) => m.id);
    const totals: Record<string, number> = {};
    if (ids.length) {
      const { data: contribs } = await supabase
        .from('contributions_v2')
        .select('membership_id, amount')
        .in('membership_id', ids)
        .eq('status', 'confirmed');
      (contribs || []).forEach((c) => { totals[c.membership_id] = (totals[c.membership_id] || 0) + Number(c.amount); });
    }

    setProfile((profRes.data as Profile) || null);
    setNationalId(nid);
    setGroups(mems.map((m) => ({
      membershipId: m.id,
      chamaId: m.chama_id,
      name: m.chamas_v2?.name || 'Group',
      role: m.role,
      status: m.status,
      joinedAt: m.joined_at,
      trust: m.trust_score ?? 0,
      streak: m.contribution_streak ?? 0,
      saved: totals[m.id] || 0,
    })));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 5 * 1024 * 1024) { setMsg({ tone: 'danger', text: 'Choose a photo under 5 MB.' }); return; }
    setUploading(true);
    setMsg(null);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${userId}/avatar.${ext}`;
    const up = await supabase.storage.from('avatars').upload(path, file, { upsert: true, cacheControl: '60' });
    if (up.error) { setUploading(false); setMsg({ tone: 'danger', text: 'The photo did not upload. Try again.' }); return; }
    const url = `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
    setUploading(false);
    if (error) { setMsg({ tone: 'danger', text: 'The photo uploaded but could not be saved to your profile.' }); return; }
    setProfile((p) => (p ? { ...p, avatar_url: url } : p));
    setMsg({ tone: 'ok', text: 'Your photo is updated.' });
    refreshMemberData();
  }

  if (loading || !profile) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-56 rounded-[28px]" />
        <Skeleton className="h-40" />
        <div className="grid md:grid-cols-2 gap-4"><Skeleton className="h-52" /><Skeleton className="h-52" /></div>
      </div>
    );
  }

  const current = groups.find((g) => g.chamaId === group?.id) || groups[0];
  const active = groups.filter((g) => g.status === 'active');
  const totalSaved = active.reduce((s, g) => s + g.saved, 0);
  const verified = profile.kyc_status === 'verified';

  return (
    <div className="flex flex-col gap-4">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <Panel tone="forest" className="rounded-[28px] sm:p-8">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative shrink-0">
            <Avatar name={profile.full_name} src={profile.avatar_url} size={80} tone="lavender" />
            <label className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-mint text-forest flex items-center justify-center cursor-pointer hover:bg-[#9BEBBD] focus-within:ring-2 focus-within:ring-white">
              <Camera size={16} aria-hidden="true" />
              <span className="sr-only">Change your photo</span>
              <input type="file" accept="image/*" className="sr-only" onChange={onAvatar} disabled={uploading} />
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[28px] sm:text-[40px] leading-tight break-words">{profile.full_name || 'Your profile'}</h1>
            <p className="text-[14px] sm:text-[15px] text-[#A9C2B3] mt-1">
              {active.length === 1 ? 'Member of 1 group' : `Member of ${active.length} groups`}
              {verified && <span className="inline-flex items-center gap-1 ml-2 text-mint"><BadgeCheck size={15} aria-hidden="true" />ID verified</span>}
            </p>
            {uploading && <p className="text-[13px] text-mint mt-1">Uploading your photo…</p>}
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-3 mt-7 pt-5 border-t border-[#234235]">
          <div className="min-w-0">
            <dd><Money value={totalSaved} className="text-[20px] sm:text-[28px]" /></dd>
            <dt className="text-[12px] sm:text-[13px] text-[#8FAA9B]">saved, all groups</dt>
          </div>
          <div>
            <dd className="font-money text-[20px] sm:text-[28px] text-mint">{current?.trust ?? 0}</dd>
            <dt className="text-[12px] sm:text-[13px] text-[#8FAA9B]">trust score</dt>
          </div>
          <div>
            <dd className="font-money text-[20px] sm:text-[28px]">{current?.streak ?? 0}</dd>
            <dt className="text-[12px] sm:text-[13px] text-[#8FAA9B]">month streak</dt>
          </div>
        </dl>
      </Panel>

      <Panel>
        <PanelTitle>Your groups</PanelTitle>
        <p className="text-[14px] text-ink-3 mt-1">One account works across every chama you belong to. Tap a group to open it.</p>
        {groups.length === 0 ? (
          <p className="text-[15px] text-ink-2 mt-4">You are not in a group yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {groups.map((g) => {
              const isCurrent = g.chamaId === group?.id;
              const pending = g.status === 'pending';
              return (
                <li key={g.membershipId}>
                  <button
                    type="button"
                    disabled={pending || isCurrent}
                    onClick={() => switchTo(g.chamaId, g.role)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 sm:p-4 rounded-[18px] text-left border transition-colors',
                      isCurrent ? 'bg-tint border-transparent' : 'bg-surface-2 border-line hover:bg-raised disabled:hover:bg-surface-2',
                    )}
                  >
                    <span className="w-11 h-11 rounded-[12px] bg-sage text-forest flex items-center justify-center font-display text-[20px] shrink-0">
                      {g.name[0]?.toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-semibold truncate">{g.name}</span>
                        {isCurrent && <Chip kind="paid">Open now</Chip>}
                        {pending && <Chip kind="pending">Waiting for approval</Chip>}
                      </span>
                      <span className="block text-[13px] text-ink-3 mt-0.5">
                        {ROLE_LABEL[g.role] || 'Member'}
                        {g.joinedAt && !pending ? ` · since ${fmtDate(g.joinedAt)}` : ''}
                      </span>
                    </span>
                    {!pending && (
                      <span className="text-right shrink-0">
                        <Money value={g.saved} className="text-[16px] sm:text-[18px] block" />
                        <span className="text-[12px] text-ink-3">saved</span>
                      </span>
                    )}
                    {!pending && !isCurrent && <ChevronRight size={18} className="text-ink-3 shrink-0" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <ButtonLink href="/onboarding?intent=join" variant="outline"><UserPlus size={17} aria-hidden="true" />Join with a group code</ButtonLink>
          <ButtonLink href="/onboarding?intent=create" variant="ghost"><Plus size={17} aria-hidden="true" />Start another group</ButtonLink>
        </div>
      </Panel>

      <div className="grid md:grid-cols-2 gap-4">
        <Panel>
          <PanelTitle action={<ButtonLink href="/dashboard/settings" variant="ghost" size="sm">Edit</ButtonLink>}>Your details</PanelTitle>
          <dl className="mt-2 divide-y divide-line text-[15px]">
            {[
              ['Phone', profile.phone_number ? `${profile.phone_number}${profile.phone_verified_at ? '' : ' (not verified)'}` : 'Not added'],
              ['Email', profile.email || session?.user?.email || 'Not added'],
              ['County', profile.county || 'Not added'],
              ['Occupation', profile.occupation || 'Not added'],
              ['National ID', nationalId ? `•••• ${nationalId.slice(-3)}` : 'Not added'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3">
                <dt className="text-ink-3 shrink-0">{k}</dt>
                <dd className="text-right min-w-0 break-words">{v}</dd>
              </div>
            ))}
          </dl>
          {!verified && variant === 'admin' && (
            <Link href="/verify-identity" className="mt-3 inline-flex items-center gap-1.5 text-[14px] text-brand font-medium hover:underline underline-offset-4">
              <BadgeCheck size={16} aria-hidden="true" />Verify your ID
            </Link>
          )}
        </Panel>
        <Panel tone="sage" className="flex flex-col">
          <ShieldCheck size={26} aria-hidden="true" />
          <h2 className="font-display text-[26px] mt-3">Proof that you save</h2>
          <p className="text-[15px] leading-relaxed text-[#2B4637] mt-2 mb-5">
            Your credit passport is a one-page PDF of your score and record in the group that&apos;s open now. Nobody sees it unless you share it.
          </p>
          <ButtonLink href="/dashboard/trust-score" variant="forest" className="mt-auto self-start">See your score and passport</ButtonLink>
        </Panel>
      </div>
    </div>
  );
}

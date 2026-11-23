'use client'
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
import { Camera, ShieldCheck } from 'lucide-react'
import { Avatar, ButtonLink, Money, Notice, Panel, PanelTitle, Skeleton } from '@/components/ui'
import { ROLE_LABEL } from '@/components/shell/nav'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

import { loadNationalId, saveNationalId } from '@/lib/private-profile'
import PhoneVerification from '@/components/PhoneVerification'
export default function ProfilePage() {
  const { session, member, group, isLoading: authLoading, refreshMemberData } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [editMode, setEditMode] = useState(false)

  // Profile Form States
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [county, setCounty] = useState('Nairobi')
  const [occupation, setOccupation] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Lender visibility & Financial identity states
  const [lenderVisibility, setLenderVisibility] = useState(false)
  const [totalContributed, setTotalContributed] = useState(0)
  const [joinDateStr, setJoinDateStr] = useState('')

  const getInitials = (name: string) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const loadProfileData = async () => {
    if (!session?.user?.id || !member) return
    try {
      setLoading(true)
      setErrorMsg('')

      // 1. Fetch profile details
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profErr) throw profErr

      if (profile) {
        setFullName(profile.full_name || '')
        setPhone(profile.phone_number || '')
        setEmail(profile.email || session.user.email || '')
        setNationalId(await loadNationalId(supabase as any, session.user.id))
        setCounty(profile.county || 'Nairobi')
        setOccupation(profile.occupation || '')
        setAvatarUrl(profile.avatar_url || '')
        
        // Load lender visibility from notification prefs JSONB or default to false
        const prefs = profile.notification_prefs || {}
        setLenderVisibility(!!prefs.lender_visibility)
      }

      // 2. Fetch total contribution from contributions_v2
      const { data: contributions, error: contErr } = await supabase
        .from('contributions_v2')
        .select('amount')
        .eq('membership_id', member.id)
        .eq('status', 'confirmed')

      if (!contErr && contributions) {
        const sum = contributions.reduce((s, c) => s + Number(c.amount), 0)
        setTotalContributed(sum)
      }

      // 3. Joined date
      if (member.joined_at) {
        setJoinDateStr(new Date(member.joined_at).toLocaleDateString('en-KE', {
          year: 'numeric', month: 'long', day: 'numeric'
        }))
      } else {
        setJoinDateStr('Not Joined')
      }

    } catch (err: any) {
      console.error(err)
      setErrorMsg('Failed to load profile details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && member) {
      loadProfileData()
    }
  }, [authLoading, member])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return

    try {
      setSaving(true)
      setErrorMsg('')
      setToastMsg('')

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          county,
          occupation
        })
        .eq('id', session.user.id)

      if (error) {
        if (error.code === '23505') {
          throw new Error('This phone number is already registered to another user.')
        }
        throw error
      }

      setToastMsg('Profile updated successfully!')
      setEditMode(false)
      setTimeout(() => setToastMsg(''), 3000)
      await refreshMemberData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !session?.user?.id) return

    try {
      setUploadingAvatar(true)
      setErrorMsg('')
      setToastMsg('')

      const fileExt = file.name.split('.').pop()
      const filePath = `${session.user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      if (data?.publicUrl) {
        const publicUrl = data.publicUrl
        
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', session.user.id)

        if (updateErr) throw updateErr
        setAvatarUrl(publicUrl)
        setToastMsg('Your photo is updated.')
        setTimeout(() => setToastMsg(''), 3000)
        await refreshMemberData()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Avatar upload failed.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const countiesList = [
    "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado",
    "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia",
    "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi",
    "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita Taveta", "Tana River",
    "Tharaka Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
  ]

  const score = member?.trust_score ?? 0

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-64 rounded-[28px]" />
        <div className="grid md:grid-cols-2 gap-4"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
      </div>
    )
  }

  return (
    <div>
      {toastMsg && <Notice tone="ok" className="mb-4">{toastMsg}</Notice>}
      {errorMsg && <Notice tone="danger" className="mb-4">{errorMsg}</Notice>}

      <Panel tone="forest" className="rounded-[28px] sm:p-8 mb-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative">
            <Avatar name={fullName} src={avatarUrl || null} size={96} tone="lavender" />
            <label className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-mint text-forest flex items-center justify-center cursor-pointer hover:bg-[#9BEBBD] focus-within:ring-2 focus-within:ring-mint" title="Change photo">
              <Camera size={18} aria-hidden="true" />
              <span className="sr-only">Change your photo</span>
              <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            </label>
          </div>
          <div className="flex-1 min-w-[220px]">
            <h1 className="font-display text-[34px] sm:text-[42px] leading-tight">{fullName || 'Your profile'}</h1>
            <p className="text-[15px] text-[#A9C2B3] mt-1">
              {ROLE_LABEL[member?.role || 'member'] || 'Member'} of {group?.name || 'your group'}{joinDateStr ? ` since ${joinDateStr}` : ''}
            </p>
            {uploadingAvatar && <p className="text-[13px] text-mint mt-2">Uploading your photo…</p>}
          </div>
          <div className="text-right">
            <div className="font-money text-[64px] leading-none text-mint">{score}</div>
            <div className="text-[13px] text-[#8FAA9B] mt-1">trust score</div>
          </div>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#234235]">
          <div><dd><Money value={totalContributed} className="text-[24px] sm:text-[28px]" /></dd><dt className="text-[13px] text-[#8FAA9B]">contributed</dt></div>
          <div><dd className="font-money text-[24px] sm:text-[28px]">{member?.contribution_streak ?? 0}</dd><dt className="text-[13px] text-[#8FAA9B]">month streak</dt></div>
          <div className="col-span-2 sm:col-span-1"><dd className="text-[16px] mt-2">{phone || 'No phone yet'}</dd><dt className="text-[13px] text-[#8FAA9B]">sign-in phone</dt></div>
        </dl>
      </Panel>

      <div className="grid md:grid-cols-2 gap-4">
        <Panel>
          <PanelTitle action={<ButtonLink href="/dashboard/settings" variant="ghost" size="sm">Edit</ButtonLink>}>Your details</PanelTitle>
          <dl className="mt-3 divide-y divide-line text-[15px]">
            {[
              ['Email', email || 'Not added'],
              ['County', county || 'Not added'],
              ['Occupation', occupation || 'Not added'],
              ['National ID', nationalId ? `•••• ${nationalId.slice(-3)}` : 'Not added'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3"><dt className="text-ink-3">{k}</dt><dd className="text-right">{v}</dd></div>
            ))}
          </dl>
        </Panel>
        <Panel tone="sage" className="flex flex-col">
          <ShieldCheck size={26} aria-hidden="true" />
          <h2 className="font-display text-[26px] mt-3">Proof that you save</h2>
          <p className="text-[15px] leading-relaxed text-[#2B4637] mt-2">
            Download your credit passport, a one-page PDF of your score and record in this group, whenever a lender or SACCO asks. Nobody sees it unless you share it.
          </p>
          <ButtonLink href="/dashboard/trust-score" variant="forest" className="mt-auto self-start">See your score and passport</ButtonLink>
        </Panel>
      </div>
    </div>
  )
}

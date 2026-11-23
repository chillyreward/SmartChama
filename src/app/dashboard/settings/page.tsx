'use client'
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
import { Button, Field, Notice, PageHeader, Panel, PanelTitle, Skeleton, Tabs, cn, inputClass } from '@/components/ui'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-helpers'

import { loadNationalId, saveNationalId } from '@/lib/private-profile'
import PhoneVerification from '@/components/PhoneVerification'
export default function SettingsPage() {
  const { session, member, group, isLoading: authLoading, refreshMemberData } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [activeTab, setActiveTab] = useState<'Profile Details' | 'Notifications' | 'Security'>('Profile Details')
  const tabs = [
    { name: 'Profile Details', icon: 'person' },
    { name: 'Notifications', icon: 'notifications' },
    { name: 'Security', icon: 'shield' }
  ] as const

  // --- Profile States ---
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [county, setCounty] = useState('')
  const [occupation, setOccupation] = useState('')

  // --- Notifications Preferences States ---
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    contribution_reminders: true,
    late_payment_alerts: true,
    monthly_report: true,
    new_member_joins: true,
    whatsapp_notifications: false,
    sms_notifications: true,
    email_notifications: false
  })

  // --- Security States ---
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const loadSettingsData = async () => {
    if (!session?.user?.id) return
    try {
      setLoading(true)
      
      // Load user profile details
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      if (profile) {
        setFullName(profile.full_name || '')
        setEmail(profile.email || '')
        setPhoneNumber(profile.phone_number || '')
        setNationalId(await loadNationalId(supabase as any, session.user.id))
        setCounty(profile.county || '')
        setOccupation(profile.occupation || '')
        if (profile.notification_prefs) {
          setNotifPrefs({
            ...notifPrefs,
            ...profile.notification_prefs
          })
        }
      }

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadSettingsData()
    }
  }, [authLoading])

  // Save Profile Settings
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
          email,
          county,
          occupation
        })
        .eq('id', session.user.id)

      if (error) throw error

      // National ID is stored privately (owner-only), not on the shared profile
      const { error: idError } = await saveNationalId(supabase as any, session.user.id, nationalId.trim())
      if (idError) throw idError

      setToastMsg('Saved.')
      setTimeout(() => setToastMsg(''), 3000)
      await refreshMemberData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  // Toggle Notification Prefs
  const handleTogglePref = async (key: string) => {
    if (!session?.user?.id) return
    const updatedValue = !notifPrefs[key]
    const updatedPrefs = {
      ...notifPrefs,
      [key]: updatedValue
    }
    setNotifPrefs(updatedPrefs)

    try {
      await supabase
        .from('profiles')
        .update({
          notification_prefs: updatedPrefs
        })
        .eq('id', session.user.id)
    } catch (err) {
      console.error('Error saving notification preferences:', err)
    }
  }

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setToastMsg('')

    if (newPassword !== confirmPassword) {
      setErrorMsg('The two passwords don\'t match.')
      return
    }
    if (newPassword.length < 8) {
      setErrorMsg('Use at least 8 characters.')
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setToastMsg('Your password is changed.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setToastMsg(''), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOutAll = signOut;

  const countiesList = [
    "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado",
    "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia",
    "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi",
    "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita Taveta", "Tana River",
    "Tharaka Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
  ]

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: 'bg-gray-200 w-0' }
    if (pwd.length < 6) return { label: 'Weak', color: 'bg-red-500 w-1/3' }
    if (pwd.length < 10) return { label: 'Medium', color: 'bg-amber-500 w-2/3' }
    return { label: 'Strong', color: 'bg-green-500 w-full' }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-52" />
        <Skeleton className="h-11 w-96" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  const PREFS: { key: string; label: string; hint: string; group: 'what' | 'how' }[] = [
    { key: 'contribution_reminders', label: 'Contribution reminders', hint: 'Before and on the day a payment is due', group: 'what' },
    { key: 'late_payment_alerts', label: 'Late payment alerts', hint: 'If a payment is missed or a fine is added', group: 'what' },
    { key: 'monthly_report', label: 'Monthly summary', hint: 'What you and the group saved last month', group: 'what' },
    { key: 'new_member_joins', label: 'New members', hint: 'When someone joins the group', group: 'what' },
    { key: 'sms_notifications', label: 'SMS', hint: 'Works on any phone', group: 'how' },
    { key: 'whatsapp_notifications', label: 'WhatsApp', hint: 'If your group has it switched on', group: 'how' },
    { key: 'email_notifications', label: 'Email', hint: 'To the address on your profile', group: 'how' },
  ]

  const Toggle = ({ k, label, hint }: { k: string; label: string; hint: string }) => (
    <div className="flex items-center justify-between gap-4 py-4 border-t border-line first:border-t-0">
      <div>
        <div className="text-[15px] font-medium">{label}</div>
        <div className="text-[13px] text-ink-3">{hint}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={!!notifPrefs[k]}
        aria-label={label}
        onClick={() => handleTogglePref(k)}
        className={cn('relative w-[52px] h-[30px] rounded-full transition-colors shrink-0', notifPrefs[k] ? 'bg-moss dark:bg-mint' : 'bg-raised border border-line')}
      >
        <span className={cn('absolute top-[3px] w-6 h-6 rounded-full bg-white shadow transition-all', notifPrefs[k] ? 'left-[25px]' : 'left-[3px]')} />
      </button>
    </div>
  )

  return (
    <div>
      <PageHeader title="Settings" subtitle="Your details, how we reach you, and keeping your account safe." />

      <Tabs
        label="Settings sections"
        value={activeTab}
        onChange={(v) => { setActiveTab(v); setErrorMsg(''); setToastMsg('') }}
        className="mb-5"
        items={[{ value: 'Profile Details', label: 'Your details' }, { value: 'Notifications', label: 'Notifications' }, { value: 'Security', label: 'Security' }]}
      />

      {toastMsg && <Notice tone="ok" className="mb-4">{toastMsg}</Notice>}
      {errorMsg && <Notice tone="danger" className="mb-4">{errorMsg}</Notice>}

      {activeTab === 'Profile Details' && (
        <Panel className="max-w-[760px]">
          <form onSubmit={handleSaveProfile} className="grid sm:grid-cols-2 gap-5">
            <Field label="Full name" className="sm:col-span-2">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <PhoneVerification currentPhone={phoneNumber} onVerified={setPhoneNumber} label="Phone number (you sign in with this)" />
            </div>
            <Field label="Email" hint="Optional. Used for statements if you switch email on.">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputClass} />
            </Field>
            <Field label="National ID number" hint="Only you can see this.">
              <input value={nationalId} onChange={(e) => setNationalId(e.target.value)} inputMode="numeric" className={inputClass} />
            </Field>
            <Field label="County">
              <select value={county} onChange={(e) => setCounty(e.target.value)} className={inputClass}>
                <option value="">Choose your county</option>
                {countiesList.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Occupation">
              <input value={occupation} onChange={(e) => setOccupation(e.target.value)} className={inputClass} />
            </Field>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
            </div>
          </form>
        </Panel>
      )}

      {activeTab === 'Notifications' && (
        <div className="grid lg:grid-cols-2 gap-4 max-w-[1000px]">
          <Panel>
            <PanelTitle>What to tell you about</PanelTitle>
            <div className="mt-2">{PREFS.filter((p) => p.group === 'what').map((p) => <Toggle key={p.key} k={p.key} label={p.label} hint={p.hint} />)}</div>
          </Panel>
          <Panel>
            <PanelTitle>How to reach you</PanelTitle>
            <div className="mt-2">{PREFS.filter((p) => p.group === 'how').map((p) => <Toggle key={p.key} k={p.key} label={p.label} hint={p.hint} />)}</div>
          </Panel>
        </div>
      )}

      {activeTab === 'Security' && (
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4 max-w-[1000px] items-start">
          <Panel>
            <PanelTitle>Change your password</PanelTitle>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-5 mt-4">
              <Field label="New password" hint={newPassword ? `Strength: ${passwordStrength.label.toLowerCase()}` : 'At least 8 characters. Longer is stronger.'}>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" minLength={8} required className={inputClass} />
              </Field>
              <Field label="Type it again" error={confirmPassword && confirmPassword !== newPassword ? 'The two passwords don\'t match yet.' : undefined}>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required className={inputClass} />
              </Field>
              <Button type="submit" disabled={saving} className="self-start">{saving ? 'Updating…' : 'Update password'}</Button>
            </form>
          </Panel>
          <div className="flex flex-col gap-4">
            <Panel>
              <PanelTitle>Sign out</PanelTitle>
              <p className="text-[14px] text-ink-2 mt-2">Signs you out on this device. Do this if you used a shared or borrowed phone.</p>
              <Button variant="outline" className="mt-4" onClick={handleSignOutAll}>Sign out</Button>
            </Panel>
            <Panel className="border-danger/40">
              <PanelTitle>Delete your account</PanelTitle>
              <p className="text-[14px] text-ink-2 mt-2">Removes your personal details. Your group keeps the record of payments you made, without your name.</p>
              <Button variant="danger" className="mt-4" onClick={() => router.push('/account/delete')}>Delete my account</Button>
            </Panel>
          </div>
        </div>
      )}
    </div>
  )
}

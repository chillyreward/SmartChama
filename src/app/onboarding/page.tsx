'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Hourglass, Plus, Users } from 'lucide-react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { KENYA_COUNTIES } from '@/lib/counties'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button, Field, Notice, Panel, cn, formatKsh, inputClass } from '@/components/ui'
import PhoneVerification from '@/components/PhoneVerification'
import ContributionSchedulePicker, { ContributionSchedule, scheduleComplete, scheduleDates, scheduleSummary, toScheduleMode } from '@/components/ContributionSchedulePicker'
import { loadNationalId, loadIdDocumentPath } from '@/lib/private-profile'
import IdDocumentUpload from '@/components/IdDocumentUpload'

// Step 0: Choose path
// Step 1: Complete profile  
// Step 2A: Create group
// Step 2B: Join with invite code

type Step = 0 | 1 | '2A' | '2B'

export default function OnboardingPage() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  
  const [step, setStep] = 
    useState<Step>(0)
  const [loading, setLoading] = 
    useState(false)
  const [error, setError] = 
    useState('')
  const [session, setSession] = 
    useState<any>(null)

  // PROFILE FORM STATE
  // Each field is its own state 
  // variable — this is more reliable 
  // than a single object for form 
  // inputs including selects
  const [fullName, setFullName] = 
    useState('')
  const [phone, setPhone] =
    useState('')
  // A number counts only once confirmed by SMS code (saved on the profile by
  // /api/phone/verify). Typed-but-unconfirmed numbers just pre-fill the box.
  const [phoneVerified, setPhoneVerified] = useState(false)
  // Joined with a group code and waiting for an official to approve
  const [pendingChamaName, setPendingChamaName] = useState<string | null>(null)
  const [county, setCounty] = 
    useState('')
  const [idDocumentPath, setIdDocumentPath] = useState<string | null>(null)
  const [nationalId, setNationalId] = 
    useState('')

  // GROUP FORM STATE
  // Same pattern — individual 
  // state variables, never nested 
  // objects for form fields
  const [groupName, setGroupName] = 
    useState('')
  const [contributionAmount, 
    setContributionAmount] = 
    useState('')
  // Every day, or specific dates picked on a calendar
  const [schedule, setSchedule] = useState<ContributionSchedule>({ mode: 'custom', dates: [] })

  // JOIN FORM STATE
  const [inviteCode, setInviteCode] = 
    useState('')

  useEffect(() => {
    supabase.auth.getUser().then(
      ({ data: { user } }) => {
        if (!user) {
          router.push('/login')
          return
        }
        setSession({ user })
        
        // Check if profile already 
        // exists — skip step 1 if so
        checkExistingProfile(
          user.id
        )
      }
    )
  }, [])

  async function checkExistingProfile(
    userId: string
  ) {
    const { data: profile } =
      await supabase
        .from('profiles')
        .select('id, full_name, phone_number')
        .eq('id', userId)
        .maybeSingle()

    // Finish a sign-up that was waiting on email confirmation
    try {
      const pendingCode = localStorage.getItem('sc_pending_join_code')
      if (pendingCode) setInviteCode(pendingCode)
      // Group code carried through Google/Apple sign-up
      const urlCode = new URLSearchParams(window.location.search).get('code')
      if (urlCode) setInviteCode(urlCode.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 14))
      const pendingProfile = localStorage.getItem('sc_pending_profile')
      if (pendingProfile) {
        const pp = JSON.parse(pendingProfile)
        if (pp.national_id) setNationalId(pp.national_id)
        if (pp.phone) setPhone(pp.phone)
      }
    } catch (e) {}

    // Group set up at sign-up: this browser's copy, else the copy saved on the
    // account (the email confirmation link may open on another device)
    let savedGroup: { name?: string; amount?: string; frequency?: string; dates?: string[] } | null = null
    try {
      const local = localStorage.getItem('sc_pending_group')
      if (local) savedGroup = JSON.parse(local)
    } catch (e) {}
    if (!savedGroup?.name) {
      const { data: { user } } = await supabase.auth.getUser()
      const meta = user?.user_metadata?.pending_group
      if (meta?.name) savedGroup = meta
    }
    if (savedGroup?.name) {
      const g = {
        name: String(savedGroup.name),
        amount: String(savedGroup.amount || ''),
        frequency: toScheduleMode(savedGroup.frequency),
        dates: Array.isArray(savedGroup.dates) ? savedGroup.dates : [],
      }
      setGroupName(g.name)
      setContributionAmount(g.amount)
      setSchedule({ mode: g.frequency, dates: g.dates })
    }

    // A profile is complete with a name and a verified phone number
    // (phone_number is only ever written after the SMS code is confirmed).
    if (profile?.phone_number) {
      setPhone(profile.phone_number)
      setPhoneVerified(true)
    }
    const savedNationalId = profile ? await loadNationalId(supabase as any, userId) : ''
    if (savedNationalId) setNationalId(savedNationalId)
    const savedIdDoc = profile ? await loadIdDocumentPath(supabase as any, userId) : null
    if (savedIdDoc) setIdDocumentPath(savedIdDoc)
    if (profile?.full_name && profile?.phone_number) {
      // Profile complete, check
      // if already in a chama
      const { data: memberships } = 
        await supabase
          .from('chama_memberships')
          .select('chama_id, role, status, chamas_v2(id, name)')
          .eq('profile_id', userId)
          .in('status', ['active', 'pending'])

      const activeOnes = (memberships ?? []).filter((m: any) => m.status === 'active')
      const pendingOne = (memberships ?? []).find((m: any) => m.status === 'pending')
      if (activeOnes.length === 0 && pendingOne) {
        setFullName(profile.full_name || '')
        setPendingChamaName((pendingOne.chamas_v2 as any)?.name || 'your group')
        return
      }

      if (activeOnes.length > 0) {
        // Already in a chama — 
        // go straight to dashboard
        const m = activeOnes[0]
        sessionStorage.setItem(
          'active_chama_id',
          (m.chamas_v2 as any).id
        )
        const isAdmin = [
          'admin', 'chairlady',
          'treasurer', 'secretary'
        ].includes(m.role)
        router.push(
          isAdmin 
            ? '/admin/dashboard' 
            : '/dashboard'
        )
        return
      }
      
      // Has profile but no chama yet
      // Pre-fill the form fields
      setFullName(profile.full_name || '')
      setPhone(profile.phone_number || '')
      if (savedGroup?.name) {
        // They already set up a group at sign-up: create it now instead of
        // asking "create or join" again. On failure the group form opens,
        // pre-filled, with the error.
        setStep('2A')
        await createGroup({
          name: String(savedGroup.name),
          amount: String(savedGroup.amount || ''),
          schedule: { mode: toScheduleMode(savedGroup.frequency), dates: Array.isArray(savedGroup.dates) ? savedGroup.dates : [] },
        })
        return
      }
      if (inviteCodeFromSignup()) {
        // Signed up with a group code: go straight to joining
        setStep('2B')
        return
      }
      // Skip to step 0 (choose path)
      setStep(0)
    } else {
      // No profile or incomplete profile
      // Pre-fill name from Google/OAuth metadata if available
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.full_name || user?.user_metadata?.name) {
        setFullName(user.user_metadata.full_name || user.user_metadata.name || '')
      }
      // Show profile completion step
      setStep(1)
    }
  }

  // ═══ STEP 1: SAVE PROFILE ═══
  async function handleSaveProfile() {
    setError('')
    
    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!county) {
      setError('Please select your county.')
      return
    }
    if (!nationalId.trim()) {
      setError('Please enter your National ID number.')
      return
    }
    if (!idDocumentPath) {
      setError('Upload a photo of your ID.')
      return
    }
    if (!phoneVerified) {
      setError('Verify your phone number: send the code and enter it.')
      return
    }

    setLoading(true)

    // Format phone number if provided
    let formattedPhone: string | null = null
    if (phone.trim()) {
      formattedPhone = phone.replace(/\s/g, '')
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.slice(1)
      }
      if (!formattedPhone.startsWith('+254')) {
        formattedPhone = '+254' + formattedPhone
      }
    }

    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName.trim(),
        phone_number: formattedPhone,
        county,
        national_id: nationalId.trim(),
        id_document_path: idDocumentPath
      })
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Could not save profile. Please try again.')
      setLoading(false)
      return
    }

    setLoading(false)
    // Re-check where this person belongs: an existing group goes to its
    // dashboard, a pending request to the waiting screen, otherwise the
    // create/join choice (step 0)
    await checkExistingProfile(session.user.id)
  }

  function inviteCodeFromSignup() {
    try {
      return localStorage.getItem('sc_pending_join_code') || new URLSearchParams(window.location.search).get('code')
    } catch (e) {
      return null
    }
  }

  async function handleCreateGroup() {
    await createGroup({ name: groupName, amount: contributionAmount, schedule })
  }

  async function createGroup(g: { name: string; amount: string; schedule: ContributionSchedule }) {
    setError('')
    if (!g.name.trim()) {
      setError('Please enter a group name.')
      return
    }
    if (!g.amount || Number(g.amount) < 1) {
      setError('Please enter a contribution amount.')
      return
    }
    if (!scheduleComplete(g.schedule)) {
      setError(g.schedule.mode === 'custom'
        ? 'Pick at least one contribution date on the calendar, or choose Every day.'
        : 'Tap the first contribution date on the calendar.')
      return
    }
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await fetch('/api/chamas/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          chama_name: g.name.trim(),
          contribution_amount: g.amount,
          contribution_frequency: g.schedule.mode,
          contribution_dates: scheduleDates(g.schedule),
          payment_type: 'till',
          till_number: '',
          paybill_number: '',
          account_number: '',
          phone_number: '',
          account_name: ''
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Could not create group. Please try again.')
        setLoading(false)
        return
      }

      const chamaId = data.chama_id || data.chamaId
      if (chamaId) {
        document.cookie = `active_chama_id=${chamaId}; path=/; max-age=${60 * 60 * 24 * 30}`
        sessionStorage.setItem('active_chama_id', chamaId)
        localStorage.setItem('sc_last_chama_id', chamaId)
      }
      localStorage.removeItem('sc_pending_group')
      if (user.user_metadata?.pending_group) {
        await supabase.auth.updateUser({ data: { pending_group: null } }).catch(() => {})
      }

      // Next step: identity check (the group works now; payouts unlock once verified)
      window.location.href = '/verify-identity?next=/admin/dashboard'

    } catch (err) {
      console.error('Create group error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  async function handleJoinGroup() {
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await fetch('/api/admin/create-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode.trim().toUpperCase() })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Could not join group. Please try again.')
        setLoading(false)
        return
      }

      if (data.pending) {
        localStorage.removeItem('sc_pending_join_code')
        setError('')
        setLoading(false)
        setPendingChamaName(data.chamaName || 'the group')
        return
      }

      const chamaId = data.chamaId
      document.cookie = `active_chama_id=${chamaId}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
      sessionStorage.setItem('active_chama_id', chamaId)
      localStorage.setItem('sc_last_chama_id', chamaId)
      localStorage.removeItem('sc_pending_join_code')
      window.location.href = '/dashboard'

    } catch (err) {
      console.error('Join group error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // Joined with a group code and waiting for an official
  if (pendingChamaName) {
    return (
      <AuthShell
        aside="none"
        title="Waiting for approval"
        subtitle={<>Your request to join <strong className="text-ink">{pendingChamaName}</strong> is with the group&apos;s officials. The group opens for you as soon as one of them approves it.</>}
      >
        <Panel tone="sage" className="flex gap-4 items-start">
          <Hourglass className="shrink-0 mt-0.5" size={22} />
          <p className="text-[15px] leading-relaxed">If it is taking long, ask your chair or treasurer to open Members and look under Waiting.</p>
        </Panel>
        <div className="flex flex-col gap-3 mt-6">
          <Button size="lg" onClick={() => window.location.reload()}>Check again</Button>
          <Button size="lg" variant="outline" onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}>Sign out</Button>
        </div>
      </AuthShell>
    )
  }

  const stepIndex = step === 0 ? 0 : step === 1 ? 1 : 2
  const back = (to: Step) => (
    <button onClick={() => { setError(''); setStep(to) }} className="inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-ink mb-6 -ml-1 px-1 py-1 rounded-md">
      <ArrowLeft size={16} /> Back
    </button>
  )
  const progress = (
    <ol className="flex gap-1.5 mb-8" aria-label={`Step ${stepIndex + 1} of 3`}>
      {['You', 'Your details', 'Your group'].map((name, i) => (
        <li key={name} className="flex-1">
          <span className={cn('block h-1.5 rounded-[2px]', i <= stepIndex ? 'bg-brand' : 'bg-raised')} />
          <span className={cn('block text-[12px] mt-2', i === stepIndex ? 'text-ink font-medium' : 'text-ink-3')}>{name}</span>
        </li>
      ))}
    </ol>
  )
  const errorBox = error ? <Notice tone="danger" className="mb-5">{error}</Notice> : null

  if (!session) {
    return <div className="min-h-dvh bg-page" aria-busy="true" />
  }

  // Step 0: start or join
  if (step === 0) {
    return (
      <AuthShell title="What brings you here?" subtitle="You can belong to more than one group later.">
        {progress}
        {errorBox}
        <div className="space-y-3">
          {[
            { icon: Users, title: 'Join my group', body: 'Someone in your group shared a code with you.', go: () => setStep('2B') },
            { icon: Plus, title: 'Start a new group', body: 'You will be the first official and invite members.', go: () => setStep(fullName && phone ? '2A' : 1) },
          ].map(({ icon: Icon, title, body, go }) => (
            <button
              key={title}
              onClick={go}
              className="w-full flex items-center gap-4 p-5 rounded-[22px] bg-surface border border-line text-left hover:border-line-strong hover:bg-surface-2 transition-colors"
            >
              <span className="w-12 h-12 rounded-full bg-sage text-forest flex items-center justify-center shrink-0"><Icon size={22} /></span>
              <span>
                <span className="block text-[17px] font-semibold">{title}</span>
                <span className="block text-[14px] text-ink-2 mt-0.5">{body}</span>
              </span>
            </button>
          ))}
        </div>
      </AuthShell>
    )
  }

  // Step 1: profile
  if (step === 1) {
    return (
      <AuthShell
        wide
        title="Your details"
        subtitle="Officials see your name and phone number. Your ID number and photo stay private and are only used to confirm who you are."
      >
        {back(0)}
        {progress}
        {errorBox}
        <div className="space-y-5">
          <Field label="Full name, as on your ID">
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Grace Wanjiku" autoComplete="name" className={inputClass} />
          </Field>

          {/* Required: used for sign-in, USSD and M-Pesa payment prompts */}
          <PhoneVerification
            currentPhone={phoneVerified ? phone : null}
            verified={phoneVerified}
            initialPhone={phoneVerified ? '' : phone}
            onVerified={(p) => { setPhone(p); setPhoneVerified(true) }}
            label="Phone number"
          />

          <Field label="County">
            <select value={county} onChange={e => setCounty(e.target.value)} className={cn(inputClass, 'appearance-none', !county && 'text-ink-3')}>
              <option value="" disabled>Choose your county</option>
              {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="National ID number">
            <input type="text" inputMode="numeric" value={nationalId} onChange={e => setNationalId(e.target.value)} placeholder="12345678" className={inputClass} />
          </Field>

          <IdDocumentUpload value={idDocumentPath} onUploaded={setIdDocumentPath} />
        </div>
        <Button size="lg" className="w-full mt-8" onClick={handleSaveProfile} disabled={loading}>
          {loading ? 'Saving…' : 'Continue'}
        </Button>
      </AuthShell>
    )
  }

  // Step 2A: start a group
  if (step === '2A') {
    const ready = !!groupName.trim() && Number(contributionAmount) > 0 && scheduleComplete(schedule)
    return (
      <AuthShell aside="officials" wide title="Start your group" subtitle="You will be the first official. You can give other people roles from Members later.">
        {back(0)}
        {progress}
        {errorBox}
        <div className="space-y-5">
          <Field label="Group name">
            <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Tujenge Women Group" className={inputClass} />
          </Field>
          <Field label="Each member contributes" hint="The amount for one contribution date.">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-ink-3">KSh</span>
              <input type="number" inputMode="numeric" min="1" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} placeholder="5,000" className={cn(inputClass, 'pl-14')} />
            </div>
          </Field>
          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-medium">When people contribute</span>
            <ContributionSchedulePicker value={schedule} onChange={setSchedule} />
          </div>
        </div>

        <Panel tone="sage" className="mt-6 text-[15px]">
          <p className="font-semibold">Summary</p>
          <p className="mt-1.5 leading-relaxed">
            {groupName.trim() || 'Your group'}: {Number(contributionAmount) > 0 ? formatKsh(Number(contributionAmount)) : 'an amount'} per member,{' '}
            {scheduleComplete(schedule) ? (schedule.mode === 'custom' ? `on ${scheduleSummary(schedule)}` : scheduleSummary(schedule)) : 'on dates you pick above'}.
          </p>
        </Panel>

        <Button size="lg" className="w-full mt-6" onClick={handleCreateGroup} disabled={loading || !ready}>
          {loading ? 'Creating the group…' : 'Create the group'}
        </Button>
      </AuthShell>
    )
  }

  // Step 2B: join with a code
  return (
    <AuthShell title="Join your group" subtitle="Type the group code your chair or treasurer shared. An official approves each new member.">
      {back(0)}
      {progress}
      {errorBox}
      <Field label="Group code">
        <input
          type="text"
          value={inviteCode}
          onChange={e => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 14))}
          placeholder="TUJ-7Q4K"
          autoCapitalize="characters"
          spellCheck={false}
          className={cn(inputClass, 'h-16 text-center font-mono text-[26px] tracking-[0.18em] uppercase')}
        />
      </Field>
      <Button size="lg" className="w-full mt-6" onClick={handleJoinGroup} disabled={loading || !inviteCode.trim()}>
        {loading ? 'Sending your request…' : 'Join the group'}
      </Button>
      <p className="mt-6 text-[14px] text-ink-3">
        No code? Ask an official in your group, or <Link href="/contact" className="underline underline-offset-4 text-ink-2 hover:text-ink">contact us</Link>.
      </p>
    </AuthShell>
  )
}

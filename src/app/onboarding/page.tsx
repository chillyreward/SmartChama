'use client'
import { useState, useEffect } 
  from 'react'
import { useRouter } 
  from 'next/navigation'
import { getSupabaseBrowser } 
  from '@/lib/supabase-browser'

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
  const [county, setCounty] = 
    useState('')
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
  const [frequency, setFrequency] = 
    useState('monthly')
  const [groupDescription, 
    setGroupDescription] = useState('')
  const [meetingDay, setMeetingDay] = 
    useState('1')

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
        .single()

    if (profile?.full_name && 
        profile?.phone_number) {
      // Profile complete, check 
      // if already in a chama
      const { data: memberships } = 
        await supabase
          .from('chama_memberships')
          .select('chama_id, role, status, chamas_v2(id, name)')
          .eq('profile_id', userId)
          .eq('status', 'active')

      if (memberships && 
          memberships.length > 0) {
        // Already in a chama — 
        // go straight to dashboard
        const m = memberships[0]
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
      // Skip to step 0 (choose path)
      setStep(0)
    }
  }

  // ═══ STEP 1: SAVE PROFILE ═══
  async function handleSaveProfile() {
    setError('')
    
    // Validate each field individually 
    // with specific error messages
    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!phone.trim()) {
      setError('Please enter your phone number.')
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

    setLoading(true)

    // Format phone number
    let formattedPhone = 
      phone.replace(/\s/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+254' + 
        formattedPhone.slice(1)
    }
    if (!formattedPhone
      .startsWith('+254')) {
      formattedPhone = '+254' + 
        formattedPhone
    }

    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: session.user.id,
        full_name: fullName.trim(),
        phone_number: formattedPhone,
        email: session.user.email || '',
        county,
        national_id: nationalId.trim()
      })
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Could not save profile. Please try again.')
      setLoading(false)
      return
    }

    setLoading(false)
    // Move to choose path step
    setStep(0)
  }

  async function handleCreateGroup() {
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await fetch('/api/chamas/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
          phone: '',
          chama_name: groupName.trim(),
          contribution_amount: contributionAmount,
          contribution_frequency: frequency,
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

      window.location.href = '/admin/dashboard'

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

      const { data: invite } = await supabase
        .from('invite_tokens')
        .select('id, chama_id, expires_at')
        .eq('token', inviteCode.trim().toUpperCase())
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .single()

      if (!invite) {
        setError('Invalid or expired invite code. Ask your admin for a new one.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/admin/create-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fullName: user.user_metadata?.full_name || user.email,
          email: user.email || '',
          chamaName: '',
          chamaId: invite.chama_id,
          role: 'member',
          inviteId: invite.id
        })
      })

      if (!res.ok) {
        setError('Could not join group. Please try again.')
        setLoading(false)
        return
      }

      document.cookie = `active_chama_id=${invite.chama_id}; path=/; max-age=${60 * 60 * 24 * 30}`
      sessionStorage.setItem('active_chama_id', invite.chama_id)
      localStorage.setItem('sc_last_chama_id', invite.chama_id)
      window.location.href = '/dashboard'

    } catch (err) {
      console.error('Join group error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // ═══ THE UI ═══

  return (
    <div 
      className="min-h-screen flex 
        flex-col items-center 
        justify-center p-4"
      style={{ 
        backgroundColor: 
          'var(--bg-page)' 
      }}>

      {/* Logo */}
      <div className="flex items-center 
        gap-2 mb-10">
        <img 
          src="/favicon.svg"
          alt="SmartChama"
          className="h-10 w-10 
            object-contain"
        />
        <span 
          className="text-[22px] 
            font-bold"
          style={{ 
            color: 'var(--text-primary)' 
          }}>
          SmartChama
        </span>
      </div>

      <div 
        className="w-full max-w-md 
          rounded-2xl p-8"
        style={{
          backgroundColor: 
            'var(--bg-card)',
          border: '1px solid var(--border)'
        }}>

        {/* Progress dots */}
        <div className="flex gap-2 
          justify-center mb-8">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="h-1.5 
                rounded-full 
                transition-all"
              style={{
                width: i === 
                  (step === 0 ? 0 : 
                   step === 1 ? 1 : 2)
                  ? '24px' : '8px',
                backgroundColor: 
                  i <= (step === 0 ? 0 : 
                        step === 1 ? 1 : 2)
                  ? '#22C55E' 
                  : 'var(--border)'
              }}
            />
          ))}
        </div>

        {/* Error display */}
        {error && (
          <div 
            className="rounded-xl p-4 
              mb-5 text-[14px]"
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B'
            }}>
            {error}
          </div>
        )}

        {/* ═══ STEP 0: CHOOSE PATH ═══ */}
        {step === 0 && (
          <div>
            <h1 
              className="text-[28px] 
                font-bold text-center 
                mb-2"
              style={{ 
                color: 
                  'var(--text-primary)' 
              }}>
              Welcome to SmartChama
            </h1>
            <p 
              className="text-center 
                mb-8 text-[15px]"
              style={{ 
                color: 
                  'var(--text-secondary)' 
              }}>
              What would you like to do?
            </p>

            <div className="space-y-4">
              <button
                onClick={() => {
                  if (fullName && phone) {
                    setStep('2A')
                  } else {
                    setStep(1)
                  }
                }}
                className="w-full p-5 
                  rounded-2xl border-2 
                  text-left transition-all
                  hover:border-[#22C55E]"
                style={{
                  borderColor: 
                    'var(--border)',
                  backgroundColor: 
                    'var(--bg-card)'
                }}>
                <div className="flex 
                  items-center gap-4">
                  <div 
                    className="w-12 h-12 
                      rounded-xl flex 
                      items-center 
                      justify-center 
                      flex-shrink-0"
                    style={{ 
                      backgroundColor: 
                        '#F0FDF4' 
                    }}>
                    <span className="
                      material-symbols-outlined 
                      text-[24px] 
                      text-[#22C55E]">
                      add_circle
                    </span>
                  </div>
                  <div>
                    <p 
                      className="text-[16px] 
                        font-semibold mb-0.5"
                      style={{ 
                        color: 
                          'var(--text-primary)' 
                      }}>
                      Create a new group
                    </p>
                    <p 
                      className="text-[13px]"
                      style={{ 
                        color: 
                          'var(--text-secondary)' 
                      }}>
                      Start a new chama 
                      and invite members
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStep('2B')}
                className="w-full p-5 
                  rounded-2xl border-2 
                  text-left transition-all
                  hover:border-[#22C55E]"
                style={{
                  borderColor: 
                    'var(--border)',
                  backgroundColor: 
                    'var(--bg-card)'
                }}>
                <div className="flex 
                  items-center gap-4">
                  <div 
                    className="w-12 h-12 
                      rounded-xl flex 
                      items-center 
                      justify-center 
                      flex-shrink-0"
                    style={{ 
                      backgroundColor: 
                        '#F0FDF4' 
                    }}>
                    <span className="
                      material-symbols-outlined 
                      text-[24px] 
                      text-[#22C55E]">
                      group_add
                    </span>
                  </div>
                  <div>
                    <p 
                      className="text-[16px] 
                        font-semibold mb-0.5"
                      style={{ 
                        color: 
                          'var(--text-primary)' 
                      }}>
                      Join existing group
                    </p>
                    <p 
                      className="text-[13px]"
                      style={{ 
                        color: 
                          'var(--text-secondary)' 
                      }}>
                      Use an invite code 
                      from your admin
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 1: PROFILE ═══ */}
        {step === 1 && (
          <div>
            <button
              onClick={() => setStep(0)}
              className="flex items-center 
                gap-1 mb-6 text-[14px]"
              style={{ 
                color: 
                  'var(--text-secondary)' 
              }}>
              <span className="
                material-symbols-outlined 
                text-[18px]">
                arrow_back
              </span>
              Back
            </button>

            <h1 
              className="text-[24px] 
                font-bold mb-2"
              style={{ 
                color: 
                  'var(--text-primary)' 
              }}>
              Complete your profile
            </h1>
            <p 
              className="text-[14px] mb-6"
              style={{ 
                color: 
                  'var(--text-secondary)' 
              }}>
              This is used for your 
              financial identity record.
            </p>

            <div className="space-y-4">
              
              <div>
                <label 
                  className="block 
                    text-[11px] 
                    font-semibold 
                    uppercase 
                    tracking-wider 
                    mb-1.5"
                  style={{ 
                    color: 
                      'var(--text-secondary)' 
                  }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => 
                    setFullName(
                      e.target.value
                    )}
                  placeholder="Grace Wanjiku"
                  className="w-full px-4 
                    py-3 rounded-xl border 
                    text-[15px]
                    focus:outline-none 
                    focus:border-[#22C55E]"
                  style={{
                    backgroundColor: 
                      'var(--bg-input)',
                    borderColor: 
                      'var(--border)',
                    color: 
                      'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label 
                  className="block 
                    text-[11px] 
                    font-semibold 
                    uppercase 
                    tracking-wider 
                    mb-1.5"
                  style={{ 
                    color: 
                      'var(--text-secondary)' 
                  }}>
                  Phone Number
                </label>
                <div className="flex">
                  <div 
                    className="flex 
                      items-center px-3 
                      rounded-l-xl border 
                      border-r-0 
                      text-[14px]"
                    style={{
                      backgroundColor: 
                        'var(--bg-hover)',
                      borderColor: 
                        'var(--border)',
                      color: 
                        'var(--text-secondary)'
                    }}>
                    +254
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => 
                      setPhone(
                        e.target.value
                      )}
                    placeholder="712 345 678"
                    className="flex-1 
                      px-4 py-3 
                      rounded-r-xl border 
                      text-[15px]
                      focus:outline-none 
                      focus:border-[#22C55E]"
                    style={{
                      backgroundColor: 
                        'var(--bg-input)',
                      borderColor: 
                        'var(--border)',
                      color: 
                        'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div>
                <label 
                  className="block 
                    text-[11px] 
                    font-semibold 
                    uppercase 
                    tracking-wider 
                    mb-1.5"
                  style={{ 
                    color: 
                      'var(--text-secondary)' 
                  }}>
                  County
                </label>
                {/* 
                  CRITICAL FIX: 
                  Use value + onChange 
                  on a native select.
                  Do NOT use a custom 
                  dropdown component 
                  here — the bug is 
                  in custom select 
                  components not 
                  updating state.
                */}
                <select
                  value={county}
                  onChange={e => {
                    setCounty(e.target.value)
                  }}
                  className="w-full px-4 
                    py-3 rounded-xl border 
                    text-[15px]
                    focus:outline-none 
                    focus:border-[#22C55E]
                    appearance-none"
                  style={{
                    backgroundColor: 
                      'var(--bg-input)',
                    borderColor: county 
                      ? '#22C55E' 
                      : 'var(--border)',
                    color: county 
                      ? 'var(--text-primary)' 
                      : 'var(--text-muted)'
                  }}>
                  <option value="" 
                    disabled>
                    Select county
                  </option>
                  <option value="Nairobi">
                    Nairobi
                  </option>
                  <option value="Mombasa">
                    Mombasa
                  </option>
                  <option value="Kisumu">
                    Kisumu
                  </option>
                  <option value="Nakuru">
                    Nakuru
                  </option>
                  <option value="Eldoret">
                    Eldoret
                  </option>
                  <option value="Kiambu">
                    Kiambu
                  </option>
                  <option value="Machakos">
                    Machakos
                  </option>
                  <option value="Kajiado">
                    Kajiado
                  </option>
                  <option value="Nyeri">
                    Nyeri
                  </option>
                  <option value="Meru">
                    Meru
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              <div>
                <label 
                  className="block 
                    text-[11px] 
                    font-semibold 
                    uppercase 
                    tracking-wider 
                    mb-1.5"
                  style={{ 
                    color: 
                      'var(--text-secondary)' 
                  }}>
                  National ID Number
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={e => 
                    setNationalId(
                      e.target.value
                    )}
                  placeholder="12345678"
                  className="w-full px-4 
                    py-3 rounded-xl border 
                    text-[15px]
                    focus:outline-none 
                    focus:border-[#22C55E]"
                  style={{
                    backgroundColor: 
                      'var(--bg-input)',
                    borderColor: 
                      'var(--border)',
                    color: 
                      'var(--text-primary)'
                  }}
                />
              </div>

            </div>

            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="w-full mt-6 
                py-4 rounded-xl 
                text-[16px] font-semibold 
                bg-[#22C55E] text-white
                hover:bg-[#16A34A]
                disabled:opacity-50
                transition-colors">
              {loading 
                ? 'Saving...' 
                : 'Continue'}
            </button>
          </div>
        )}

        {/* ═══ STEP 2A: CREATE GROUP ═══ */}
        {step === '2A' && (
          <div>
            <button
              onClick={() => setStep(0)}
              className="flex items-center 
                gap-1 mb-6 text-[14px]"
              style={{ 
                color: 
                  'var(--text-secondary)' 
              }}>
              <span className="
                material-symbols-outlined 
                text-[18px]">
                arrow_back
              </span>
              Back
            </button>

            <h1 
              className="text-[24px] 
                font-bold mb-2"
              style={{ 
                color: 
                  'var(--text-primary)' 
              }}>
              Create your group
            </h1>
            <p 
              className="text-[14px] mb-6"
              style={{ 
                color: 
                  'var(--text-secondary)' 
              }}>
              You will be the admin 
              (Chairlady/Chairman).
            </p>

            <div className="space-y-4">

              <div>
                <label 
                  className="block 
                    text-[11px] 
                    font-semibold 
                    uppercase 
                    tracking-wider 
                    mb-1.5"
                  style={{ 
                    color: 
                      'var(--text-secondary)' 
                  }}>
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={e => 
                    setGroupName(
                      e.target.value
                    )}
                  placeholder="Nairobi Women Investment Group"
                  className="w-full px-4 
                    py-3 rounded-xl border 
                    text-[15px]
                    focus:outline-none 
                    focus:border-[#22C55E]"
                  style={{
                    backgroundColor: 
                      'var(--bg-input)',
                    borderColor: 
                      groupName 
                        ? '#22C55E' 
                        : 'var(--border)',
                    color: 
                      'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label 
                  className="block 
                    text-[11px] 
                    font-semibold 
                    uppercase 
                    tracking-wider 
                    mb-1.5"
                  style={{ 
                    color: 
                      'var(--text-secondary)' 
                  }}>
                  Monthly Contribution 
                  (KSh)
                </label>
                <div className="flex">
                  <div 
                    className="flex 
                      items-center px-3 
                      rounded-l-xl border 
                      border-r-0 
                      text-[14px]"
                    style={{
                      backgroundColor: 
                        'var(--bg-hover)',
                      borderColor: 
                        'var(--border)',
                      color: 
                        'var(--text-secondary)'
                    }}>
                    KSh
                  </div>
                  <input
                    type="number"
                    value={contributionAmount}
                    onChange={e => {
                      setContributionAmount(
                        e.target.value
                      )
                    }}
                    placeholder="5000"
                    min="1"
                    className="flex-1 
                      px-4 py-3 
                      rounded-r-xl border 
                      text-[15px]
                      focus:outline-none 
                      focus:border-[#22C55E]"
                    style={{
                      backgroundColor: 
                        'var(--bg-input)',
                      borderColor: 
                        contributionAmount 
                          ? '#22C55E' 
                          : 'var(--border)',
                      color: 
                        'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div>
                <label 
                  className="block 
                    text-[11px] 
                    font-semibold 
                    uppercase 
                    tracking-wider 
                    mb-1.5"
                  style={{ 
                    color: 
                      'var(--text-secondary)' 
                  }}>
                  Contribution Frequency
                </label>
                {/*
                  CRITICAL FIX:
                  Native select with 
                  explicit value and 
                  onChange handler.
                  Log the value so 
                  you can see it 
                  updating in the 
                  console.
                */}
                <select
                  value={frequency}
                  onChange={e => {
                    setFrequency(
                      e.target.value
                    )
                  }}
                  className="w-full px-4 
                    py-3 rounded-xl border 
                    text-[15px]
                    focus:outline-none 
                    focus:border-[#22C55E]
                    appearance-none"
                  style={{
                    backgroundColor: 
                      'var(--bg-input)',
                    borderColor: 
                      'var(--border)',
                    color: 
                      'var(--text-primary)'
                  }}>
                  <option value="weekly">
                    Weekly
                  </option>
                  <option value="biweekly">
                    Fortnightly 
                    (every 2 weeks)
                  </option>
                  <option value="monthly">
                    Monthly
                  </option>
                  <option value="quarterly">
                    Quarterly
                  </option>
                </select>
              </div>

              <div>
                <label 
                  className="block 
                    text-[11px] 
                    font-semibold 
                    uppercase 
                    tracking-wider 
                    mb-1.5"
                  style={{ 
                    color: 
                      'var(--text-secondary)' 
                  }}>
                  Meeting Day of Month
                  <span 
                    className="ml-1 
                      normal-case 
                      font-normal">
                    (optional)
                  </span>
                </label>
                <select
                  value={meetingDay}
                  onChange={e => 
                    setMeetingDay(
                      e.target.value
                    )}
                  className="w-full px-4 
                    py-3 rounded-xl border 
                    text-[15px]
                    focus:outline-none 
                    focus:border-[#22C55E]
                    appearance-none"
                  style={{
                    backgroundColor: 
                      'var(--bg-input)',
                    borderColor: 
                      'var(--border)',
                    color: 
                      'var(--text-primary)'
                  }}>
                  {Array.from(
                    { length: 28 }, 
                    (_, i) => i + 1
                  ).map(day => (
                    <option 
                      key={day} 
                      value={day}>
                      {day}{
                        day === 1 ? 'st' 
                        : day === 2 ? 'nd' 
                        : day === 3 ? 'rd' 
                        : 'th'
                      } of every month
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label 
                  className="block 
                    text-[11px] 
                    font-semibold 
                    uppercase 
                    tracking-wider 
                    mb-1.5"
                  style={{ 
                    color: 
                      'var(--text-secondary)' 
                  }}>
                  Group Description
                  <span 
                    className="ml-1 
                      normal-case 
                      font-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={groupDescription}
                  onChange={e => 
                    setGroupDescription(
                      e.target.value
                    )}
                  placeholder="Tell members what this group is about..."
                  rows={3}
                  className="w-full px-4 
                    py-3 rounded-xl border 
                    text-[15px] resize-none
                    focus:outline-none 
                    focus:border-[#22C55E]"
                  style={{
                    backgroundColor: 
                      'var(--bg-input)',
                    borderColor: 
                      'var(--border)',
                    color: 
                      'var(--text-primary)'
                  }}
                />
              </div>

            </div>

            {/* Live field status — 
                shows what is filled 
                so admin can see 
                exactly what is missing */}
            <div 
              className="mt-4 p-3 
                rounded-xl text-[12px]"
              style={{
                backgroundColor: 
                  'var(--bg-subtle)'
              }}>
              <div className="flex 
                items-center gap-2 mb-1">
                <span style={{ 
                  color: groupName 
                    ? '#22C55E' 
                    : 'var(--text-muted)' 
                }}>
                  {groupName ? '✓' : '○'} 
                  Group name
                  {groupName && 
                    `: ${groupName}`}
                </span>
              </div>
              <div className="flex 
                items-center gap-2 mb-1">
                <span style={{ 
                  color: 
                    contributionAmount 
                      ? '#22C55E' 
                      : 'var(--text-muted)' 
                }}>
                  {contributionAmount 
                    ? '✓' : '○'} 
                  Amount
                  {contributionAmount && 
                    `: KSh ${contributionAmount}`}
                </span>
              </div>
              <div className="flex 
                items-center gap-2">
                <span style={{ 
                  color: frequency 
                    ? '#22C55E' 
                    : 'var(--text-muted)' 
                }}>
                  {frequency ? '✓' : '○'} 
                  Frequency: {frequency}
                </span>
              </div>
            </div>

            <button
              onClick={handleCreateGroup}
              disabled={
                loading || 
                !groupName.trim() || 
                !contributionAmount
              }
              className="w-full mt-6 
                py-4 rounded-xl 
                text-[16px] font-semibold 
                bg-[#22C55E] text-white
                hover:bg-[#16A34A]
                disabled:opacity-50
                disabled:cursor-not-allowed
                transition-colors">
              {loading ? (
                <span className="flex 
                  items-center 
                  justify-center gap-2">
                  <div className="w-4 
                    h-4 rounded-full 
                    border-2 
                    border-white/30 
                    border-t-white 
                    animate-spin" />
                  Creating group...
                </span>
              ) : 'Create Group'}
            </button>
          </div>
        )}

        {/* ═══ STEP 2B: JOIN GROUP ═══ */}
        {step === '2B' && (
          <div>
            <button
              onClick={() => setStep(0)}
              className="flex items-center 
                gap-1 mb-6 text-[14px]"
              style={{ 
                color: 
                  'var(--text-secondary)' 
              }}>
              <span className="
                material-symbols-outlined 
                text-[18px]">
                arrow_back
              </span>
              Back
            </button>

            <h1 
              className="text-[24px] 
                font-bold mb-2"
              style={{ 
                color: 
                  'var(--text-primary)' 
              }}>
              Join a group
            </h1>
            <p 
              className="text-[14px] mb-6"
              style={{ 
                color: 
                  'var(--text-secondary)' 
              }}>
              Enter the invite code 
              your admin sent you.
            </p>

            <div>
              <label 
                className="block 
                  text-[11px] 
                  font-semibold 
                  uppercase 
                  tracking-wider 
                  mb-1.5"
                style={{ 
                  color: 
                    'var(--text-secondary)' 
                }}>
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={e => 
                  setInviteCode(
                    e.target.value
                      .toUpperCase()
                      .slice(0, 8)
                  )}
                placeholder="e.g. SC4829"
                className="w-full px-4 
                  py-4 rounded-xl border
                  text-[24px] font-bold 
                  font-mono tracking-[0.3em]
                  text-center uppercase
                  focus:outline-none 
                  focus:border-[#22C55E]"
                style={{
                  backgroundColor: 
                    'var(--bg-input)',
                  borderColor: 
                    inviteCode 
                      ? '#22C55E' 
                      : 'var(--border)',
                  color: 
                    'var(--text-primary)'
                }}
              />
            </div>

            <button
              onClick={handleJoinGroup}
              disabled={
                loading || 
                !inviteCode.trim()
              }
              className="w-full mt-6 
                py-4 rounded-xl 
                text-[16px] font-semibold 
                bg-[#22C55E] text-white
                hover:bg-[#16A34A]
                disabled:opacity-50
                transition-colors">
              {loading 
                ? 'Joining...' 
                : 'Join Group'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
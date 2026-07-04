'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

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
  const [repaymentRate, setRepaymentRate] = useState(100)
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
        setNationalId(profile.national_id || '')
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

      // 3. Fetch repayment rate from loans_v2
      const { data: loans, error: loanErr } = await supabase
        .from('loans_v2')
        .select('status')
        .eq('membership_id', member.id)

      if (!loanErr && loans && loans.length > 0) {
        const repaid = loans.filter(l => l.status === 'repaid').length
        setRepaymentRate(Math.round((repaid / loans.length) * 100))
      } else {
        setRepaymentRate(100)
      }

      // 4. Joined date
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
          phone_number: phone,
          national_id: nationalId,
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

  const handleToggleLenderVisibility = async () => {
    if (!session?.user?.id) return
    const newValue = !lenderVisibility
    setLenderVisibility(newValue)

    try {
      // Fetch current prefs
      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_prefs')
        .eq('id', session.user.id)
        .single()

      const currentPrefs = profile?.notification_prefs || {}

      await supabase
        .from('profiles')
        .update({
          notification_prefs: {
            ...currentPrefs,
            lender_visibility: newValue
          }
        })
        .eq('id', session.user.id)
      
      setToastMsg(`Lender visibility is now ${newValue ? 'Enabled' : 'Disabled'}`)
      setTimeout(() => setToastMsg(''), 3000)
    } catch (err) {
      console.error('Error toggling lender visibility:', err)
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
        setToastMsg('Avatar uploaded successfully!')
        setTimeout(() => setToastMsg(''), 3000)
        await refreshMemberData()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Avatar upload failed.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDownloadReport = () => {
    if (!member) return

    const report = `
SmartChama Financial Identity Report
Generated: ${new Date().toLocaleDateString('en-KE')}

Name: ${fullName}
Phone: ${phone}
Group: ${group?.name || 'SmartChama Savings'}
Member Since: ${joinDateStr}

Total Contributed: KSh ${totalContributed.toLocaleString()}
CREDIT SCORE: ${member?.trust_score ?? 60}/100
Repayment Rate: ${repaymentRate}%
Contribution Streak: ${member?.contribution_streak ?? 0} months

This record is verified by SmartChama Technologies Ltd.
`

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fullName.toLowerCase().replace(/\s+/g, '-')}-smartchama-report.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const countiesList = [
    "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado",
    "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia",
    "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi",
    "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita Taveta", "Tana River",
    "Tharaka Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
  ]

  // CREDIT SCORE gauge arc settings
  const score = member?.trust_score ?? 60
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <span className="w-8 h-8 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl p-6 md:p-8 font-inter text-[var(--text-main)]">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Profile</span>
        </p>
        
        <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
          My Profile
        </h1>
        <p className="text-[14px] text-[var(--text-muted)] mt-1">
          Manage your personal details, verify credentials, and view your verified financial standing.
        </p>
      </div>

      {toastMsg && (
        <div className="bg-transparent text-[var(--brand-green)]/30 border border-[#bccbb9] dark:border-[#2d3d2d] text-[var(--brand-green)] p-4 rounded-xl text-[14px] font-medium mb-6">
          {toastMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-[14px] font-medium mb-6">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Profile Card & Gauge */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Main Card */}
          <div className="card-bg border border-[var(--border)] p-6 rounded-2xl text-center shadow-sm">
            <div className="relative w-24 h-24 mx-auto mb-4 group">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-[#006e2f]" />
              ) : (
                <div className="w-full h-full rounded-full bg-[#006e2f] text-white flex items-center justify-center font-bold text-2xl">
                  {getInitials(fullName)}
                </div>
              )}
              <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold">
                {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
              </label>
            </div>

            <h3 className="text-[18px] font-bold text-[#161d16] dark:text-white truncate font-geist">{fullName || 'Chama Member'}</h3>
            
            <div className="mt-2 flex justify-center gap-2">
              <span className="bg-green-50 dark:bg-green-950/20 text-[var(--brand-green)] text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-[#bccbb9]/40 dark:border-green-900/30">
                {member?.role || 'Member'}
              </span>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 mt-6 pt-4 text-left space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#60645f] dark:text-gray-400">Phone:</span>
                <span className="text-[#161d16] dark:text-[#e8f0e4] font-medium">{phone || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#60645f] dark:text-gray-400">Member Since:</span>
                <span className="text-[#161d16] dark:text-[#e8f0e4] font-medium">{joinDateStr.split(',')[1] || joinDateStr}</span>
              </div>
            </div>

            <button
              onClick={() => setEditMode(!editMode)}
              className="mt-6 w-full card-bg border border-[var(--border)] text-[#161d16] dark:text-[#e8f0e4] text-[13px] font-semibold py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-colors"
            >
              {editMode ? 'View Summary' : 'Edit Profile'}
            </button>
          </div>

          {/* CREDIT SCORE Gauge Card */}
          <div className="card-bg border border-[var(--border)] p-6 rounded-2xl shadow-sm text-center">
            <h4 className="text-[14px] font-bold text-[#161d16] dark:text-white mb-4 font-geist">Reputation Standing</h4>
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r={radius} className="stroke-gray-100 dark:stroke-gray-800" strokeWidth="8" fill="transparent" />
                <circle cx="64" cy="64" r={radius} className="stroke-[#22C55E]" strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[28px] font-bold text-[#161d16] dark:text-white leading-none font-geist">{score}</span>
                <span className="text-[10px] text-gray-450 mt-1 uppercase font-semibold">Points</span>
              </div>
            </div>
            <p className="text-[12px] text-[#60645f] dark:text-gray-400 mt-4 leading-relaxed">
              Verify your records by keeping a steady monthly contribution.
            </p>
          </div>
        </div>

        {/* Right Side: Editable Details OR Financial Summary */}
        <div className="lg:col-span-2">
          {editMode ? (
            <form onSubmit={handleSaveProfile} className="card-bg border border-[var(--border)] p-6 rounded-2xl shadow-sm space-y-6">
              <h3 className="text-[16px] font-bold text-[#161d16] dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 font-geist">
                Edit Personal Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5 flex items-center justify-between">
                    Phone Number
                    {phone && (
                      <span className="text-[11px] text-[var(--brand-green)] font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">verified</span> Verified
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full bg-gray-50 dark:bg-[#1a2218] border border-[var(--border)] rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5 flex items-center justify-between">
                    National ID
                    {nationalId && (
                      <span className="text-[11px] text-[var(--brand-green)] font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">verified</span> Verified
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden"
                    placeholder="Enter national ID"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                    County
                  </label>
                  <select
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden"
                  >
                    {countiesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden"
                    placeholder="e.g. Business Owner"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="card-bg border border-[var(--border)] text-[#161d16] dark:text-[#e8f0e4] px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#22C55E] text-white px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#006e2f] transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Financial Identity Section */}
              <div className="card-bg border border-[var(--border)] p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3 mb-6">
                  <h3 className="text-[16px] font-bold text-[#161d16] dark:text-white font-geist">
                    Financial Identity Summary
                  </h3>
                  <button
                    onClick={handleDownloadReport}
                    className="text-[var(--brand-green)] hover:underline text-[13px] font-semibold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download Report
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-[#1a2218] border border-[var(--border)] p-4 rounded-xl">
                    <span className="text-[11px] text-[#60645f] dark:text-gray-400 uppercase font-semibold">Contributions</span>
                    <div className="text-[16px] font-bold text-[#161d16] dark:text-white mt-1">KSh {totalContributed.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#1a2218] border border-[var(--border)] p-4 rounded-xl">
                    <span className="text-[11px] text-[#60645f] dark:text-gray-400 uppercase font-semibold">Repayment Rate</span>
                    <div className="text-[16px] font-bold text-[#161d16] dark:text-white mt-1">{repaymentRate}%</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#1a2218] border border-[var(--border)] p-4 rounded-xl">
                    <span className="text-[11px] text-[#60645f] dark:text-gray-400 uppercase font-semibold">Credit Score</span>
                    <div className="text-[16px] font-bold text-[#161d16] dark:text-white mt-1">{score}/100</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#1a2218] border border-[var(--border)] p-4 rounded-xl">
                    <span className="text-[11px] text-[#60645f] dark:text-gray-450 uppercase font-semibold">Streak</span>
                    <div className="text-[16px] font-bold text-[#161d16] dark:text-white mt-1">{member?.contribution_streak ?? 0} months</div>
                  </div>
                </div>
              </div>

              {/* Lender Visibility Card */}
              <div className="card-bg border border-[var(--border)] p-6 rounded-2xl shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#161d16] dark:text-white font-geist flex items-center gap-1.5">
                      Lender visibility
                      {lenderVisibility ? (
                        <span className="bg-green-100 dark:bg-green-950/20 text-[#166534] dark:text-[#4ae176] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Enabled
                        </span>
                      ) : (
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Disabled
                        </span>
                      )}
                    </h3>
                    <p className="text-[13px] text-[#60645f] dark:text-gray-400 mt-1 max-w-md">
                      Let third-party micro-lenders view your payment history and CREDIT SCORE to offer tailored business loans.
                    </p>
                  </div>
                  <div
                    className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors duration-200 shrink-0 ${
                      lenderVisibility ? 'bg-[#22C55E]' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    onClick={handleToggleLenderVisibility}
                  >
                    <div
                      className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform duration-200 shadow-sm ${
                        lenderVisibility ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Personal details static view */}
              <div className="card-bg border border-[var(--border)] p-6 rounded-2xl shadow-sm">
                <h3 className="text-[16px] font-bold text-[#161d16] dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 font-geist">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px]">
                  <div>
                    <span className="text-[#60645f] dark:text-gray-450 block">National ID</span>
                    <span className="text-[#161d16] dark:text-[#e8f0e4] font-medium">{nationalId || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="text-[#60645f] dark:text-gray-450 block">County</span>
                    <span className="text-[#161d16] dark:text-[#e8f0e4] font-medium">{county}</span>
                  </div>
                  <div>
                    <span className="text-[#60645f] dark:text-gray-450 block">Occupation</span>
                    <span className="text-[#161d16] dark:text-[#e8f0e4] font-medium">{occupation || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="text-[#60645f] dark:text-gray-450 block">Chama Savings Group</span>
                    <span className="text-[#161d16] dark:text-[#e8f0e4] font-medium">{group?.name || 'Loading...'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
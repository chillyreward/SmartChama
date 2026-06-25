'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'

export default function SettingsPage() {
  const { session, member, group, isLoading: authLoading, refreshMemberData } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [activeTab, setActiveTab] = useState<'Group Settings' | 'Notifications' | 'Appearance' | 'Security' | 'Connected Apps'>('Group Settings')
  const tabs = [
    { name: 'Group Settings', icon: 'tune' },
    { name: 'Notifications', icon: 'notifications' },
    { name: 'Appearance', icon: 'palette' },
    { name: 'Security', icon: 'shield' },
    { name: 'Connected Apps', icon: 'grid_view' }
  ] as const

  // Admin check
  const isAdmin = member?.role === 'admin' || member?.role === 'chairlady'

  // --- Group Settings States ---
  const [chamaName, setChamaName] = useState('')
  const [county, setCounty] = useState('Nairobi')
  const [contributionAmount, setContributionAmount] = useState(500)
  const [contributionFrequency, setContributionFrequency] = useState<'weekly' | 'monthly'>('monthly')
  const [contributionDueDay, setContributionDueDay] = useState(1)
  const [gracePeriodDays, setGracePeriodDays] = useState(5)
  const [latePenaltyAmount, setLatePenaltyAmount] = useState(100)
  const [maxLoanMultiplier, setMaxLoanMultiplier] = useState(2)
  const [loanInterestRate, setLoanInterestRate] = useState(10)
  const [maxRepaymentMonths, setMaxRepaymentMonths] = useState(3)
  const [minTrustScoreForLoan, setMinTrustScoreForLoan] = useState(60)

  // --- Notifications Preferences States ---
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    contribution_reminders: true,
    late_payment_alerts: true,
    loan_notifications: true,
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
      
      // Load group settings if available
      if (group) {
        setChamaName(group.name || '')
        setCounty(group.county || 'Nairobi')
        setContributionAmount(Number(group.contribution_amount || 0))
        setContributionFrequency(group.contribution_frequency || 'monthly')
        setContributionDueDay(Number(group.contribution_due_day || 1))
        setGracePeriodDays(Number(group.grace_period_days || 0))
        setLatePenaltyAmount(Number(group.late_penalty_amount || 0))
        setMaxLoanMultiplier(Number(group.max_loan_multiplier || 2))
        setLoanInterestRate(Number(group.loan_interest_rate || 0))
        setMaxRepaymentMonths(Number(group.max_repayment_months || 3))
        setMinTrustScoreForLoan(Number(group.min_trust_score_for_loan || 60))
      }

      // Load notification prefs from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_prefs')
        .eq('id', session.user.id)
        .single()

      if (profile?.notification_prefs) {
        setNotifPrefs({
          ...notifPrefs,
          ...profile.notification_prefs
        })
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
  }, [authLoading, group])

  // Save Group Settings (Admin Only)
  const handleSaveGroupSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin || !group?.id) return

    try {
      setSaving(true)
      setErrorMsg('')
      setToastMsg('')

      const { error } = await supabase
        .from('chamas_v2')
        .update({
          name: chamaName,
          county,
          contribution_amount: Number(contributionAmount),
          contribution_frequency: contributionFrequency,
          contribution_due_day: Number(contributionDueDay),
          grace_period_days: Number(gracePeriodDays),
          late_penalty_amount: Number(latePenaltyAmount),
          max_loan_multiplier: Number(maxLoanMultiplier),
          loan_interest_rate: Number(loanInterestRate),
          max_repayment_months: Number(maxRepaymentMonths),
          min_trust_score_for_loan: Number(minTrustScoreForLoan),
          updated_at: new Date().toISOString()
        })
        .eq('id', group.id)

      if (error) throw error

      setToastMsg('Group settings updated successfully.')
      setTimeout(() => setToastMsg(''), 3000)
      await refreshMemberData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update group settings.')
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
      setErrorMsg('New passwords do not match.')
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setToastMsg('Password updated.')
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

  // Sign Out All Devices
  const handleSignOutAll = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' })
      sessionStorage.removeItem('active_chama_id')
      router.push('/login')
    } catch (err) {
      console.error('Error signing out all devices:', err)
    }
  }

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
      <div className="p-8 flex justify-center items-center">
        <span className="w-8 h-8 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></span>
      </div>
    )
  }

  return (
    <div className="max-w-5xl p-6 md:p-8 font-inter text-[var(--text-main)]">
      
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Settings</span>
        </p>
        
        <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
          Settings
        </h1>
        <p className="text-[14px] text-[var(--text-muted)] mt-1">
          Adjust group properties, manage communication settings, and maintain account security.
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

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left: Tab selectors */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map(t => (
            <button
              key={t.name}
              onClick={() => {
                setActiveTab(t.name)
                setErrorMsg('')
                setToastMsg('')
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-colors text-left ${
                activeTab === t.name
                  ? 'bg-transparent text-[var(--brand-green)] text-[var(--brand-green)]'
                  : 'text-[#3d4a3d] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1f2a1f]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
              {t.name}
            </button>
          ))}
        </div>

        {/* Right: Tab Contents */}
        <div className="flex-1 card-bg border border-[var(--border)] p-6 rounded-2xl shadow-sm">
          
          {/* GROUP SETTINGS TAB */}
          {activeTab === 'Group Settings' && (
            <div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
                <h3 className="text-[16px] font-bold text-[#161d16] dark:text-white font-geist">
                  Chama Group Settings
                </h3>
                {!isAdmin && (
                  <span className="bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold px-3 py-1 rounded-full uppercase">
                    Read-only
                  </span>
                )}
              </div>

              {!isAdmin && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/35 text-amber-700 dark:text-amber-400 p-4 rounded-xl text-[13px] font-medium mb-6">
                  Only group administrators can modify group-wide parameters.
                </div>
              )}

              <form onSubmit={handleSaveGroupSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                      Group Name
                    </label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={chamaName}
                      onChange={(e) => setChamaName(e.target.value)}
                      className="w-full bg-white dark:bg-[#1a1f1b] disabled:bg-gray-50 dark:disabled:bg-gray-900/30 border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden disabled:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                      County
                    </label>
                    <select
                      disabled={!isAdmin}
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      className="w-full bg-white dark:bg-[#1a1f1b] disabled:bg-gray-50 dark:disabled:bg-gray-900/30 border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden disabled:text-gray-400"
                    >
                      {countiesList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                      Contribution Amount (KSh)
                    </label>
                    <input
                      type="number"
                      disabled={!isAdmin}
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#1a1f1b] disabled:bg-gray-50 dark:disabled:bg-gray-900/30 border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden disabled:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                      Contribution Frequency
                    </label>
                    <div className="flex gap-4 pt-1.5">
                      <label className="flex items-center gap-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] cursor-pointer">
                        <input
                          type="radio"
                          disabled={!isAdmin}
                          checked={contributionFrequency === 'weekly'}
                          onChange={() => setContributionFrequency('weekly')}
                          className="accent-[#22C55E] cursor-pointer"
                        />
                        Weekly
                      </label>
                      <label className="flex items-center gap-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] cursor-pointer">
                        <input
                          type="radio"
                          disabled={!isAdmin}
                          checked={contributionFrequency === 'monthly'}
                          onChange={() => setContributionFrequency('monthly')}
                          className="accent-[#22C55E] cursor-pointer"
                        />
                        Monthly
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                      Due Day of the Month (1-28)
                    </label>
                    <select
                      disabled={!isAdmin}
                      value={contributionDueDay}
                      onChange={(e) => setContributionDueDay(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#1a1f1b] disabled:bg-gray-50 dark:disabled:bg-gray-900/30 border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden disabled:text-gray-400"
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>Day {d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                      Grace Period (Days)
                    </label>
                    <input
                      type="number"
                      disabled={!isAdmin}
                      value={gracePeriodDays}
                      onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#1a1f1b] disabled:bg-gray-50 dark:disabled:bg-gray-900/30 border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden disabled:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                      Late Penalty Amount (KSh)
                    </label>
                    <input
                      type="number"
                      disabled={!isAdmin}
                      value={latePenaltyAmount}
                      onChange={(e) => setLatePenaltyAmount(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#1a1f1b] disabled:bg-gray-50 dark:disabled:bg-gray-900/30 border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden disabled:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                      Max Loan Multiplier (Savings Based)
                    </label>
                    <select
                      disabled={!isAdmin}
                      value={maxLoanMultiplier}
                      onChange={(e) => setMaxLoanMultiplier(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#1a1f1b] disabled:bg-gray-50 dark:disabled:bg-gray-900/30 border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden disabled:text-gray-400"
                    >
                      <option value="1">1x Member Savings</option>
                      <option value="2">2x Member Savings</option>
                      <option value="3">3x Member Savings</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                      Loan Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      disabled={!isAdmin}
                      value={loanInterestRate}
                      onChange={(e) => setLoanInterestRate(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#1a1f1b] disabled:bg-gray-50 dark:disabled:bg-gray-900/30 border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden disabled:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                      Max Repayment Duration (Months)
                    </label>
                    <select
                      disabled={!isAdmin}
                      value={maxRepaymentMonths}
                      onChange={(e) => setMaxRepaymentMonths(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#1a1f1b] disabled:bg-gray-50 dark:disabled:bg-gray-900/30 border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden disabled:text-gray-400"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-3">
                    Minimum Trust Score for Loan Approval ({minTrustScoreForLoan})
                  </label>
                  <input
                    type="range"
                    disabled={!isAdmin}
                    min="0"
                    max="100"
                    value={minTrustScoreForLoan}
                    onChange={(e) => setMinTrustScoreForLoan(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#22C55E] disabled:bg-gray-300 disabled:cursor-not-allowed"
                  />
                </div>

                {isAdmin && (
                  <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-[#22C55E] text-white px-6 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#006e2f] transition-colors shadow-sm"
                    >
                      {saving ? 'Updating...' : 'Save Group Settings'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'Notifications' && (
            <div>
              <h3 className="text-[16px] font-bold text-[#161d16] dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4 mb-6 font-geist">
                Communication Preferences
              </h3>
              
              <div className="space-y-4">
                {[
                  { key: 'contribution_reminders', label: 'Contribution Reminders', desc: 'Alerts when monthly contributions are due.' },
                  { key: 'late_payment_alerts', label: 'Late Payment Alerts', desc: 'Reminders if contributions are overdue.' },
                  { key: 'loan_notifications', label: 'Loan Status Alerts', desc: 'Updates on your loan requests and approvals.' },
                  { key: 'monthly_report', label: 'Monthly Financial Report', desc: 'Receive details on group balances.' },
                  { key: 'new_member_joins', label: 'New Member Joins', desc: 'Notifications when someone joins the chama.' },
                  { key: 'whatsapp_notifications', label: 'WhatsApp Alerts', desc: 'Send core notifications directly to your WhatsApp.' },
                  { key: 'sms_notifications', label: 'SMS Notifications', desc: 'Receive transactional updates via text.' },
                  { key: 'email_notifications', label: 'Email Correspondence', desc: 'Send summary updates and report details to email.' }
                ].map(pref => (
                  <div key={pref.key} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div>
                      <h4 className="text-[14px] font-bold text-[#161d16] dark:text-white">{pref.label}</h4>
                      <p className="text-[12px] text-[#60645f] dark:text-gray-400 mt-0.5">{pref.desc}</p>
                    </div>
                    
                    <div
                      className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors duration-200 shrink-0 ${
                        notifPrefs[pref.key] ? 'bg-[#22C55E]' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      onClick={() => handleTogglePref(pref.key)}
                    >
                      <div
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm ${
                          notifPrefs[pref.key] ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'Appearance' && (
            <div>
              <h3 className="text-[16px] font-bold text-[#161d16] dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4 mb-6 font-geist">
                Appearance Settings
              </h3>
              <p className="text-[13px] text-[#60645f] dark:text-gray-400 mb-6">
                Customize the visual style of your SmartChama dashboard. Choose between a light theme, dark theme, or match your system settings.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    value: 'light',
                    label: 'Light Mode',
                    icon: 'light_mode',
                    desc: 'Clean white & green interface',
                    bgClass: 'bg-white border-gray-200 text-gray-850',
                    previewBg: 'bg-gray-50 border-gray-150',
                    previewCard: 'bg-white border-gray-200'
                  },
                  {
                    value: 'dark',
                    label: 'Dark Mode',
                    icon: 'dark_mode',
                    desc: 'Sleek black & green OLED theme',
                    bgClass: 'bg-slate-950 border-slate-800 text-slate-100',
                    previewBg: 'bg-black border-slate-900',
                    previewCard: 'bg-[#0E1410] border-[#1B2520]'
                  },
                  {
                    value: 'system',
                    label: 'System Default',
                    icon: 'desktop_windows',
                    desc: 'Sync theme with your device settings',
                    bgClass: 'bg-gray-100 border-gray-300 text-gray-850',
                    previewBg: 'bg-gray-50 dark:bg-black',
                    previewCard: 'bg-white dark:bg-[#0E1410]'
                  }
                ].map(opt => {
                  const isSelected = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value as any)}
                      className={`flex flex-col text-left p-4 rounded-xl border transition-all relative cursor-pointer outline-none focus:ring-2 focus:ring-[#006e2f] ${
                        isSelected
                          ? 'border-[#006e2f] dark:border-[#22C55E] ring-1 ring-[#006e2f] dark:ring-[#22C55E]'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <span className="absolute top-3 right-3 material-symbols-outlined text-[#006e2f] dark:text-[#22C55E] text-[18px]">
                          check_circle
                        </span>
                      )}

                      {/* Icon & Label */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-secondary text-[20px]">
                          {opt.icon}
                        </span>
                        <span className="text-[14px] font-bold text-on-surface">
                          {opt.label}
                        </span>
                      </div>
                      
                      {/* Description */}
                      <span className="text-[11px] text-[#60645f] dark:text-gray-400 mb-4 block leading-tight">
                        {opt.desc}
                      </span>

                      {/* Visual Preview */}
                      <div className={`mt-auto w-full h-16 rounded-lg p-2 border flex flex-col justify-between ${opt.previewBg}`}>
                        <div className="flex justify-between items-center">
                          <div className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                          <div className="w-3 h-3 rounded-full bg-[#006e2f] dark:bg-[#22C55E]"></div>
                        </div>
                        <div className={`w-full h-8 rounded border p-1 flex items-center gap-1.5 ${opt.previewCard}`}>
                          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                          <div className="flex-1 space-y-1">
                            <div className="w-2/3 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                            <div className="w-1/2 h-0.5 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'Security' && (
            <div className="space-y-8">
              
              {/* Change Password */}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <h3 className="text-[16px] font-bold text-[#161d16] dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 font-geist">
                  Change Password
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-white dark:bg-[#1a1f1b] border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white dark:bg-[#1a1f1b] border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white dark:bg-[#1a1f1b] border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {newPassword && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-[#60645f] dark:text-gray-400">
                        <span>Password Strength:</span>
                        <span>{passwordStrength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-200 ${passwordStrength.color}`} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#22C55E] text-white px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#006e2f] transition-colors shadow-sm"
                  >
                    Change Password
                  </button>
                </div>
              </form>

              {/* Two-Factor Authentication */}
              <div className="space-y-3">
                <h3 className="text-[16px] font-bold text-[#161d16] dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 font-geist">
                  Two-Factor Authentication (2FA)
                </h3>
                <div className="bg-gray-50 dark:bg-[#1f2620]/30 border border-[#E5E7EB] dark:border-gray-800 p-4 rounded-xl flex gap-3 items-start">
                  <span className="material-symbols-outlined text-[var(--brand-green)]">security</span>
                  <div>
                    <h4 className="text-[14px] font-bold text-[#161d16] dark:text-white">Enhanced Verification</h4>
                    <p className="text-[12px] text-[#60645f] dark:text-gray-400 mt-0.5 leading-relaxed">
                      Two-factor authentication via SMS is available. Enable OTP login to activate. Contact administrator to verify mobile setup.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sessions */}
              <div className="space-y-4">
                <h3 className="text-[16px] font-bold text-[#161d16] dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 font-geist">
                  Active Sessions
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-gray-50 dark:bg-[#1f2620]/30 border border-[#E5E7EB] dark:border-gray-800 p-3 rounded-lg text-[13px]">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary">devices</span>
                      <div>
                        <div className="font-bold text-[#161d16] dark:text-white">Current Session Device</div>
                        <div className="text-[11px] text-[#60645f] dark:text-gray-400">IP: Client Address • Last active just now</div>
                      </div>
                    </div>
                    <span className="bg-green-100 dark:bg-green-950/20 text-[#166534] dark:text-[#4ae176] text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      Active
                    </span>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSignOutAll}
                      className="bg-white dark:bg-[#1a1f1b] border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors"
                    >
                      Sign Out All Devices
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONNECTED APPS TAB */}
          {activeTab === 'Connected Apps' && (
            <div className="space-y-6">
              <h3 className="text-[16px] font-bold text-[#161d16] dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4 mb-4 font-geist">
                Integrations and Services
              </h3>

              {/* M-Pesa */}
              <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <h4 className="text-[14px] font-bold text-[#161d16] dark:text-white flex items-center gap-1.5">
                    Safaricom M-Pesa Webhook Ingestion
                    {group?.paybill_number ? (
                      <span className="bg-green-100 dark:bg-green-950/20 text-[#166534] dark:text-[#4ae176] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                        Connected
                      </span>
                    ) : (
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                        Not Connected
                      </span>
                    )}
                  </h4>
                  <p className="text-[12px] text-[#60645f] dark:text-gray-400 mt-0.5 leading-relaxed max-w-md">
                    Connects directly to your chama paybill or till number to auto-reconcile member savings contributions.
                  </p>
                  {group?.paybill_number && (
                    <div className="mt-3 flex items-center gap-2 bg-gray-50 dark:bg-[#1f2620]/30 border border-[#E5E7EB] dark:border-gray-800 px-3 py-1.5 rounded-lg w-fit text-[13px] font-mono">
                      <span>Paybill: {group.paybill_number}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(group.paybill_number)
                          setToastMsg('Paybill number copied!')
                          setTimeout(() => setToastMsg(''), 3000)
                        }}
                        className="text-[var(--brand-green)] hover:underline material-symbols-outlined text-[16px] leading-none"
                      >
                        content_copy
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Africa's Talking */}
              <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <h4 className="text-[14px] font-bold text-[#161d16] dark:text-white flex items-center gap-1.5">
                    Africa's Talking SMS Core
                    <span className="bg-green-100 dark:bg-green-950/20 text-[#166534] dark:text-[#4ae176] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      Connected
                    </span>
                  </h4>
                  <p className="text-[12px] text-[#60645f] dark:text-gray-400 mt-0.5 leading-relaxed max-w-md">
                    Active backend SMS delivery service. Sends contribution receipts, loan status changes, and OTP validation keys.
                  </p>
                </div>
              </div>

              {/* Google */}
              <div className="flex justify-between items-start pb-2">
                <div>
                  <h4 className="text-[14px] font-bold text-[#161d16] dark:text-white flex items-center gap-1.5">
                    Google OAuth Identity
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      Not Connected
                    </span>
                  </h4>
                  <p className="text-[12px] text-[#60645f] dark:text-gray-400 mt-0.5 leading-relaxed max-w-md">
                    Link your account to log in with a single click using your Google email address.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
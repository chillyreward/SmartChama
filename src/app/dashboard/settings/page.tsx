'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-helpers'

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
        setNationalId(profile.national_id || '')
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
          national_id: nationalId,
          county,
          occupation
        })
        .eq('id', session.user.id)

      if (error) throw error

      setToastMsg('Profile updated successfully.')
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
      setErrorMsg('New passwords do not match.')
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setToastMsg('Password updated successfully.')
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
          Member Settings
        </h1>
        <p className="text-[14px] text-[var(--text-muted)] mt-1">
          Manage your personal details, adjust notification rules, and configure security settings.
        </p>
      </div>

      {toastMsg && (
        <div className="bg-transparent text-[var(--brand-green)] border border-[#bccbb9] dark:border-[#2d3d2d] p-4 rounded-xl text-[14px] font-medium mb-6">
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
          
          {/* PROFILE DETAILS TAB */}
          {activeTab === 'Profile Details' && (
            <div>
              <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
                <h3 className="text-[16px] font-bold text-[#161d16] dark:text-white font-geist">
                  Profile Details
                </h3>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
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
                      className="w-full bg-white dark:bg-[#1a1f1b] border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                      Phone Number (Primary ID)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={phoneNumber}
                      className="w-full bg-gray-50 dark:bg-gray-900/30 border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-gray-400 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white dark:bg-[#1a1f1b] border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                      National ID
                    </label>
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      className="w-full bg-white dark:bg-[#1a1f1b] border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                      County
                    </label>
                    <select
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      className="w-full bg-white dark:bg-[#1a1f1b] border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden"
                    >
                      <option value="">Select County</option>
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
                      placeholder="e.g. Entrepreneur, Farmer"
                      className="w-full bg-white dark:bg-[#1a1f1b] border border-[#E5E7EB] dark:border-gray-700 rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden"
                    />
                  </div>

                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#22C55E] text-white px-6 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#006e2f] transition-colors shadow-sm cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
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
                    className="bg-[#22C55E] text-white px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#006e2f] transition-colors shadow-sm cursor-pointer"
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
                      className="bg-white dark:bg-[#1a1f1b] border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors cursor-pointer"
                    >
                      Sign Out All Devices
                    </button>
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
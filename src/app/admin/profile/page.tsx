'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface ChamaType {
  id: string
  name: string
  county: string
  status: string
}

export default function AdminProfilePage() {
  const { session, member, isLoading: authLoading, refreshMemberData } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [county, setCounty] = useState('Nairobi')
  const [occupation, setOccupation] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [managedChamas, setManagedChamas] = useState<ChamaType[]>([])

  const getInitials = (name: string) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const loadAdminProfile = async () => {
    if (!session?.user?.id) return
    try {
      setLoading(true)
      
      // Load from profiles table
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
      }

      // Load managed chamas
      const { data: chamas, error: chamaErr } = await supabase
        .from('chamas_v2')
        .select('id, name, county, status')
        .eq('created_by', session.user.id)

      if (!chamaErr && chamas) {
        setManagedChamas(chamas)
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg('Failed to load admin profile info.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      loadAdminProfile()
    }
  }, [session])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return
    
    try {
      setSaving(true)
      setErrorMsg('')
      setSuccessMsg('')

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

      setSuccessMsg('Profile updated successfully.')
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
      setSuccessMsg('')

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
        setSuccessMsg('Avatar updated successfully.')
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

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <span className="w-8 h-8 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full font-inter min-h-full text-[var(--text-main)]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
        <div>
          <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
            <span>Admin Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Profile</span>
          </p>
          <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
            Admin Profile Settings
          </h1>
          <p className="text-[14px] text-[var(--text-muted)] mt-1">
            Manage your personal administrative identity and view your savings groups.
          </p>
        </div>
        <div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-transparent border border-[var(--border)] text-[#161d16] dark:text-[#e8f0e4] px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">switch_account</span>
            Switch to Member View
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-transparent text-[var(--brand-green)]/30 border border-[#bccbb9] dark:border-[#2d3d2d] text-[var(--brand-green)] p-4 rounded-lg text-[14px] font-medium mb-6 animate-fade-in">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-905/30 text-red-650 dark:text-red-400 p-4 rounded-lg text-[14px] font-medium mb-6 animate-fade-in">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Avatar & Role */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-bg border border-[var(--border)] border-t-2 border-t-red-500 p-6 rounded-2xl text-center shadow-sm hover:shadow-md transition-all duration-200">
            <div className="relative w-24 h-24 mx-auto mb-4 group cursor-pointer">
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

            <h3 className="text-[18px] font-bold text-[#161d16] dark:text-white truncate font-geist">{fullName || 'Admin User'}</h3>
            <div className="mt-2">
              <span className="bg-red-50 dark:bg-red-950/20 text-[#ba1a1a] dark:text-red-450 text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border border-red-200/50 dark:border-red-900/30">
                Group Administrator
              </span>
            </div>
            
            <div className="border-t border-[var(--border)] mt-6 pt-4 text-left space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Phone:</span>
                <span className="text-[#161d16] dark:text-[#e8f0e4] font-medium">{phone || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Email:</span>
                <span className="text-[#161d16] dark:text-[#e8f0e4] font-medium truncate max-w-[120px]">{email}</span>
              </div>
            </div>
          </div>

          {/* Managed Groups */}
          <div className="card-bg border border-[var(--border)] border-t-2 border-t-[#22C55E] p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
            <h3 className="text-[15px] font-bold text-[#161d16] dark:text-white mb-4 font-geist">
              Chamas You Administer
            </h3>
            {managedChamas.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">
                You do not administer any savings groups yet. Create one in onboarding to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {managedChamas.map(ch => (
                  <div key={ch.id} className="flex justify-between items-center bg-gray-50 dark:bg-[#1a2218] border border-[var(--border)] p-3 rounded-lg">
                    <div>
                      <h4 className="text-[13px] font-bold text-[#161d16] dark:text-white">{ch.name}</h4>
                      <span className="text-[11px] text-[var(--text-muted)]">{ch.county} County</span>
                    </div>
                    <span className="bg-green-100 dark:bg-green-950/20 text-[#166534] dark:text-[#4ae176] text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {ch.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Form Inputs */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="card-bg border border-[var(--border)] border-t-2 border-t-[#22C55E] p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 space-y-6">
            <h3 className="text-[16px] font-bold text-[#161d16] dark:text-white border-b border-[var(--border)] pb-3 font-geist">
              Personal Information
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
                  className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden outline-none transition-all"
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
                  className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden outline-none transition-all"
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
                  className="w-full bg-gray-50 dark:bg-[#1a2218]/30 border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] text-gray-500 dark:text-gray-400 cursor-not-allowed"
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
                  className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden outline-none transition-all"
                  placeholder="Enter National ID"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#161d16] dark:text-white mb-1.5">
                  County
                </label>
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden outline-none transition-all"
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
                  className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] text-[#161d16] dark:text-[#e8f0e4] focus:border-[#22C55E] focus:outline-hidden outline-none transition-all"
                  placeholder="e.g. Finance Manager"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#22C55E] hover:bg-[#1ea94e] text-white px-6 py-2.5 rounded-lg text-[14px] font-semibold transition-colors shadow-sm disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving changes...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}

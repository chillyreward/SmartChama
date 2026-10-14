'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import AdminDashboardPage from './AdminDashboardClient'
import { SkeletonDashboard } from '@/components/Skeleton'

export default function AdminDashboard() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const initialized = useRef(false)
  
  const [state, setState] = useState<{
    loading: boolean
    error: string | null
    membership: any
    chama: any
    metrics: any
    transactions: any[]
  }>({
    loading: true,
    error: null,
    membership: null,
    chama: null,
    metrics: null,
    transactions: []
  })

  const load = useCallback(async () => {
    try {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.replace('/login')
        return
      }

      // The official's groups; prefer the one they last opened
      const adminRoles = ['admin', 'chairlady', 'treasurer', 'secretary']
      const { data: memberships, error: memErr } = await supabase
        .from('chama_memberships')
        .select('*, chamas_v2(*), profiles(full_name, email, phone_number, avatar_url)')
        .eq('profile_id', user.id)
        .eq('status', 'active')
        .in('role', adminRoles)
        .order('joined_at', { ascending: false })

      if (memErr) {
        console.error('Admin dashboard membership load failed:', memErr)
        setState(prev => ({ ...prev, loading: false, error: 'Could not load admin dashboard data. Please refresh.' }))
        return
      }
      if (!memberships || memberships.length === 0) {
        router.replace('/dashboard')
        return
      }

      let preferred: string | null = null
      try { preferred = sessionStorage.getItem('active_chama_id') || localStorage.getItem('sc_last_chama_id') } catch (e) {}
      const memberData: any = memberships.find((m: any) => m.chama_id === preferred) || memberships[0]
      const chamaData = memberData.chamas_v2 as any
      const profileData = memberData.profiles as any

      try {
        sessionStorage.setItem('active_chama_id', chamaData.id)
        localStorage.setItem('sc_last_chama_id', chamaData.id)
      } catch (e) {}

      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const [txResult, contribResult, walletResult, membersResult, totalResult] = await Promise.all([
        supabase.from('transactions_v2').select('*').eq('chama_id', chamaData.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('contributions_v2').select('amount, status, created_at, membership_id, mpesa_receipt').eq('chama_id', chamaData.id).eq('status', 'confirmed').order('created_at', { ascending: false }).limit(20),
        supabase.from('wallets').select('balance').eq('chama_id', chamaData.id).maybeSingle(),
        supabase.from('chama_memberships').select('id, trust_score, profiles(full_name)').eq('chama_id', chamaData.id).eq('status', 'active'),
        supabase.from('contributions_v2').select('amount, membership_id, created_at').eq('chama_id', chamaData.id).eq('status', 'confirmed'),
      ])

      const members = membersResult.data || []
      const allConfirmed = totalResult.data || []
      const totalSavings = allConfirmed.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
      const paidThisMonth = new Set(allConfirmed.filter((c: any) => c.created_at >= monthStart).map((c: any) => c.membership_id)).size
      const collectionRate = members.length > 0 ? Math.round((paidThisMonth / members.length) * 100) : 0
      const avgTrust = members.length > 0
        ? Math.round(members.reduce((sum: number, m: any) => sum + (m.trust_score || 0), 0) / members.length)
        : 0
      const balance = Number((walletResult.data as any)?.balance || 0)

      setState({
        loading: false,
        error: null,
        membership: {
          id: memberData.id,
          role: memberData.role,
          trust_score: memberData.trust_score ?? 0,
          full_name: profileData?.full_name || '',
          email: profileData?.email || user.email || '',
          phone: profileData?.phone_number || '',
          chama_id: chamaData.id
        },
        chama: chamaData,
        metrics: {
          totalSavings,
          memberCount: members.length,
          collectionRate,
          avgTrust,
          walletBalance: balance,
          members,
          contributions: contribResult.data || [],
          wallet: { balance }
        },
        transactions: txResult.data || []
      })

    } catch (err) {
      console.error('Admin dashboard load caught:', err)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Unexpected error. Please refresh.'
      }))
    }
  }, [supabase, router])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    load()
  }, [load])

  const { loading, error, membership, chama, metrics, transactions } = state

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <SkeletonDashboard />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="text-center max-w-sm p-6">
          <p className="text-[18px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Something went wrong
          </p>
          <p className="text-[14px] mb-4" style={{ color: 'var(--text-secondary)' }}>
            {error}
          </p>
          <button
            onClick={load}
            className="bg-[#22C55E] text-white px-6 py-2.5 rounded-xl font-medium">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <AdminDashboardPage 
      member={membership} 
      chama={chama} 
      metrics={metrics} 
      initialTransactions={transactions} 
    />
  )
}
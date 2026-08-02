'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import AdminDashboardPage from './AdminDashboardClient'

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

      // Use RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_admin_dashboard_data',
        { p_user_id: user.id }
      )

      if (rpcError) {
        console.error('Admin Dashboard RPC error:', rpcError, '— trying direct query fallback')
        // Fallback: query directly without RPC
        try {
          const adminRoles = ['admin', 'chairlady', 'treasurer', 'secretary']
          const { data: memberData, error: memErr } = await supabase
            .from('chama_memberships')
            .select('*, chamas_v2(*), profiles(full_name, email, phone_number, avatar_url)')
            .eq('profile_id', user.id)
            .eq('status', 'active')
            .in('role', adminRoles)
            .order('joined_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (memErr || !memberData) {
            router.replace('/dashboard')
            return
          }

          const chamaData = memberData.chamas_v2 as any
          const profileData = memberData.profiles as any

          if (chamaData?.id) {
            try {
              sessionStorage.setItem('active_chama_id', chamaData.id)
              localStorage.setItem('sc_last_chama_id', chamaData.id)
            } catch(e) {}
          }

          const [txResult, contribResult, loansResult, walletResult] = await Promise.all([
            supabase.from('transactions_v2').select('*').eq('chama_id', chamaData.id).order('created_at', { ascending: false }).limit(10),
            supabase.from('contributions_v2').select('amount, status, created_at, membership_id, mpesa_receipt').eq('chama_id', chamaData.id).eq('status', 'confirmed').order('created_at', { ascending: false }).limit(20),
            supabase.from('loans_v2').select('id, status, amount, created_at, membership_id, chama_memberships(profiles(full_name))').eq('chama_id', chamaData.id).order('created_at', { ascending: false }).limit(20),
            supabase.from('wallets').select('balance').eq('chama_id', chamaData.id).maybeSingle(),
          ])

          const totalContribs = (contribResult.data || []).reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0)
          const repaidLoans = (loansResult.data || []).filter((l: any) => l.status === 'repaid').length
          const totalLoans = (loansResult.data || []).length
          const activeLoans = (loansResult.data || []).filter((l: any) => l.status === 'active').length

          setState({
            loading: false,
            error: null,
            membership: {
              id: memberData.id,
              role: memberData.role,
              trust_score: memberData.trust_score || 100,
              full_name: profileData?.full_name || '',
              email: profileData?.email || user.email || '',
              phone: profileData?.phone_number || '',
              chama_id: chamaData.id
            },
            chama: chamaData,
            metrics: {
              totalSavings: totalContribs,
              memberCount: 0,
              activeLoanCount: activeLoans,
              collectionRate: totalLoans > 0 ? Math.round((repaidLoans / totalLoans) * 100) : 100,
              avgTrust: 100,
              walletBalance: (walletResult.data as any)?.balance || 0,
              members: [],
              contributions: contribResult.data || [],
              loans: loansResult.data || [],
              wallet: { balance: (walletResult.data as any)?.balance || 0 }
            },
            transactions: txResult.data || []
          })
          return
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr)
          setState(prev => ({ ...prev, loading: false, error: 'Could not load admin dashboard data. Please refresh.' }))
          return
        }
      }

      // If no membership found or not admin
      if (!rpcData?.found) {
        if (rpcData?.error === 'not_admin') {
          router.replace('/dashboard')
        } else {
          router.replace('/onboarding')
        }
        return
      }

      const { membership, chama, metrics: baseMetrics } = rpcData

      // Save chama ID for convenience
      if (chama?.id) {
        try {
          sessionStorage.setItem('active_chama_id', chama.id)
          localStorage.setItem('sc_last_chama_id', chama.id)
        } catch(e) {}
      }

      // Load secondary data in parallel
      const [txResult, contribResult, loansResult] = await Promise.all([
        supabase
          .from('transactions_v2')
          .select('*')
          .eq('chama_id', chama.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('contributions_v2')
          .select('amount, status, created_at, membership_id, mpesa_receipt')
          .eq('chama_id', chama.id)
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false })
          .limit(20),

        supabase
          .from('loans_v2')
          .select('id, status, amount, created_at, membership_id, chama_memberships(profiles(full_name))')
          .eq('chama_id', chama.id)
          .order('created_at', { ascending: false })
          .limit(20)
      ])

      // Map RPC names to props required by AdminDashboardClient
      const mappedMember = {
        id: membership.membership_id,
        role: membership.role,
        trust_score: membership.trust_score,
        full_name: membership.full_name,
        email: membership.email,
        phone: membership.phone,
        chama_id: membership.chama_id
      }

      const stats = rpcData.chama_stats || {}
      const members = rpcData.members || []

      // Calculate avg trust
      const totalTrust = members.reduce((sum: number, m: any) => sum + (m.trust_score || 0), 0) || 0
      const avgTrust = members.length > 0 ? Math.round(totalTrust / members.length) : 100

      // Calculate collection rate
      const repaidLoans = loansResult.data?.filter((l: any) => l.status === 'repaid').length || 0
      const totalLoans = loansResult.data?.length || 0
      const collectionRate = totalLoans > 0 ? Math.round((repaidLoans / totalLoans) * 100) : 100

      // Format metrics expected by AdminDashboardClient
      const formattedMetrics = {
        totalSavings: stats.total_contributions || 0,
        memberCount: stats.member_count || 0,
        activeLoanCount: stats.active_loans || 0,
        collectionRate,
        avgTrust,
        walletBalance: baseMetrics.wallet_balance || 0,
        members,
        contributions: contribResult.data || [],
        loans: loansResult.data || [],
        wallet: { balance: baseMetrics.wallet_balance || 0 }
      }

      setState({
        loading: false,
        error: null,
        membership: mappedMember,
        chama,
        metrics: formattedMetrics,
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full border-4 border-[#22C55E]/20 border-t-[#22C55E] animate-spin mx-auto mb-4" />
          <p style={{ color: 'var(--text-secondary)' }}>
            Loading admin dashboard...
          </p>
        </div>
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
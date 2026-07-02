'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import MemberDashboard from './DashboardClient'

export default function Dashboard() {
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
    contributions: any[]
  }>({
    loading: true,
    error: null,
    membership: null,
    chama: null,
    metrics: null,
    transactions: [],
    contributions: []
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
      const { data: dashData, error: rpcError } = await supabase.rpc(
        'get_user_dashboard_data',
        { p_user_id: user.id }
      )

      if (rpcError) {
        console.error('Dashboard RPC error:', rpcError)
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Could not load dashboard data.'
        }))
        return
      }

      // If no membership found, go to onboarding
      if (!dashData?.found) {
        console.log('No membership found:', dashData?.error)
        router.replace('/onboarding')
        return
      }

      const { membership, chama, metrics } = dashData

      // Save chama ID for convenience
      if (chama?.id) {
        try {
          sessionStorage.setItem('active_chama_id', chama.id)
          localStorage.setItem('sc_last_chama_id', chama.id)
        } catch(e) {}
      }

      // Load secondary data in parallel
      const [txResult, contribResult] = await Promise.all([
        supabase
          .from('transactions_v2')
          .select('*')
          .eq('chama_id', chama.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('contributions_v2')
          .select('*')
          .eq('membership_id', membership.membership_id)
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false })
          .limit(12)
      ])

      // Map RPC names to props required by DashboardClient (e.g. membership_id -> id)
      const mappedMember = {
        id: membership.membership_id,
        role: membership.role,
        trust_score: membership.trust_score,
        full_name: membership.full_name,
        email: membership.email,
        phone: membership.phone,
        chama_id: membership.chama_id
      }

      const formattedMetrics = {
        totalSaved: metrics.total_saved || 0,
        activeLoans: 0, // Will be fetched inside Client components or defaults
        repaymentRate: null,
        trustScore: membership.trust_score || 0,
        walletBalance: metrics.wallet_balance || 0,
        contributions: contribResult.data || [],
        loans: [],
        wallet: { balance: metrics.wallet_balance || 0 }
      }

      setState({
        loading: false,
        error: null,
        membership: mappedMember,
        chama,
        metrics: formattedMetrics,
        transactions: txResult.data || [],
        contributions: contribResult.data || []
      })

    } catch (err) {
      console.error('Dashboard load caught:', err)
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
            Loading your dashboard...
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
    <MemberDashboard 
      member={membership} 
      chama={chama} 
      metrics={metrics} 
      initialTransactions={transactions} 
    />
  )
}
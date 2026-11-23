'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import MemberDashboard from './DashboardClient'

const CACHE_KEY = 'sc_dashboard_cache'
const CACHE_TTL = 60_000 // 1 minute TTL

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
      // 1. Try cache first for instant display
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached)
            if (Date.now() - timestamp < CACHE_TTL) {
              setState({
                loading: false,
                error: null,
                ...data
              })
              // Background refresh silently
              refreshInBackground()
              return
            }
          } catch (e) {
            sessionStorage.removeItem(CACHE_KEY)
          }
        }
      }

      await fetchFreshData()
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Something unexpected stopped the page.'
      }))
    }
  }, [supabase, router])

  const fetchFreshData = async () => {
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
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'The dashboard data did not load.'
      }))
      return
    }

    if (!dashData?.found) {
      router.replace('/onboarding')
      return
    }

    const { membership, chama, metrics } = dashData

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
        .in('status', ['confirmed', 'pending'])
        .order('created_at', { ascending: false })
        .limit(12)
    ])

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
      trustScore: membership.trust_score || 0,
      walletBalance: metrics.wallet_balance || 0,
      contributions: contribResult.data || [],
      wallet: { balance: metrics.wallet_balance || 0 }
    }

    const resultState = {
      membership: mappedMember,
      chama,
      metrics: formattedMetrics,
      transactions: txResult.data || [],
      contributions: contribResult.data || []
    }

    // Update state
    setState({
      loading: false,
      error: null,
      ...resultState
    })

    // Store in cache
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          data: resultState,
          timestamp: Date.now()
        }))
      } catch (e) {}
    }
  }

  const refreshInBackground = async () => {
    try {
      await fetchFreshData()
    } catch (e) {}
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    load()
  }, [load])

  const { loading, error, membership, chama, metrics, transactions } = state

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse" aria-busy="true" aria-label="Loading your dashboard">
        <div className="h-10 w-72 rounded-xl bg-raised" />
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="h-[340px] rounded-[28px] bg-surface border border-line" />
          <div className="h-[340px] rounded-[24px] bg-sage/50" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-[180px] rounded-[24px] bg-surface border border-line" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-sm text-center">
          <p className="font-display text-[26px]">We couldn&apos;t load your group</p>
          <p className="text-[15px] text-ink-2 mt-2">{error} Check your connection, then try again.</p>
          <button onClick={fetchFreshData} className="mt-5 h-11 px-6 rounded-full bg-primary text-on-primary font-semibold">Try again</button>
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
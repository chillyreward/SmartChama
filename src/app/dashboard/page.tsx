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
        error: 'Unexpected error. Please refresh.'
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
        error: 'Could not load dashboard data.'
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
      activeLoans: 0,
      repaymentRate: null,
      trustScore: membership.trust_score || 0,
      walletBalance: metrics.wallet_balance || 0,
      contributions: contribResult.data || [],
      loans: [],
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
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="sc-card p-5 space-y-3">
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-7 w-32 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-2.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 sc-card p-6 space-y-4">
            <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
                <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>

          <div className="sc-card p-6 space-y-4">
            <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-36 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
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
            onClick={fetchFreshData}
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
      onRefresh={fetchFreshData}
    />
  )
}
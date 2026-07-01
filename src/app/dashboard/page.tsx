'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import MemberDashboard from './DashboardClient'

export default function DashboardPage() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const hasFetched = useRef(false)
  
  const [loading, setLoading] = useState(true)
  const [chamaId, setChamaId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [chama, setChama] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      // STEP 1: Get the current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/login')
        return
      }

      // STEP 2: Get their active membership directly from DB
      const { data: memberships, error: membershipError } = await supabase
        .from('chama_memberships')
        .select(`
          id,
          role,
          trust_score,
          contribution_streak,
          status,
          chamas_v2 (
            id,
            name,
            contribution_amount,
            contribution_frequency,
            status
          ),
          profiles (
            id,
            full_name,
            phone_number,
            email
          )
        `)
        .eq('profile_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: true })

      if (membershipError) {
        console.error('Membership query error:', membershipError)
        setLoading(false)
        return
      }

      // STEP 3: If no active membership, user genuinely needs onboarding
      if (!memberships || memberships.length === 0) {
        router.push('/onboarding')
        return
      }

      // STEP 4: Determine which chama to show. Check sessionStorage as a HINT only, not as a routing decision.
      let activeMembership = memberships[0]
      
      const hintId = sessionStorage.getItem('active_chama_id') ||
                     localStorage.getItem('sc_last_chama_id')

      if (hintId && memberships.length > 1) {
        const hinted = memberships.find(
          m => (m.chamas_v2 as any)?.id === hintId
        )
        if (hinted) {
          activeMembership = hinted
        }
      }

      const resolvedChamaId = (activeMembership.chamas_v2 as any)?.id

      if (!resolvedChamaId) {
        console.error('Could not resolve chama ID')
        router.push('/onboarding')
        return
      }

      // STEP 5: Save for convenience (not for routing decisions)
      sessionStorage.setItem('active_chama_id', resolvedChamaId)
      localStorage.setItem('sc_last_chama_id', resolvedChamaId)

      setChamaId(resolvedChamaId)
      setProfile(activeMembership)
      setChama(activeMembership.chamas_v2)

      // STEP 6: Load all other data in parallel now that we have a confirmed chama ID
      const [
        contributionsResult,
        loansResult,
        transactionsResult,
        walletResult
      ] = await Promise.all([
        supabase
          .from('contributions_v2')
          .select('amount, created_at, status')
          .eq('membership_id', activeMembership.id)
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false }),

        supabase
          .from('loans_v2')
          .select('id, status, amount, created_at')
          .eq('membership_id', activeMembership.id),

        supabase
          .from('transactions_v2')
          .select(`
            id, type, amount, 
            created_at, reference,
            chama_memberships (
              profiles ( full_name )
            )
          `)
          .eq('chama_id', resolvedChamaId)
          .order('created_at', { ascending: false })
          .limit(10),

        supabase
          .from('wallets')
          .select('balance, savings_pool, loans_disbursed')
          .eq('chama_id', resolvedChamaId)
          .single()
      ])

      const totalSaved = contributionsResult.data?.reduce(
        (sum, c) => sum + c.amount, 
        0
      ) || 0

      const repaidLoans = loansResult.data?.filter(
        l => l.status === 'repaid'
      ).length || 0
      const totalLoans = loansResult.data?.length || 0
      const activeLoans = loansResult.data?.filter(
        l => ['active', 'overdue'].includes(l.status)
      ).length || 0

      setMetrics({
        totalSaved,
        activeLoans,
        repaymentRate: totalLoans > 0
          ? Math.round((repaidLoans / totalLoans) * 100)
          : null,
        trustScore: activeMembership.trust_score || 0,
        walletBalance: walletResult.data?.balance || 0,
        contributions: contributionsResult.data || [],
        loans: loansResult.data || [],
        wallet: walletResult.data || null
      })

      setTransactions(transactionsResult.data || [])
      setLoading(false)

      // Connect real-time AFTER everything has loaded
      const channel = supabase
        .channel(`dash-${activeMembership.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'contributions_v2',
          filter: `membership_id=eq.${activeMembership.id}`
        }, async () => {
          // Refresh only contributions metric, not the whole page
          const { data: fresh } = await supabase
            .from('contributions_v2')
            .select('amount')
            .eq('membership_id', activeMembership.id)
            .eq('status', 'confirmed')

          const newTotal = fresh?.reduce(
            (s, c) => s + c.amount, 
            0
          ) || 0

          setMetrics((prev: any) => ({
            ...prev,
            totalSaved: newTotal
          }))
        })
        .subscribe()

    } catch (err) {
      console.error('Dashboard load error:', err)
      setLoading(false)
    }
  }

  if (loading || !chamaId || !profile || !chama || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#22C55E]/20 border-t-[#22C55E] animate-spin" />
          <p style={{ color: 'var(--text-secondary)' }}>
            Loading your dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <MemberDashboard 
      member={profile} 
      chama={chama} 
      metrics={metrics} 
      initialTransactions={transactions} 
    />
  )
}
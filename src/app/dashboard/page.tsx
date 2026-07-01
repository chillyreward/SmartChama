'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import MemberDashboard from './DashboardClient'

export default function DashboardPage() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const [chamaId, setChamaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try sessionStorage first
    let id = sessionStorage.getItem('active_chama_id')
    
    // Fall back to localStorage
    if (!id) {
      id = localStorage.getItem('sc_last_chama_id')
      if (id) {
        // Restore to sessionStorage
        sessionStorage.setItem('active_chama_id', id)
      }
    }
    
    setChamaId(id)
  }, [])

  useEffect(() => {
    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      let resolvedChamaId = sessionStorage.getItem('active_chama_id') ||
                            localStorage.getItem('sc_last_chama_id')

      if (!resolvedChamaId) {
        // Neither storage has the ID — get it directly from the database
        const { data: memberships } = await supabase
          .from('chama_memberships')
          .select('chama_id, role, status')
          .eq('profile_id', session.user.id)
          .eq('status', 'active')
          .limit(1)

        if (!memberships?.length) {
          // No memberships — they need to onboard
          router.push('/onboarding')
          return
        }

        resolvedChamaId = memberships[0].chama_id
        
        // Save for next time
        sessionStorage.setItem('active_chama_id', resolvedChamaId)
        localStorage.setItem('sc_last_chama_id', resolvedChamaId)
        
        // Update cookie for AuthProvider
        document.cookie = `active_chama_id=${resolvedChamaId}; path=/; max-age=${60 * 60 * 24 * 30}`
      }
      
      setChamaId(resolvedChamaId)
      setLoading(false)
    }

    loadDashboard()
  }, [supabase, router])

  if (loading || !chamaId) {
    return (
      <div className="flex h-screen items-center justify-center page-bg">
        <div className="w-10 h-10 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return <MemberDashboard />
}
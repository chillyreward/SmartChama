'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import Image from 'next/image'

export default function SelectGroupPage() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const [memberships, setMemberships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)

  useEffect(() => {
    loadGroups()
  }, [])

  async function loadGroups() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('chama_memberships')
      .select(`
        id, role, trust_score,
        chamas_v2 (
          id, name, 
          contribution_amount,
          status
        )
      `)
      .eq('profile_id', user.id)
      .eq('status', 'active')

    if (!data || data.length === 0) {
      router.push('/onboarding')
      return
    }

    if (data.length === 1) {
      selectGroup(data[0])
      return
    }

    setMemberships(data)
    setLoading(false)
  }

  function selectGroup(membership: any) {
    setSelecting((membership.chamas_v2 as any).id)
    
    sessionStorage.setItem('active_chama_id', (membership.chamas_v2 as any).id)
    localStorage.setItem('sc_last_chama_id', (membership.chamas_v2 as any).id)
    document.cookie = `active_chama_id=${(membership.chamas_v2 as any).id}; path=/; max-age=${60 * 60 * 24 * 30}`

    const isAdmin = [
      'admin', 'chairlady',
      'treasurer', 'secretary'
    ].includes(membership.role)

    router.push(isAdmin ? '/admin/dashboard' : '/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="w-10 h-10 rounded-full border-4 border-[#22C55E]/20 border-t-[#22C55E] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-page)' }}>
      <Image
        src="/favicon.svg"
        alt="SmartChama"
        width={48} height={48}
        className="h-12 w-12 object-contain mb-6"
      />

      <h1 className="text-[26px] font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>
        Choose a group
      </h1>
      <p className="text-[15px] text-center mb-8" style={{ color: 'var(--text-secondary)' }}>
        You belong to multiple groups. Which would you like to open?
      </p>

      <div className="w-full max-w-sm space-y-3">
        {memberships.map(m => {
          const chama = m.chamas_v2 as any
          const isSelecting = selecting === chama.id

          return (
            <button
              key={m.id}
              onClick={() => selectGroup(m)}
              disabled={selecting !== null}
              className="w-full p-4 rounded-2xl border text-left transition-all hover:border-[#22C55E] disabled:opacity-60"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: isSelecting ? '#22C55E' : 'var(--border)'
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[16px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {chama.name}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--green)' }}>
                      {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                    </span>
                    <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      KSh {chama.contribution_amount?.toLocaleString('en-KE')}/month
                    </span>
                  </div>
                </div>
                {isSelecting ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#22C55E]/30 border-t-[#22C55E] animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--text-muted)' }}>
                    chevron_right
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

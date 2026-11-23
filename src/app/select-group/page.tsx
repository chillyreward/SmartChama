'use client'
import { ChevronRight } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { Avatar, Chip, formatKsh } from '@/components/ui'
import { ROLE_LABEL } from '@/components/shell/nav'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

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
    return <div className="min-h-dvh bg-page" aria-busy="true" />
  }

  return (
    <AuthShell aside="none" title="Which group?" subtitle="You belong to more than one. You can switch any time from the group menu.">
      <ul className="space-y-3">
        {memberships.map(m => {
          const chama = m.chamas_v2 as any
          const isSelecting = selecting === chama.id
          return (
            <li key={m.id}>
              <button
                onClick={() => selectGroup(m)}
                disabled={selecting !== null}
                className="w-full flex items-center gap-4 p-4 rounded-[22px] bg-surface border border-line text-left hover:border-line-strong hover:bg-surface-2 transition-colors disabled:opacity-60"
              >
                <Avatar name={chama.name} size={48} tone="sage" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[17px] font-semibold truncate">{chama.name}</span>
                  <span className="flex items-center gap-2 mt-1 text-[14px] text-ink-2">
                    <Chip kind="neutral">{(ROLE_LABEL as Record<string, string>)[m.role] ?? m.role}</Chip>
                    {chama.contribution_amount ? <span>{formatKsh(chama.contribution_amount)} per contribution</span> : null}
                  </span>
                </span>
                {isSelecting
                  ? <span className="w-5 h-5 rounded-full border-2 border-line border-t-brand animate-spin" aria-label="Opening" />
                  : <ChevronRight size={20} className="text-ink-3" />}
              </button>
            </li>
          )
        })}
      </ul>
    </AuthShell>
  )
}

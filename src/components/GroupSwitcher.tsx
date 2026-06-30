'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

export default function GroupSwitcher() {
  const router = useRouter()
  const { group: currentGroup, member: currentMember } = useAuth()
  
  const [memberships, setMemberships] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchMemberships() {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled || !session) return

      const { data } = await supabase
        .from('chama_memberships')
        .select(`
          id, role,
          chamas_v2 ( id, name )
        `)
        .eq('profile_id', session.user.id)
        .eq('status', 'active')

      if (!cancelled && data) setMemberships(data)
    }

    fetchMemberships()
    return () => { cancelled = true }
  }, [])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!currentGroup || memberships.length <= 1) return null

  const handleSwitch = (chamaId: string, role: string) => {
    sessionStorage.setItem('active_chama_id', chamaId)
    document.cookie = `active_chama_id=${chamaId}; path=/; max-age=${60 * 60 * 24 * 30}`;
    setIsOpen(false)
    window.location.reload()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-[#1f2a1f] px-3 py-1.5 rounded-lg transition-colors border border-[var(--border)] cursor-pointer"
      >
        <div className="flex flex-col items-start text-left">
          <span className="text-sm font-semibold text-[var(--text-main)] truncate max-w-40">{currentGroup.name}</span>
          <span className="text-xs text-[var(--text-muted)] capitalize">{currentMember?.role}</span>
        </div>
        <span className="material-symbols-outlined text-[var(--text-muted)] text-[20px]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#111111] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-50 animate-fade-in">
          <div className="p-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider bg-gray-50 dark:bg-[#1a1f1b]/50 border-b border-[var(--border)]">
            Your Groups
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {memberships.map((m) => {
              const chama = m.chamas_v2 as any
              const isCurrent = chama.id === currentGroup.id
              
              return (
                <button
                  key={m.id}
                  onClick={() => !isCurrent && handleSwitch(chama.id, m.role)}
                  className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-colors cursor-pointer ${isCurrent ? 'bg-[#f0fdf4] dark:bg-[#1a2a1a]/40 hover:bg-[#f0fdf4] dark:hover:bg-[#1a2a1a]/40' : ''}`}
                >
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${isCurrent ? 'text-[#22C55E]' : 'text-[var(--text-main)]'}`}>
                      {chama.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] capitalize">{m.role}</span>
                  </div>
                  {isCurrent ? (
                    <span className="material-symbols-outlined text-[#22C55E] text-[18px]">check</span>
                  ) : (
                    <span className="text-xs font-semibold text-[#22C55E]">Switch</span>
                  )}
                </button>
              )
            })}
          </div>
          
          <div className="border-t border-[var(--border)] p-2 bg-gray-50 dark:bg-[#1a1f1b]/50 flex flex-col gap-1">
            <Link 
              href="/onboarding" 
              className="px-3 py-2 text-sm text-[#22C55E] hover:bg-[#e6f4ea] dark:hover:bg-[#1f2a1f] rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create New Group
            </Link>
            <Link 
              href="/onboarding" 
              className="px-3 py-2 text-sm text-[#22C55E] hover:bg-[#e6f4ea] dark:hover:bg-[#1f2a1f] rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">group_add</span>
              Join Another Group
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

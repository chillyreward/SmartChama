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
    async function fetchMemberships() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('chama_memberships')
        .select(`
          id, role,
          chamas_v2 ( id, name )
        `)
        .eq('profile_id', session.user.id)
        .eq('status', 'active')

      if (data) setMemberships(data)
    }

    fetchMemberships()
  }, [supabase])

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
        className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
      >
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold text-[#161d16]">{currentGroup.name}</span>
          <span className="text-xs text-[#60645f] capitalize">{currentMember?.role}</span>
        </div>
        <span className="material-symbols-outlined text-[#60645f] text-[20px]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden z-50">
          <div className="p-2 text-xs font-semibold text-[#60645f] uppercase tracking-wider bg-gray-50 border-b border-[#E5E7EB]">
            Your Groups
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {memberships.map((m) => {
              const chama = m.chamas_v2 as any
              const isCurrent = chama.id === currentGroup.id
              const isLeadership = ['admin', 'chairlady', 'treasurer', 'secretary'].includes(m.role)
              
              return (
                <button
                  key={m.id}
                  onClick={() => !isCurrent && handleSwitch(chama.id, m.role)}
                  className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors ${isCurrent ? 'bg-[#f0fdf4] hover:bg-[#f0fdf4]' : ''}`}
                >
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${isCurrent ? 'text-[#006e2f]' : 'text-[#161d16]'}`}>
                      {chama.name}
                    </span>
                    <span className="text-xs text-[#60645f] capitalize">{m.role}</span>
                  </div>
                  {isCurrent ? (
                    <span className="material-symbols-outlined text-[#22C55E] text-[18px]">check</span>
                  ) : (
                    <span className="text-xs font-semibold text-[#006e2f]">Switch</span>
                  )}
                </button>
              )
            })}
          </div>
          
          <div className="border-t border-[#E5E7EB] p-2 bg-gray-50 flex flex-col">
            <Link 
              href="/onboarding" 
              className="px-3 py-2 text-sm text-[#006e2f] hover:bg-[#e6f4ea] rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create New Group
            </Link>
            <Link 
              href="/onboarding" 
              className="px-3 py-2 text-sm text-[#006e2f] hover:bg-[#e6f4ea] rounded-lg transition-colors flex items-center gap-2"
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

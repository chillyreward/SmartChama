'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

interface NotificationType {
  id: string
  profile_id: string
  title: string
  message: string
  type: 'contribution' | 'loan_approved' | 'loan_request' | 'new_member' | 'announcement' | 'reminder'
  read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const { session } = useAuth()
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationType[]>([])
  const [activeTab, setActiveTab] = useState<'All' | 'Unread' | 'Contributions' | 'Loans' | 'Group'>('All')
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    if (!session?.user?.id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    if (!session?.user?.id) return
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('profile_id', session.user.id)
        .eq('read', false)
    } catch (err) {
      console.error('Error marking notifications read:', err)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications().then(() => {
        markAllAsRead()
      })
    }
  }, [session])

  useEffect(() => {
    if (activeTab === 'All') {
      setFilteredNotifications(notifications)
    } else if (activeTab === 'Unread') {
      setFilteredNotifications(notifications.filter(n => !n.read))
    } else if (activeTab === 'Contributions') {
      setFilteredNotifications(notifications.filter(n => n.type === 'contribution'))
    } else if (activeTab === 'Loans') {
      setFilteredNotifications(notifications.filter(n => n.type === 'loan_approved' || n.type === 'loan_request'))
    } else if (activeTab === 'Group') {
      setFilteredNotifications(notifications.filter(n => n.type === 'new_member' || n.type === 'announcement' || n.type === 'reminder'))
    }
  }, [activeTab, notifications])

  const timeAgo = (dateString: string) => {
    const now = new Date()
    const past = new Date(dateString)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getIconConfig = (type: string) => {
    switch (type) {
      case 'contribution':
        return { icon: 'payments', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' }
      case 'loan_approved':
        return { icon: 'check_circle', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' }
      case 'loan_request':
        return { icon: 'account_balance', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' }
      case 'new_member':
        return { icon: 'person_add', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' }
      case 'announcement':
        return { icon: 'campaign', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' }
      case 'reminder':
      default:
        return { icon: 'alarm', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' }
    }
  }

  return (
    <div className="max-w-4xl p-6 md:p-8 font-inter text-[var(--text-main)]">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Notifications</span>
        </p>
        
        <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
          Notifications
        </h1>
        <p className="text-[14px] text-[var(--text-muted)] mt-1">
          Updates on contributions, loan applications, and activity in your savings group.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-3 mb-6 overflow-x-auto scrollbar-hide">
        {(['All', 'Unread', 'Contributions', 'Loans', 'Group'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-[14px] font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-transparent text-[var(--brand-green)] text-[var(--brand-green)]'
                : 'text-[#60645f] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1f2a1f]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-8 h-8 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[var(--border)] rounded-2xl card-bg">
          <div className="w-16 h-16 bg-transparent text-[var(--brand-green)] rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[28px] text-[var(--brand-green)]">
              notifications_off
            </span>
          </div>
          <h2 className="text-[18px] font-semibold text-[#161d16] dark:text-white mb-2">
            No notifications yet
          </h2>
          <p className="text-[14px] text-[#60645f] dark:text-gray-400 max-w-sm">
            Notifications about your contributions, loans, and group activity will appear here.
          </p>
        </div>
      ) : (
        <div className="card-bg border border-[var(--border)] rounded-2xl overflow-hidden divide-y divide-[#E5E7EB] dark:divide-[#2d3d2d] shadow-sm">
          {filteredNotifications.map(notif => {
            const config = getIconConfig(notif.type)
            return (
              <div
                key={notif.id}
                className={`p-4 flex gap-4 transition-colors ${
                  !notif.read
                    ? 'bg-[#edf6ea]/30 dark:bg-[#1a2a1a]/10 border-l-4 border-[#22C55E]'
                    : 'card-bg border-l-4 border-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
                  <span className={`material-symbols-outlined text-[20px] ${config.color}`}>
                    {config.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className={`text-[14px] text-[#161d16] dark:text-white truncate ${!notif.read ? 'font-bold' : 'font-medium'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[12px] text-[#9ca3af] dark:text-gray-500 font-mono whitespace-nowrap">
                      {timeAgo(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-[14px] text-[#60645f] dark:text-gray-400 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}

'use client'
import { MIcon } from '@/components/ui/MIcon';

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { EmptyState, PageHeader, Panel, Skeleton, Tabs, cn } from '@/components/ui'

interface NotificationType {
  id: string
  profile_id: string
  title: string
  message: string
  type: 'contribution' | 'new_member' | 'announcement' | 'reminder'
  read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const { session } = useAuth()
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationType[]>([])
  const [activeTab, setActiveTab] = useState<'All' | 'Unread' | 'Contributions' | 'Group'>('All')
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
      case 'contribution': return { icon: 'payments', cls: 'bg-mint text-forest' };
      case 'new_member': return { icon: 'person_add', cls: 'bg-lavender text-lavender-ink' };
      case 'announcement': return { icon: 'campaign', cls: 'bg-sage text-sage-ink' };
      default: return { icon: 'schedule', cls: 'bg-amber-soft text-amber-ink' };
    }
  }

  const unread = notifications.filter((n) => !n.read).length

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Payments, reminders, announcements and new members. Opening this page marks them as read." />
      <Tabs
        label="Filter notifications"
        value={activeTab}
        onChange={setActiveTab}
        className="mb-4"
        items={[
          { value: 'All', label: 'All', count: notifications.length },
          { value: 'Unread', label: 'New', count: unread },
          { value: 'Contributions', label: 'Payments' },
          { value: 'Group', label: 'Group' },
        ]}
      />
      <Panel className="p-2 sm:p-3">
        {loading ? (
          <div className="flex flex-col gap-2 p-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState className="px-4" title={activeTab === 'Unread' ? 'You\'re all caught up' : 'Nothing here yet'}>
            Reminders before a due date, confirmed payments and group announcements show up here.
          </EmptyState>
        ) : (
          <ul>
            {filteredNotifications.map((n) => {
              const c = getIconConfig(n.type)
              return (
                <li key={n.id} className={cn('flex gap-4 px-3 sm:px-4 py-4 rounded-[16px]', !n.read && 'bg-tint')}>
                  <span className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', c.cls)}><MIcon name={c.icon} size={18} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[15px] font-semibold">{n.title}</span>
                      <time className="text-[12px] text-ink-3 whitespace-nowrap">{timeAgo(n.created_at)}</time>
                    </div>
                    <p className="text-[14px] text-ink-2 mt-0.5">{n.message}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
